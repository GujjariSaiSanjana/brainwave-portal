import type { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE } from "../lib/cookies.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { resolvePermissions } from "../rbac/engine.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string | null;
  roles: { id: string; name: string; slug: string }[];
  permissions: Set<string>;
}

// Permissions are resolved from the database on every request so that role changes and
// deactivations take effect immediately rather than when the access token expires.
export async function loadAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!user || !user.isActive) return null;

  const roles = user.roles.map((ur) => ({
    id: ur.role.id,
    name: ur.role.name,
    slug: ur.role.slug,
    permissions: ur.role.permissions.map((rp) => rp.permission.key),
  }));

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    departmentId: user.departmentId,
    roles: roles.map(({ id, name, slug }) => ({ id, name, slug })),
    permissions: resolvePermissions(roles),
  };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = (req.cookies as Record<string, string | undefined>)[ACCESS_COOKIE];
  if (!token) throw AppError.unauthenticated();

  const claims = verifyAccessToken(token);
  const user = await loadAuthenticatedUser(claims.sub);
  if (!user) throw AppError.unauthenticated("Account is inactive or no longer exists");

  req.user = user;
  req.sessionId = claims.sid;
  next();
}

export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw AppError.unauthenticated();
  return req.user;
}
