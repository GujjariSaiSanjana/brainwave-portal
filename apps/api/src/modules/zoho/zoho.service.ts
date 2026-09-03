import { AUDIT } from "../../config/audit-actions.js";
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

export async function records(user: AuthenticatedUser, key: string, meta: RequestMeta) {
  const service = authorizedService(user, key);
  const data = isMockMode() ? mockRecords(service.key) : await fetchers[service.key]();
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
