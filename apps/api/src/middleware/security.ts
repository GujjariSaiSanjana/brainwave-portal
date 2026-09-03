import type { NextFunction, Request, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { isProduction } from "../config/env.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Cookie-based auth is vulnerable to cross-site form posts. Browsers cannot send
// application/json cross-origin without a CORS preflight, so requiring it on
// mutations (together with SameSite cookies) closes that hole.
export function requireJsonForMutations(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING.has(req.method)) return next();
  const type = req.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    res.status(415).json({ error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" } });
    return;
  }
  next();
}

export function enforceHttps(req: Request, res: Response, next: NextFunction): void {
  if (!isProduction || req.secure) return next();
  const host = req.get("host");
  res.redirect(308, `https://${host}${req.originalUrl}`);
}

const limited = (message: string) => ({
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message } },
});

const byIp = (req: Request) => ipKeyGenerator(req.ip ?? "");
const byUserOrIp = (req: Request) => (req.user ? `user:${req.user.id}` : byIp(req));
const byEmail = (req: Request) => {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? `email:${email.toLowerCase().trim()}` : byIp(req);
};

// Whole API, per IP.
export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  keyGenerator: byIp,
  ...limited("Too many requests"),
});

// Login: per IP and per email so a botnet cannot brute-force one account.
export const loginIpRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  keyGenerator: byIp,
  ...limited("Too many login attempts from this address. Try again in 15 minutes."),
});
export const loginEmailRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 8,
  skipSuccessfulRequests: true,
  keyGenerator: byEmail,
  ...limited("Too many failed attempts for this account. Try again in 15 minutes."),
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 60,
  keyGenerator: byIp,
  ...limited("Too many session refreshes"),
});

// Zoho calls consume the shared service account's API quota, so cap them per user.
export const zohoRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: byUserOrIp,
  ...limited("Too many Zoho requests. Wait a minute and try again."),
});

// Admin writes (user/role changes) per user.
export const adminWriteRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 60,
  keyGenerator: byUserOrIp,
  skip: (req) => !MUTATING.has(req.method),
  ...limited("Too many changes in a short time. Try again later."),
});
