import { env } from "../config/env.js";
import { SEEDED_EMAILS, SEEDED_ROLE_SLUGS } from "../config/demo.js";
import { AppError } from "./errors.js";

const protectedEmails = new Set<string>(SEEDED_EMAILS);
const protectedRoles = new Set<string>(SEEDED_ROLE_SLUGS);

export const isDemoMode = (): boolean => env.DEMO_MODE;

export function assertUserNotProtected(email: string, action: string): void {
  if (isDemoMode() && protectedEmails.has(email.toLowerCase())) {
    throw AppError.forbidden(`Demo accounts cannot be ${action}. Create a new user to try this.`);
  }
}

export function assertRoleNotProtected(slug: string, action: string): void {
  if (isDemoMode() && protectedRoles.has(slug)) {
    throw AppError.forbidden(`Seeded roles cannot be ${action}. Create a new role to try this.`);
  }
}

export function assertDemoAllows(action: string): void {
  if (isDemoMode()) throw AppError.forbidden(`${action} is disabled in demo mode.`);
}
