import { Router } from "express";
import { PERMISSIONS } from "../../config/permissions.js";
import { requestMeta } from "../../lib/request-meta.js";
import { validateBody, validateParams, validateQuery } from "../../lib/validation.js";
import { requireUser } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { createUserSchema, idParamSchema, listUsersSchema, setUserRolesSchema, updateUserSchema } from "./users.schemas.js";
import * as users from "./users.service.js";

export const usersRouter = Router();

const actorOf = (req: Parameters<typeof requireUser>[0]) => ({ ...requestMeta(req), actorId: requireUser(req).id });

usersRouter.get("/", authorize(PERMISSIONS.USERS_READ), async (req, res) => {
  const query = validateQuery(listUsersSchema, req);
  const { items, total } = await users.list(query);
  res.json({ items, total, page: query.page, pageSize: query.pageSize });
});

usersRouter.post("/", authorize(PERMISSIONS.USERS_WRITE), async (req, res) => {
  const input = validateBody(createUserSchema, req);
  const user = await users.create(input, actorOf(req));
  res.status(201).json({ user });
});

usersRouter.get("/:id", authorize(PERMISSIONS.USERS_READ), async (req, res) => {
  const { id } = validateParams(idParamSchema, req);
  res.json({ user: await users.getById(id) });
});

usersRouter.patch("/:id", authorize(PERMISSIONS.USERS_WRITE), async (req, res) => {
  const { id } = validateParams(idParamSchema, req);
  const input = validateBody(updateUserSchema, req);
  res.json({ user: await users.update(id, input, actorOf(req)) });
});

usersRouter.put("/:id/roles", authorize(PERMISSIONS.USERS_WRITE), async (req, res) => {
  const { id } = validateParams(idParamSchema, req);
  const { roleIds } = validateBody(setUserRolesSchema, req);
  res.json({ user: await users.setRoles(id, roleIds, actorOf(req)) });
});

usersRouter.delete("/:id", authorize(PERMISSIONS.USERS_WRITE), async (req, res) => {
  const { id } = validateParams(idParamSchema, req);
  await users.remove(id, actorOf(req));
  res.status(204).end();
});
