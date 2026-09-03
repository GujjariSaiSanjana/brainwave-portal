import type { ZohoRecords } from "../zoho.catalog.js";
import { str, zohoGet } from "../zoho.http.js";

interface LeadsResponse {
  data?: Record<string, unknown>[];
}

export async function fetchLeads(): Promise<ZohoRecords> {
  const fields = ["Full_Name", "Company", "Email", "Phone", "Lead_Status", "Lead_Source", "Created_Time"];
  const body = await zohoGet<LeadsResponse>((apiDomain) => ({
    url: `${apiDomain}/crm/v7/Leads?fields=${fields.join(",")}&per_page=25&sort_by=Created_Time&sort_order=desc`,
  }));

  return {
    columns: [
      { key: "name", label: "Name" },
      { key: "company", label: "Company" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "createdAt", label: "Created" },
    ],
    rows: (body.data ?? []).map((lead) => ({
      id: str(lead.id),
      name: str(lead.Full_Name),
      company: str(lead.Company),
      email: str(lead.Email),
      phone: str(lead.Phone),
      status: str(lead.Lead_Status),
      source: str(lead.Lead_Source),
      createdAt: str(lead.Created_Time),
    })),
  };
}
