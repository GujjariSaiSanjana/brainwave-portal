export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  AUDIT_READ: "audit:read",
  TEAM_READ: "team:read",
  INTEGRATIONS_MANAGE: "integrations:manage",
  ZOHO_CRM: "zoho:crm",
  ZOHO_PEOPLE: "zoho:people",
  ZOHO_DESK: "zoho:desk",
  ZOHO_BOOKS: "zoho:books",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: PermissionKey;
  description: string;
  group: string;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { key: PERMISSIONS.USERS_READ, description: "View users", group: "Users" },
  { key: PERMISSIONS.USERS_WRITE, description: "Create, edit and delete users", group: "Users" },
  { key: PERMISSIONS.ROLES_READ, description: "View roles and permissions", group: "Roles" },
  { key: PERMISSIONS.ROLES_WRITE, description: "Create, edit and delete roles", group: "Roles" },
  { key: PERMISSIONS.AUDIT_READ, description: "View audit logs", group: "Monitoring" },
  { key: PERMISSIONS.TEAM_READ, description: "View own department's team and activity", group: "Monitoring" },
  { key: PERMISSIONS.INTEGRATIONS_MANAGE, description: "Connect and manage Zoho integration", group: "Integrations" },
  { key: PERMISSIONS.ZOHO_CRM, description: "Access Zoho CRM", group: "Zoho" },
  { key: PERMISSIONS.ZOHO_PEOPLE, description: "Access Zoho People", group: "Zoho" },
  { key: PERMISSIONS.ZOHO_DESK, description: "Access Zoho Desk", group: "Zoho" },
  { key: PERMISSIONS.ZOHO_BOOKS, description: "Access Zoho Books", group: "Zoho" },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_CATALOG.map((p) => p.key);

export const SYSTEM_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
} as const;
