// Accounts and roles created by the seed script. In demo mode they cannot be
// deleted, deactivated or locked out, so a public demo keeps working.
export const SEEDED_EMAILS = [
  "admin@brainwave.dev",
  "manager@brainwave.dev",
  "hr@brainwave.dev",
  "sales@brainwave.dev",
  "support@brainwave.dev",
  "finance@brainwave.dev",
  "employee@brainwave.dev",
] as const;

export const SEEDED_ROLE_SLUGS = ["admin", "manager", "employee", "hr", "sales", "support", "finance"] as const;
