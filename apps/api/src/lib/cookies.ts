import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../config/env.js";

export const ACCESS_COOKIE = "bw_access";
export const REFRESH_COOKIE = "bw_refresh";
const REFRESH_PATH = "/api/auth";

function base(): CookieOptions {
  return { httpOnly: true, secure: isProduction, sameSite: "lax" };
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const factor = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "ms" | "s" | "m" | "h" | "d"];
  return n * factor;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, { ...base(), path: "/", maxAge: parseDurationMs(env.ACCESS_TOKEN_TTL) });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base(),
    path: REFRESH_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...base(), path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...base(), path: REFRESH_PATH });
}
