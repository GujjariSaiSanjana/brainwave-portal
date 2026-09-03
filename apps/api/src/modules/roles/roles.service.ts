import type { Prisma } from "@prisma/client";
import { AUDIT } from "../../config/audit-actions.js";
import { SYSTEM_ROLES } from "../../config/permissions.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMeta } from "../../lib/request-meta.js";
import { slugify } from "../../lib/slug.js";
import * as audit from "../audit/audit.service.js";

const roleSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isSystem: true,
  permissions: { select: { permission: { select: { key: true } } } },
  _count: { select: { users: true } },
} satisfies Prisma.RoleSelect;

type RoleRow = Prisma.RoleGetPayload<{ select: typeof roleSelect }>;

function toRole(row: RoleRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isSystem: row.isSystem,
    permissions: row.permissions.map((p) => p.permission.key).sort(),
    userCount: row._count.users,
  };
}
export type RoleView = ReturnType<typeof toRole>;

interface Actor extends RequestMeta {
  actorId: string;
}

export async function list(): Promise<RoleView[]> {
  const rows = await prisma.role.findMany({ select: roleSelect, orderBy: [{ isSystem: "desc" }, { name: "asc" }] });
  return rows.map(toRole);
}

async function findOrThrow(id: string): Promise<RoleRow> {
  const row = await prisma.role.findUnique({ where: { id }, select: roleSelect });
  if (!row) throw AppError.notFound("Role");
  return row;
}

async function permissionIdsFor(keys: string[]): Promise<string[]> {
  const perms = await prisma.permission.findMany({ where: { key: { in: keys } }, select: { id: true } });
  if (perms.length !== new Set(keys).size) throw AppError.badRequest("One or more permissions do not exist");
  return perms.map((p) => p.id);
}

export async function create(input: { name: string; description?: string; permissionKeys: string[] }, actor: Actor): Promise<RoleView> {
  const slug = slugify(input.name);
  if (!slug) throw AppError.badRequest("Role name must contain letters or digits");
  const clash = await prisma.role.findFirst({ where: { OR: [{ slug }, { name: input.name }] }, select: { id: true } });
  if (clash) throw AppError.conflict("A role with this name already exists");

  const permissionIds = await permissionIdsFor(input.permissionKeys);
  const row = await prisma.role.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
    },
    select: roleSelect,
  });
  await audit.record({ ...actor, action: AUDIT.ROLE_CREATED, targetType: "role", targetId: row.id, metadata: { name: row.name, permissions: input.permissionKeys } });
  return toRole(row);
}

export async function update(id: string, input: { name?: string; description?: string | null }, actor: Actor): Promise<RoleView> {
  const existing = await findOrThrow(id);
  if (existing.isSystem && input.name !== undefined && input.name !== existing.name) {
    throw AppError.badRequest("System roles cannot be renamed");
  }
  const data: Prisma.RoleUpdateInput = {};
  if (input.name !== undefined) {
    data.name = input.name;
    data.slug = slugify(input.name);
  }
  if (input.description !== undefined) data.description = input.description;

  const row = await prisma.role.update({ where: { id }, data, select: roleSelect });
  await audit.record({ ...actor, action: AUDIT.ROLE_UPDATED, targetType: "role", targetId: id, metadata: input });
  return toRole(row);
}

export async function setPermissions(id: string, permissionKeys: string[], actor: Actor): Promise<RoleView> {
  const existing = await findOrThrow(id);
  if (existing.slug === SYSTEM_ROLES.ADMIN) throw AppError.badRequest("The admin role always has every permission");

  const permissionIds = await permissionIdsFor(permissionKeys);
  const [, , row] = await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: id } }),
    prisma.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })) }),
    prisma.role.findUniqueOrThrow({ where: { id }, select: roleSelect }),
  ]);
  await audit.record({ ...actor, action: AUDIT.ROLE_PERMISSIONS_UPDATED, targetType: "role", targetId: id, metadata: { permissions: permissionKeys } });
  return toRole(row);
}

export async function remove(id: string, actor: Actor): Promise<void> {
  const existing = await findOrThrow(id);
  if (existing.isSystem) throw AppError.badRequest("System roles cannot be deleted");
  await prisma.role.delete({ where: { id } });
  await audit.record({ ...actor, action: AUDIT.ROLE_DELETED, targetType: "role", targetId: id, metadata: { name: existing.name } });
}
