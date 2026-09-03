import { env } from "../../../config/env.js";
import { AppError } from "../../../lib/errors.js";
import type { ZohoRecords } from "../zoho.catalog.js";
import { str, zohoGet } from "../zoho.http.js";

interface OrgsResponse {
  organizations?: { organization_id: string }[];
}
interface InvoicesResponse {
  invoices?: Record<string, unknown>[];
}

let cachedOrgId: string | null = null;

async function orgId(): Promise<string> {
  if (env.ZOHO_BOOKS_ORG_ID) return env.ZOHO_BOOKS_ORG_ID;
  if (cachedOrgId) return cachedOrgId;
  const orgs = await zohoGet<OrgsResponse>((apiDomain) => ({ url: `${apiDomain}/books/v3/organizations` }));
  const first = orgs.organizations?.[0]?.organization_id;
  if (!first) throw AppError.zohoError("No Zoho Books organization found on this account");
  cachedOrgId = first;
  return first;
}

export async function fetchInvoices(): Promise<ZohoRecords> {
  const org = await orgId();
  const body = await zohoGet<InvoicesResponse>((apiDomain) => ({
    url: `${apiDomain}/books/v3/invoices?organization_id=${encodeURIComponent(org)}&per_page=25&sort_column=date&sort_order=D`,
  }));

  return {
    columns: [
      { key: "number", label: "Invoice" },
      { key: "customer", label: "Customer" },
      { key: "date", label: "Date" },
      { key: "dueDate", label: "Due" },
      { key: "total", label: "Total" },
      { key: "balance", label: "Balance" },
      { key: "status", label: "Status" },
    ],
    rows: (body.invoices ?? []).map((inv) => ({
      id: str(inv.invoice_id),
      number: str(inv.invoice_number),
      customer: str(inv.customer_name),
      date: str(inv.date),
      dueDate: str(inv.due_date),
      total: typeof inv.total === "number" ? inv.total : str(inv.total),
      balance: typeof inv.balance === "number" ? inv.balance : str(inv.balance),
      status: str(inv.status),
    })),
  };
}
