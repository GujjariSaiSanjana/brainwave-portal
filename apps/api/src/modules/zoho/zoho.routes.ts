import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AUDIT } from "../../config/audit-actions.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { requestMeta } from "../../lib/request-meta.js";
import { validateParams, validateQuery } from "../../lib/validation.js";
import { authenticate, requireUser } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as audit from "../audit/audit.service.js";
import { ZOHO_HOSTS } from "./zoho.catalog.js";
import * as connection from "./zoho.connection.js";
import * as zoho from "./zoho.service.js";

const keyParam = z.object({ key: z.string().min(1).max(20) });
const callbackQuery = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  "accounts-server": z.string().url().optional(),
});

// The OAuth callback is reached by a top-level redirect from Zoho, so it cannot carry
// the access cookie reliably and is authenticated by the one-time `state` instead.
export const zohoPublicRouter = Router();

zohoPublicRouter.get("/oauth/callback", async (req, res) => {
  const q = validateQuery(callbackQuery, req);
  const back = (status: string, reason?: string) =>
    res.redirect(`${env.WEB_URL}/admin/integrations?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`);

  if (q.error) return back("error", q.error);
  if (!q.code || !q.state) return back("error", "missing_code");
  const owner = pendingOwners.get(q.state);
  if (!connection.consumeState(q.state)) return back("error", "invalid_state");
  pendingOwners.delete(q.state);

  try {
    await connection.exchangeCode(q.code, q["accounts-server"] ?? ZOHO_HOSTS.accounts, owner ?? null);
    await audit.record({ ...requestMeta(req), action: AUDIT.ZOHO_CONNECTED, actorId: owner ?? null, targetType: "zoho_connection" });
    return back("connected");
  } catch (err) {
    logger.error({ err }, "Zoho OAuth exchange failed");
    return back("error", err instanceof AppError ? err.message : "exchange_failed");
  }
});

// Tracks which admin started each OAuth flow so the connection can be attributed.
const pendingOwners = new Map<string, string>();

export const zohoRouter = Router();
zohoRouter.use(authenticate);

zohoRouter.get("/services", async (req, res) => {
  res.json(await zoho.listServices(requireUser(req)));
});

zohoRouter.get("/services/:key/records", async (req, res) => {
  const { key } = validateParams(keyParam, req);
  res.json(await zoho.records(requireUser(req), key, requestMeta(req)));
});

zohoRouter.post("/services/:key/launch", async (req, res) => {
  const { key } = validateParams(keyParam, req);
  res.json(await zoho.launch(requireUser(req), key, requestMeta(req)));
});

zohoRouter.get("/status", authorize(PERMISSIONS.INTEGRATIONS_MANAGE), async (_req, res) => {
  res.json(await connection.status());
});

zohoRouter.get("/oauth/start", authorize(PERMISSIONS.INTEGRATIONS_MANAGE), (req, res) => {
  if (connection.isMockMode()) {
    throw AppError.badRequest("Zoho client credentials are not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET and ZOHO_MOCK=false.");
  }
  const state = connection.createState();
  pendingOwners.set(state, requireUser(req).id);
  res.redirect(connection.authorizationUrl(state));
});

zohoRouter.delete("/connection", authorize(PERMISSIONS.INTEGRATIONS_MANAGE), async (req, res) => {
  await connection.disconnect();
  await audit.record({ ...requestMeta(req), action: AUDIT.ZOHO_DISCONNECTED, actorId: requireUser(req).id, targetType: "zoho_connection" });
  res.status(204).end();
});
