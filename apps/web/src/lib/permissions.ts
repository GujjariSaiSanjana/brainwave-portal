import type { Profile } from "./types";

export const PERMISSIONS = {
  usersRead: "users:read",
  usersWrite: "users:write",
  rolesRead: "roles:read",
  rolesWrite: "roles:write",
  auditRead: "audit:read",
  teamRead: "team:read",
  integrationsManage: "integrations:manage",
} as const;

export function can(user: Profile | null | undefined, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function canAny(user: Profile | null | undefined, permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}
