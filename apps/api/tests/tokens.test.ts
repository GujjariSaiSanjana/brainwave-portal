import jwt from "jsonwebtoken";
import { AppError } from "../src/lib/errors";
import { signAccessToken, verifyAccessToken } from "../src/lib/tokens";

describe("access tokens", () => {
  it("signs and verifies claims", () => {
    const token = signAccessToken({ sub: "user-1", sid: "session-1" });
    expect(verifyAccessToken(token)).toEqual({ sub: "user-1", sid: "session-1" });
  });

  it("reports expiry with TOKEN_EXPIRED", () => {
    const expired = jwt.sign({ sid: "s" }, process.env.JWT_SECRET!, {
      subject: "u",
      issuer: "brainwave-api",
      audience: "brainwave-web",
      expiresIn: -10,
    });
    expect(() => verifyAccessToken(expired)).toThrow(expect.objectContaining({ code: "TOKEN_EXPIRED" }));
  });

  it("rejects tokens signed with another secret", () => {
    const forged = jwt.sign({ sid: "s" }, "not-the-secret", { subject: "u", issuer: "brainwave-api", audience: "brainwave-web" });
    expect(() => verifyAccessToken(forged)).toThrow(AppError);
  });
});
