import { Router } from "express";
import { PERMISSIONS } from "../../config/permissions.js";
import { requestMeta } from "../../lib/request-meta.js";
import { validateBody, validateParams } from "../../lib/validation.js";
import { requireUser } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { createRoleSchema, idParamSchema, setRolePermissionsSchema, updateRoleSchema } from "./roles.schemas.js";
import * as roles from "./roles.service.js";

export const rolesRouter = Router();

const actorOf = (req: Parameters<typeof requireUser>[0]) => ({ ...requestMeta(req), actorId: requireUser(req).id });

rolesRouter.get("/", authorize(PERMISSIONS.ROLES_READ), async (_req, res) => {
  res.json({ items: await roles.list() });
});

rolesRouter.post("/", authorize(PERMISSIONS.ROLES_WRITE), async (req, res) => {
  const input = validateBody(createRoleSchema, req);
  res.status(201).json({ role: await roles.create(input, actorOf(req)) });
});

rolesRouter.patch("/:id", authorize(PERMISSIONS.ROLES_WRITE), async (req, res) => {
  const { id } = validateParams(idParamSchema, req);
  const input = validateBody(updateRoleSchema, req);
  res.json({ role: await roles.update(id, input, actorOf(req)) });
});

rolesRouter.put("/:id/permissions", authorize(PERMISSIONS.ROLES_WRITE), async (req, res) => {
  const { id } = validateParams(idParamSchema, req);
  const { permissionKeys } = validateBody(setRolePermissionsSchema, req);
  res.json({ role: await roles.setPermissions(id, permissionKeys, actorOf(req)) });
});

rolesRouter.delete("/:id", authorize(PERMISSIONS.ROLES_WRITE), async (req, res) => {
  const { id } = validateParams(idParamSchema, req);
  await roles.remove(id, actorOf(req));
  res.status(204).end();
});
