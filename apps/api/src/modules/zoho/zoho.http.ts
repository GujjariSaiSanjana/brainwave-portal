import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { getCredentials } from "./zoho.connection.js";

export interface ZohoRequest {
  url: string;
  headers?: Record<string, string>;
}

// Thin wrapper around fetch that attaches the service-account token and turns Zoho
// failures into a consistent error. Callers never see the token.
export async function zohoGet<T>(build: (apiDomain: string) => ZohoRequest): Promise<T> {
  const { accessToken, apiDomain } = await getCredentials();
  const { url, headers } = build(apiDomain);

  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, Accept: "application/json", ...headers },
  });

  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!res.ok) {
    logger.warn({ url, status: res.status, body: text.slice(0, 500) }, "Zoho API error");
    throw AppError.zohoError(`Zoho responded with ${res.status}`, safeJson(text));
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text.slice(0, 200);
  }
}

export function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.name === "string") return o.name;
    if (typeof o.display_value === "string") return o.display_value;
    return JSON.stringify(value);
  }
  return String(value);
}
