import { Router } from "express";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "../../lib/cookies.js";
import { AppError } from "../../lib/errors.js";
import { requestMeta } from "../../lib/request-meta.js";
import { validateBody } from "../../lib/validation.js";
import { authenticate, requireUser } from "../../middleware/authenticate.js";
import { loginRateLimiter } from "../../middleware/security.js";
import { changePasswordSchema, loginSchema } from "./auth.schemas.js";
import * as auth from "./auth.service.js";

export const authRouter = Router();

function refreshCookie(req: { cookies: unknown }): string | undefined {
  return (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
}

authRouter.post("/login", loginRateLimiter, async (req, res) => {
  const { email, password } = validateBody(loginSchema, req);
  const { profile, tokens } = await auth.login(email, password, requestMeta(req));
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.json({ user: profile });
});

authRouter.post("/refresh", async (req, res) => {
  const token = refreshCookie(req);
  if (!token) throw AppError.unauthenticated("Missing refresh token");
  try {
    const { profile, tokens } = await auth.refresh(token, requestMeta(req));
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ user: profile });
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }
});

authRouter.post("/logout", async (req, res) => {
  // Best effort: identify the actor if the access token is still valid, but never block logout.
  let actorId: string | undefined;
  try {
    await new Promise<void>((resolve, reject) =>
      authenticate(req, res, (e?: unknown) => (e ? reject(e) : resolve())),
    );
    actorId = req.user?.id;
  } catch {
    actorId = undefined;
  }
  await auth.logout(refreshCookie(req), actorId, requestMeta(req));
  clearAuthCookies(res);
  res.status(204).end();
});

authRouter.get("/me", authenticate, async (req, res) => {
  const user = requireUser(req);
  res.json({ user: await auth.getProfile(user.id) });
});

authRouter.post("/change-password", authenticate, async (req, res) => {
  const user = requireUser(req);
  const { currentPassword, newPassword } = validateBody(changePasswordSchema, req);
  await auth.changePassword(user.id, currentPassword, newPassword, requestMeta(req));
  clearAuthCookies(res);
  res.status(204).end();
});
