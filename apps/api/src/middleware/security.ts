import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { isProduction } from "../config/env.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Cookie-based auth is vulnerable to cross-site form posts. Browsers cannot send
// application/json cross-origin without a CORS preflight, so requiring it on
// mutations (together with SameSite cookies) closes that hole.
export function requireJsonForMutations(req: Request, _res: Response, next: NextFunction): void {
  if (!MUTATING.has(req.method)) return next();
  const type = req.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    _res.status(415).json({ error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" } });
    return;
  }
  next();
}

export function enforceHttps(req: Request, res: Response, next: NextFunction): void {
  if (!isProduction || req.secure) return next();
  const host = req.get("host");
  res.redirect(308, `https://${host}${req.originalUrl}`);
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many login attempts. Try again in 15 minutes." } },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
});
