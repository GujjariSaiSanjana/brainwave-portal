export interface Department {
  id: string;
  name: string;
  slug: string;
}

export interface RoleRef {
  id: string;
  name: string;
  slug: string;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  department: Department | null;
  roles: RoleRef[];
  permissions: string[];
}

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  department: Department | null;
  roles: RoleRef[];
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

export interface Permission {
  id: string;
  key: string;
  description: string;
  group: string;
}

export interface AuditActor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: AuditActor | null;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ZohoServiceKey = "crm" | "people" | "desk" | "books";

export interface ZohoService {
  key: ZohoServiceKey;
  name: string;
  description: string;
  portalUrl: string;
  resourceLabel: string;
  permission: string;
}

export interface ZohoServicesResponse {
  items: ZohoService[];
  connected: boolean;
  mock: boolean;
}

export interface ZohoRecordsResponse {
  service: ZohoService;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number | null>[];
  fetchedAt: string;
}

export interface ZohoStatus {
  connected: boolean;
  mock: boolean;
  region: string;
  apiDomain: string | null;
  accountsServer: string | null;
  scopes: string[];
  connectedAt: string | null;
  connectedBy: { email: string } | null;
}

export interface TeamResponse {
  department: Department | null;
  members: UserSummary[];
  activity: AuditEntry[];
}

export const AUDIT_ACTIONS = [
  "auth.login.success",
  "auth.login.failed",
  "auth.logout",
  "auth.refresh",
  "auth.password.changed",
  "user.created",
  "user.updated",
  "user.roles.updated",
  "user.deleted",
  "role.created",
  "role.updated",
  "role.permissions.updated",
  "role.deleted",
  "zoho.connected",
  "zoho.disconnected",
  "zoho.records.viewed",
  "zoho.launched",
] as const;
