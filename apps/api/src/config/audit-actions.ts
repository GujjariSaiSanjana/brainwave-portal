export const AUDIT = {
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILED: "auth.login.failed",
  LOGOUT: "auth.logout",
  REFRESH: "auth.refresh",
  PASSWORD_CHANGED: "auth.password.changed",
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_ROLES_UPDATED: "user.roles.updated",
  USER_DELETED: "user.deleted",
  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_PERMISSIONS_UPDATED: "role.permissions.updated",
  ROLE_DELETED: "role.deleted",
  ZOHO_CONNECTED: "zoho.connected",
  ZOHO_DISCONNECTED: "zoho.disconnected",
  ZOHO_RECORDS_VIEWED: "zoho.records.viewed",
  ZOHO_LAUNCHED: "zoho.launched",
} as const;

export type AuditAction = (typeof AUDIT)[keyof typeof AUDIT];
export const AUDIT_ACTIONS: AuditAction[] = Object.values(AUDIT);
