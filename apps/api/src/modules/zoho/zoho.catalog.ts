import { env } from "../../config/env.js";
import { PERMISSIONS } from "../../config/permissions.js";

export type ZohoServiceKey = "crm" | "people" | "desk" | "books";

export interface ZohoService {
  key: ZohoServiceKey;
  name: string;
  description: string;
  portalUrl: string;
  resourceLabel: string;
  permission: string;
}

export interface ZohoColumn {
  key: string;
  label: string;
}

export type ZohoRow = Record<string, string | number | null>;

export interface ZohoRecords {
  columns: ZohoColumn[];
  rows: ZohoRow[];
}

const region = env.ZOHO_REGION;

export const ZOHO_HOSTS = {
  accounts: `https://accounts.zoho.${region}`,
  api: `https://www.zohoapis.${region}`,
  people: `https://people.zoho.${region}`,
  desk: `https://desk.zoho.${region}`,
};

export const ZOHO_SCOPES = [
  "ZohoCRM.modules.leads.READ",
  "ZohoCRM.settings.modules.READ",
  "ZOHOPEOPLE.forms.READ",
  "Desk.tickets.READ",
  "Desk.basic.READ",
  "Desk.settings.READ",
  "ZohoBooks.invoices.READ",
  "ZohoBooks.settings.READ",
];

export const ZOHO_SERVICES: ZohoService[] = [
  {
    key: "crm",
    name: "Zoho CRM",
    description: "Leads, contacts, deals and the sales pipeline.",
    portalUrl: `https://crm.zoho.${region}/crm`,
    resourceLabel: "Leads",
    permission: PERMISSIONS.ZOHO_CRM,
  },
  {
    key: "people",
    name: "Zoho People",
    description: "Employee records, leave and attendance.",
    portalUrl: `https://people.zoho.${region}/people/`,
    resourceLabel: "Employees",
    permission: PERMISSIONS.ZOHO_PEOPLE,
  },
  {
    key: "desk",
    name: "Zoho Desk",
    description: "Customer support tickets and cases.",
    portalUrl: `https://desk.zoho.${region}/`,
    resourceLabel: "Tickets",
    permission: PERMISSIONS.ZOHO_DESK,
  },
  {
    key: "books",
    name: "Zoho Books",
    description: "Invoices, expenses and accounting.",
    portalUrl: `https://books.zoho.${region}/`,
    resourceLabel: "Invoices",
    permission: PERMISSIONS.ZOHO_BOOKS,
  },
];

export function findService(key: string): ZohoService | undefined {
  return ZOHO_SERVICES.find((s) => s.key === key);
}
