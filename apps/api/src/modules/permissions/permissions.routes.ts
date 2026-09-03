import { Router } from "express";
import { PERMISSIONS } from "../../config/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { authorize } from "../../middleware/authorize.js";

export const permissionsRouter = Router();

permissionsRouter.get("/", authorize(PERMISSIONS.ROLES_READ), async (_req, res) => {
  const items = await prisma.permission.findMany({
    select: { id: true, key: true, description: true, group: true },
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });
  res.json({ items });
});
