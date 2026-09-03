export interface RoleWithPermissions {
  slug: string;
  permissions: string[];
}

// Effective permissions are the union of every role's permissions.
export function resolvePermissions(roles: RoleWithPermissions[]): Set<string> {
  const result = new Set<string>();
  for (const role of roles) {
    for (const permission of role.permissions) result.add(permission);
  }
  return result;
}

export function hasPermission(granted: ReadonlySet<string>, required: string): boolean {
  return granted.has(required);
}

export function hasAllPermissions(granted: ReadonlySet<string>, required: readonly string[]): boolean {
  return required.every((p) => granted.has(p));
}

export function hasAnyPermission(granted: ReadonlySet<string>, required: readonly string[]): boolean {
  return required.some((p) => granted.has(p));
}
