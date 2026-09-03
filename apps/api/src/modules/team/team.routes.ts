import { Router } from "express";
import { PERMISSIONS } from "../../config/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { requireUser } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as audit from "../audit/audit.service.js";
import { toSummary, userSummarySelect } from "../users/users.service.js";

export const teamRouter = Router();

// Managers only ever see their own department. The scope comes from the caller's
// record, not from the request, so it cannot be widened by the client.
teamRouter.get("/", authorize(PERMISSIONS.TEAM_READ), async (req, res) => {
  const user = requireUser(req);
  if (!user.departmentId) {
    res.json({ department: null, members: [], activity: [] });
    return;
  }

  const [department, rows] = await Promise.all([
    prisma.department.findUnique({ where: { id: user.departmentId }, select: { id: true, name: true, slug: true } }),
    prisma.user.findMany({
      where: { departmentId: user.departmentId },
      select: userSummarySelect,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);
  const members = rows.map(toSummary);
  const { items: activity } = await audit.list({ page: 1, pageSize: 30, actorIds: members.map((m) => m.id) });
  res.json({ department, members, activity });
});
