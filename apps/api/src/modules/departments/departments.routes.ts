import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS } from "../../config/permissions.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { slugify } from "../../lib/slug.js";
import { validateBody } from "../../lib/validation.js";
import { authorize } from "../../middleware/authorize.js";

const createSchema = z.object({ name: z.string().trim().min(2).max(60) });

export const departmentsRouter = Router();

departmentsRouter.get("/", async (_req, res) => {
  const items = await prisma.department.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } });
  res.json({ items });
});

departmentsRouter.post("/", authorize(PERMISSIONS.USERS_WRITE), async (req, res) => {
  const { name } = validateBody(createSchema, req);
  const slug = slugify(name);
  const clash = await prisma.department.findFirst({ where: { OR: [{ slug }, { name }] } });
  if (clash) throw AppError.conflict("A department with this name already exists");
  const department = await prisma.department.create({ data: { name, slug }, select: { id: true, name: true, slug: true } });
  res.status(201).json({ department });
});
