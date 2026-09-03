import type { ZohoRecords, ZohoServiceKey } from "./zoho.catalog.js";

// Fixture data returned when ZOHO_MOCK=true or no client credentials are configured.
const fixtures: Record<ZohoServiceKey, ZohoRecords> = {
  crm: {
    columns: [
      { key: "name", label: "Name" },
      { key: "company", label: "Company" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "createdAt", label: "Created" },
    ],
    rows: [
      { id: "1", name: "Priya Raman", company: "Northwind Traders", email: "priya@northwind.example", phone: "+91 98400 11223", status: "Contacted", source: "Web Form", createdAt: "2026-08-28T09:12:00+05:30" },
      { id: "2", name: "Daniel Okafor", company: "Lakeside Logistics", email: "d.okafor@lakeside.example", phone: "+44 20 7946 0958", status: "Qualified", source: "Referral", createdAt: "2026-08-27T15:40:00+05:30" },
      { id: "3", name: "Meera Iyer", company: "Aster Health", email: "meera@asterhealth.example", phone: "+91 99870 44556", status: "Not Contacted", source: "Trade Show", createdAt: "2026-08-26T11:05:00+05:30" },
      { id: "4", name: "Tom Becker", company: "Becker & Sons", email: "tom@beckersons.example", phone: "+49 30 901820", status: "Junk Lead", source: "Cold Call", createdAt: "2026-08-25T17:20:00+05:30" },
      { id: "5", name: "Aisha Khan", company: "Bluefin Analytics", email: "aisha@bluefin.example", phone: "+971 4 555 0199", status: "Contacted", source: "Advertisement", createdAt: "2026-08-24T10:00:00+05:30" },
    ],
  },
  people: {
    columns: [
      { key: "employeeId", label: "Employee ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "designation", label: "Designation" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
      { key: "joined", label: "Joined" },
    ],
    rows: [
      { id: "1", employeeId: "EMP001", name: "Sanjana Gujjari", email: "sanjana@brainwave.example", designation: "HR Executive", department: "Human Resources", status: "Active", joined: "2024-03-11" },
      { id: "2", employeeId: "EMP002", name: "Rahul Verma", email: "rahul@brainwave.example", designation: "Software Engineer", department: "Engineering", status: "Active", joined: "2023-07-01" },
      { id: "3", employeeId: "EMP003", name: "Lakshmi Nair", email: "lakshmi@brainwave.example", designation: "Accountant", department: "Finance", status: "Active", joined: "2022-11-15" },
      { id: "4", employeeId: "EMP004", name: "Arjun Reddy", email: "arjun@brainwave.example", designation: "Sales Executive", department: "Sales", status: "Active", joined: "2025-01-20" },
      { id: "5", employeeId: "EMP005", name: "Neha Kapoor", email: "neha@brainwave.example", designation: "Support Specialist", department: "Support", status: "On Notice", joined: "2023-02-06" },
    ],
  },
  desk: {
    columns: [
      { key: "number", label: "Ticket" },
      { key: "subject", label: "Subject" },
      { key: "contact", label: "Contact" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "channel", label: "Channel" },
      { key: "createdAt", label: "Created" },
    ],
    rows: [
      { id: "1", number: "1042", subject: "Cannot download invoice PDF", contact: "priya@northwind.example", status: "Open", priority: "High", channel: "Email", createdAt: "2026-09-02T08:30:00+05:30" },
      { id: "2", number: "1041", subject: "Two-factor code not arriving", contact: "d.okafor@lakeside.example", status: "On Hold", priority: "Medium", channel: "Web", createdAt: "2026-09-01T19:10:00+05:30" },
      { id: "3", number: "1040", subject: "Request to add a second admin", contact: "meera@asterhealth.example", status: "Open", priority: "Low", channel: "Chat", createdAt: "2026-09-01T12:45:00+05:30" },
      { id: "4", number: "1039", subject: "Billing address update", contact: "tom@beckersons.example", status: "Closed", priority: "Low", channel: "Phone", createdAt: "2026-08-30T16:00:00+05:30" },
      { id: "5", number: "1038", subject: "API rate limit questions", contact: "aisha@bluefin.example", status: "Escalated", priority: "High", channel: "Email", createdAt: "2026-08-29T09:55:00+05:30" },
    ],
  },
  books: {
    columns: [
      { key: "number", label: "Invoice" },
      { key: "customer", label: "Customer" },
      { key: "date", label: "Date" },
      { key: "dueDate", label: "Due" },
      { key: "total", label: "Total" },
      { key: "balance", label: "Balance" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { id: "1", number: "INV-000118", customer: "Northwind Traders", date: "2026-08-28", dueDate: "2026-09-27", total: 125000, balance: 125000, status: "sent" },
      { id: "2", number: "INV-000117", customer: "Lakeside Logistics", date: "2026-08-21", dueDate: "2026-09-20", total: 48250, balance: 0, status: "paid" },
      { id: "3", number: "INV-000116", customer: "Aster Health", date: "2026-08-14", dueDate: "2026-08-29", total: 210000, balance: 105000, status: "partially_paid" },
      { id: "4", number: "INV-000115", customer: "Becker & Sons", date: "2026-07-30", dueDate: "2026-08-14", total: 17600, balance: 17600, status: "overdue" },
      { id: "5", number: "INV-000114", customer: "Bluefin Analytics", date: "2026-07-22", dueDate: "2026-08-21", total: 92000, balance: 0, status: "paid" },
    ],
  },
};

export function mockRecords(key: ZohoServiceKey): ZohoRecords {
  return fixtures[key];
}
