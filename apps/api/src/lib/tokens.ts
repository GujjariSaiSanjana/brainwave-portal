import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

export interface AccessTokenClaims {
  sub: string;
  sid: string;
}

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign({ sid: claims.sid }, env.JWT_SECRET, {
    subject: claims.sub,
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    issuer: "brainwave-api",
    audience: "brainwave-web",
  });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: "brainwave-api",
      audience: "brainwave-web",
    }) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
      throw AppError.unauthenticated("Malformed token");
    }
    return { sub: payload.sub, sid: payload.sid };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw AppError.tokenExpired();
    if (err instanceof AppError) throw err;
    throw AppError.unauthenticated("Invalid token");
  }
}
