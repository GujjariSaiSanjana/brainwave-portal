import { env } from "../../config/env.js";
import { AUDIT } from "../../config/audit-actions.js";
import { randomToken, sha256 } from "../../lib/crypto.js";
import { AppError } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMeta } from "../../lib/request-meta.js";
import { signAccessToken } from "../../lib/tokens.js";
import { loadAuthenticatedUser, type AuthenticatedUser } from "../../middleware/authenticate.js";
import * as audit from "../audit/audit.service.js";

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  department: { id: string; name: string; slug: string } | null;
  roles: { id: string; name: string; slug: string }[];
  permissions: string[];
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export async function getProfile(userId: string): Promise<Profile> {
  const [user, auth] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { department: { select: { id: true, name: true, slug: true } } },
    }),
    loadAuthenticatedUser(userId),
  ]);
  if (!user || !auth) throw AppError.unauthenticated();
  return toProfile(user, auth);
}

function toProfile(
  user: { id: string; email: string; firstName: string; lastName: string; isActive: boolean; lastLoginAt: Date | null; department: Profile["department"] },
  auth: AuthenticatedUser,
): Profile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    department: user.department,
    roles: auth.roles,
    permissions: [...auth.permissions].sort(),
  };
}

async function createSession(userId: string, meta: RequestMeta): Promise<IssuedTokens> {
  const refreshToken = randomToken();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  return { accessToken: signAccessToken({ sub: userId, sid: session.id }), refreshToken };
}

export async function login(email: string, password: string, meta: RequestMeta): Promise<{ profile: Profile; tokens: IssuedTokens }> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { department: { select: { id: true, name: true, slug: true } } },
  });

  // Verify against a dummy hash when the user is unknown so timing does not reveal account existence.
  const passwordOk = await verifyPassword(user?.passwordHash ?? (await dummyHash), password);
  if (!user || !passwordOk || !user.isActive) {
    await audit.record({ ...meta, action: AUDIT.LOGIN_FAILED, actorId: user?.id ?? null, metadata: { email } });
    throw AppError.invalidCredentials();
  }

  const [tokens, auth] = await Promise.all([
    createSession(user.id, meta),
    loadAuthenticatedUser(user.id),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);
  if (!auth) throw AppError.invalidCredentials();

  await audit.record({ ...meta, action: AUDIT.LOGIN_SUCCESS, actorId: user.id });
  return { profile: toProfile({ ...user, lastLoginAt: new Date() }, auth), tokens };
}

// Rotates the refresh token on every use. A reused (already rotated) token is treated as
// theft and the whole session is revoked.
export async function refresh(refreshToken: string, meta: RequestMeta): Promise<{ profile: Profile; tokens: IssuedTokens }> {
  const session = await prisma.session.findUnique({ where: { tokenHash: sha256(refreshToken) } });
  if (!session || session.revokedAt) throw AppError.unauthenticated("Session is no longer valid");

  const now = Date.now();
  const idleLimitMs = env.SESSION_IDLE_TIMEOUT_MINUTES * 60_000;
  if (session.expiresAt.getTime() < now || now - session.lastActivityAt.getTime() > idleLimitMs) {
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    throw AppError.tokenExpired();
  }

  const auth = await loadAuthenticatedUser(session.userId);
  if (!auth) throw AppError.unauthenticated("Account is inactive or no longer exists");

  const nextToken = randomToken();
  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: sha256(nextToken), lastActivityAt: new Date(), ip: meta.ip, userAgent: meta.userAgent },
  });

  await audit.record({ ...meta, action: AUDIT.REFRESH, actorId: auth.id });
  const profile = await getProfile(auth.id);
  return {
    profile,
    tokens: { accessToken: signAccessToken({ sub: auth.id, sid: session.id }), refreshToken: nextToken },
  };
}

export async function logout(refreshToken: string | undefined, actorId: string | undefined, meta: RequestMeta): Promise<void> {
  if (refreshToken) {
    await prisma.session.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  if (actorId) await audit.record({ ...meta, action: AUDIT.LOGOUT, actorId });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, meta: RequestMeta): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthenticated();
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    throw AppError.badRequest("Current password is incorrect");
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } }),
    // Every other session is revoked when the password changes.
    prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await audit.record({ ...meta, action: AUDIT.PASSWORD_CHANGED, actorId: userId });
}

// Hash of a random value, only used to equalise timing when the email is unknown.
const dummyHash = hashPassword(randomToken());
