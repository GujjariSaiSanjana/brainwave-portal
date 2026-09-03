import { z } from "zod";
import { ALL_PERMISSION_KEYS } from "../../config/permissions.js";

const permissionKey = z.string().refine((k) => (ALL_PERMISSION_KEYS as string[]).includes(k), "Unknown permission");

export const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(50),
  description: z.string().trim().max(200).optional(),
  permissionKeys: z.array(permissionKey).max(50).default([]),
});

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    description: z.string().trim().max(200).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "No fields to update");

export const setRolePermissionsSchema = z.object({
  permissionKeys: z.array(permissionKey).max(50),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
