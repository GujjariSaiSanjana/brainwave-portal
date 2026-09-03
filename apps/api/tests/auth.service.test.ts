jest.mock("../src/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    session: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));
jest.mock("../src/middleware/authenticate", () => ({
  loadAuthenticatedUser: jest.fn(),
}));

import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { sha256 } from "../src/lib/crypto";
import { loadAuthenticatedUser } from "../src/middleware/authenticate";
import { login, refresh } from "../src/modules/auth/auth.service";

const db = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock };
  session: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  auditLog: { create: jest.Mock };
};
const meta = { ip: "127.0.0.1", userAgent: "jest" };

const authUser = {
  id: "u1",
  email: "sales@brainwave.dev",
  firstName: "Arjun",
  lastName: "Reddy",
  departmentId: null,
  roles: [{ id: "r1", name: "Sales", slug: "sales" }],
  permissions: new Set(["zoho:crm"]),
};

describe("auth service", () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword("Password123!");
  });

  beforeEach(() => {
    (loadAuthenticatedUser as jest.Mock).mockResolvedValue(authUser);
    db.session.create.mockResolvedValue({ id: "s1" });
    db.user.update.mockResolvedValue({});
    db.auditLog.create.mockResolvedValue({});
  });

  it("issues tokens and records a successful login", async () => {
    db.user.findUnique.mockResolvedValue({
      id: "u1", email: "sales@brainwave.dev", passwordHash, firstName: "Arjun", lastName: "Reddy",
      isActive: true, lastLoginAt: null, department: null,
    });

    const result = await login("sales@brainwave.dev", "Password123!", meta);

    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(result.profile.permissions).toEqual(["zoho:crm"]);
    expect(db.session.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tokenHash: sha256(result.tokens.refreshToken) }) }),
    );
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "auth.login.success" }) }),
    );
  });

  it("rejects a wrong password and audits the failure", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", email: "sales@brainwave.dev", passwordHash, isActive: true, department: null });
    await expect(login("sales@brainwave.dev", "wrong", meta)).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "auth.login.failed" }) }),
    );
  });

  it("rejects unknown emails with the same error", async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(login("nobody@brainwave.dev", "Password123!", meta)).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("rejects inactive accounts", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", email: "x", passwordHash, isActive: false, department: null });
    await expect(login("x", "Password123!", meta)).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("rotates the refresh token on refresh", async () => {
    const now = new Date();
    db.session.findUnique.mockResolvedValue({
      id: "s1", userId: "u1", revokedAt: null, expiresAt: new Date(now.getTime() + 86_400_000), lastActivityAt: now,
    });
    db.session.update.mockResolvedValue({});
    db.user.findUnique.mockResolvedValue({
      id: "u1", email: "sales@brainwave.dev", firstName: "Arjun", lastName: "Reddy", isActive: true, lastLoginAt: now, department: null,
    });

    const result = await refresh("old-token", meta);

    expect(result.tokens.refreshToken).not.toBe("old-token");
    expect(db.session.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tokenHash: sha256(result.tokens.refreshToken) }) }),
    );
  });

  it("revokes sessions that exceeded the idle timeout", async () => {
    const stale = new Date(Date.now() - 2 * 60 * 60 * 1000);
    db.session.findUnique.mockResolvedValue({
      id: "s1", userId: "u1", revokedAt: null, expiresAt: new Date(Date.now() + 86_400_000), lastActivityAt: stale,
    });
    db.session.update.mockResolvedValue({});

    await expect(refresh("token", meta)).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    expect(db.session.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ revokedAt: expect.any(Date) }) }),
    );
  });

  it("rejects revoked or unknown refresh tokens", async () => {
    db.session.findUnique.mockResolvedValue(null);
    await expect(refresh("token", meta)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
