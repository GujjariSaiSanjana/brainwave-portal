import { z } from "zod";
import { passwordSchema } from "../auth/auth.schemas.js";

const name = z.string().trim().min(1).max(80);

export const listUsersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()),
  firstName: name,
  lastName: name,
  password: passwordSchema,
  departmentId: z.string().uuid().nullable().optional(),
  roleIds: z.array(z.string().uuid()).max(20).default([]),
});

export const updateUserSchema = z
  .object({
    firstName: name.optional(),
    lastName: name.optional(),
    isActive: z.boolean().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    password: passwordSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "No fields to update");

export const setUserRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()).max(20),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
