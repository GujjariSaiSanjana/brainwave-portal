import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../config/permissions.js";
import { AUDIT_ACTIONS } from "../../config/audit-actions.js";
import { validateQuery } from "../../lib/validation.js";
import { authorize } from "../../middleware/authorize.js";
import * as audit from "./audit.service.js";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().optional(),
  actorId: z.string().uuid().optional(),
});

export const auditRouter = Router();

auditRouter.get("/", authorize(PERMISSIONS.AUDIT_READ), async (req, res) => {
  const query = validateQuery(querySchema, req);
  const { items, total } = await audit.list(query);
  res.json({ items, total, page: query.page, pageSize: query.pageSize });
});

auditRouter.get("/actions", authorize(PERMISSIONS.AUDIT_READ), (_req, res) => {
  res.json({ items: AUDIT_ACTIONS });
});
