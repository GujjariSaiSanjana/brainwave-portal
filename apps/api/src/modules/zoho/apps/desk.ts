import { env } from "../../../config/env.js";
import { AppError } from "../../../lib/errors.js";
import { ZOHO_HOSTS, type ZohoRecords } from "../zoho.catalog.js";
import { str, zohoGet } from "../zoho.http.js";

interface OrgsResponse {
  data?: { id: string }[];
}
interface TicketsResponse {
  data?: Record<string, unknown>[];
}

let cachedOrgId: string | null = null;

async function orgId(): Promise<string> {
  if (env.ZOHO_DESK_ORG_ID) return env.ZOHO_DESK_ORG_ID;
  if (cachedOrgId) return cachedOrgId;
  const orgs = await zohoGet<OrgsResponse>(() => ({ url: `${ZOHO_HOSTS.desk}/api/v1/organizations` }));
  const first = orgs.data?.[0]?.id;
  if (!first) throw AppError.zohoError("No Zoho Desk organization found on this account");
  cachedOrgId = first;
  return first;
}

export async function fetchTickets(): Promise<ZohoRecords> {
  const org = await orgId();
  const body = await zohoGet<TicketsResponse>(() => ({
    url: `${ZOHO_HOSTS.desk}/api/v1/tickets?limit=25&sortBy=-createdTime`,
    headers: { orgId: org },
  }));

  return {
    columns: [
      { key: "number", label: "Ticket" },
      { key: "subject", label: "Subject" },
      { key: "contact", label: "Contact" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "channel", label: "Channel" },
      { key: "createdAt", label: "Created" },
    ],
    rows: (body.data ?? []).map((t) => ({
      id: str(t.id),
      number: str(t.ticketNumber),
      subject: str(t.subject),
      contact: str(t.email) ?? str(t.contactId),
      status: str(t.status),
      priority: str(t.priority),
      channel: str(t.channel),
      createdAt: str(t.createdTime),
    })),
  };
}
