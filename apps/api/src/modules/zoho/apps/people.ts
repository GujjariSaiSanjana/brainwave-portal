import { ZOHO_HOSTS, type ZohoRecords } from "../zoho.catalog.js";
import { str, zohoGet } from "../zoho.http.js";

// Zoho People returns `{ response: { result: [ { "<id>": [ record ] }, ... ] } }`.
interface PeopleResponse {
  response?: { result?: Record<string, Record<string, unknown>[]>[]; message?: string };
}

export async function fetchEmployees(): Promise<ZohoRecords> {
  const body = await zohoGet<PeopleResponse>(() => ({
    url: `${ZOHO_HOSTS.people}/people/api/forms/employee/getRecords?sIndex=1&limit=25`,
  }));

  const records = (body.response?.result ?? []).flatMap((entry) => Object.values(entry).flat());

  return {
    columns: [
      { key: "employeeId", label: "Employee ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "designation", label: "Designation" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
      { key: "joined", label: "Joined" },
    ],
    rows: records.map((r) => ({
      id: str(r.Zoho_ID),
      employeeId: str(r.EmployeeID),
      name: [str(r.FirstName), str(r.LastName)].filter(Boolean).join(" ") || null,
      email: str(r.EmailID),
      designation: str(r.Designation),
      department: str(r.Department),
      status: str(r.Employeestatus),
      joined: str(r.Dateofjoining),
    })),
  };
}
