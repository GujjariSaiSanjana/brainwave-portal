import { AUDIT } from "../../config/audit-actions.js";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import type { RequestMeta } from "../../lib/request-meta.js";
import type { AuthenticatedUser } from "../../middleware/authenticate.js";
import { hasPermission } from "../../rbac/engine.js";
import * as audit from "../audit/audit.service.js";
import { fetchInvoices } from "./apps/books.js";
import { fetchLeads } from "./apps/crm.js";
import { fetchTickets } from "./apps/desk.js";
import { fetchEmployees } from "./apps/people.js";
import { ZOHO_SERVICES, findService, type ZohoRecords, type ZohoService, type ZohoServiceKey } from "./zoho.catalog.js";
import { isMockMode, status as connectionStatus } from "./zoho.connection.js";
import { mockRecords } from "./zoho.mock.js";

const fetchers: Record<ZohoServiceKey, () => Promise<ZohoRecords>> = {
  crm: fetchLeads,
  people: fetchEmployees,
  desk: fetchTickets,
  books: fetchInvoices,
};

export function servicesFor(user: AuthenticatedUser): ZohoService[] {
  return ZOHO_SERVICES.filter((s) => hasPermission(user.permissions, s.permission));
}

// Resolves a service the user is allowed to use. Unknown keys and keys the user cannot
// access both produce the same 403 so the catalog is not enumerable by guessing.
export function authorizedService(user: AuthenticatedUser, key: string): ZohoService {
  const service = findService(key);
  if (!service || !hasPermission(user.permissions, service.permission)) throw AppError.forbidden();
  return service;
}

export async function listServices(user: AuthenticatedUser) {
  const { connected, mock } = await connectionStatus();
  return { items: servicesFor(user), connected: connected || mock, mock };
}

// Short-lived cache so a burst of page loads costs one Zoho call, not one per user.
const cache = new Map<ZohoServiceKey, { data: ZohoRecords; expiresAt: number }>();

async function loadRecords(key: ZohoServiceKey): Promise<ZohoRecords> {
  if (isMockMode()) return mockRecords(key);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data;
  const data = await fetchers[key]();
  if (env.ZOHO_CACHE_TTL_SECONDS > 0) cache.set(key, { data, expiresAt: Date.now() + env.ZOHO_CACHE_TTL_SECONDS * 1000 });
  return data;
}

export async function records(user: AuthenticatedUser, key: string, meta: RequestMeta) {
  const service = authorizedService(user, key);
  const data = await loadRecords(service.key);
  await audit.record({
    ...meta,
    action: AUDIT.ZOHO_RECORDS_VIEWED,
    actorId: user.id,
    targetType: "zoho_service",
    targetId: service.key,
    metadata: { rows: data.rows.length, mock: isMockMode() },
  });
  return { service, ...data, fetchedAt: new Date().toISOString() };
}

export async function launch(user: AuthenticatedUser, key: string, meta: RequestMeta): Promise<{ url: string }> {
  const service = authorizedService(user, key);
  await audit.record({ ...meta, action: AUDIT.ZOHO_LAUNCHED, actorId: user.id, targetType: "zoho_service", targetId: service.key });
  return { url: service.portalUrl };
}
