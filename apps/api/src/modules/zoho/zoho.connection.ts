import { randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { decrypt, encrypt } from "../../lib/crypto.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { ZOHO_HOSTS, ZOHO_SCOPES } from "./zoho.catalog.js";

// The portal uses one Zoho service account. Its refresh token is stored encrypted and
// only ever leaves this module as a short-lived access token used server-side.

const key = env.TOKEN_ENCRYPTION_KEY;
export const REDIRECT_URI = `${env.API_URL}/api/zoho/oauth/callback`;

export function isMockMode(): boolean {
  return env.ZOHO_MOCK || !env.ZOHO_CLIENT_ID || !env.ZOHO_CLIENT_SECRET;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  api_domain?: string;
  error?: string;
}

// OAuth state values are single use and expire after ten minutes.
const pendingStates = new Map<string, number>();

export function createState(): string {
  const state = randomBytes(24).toString("base64url");
  pendingStates.set(state, Date.now() + 10 * 60_000);
  return state;
}

export function consumeState(state: string): boolean {
  const expiresAt = pendingStates.get(state);
  pendingStates.delete(state);
  for (const [s, exp] of pendingStates) if (exp < Date.now()) pendingStates.delete(s);
  return expiresAt !== undefined && expiresAt > Date.now();
}

export function authorizationUrl(state: string): string {
  const params = new URLSearchParams({
    scope: ZOHO_SCOPES.join(","),
    client_id: env.ZOHO_CLIENT_ID,
    response_type: "code",
    access_type: "offline",
    redirect_uri: REDIRECT_URI,
    prompt: "consent",
    state,
  });
  return `${ZOHO_HOSTS.accounts}/oauth/v2/auth?${params.toString()}`;
}

async function tokenRequest(accountsServer: string, params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${accountsServer}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || body.error) {
    throw AppError.zohoError(`Zoho token request failed: ${body.error ?? res.status}`);
  }
  return body;
}

export async function exchangeCode(code: string, accountsServer: string, connectedById: string | null): Promise<void> {
  const token = await tokenRequest(accountsServer, {
    grant_type: "authorization_code",
    client_id: env.ZOHO_CLIENT_ID,
    client_secret: env.ZOHO_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    code,
  });
  if (!token.refresh_token || !token.access_token) {
    throw AppError.zohoError("Zoho did not return a refresh token. Make sure access_type=offline and prompt=consent.");
  }

  const data = {
    accountsServer,
    apiDomain: token.api_domain ?? ZOHO_HOSTS.api,
    scopes: ZOHO_SCOPES.join(","),
    refreshTokenEnc: encrypt(token.refresh_token, key),
    accessTokenEnc: encrypt(token.access_token, key),
    accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000),
    connectedById,
  };

  // Single connection row: replace whatever was there.
  await prisma.$transaction([prisma.zohoConnection.deleteMany(), prisma.zohoConnection.create({ data })]);
}

export async function disconnect(): Promise<void> {
  await prisma.zohoConnection.deleteMany();
}

export async function status() {
  const conn = await prisma.zohoConnection.findFirst({
    include: { connectedBy: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return {
    connected: conn !== null,
    mock: isMockMode(),
    region: env.ZOHO_REGION,
    apiDomain: conn?.apiDomain ?? ZOHO_HOSTS.api,
    accountsServer: conn?.accountsServer ?? ZOHO_HOSTS.accounts,
    scopes: (conn?.scopes ?? ZOHO_SCOPES.join(",")).split(","),
    connectedAt: conn?.createdAt ?? null,
    connectedBy: conn?.connectedBy ?? null,
    redirectUri: REDIRECT_URI,
  };
}

export interface ZohoCredentials {
  accessToken: string;
  apiDomain: string;
}

let refreshing: Promise<ZohoCredentials> | null = null;

// Returns a usable access token, refreshing it when it is within a minute of expiry.
// Concurrent callers share one refresh.
export async function getCredentials(): Promise<ZohoCredentials> {
  const conn = await prisma.zohoConnection.findFirst({ orderBy: { createdAt: "desc" } });
  if (!conn) throw AppError.zohoNotConnected();

  const fresh = conn.accessTokenEnc && conn.accessTokenExpiresAt && conn.accessTokenExpiresAt.getTime() - Date.now() > 60_000;
  if (fresh && conn.accessTokenEnc) {
    return { accessToken: decrypt(conn.accessTokenEnc, key), apiDomain: conn.apiDomain };
  }

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const token = await tokenRequest(conn.accountsServer, {
          grant_type: "refresh_token",
          client_id: env.ZOHO_CLIENT_ID,
          client_secret: env.ZOHO_CLIENT_SECRET,
          refresh_token: decrypt(conn.refreshTokenEnc, key),
        });
        if (!token.access_token) throw AppError.zohoError("Zoho refresh returned no access token");
        await prisma.zohoConnection.update({
          where: { id: conn.id },
          data: {
            accessTokenEnc: encrypt(token.access_token, key),
            accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000),
            apiDomain: token.api_domain ?? conn.apiDomain,
          },
        });
        logger.info("Refreshed Zoho access token");
        return { accessToken: token.access_token, apiDomain: token.api_domain ?? conn.apiDomain };
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}
