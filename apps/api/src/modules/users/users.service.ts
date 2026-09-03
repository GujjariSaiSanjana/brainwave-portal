import type { Prisma } from "@prisma/client";
import { AUDIT } from "../../config/audit-actions.js";
import { AppError } from "../../lib/errors.js";
import { hashPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMeta } from "../../lib/request-meta.js";
import * as audit from "../audit/audit.service.js";

export const userSummarySelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  department: { select: { id: true, name: true, slug: true } },
  roles: { select: { role: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSummarySelect }>;

export function toSummary(row: UserRow) {
  const { roles, ...rest } = row;
  return { ...rest, roles: roles.map((r) => r.role) };
}
export type UserSummary = ReturnType<typeof toSummary>;

interface Actor extends RequestMeta {
  actorId: string;
}

export async function list(params: { search?: string; page: number; pageSize: number }) {
  const where: Prisma.UserWhereInput = params.search
    ? {
        OR: [
          { email: { contains: params.search, mode: "insensitive" } },
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
        ],
      }
    : {};
  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSummarySelect,
      orderBy: [{ createdAt: "asc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items: rows.map(toSummary), total };
}

export async function getById(id: string): Promise<UserSummary> {
  const row = await prisma.user.findUnique({ where: { id }, select: userSummarySelect });
  if (!row) throw AppError.notFound("User");
  return toSummary(row);
}

async function assertRolesExist(roleIds: string[]): Promise<void> {
  if (roleIds.length === 0) return;
  const count = await prisma.role.count({ where: { id: { in: roleIds } } });
  if (count !== new Set(roleIds).size) throw AppError.badRequest("One or more roles do not exist");
}

async function assertDepartmentExists(departmentId: string | null | undefined): Promise<void> {
  if (!departmentId) return;
  const exists = await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } });
  if (!exists) throw AppError.badRequest("Department does not exist");
}

export async function create(
  input: { email: string; firstName: string; lastName: string; password: string; departmentId?: string | null; roleIds: string[] },
  actor: Actor,
): Promise<UserSummary> {
  await Promise.all([assertRolesExist(input.roleIds), assertDepartmentExists(input.departmentId)]);
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw AppError.conflict("A user with this email already exists");

  const row = await prisma.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: await hashPassword(input.password),
      departmentId: input.departmentId ?? null,
      roles: { create: input.roleIds.map((roleId) => ({ roleId })) },
    },
    select: userSummarySelect,
  });
  await audit.record({ ...actor, action: AUDIT.USER_CREATED, targetType: "user", targetId: row.id, metadata: { email: row.email, roleIds: input.roleIds } });
  return toSummary(row);
}

export async function update(
  id: string,
  input: { firstName?: string; lastName?: string; isActive?: boolean; departmentId?: string | null; password?: string },
  actor: Actor,
): Promise<UserSummary> {
  if (id === actor.actorId && input.isActive === false) throw AppError.badRequest("You cannot deactivate your own account");
  await assertDepartmentExists(input.departmentId);

  const data: Prisma.UserUpdateInput = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.departmentId !== undefined) {
    data.department = input.departmentId ? { connect: { id: input.departmentId } } : { disconnect: true };
  }
  if (input.password !== undefined) data.passwordHash = await hashPassword(input.password);

  const row = await prisma.user.update({ where: { id }, data, select: userSummarySelect }).catch(() => null);
  if (!row) throw AppError.notFound("User");

  if (input.isActive === false || input.password !== undefined) {
    await prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  const { password: _pw, ...changes } = input;
  await audit.record({
    ...actor,
    action: AUDIT.USER_UPDATED,
    targetType: "user",
    targetId: id,
    metadata: { ...changes, passwordReset: input.password !== undefined },
  });
  return toSummary(row);
}

export async function setRoles(id: string, roleIds: string[], actor: Actor): Promise<UserSummary> {
  await assertRolesExist(roleIds);
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) throw AppError.notFound("User");

  const [, , row] = await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId: id } }),
    prisma.userRole.createMany({ data: roleIds.map((roleId) => ({ userId: id, roleId })) }),
    prisma.user.findUniqueOrThrow({ where: { id }, select: userSummarySelect }),
  ]);
  await audit.record({ ...actor, action: AUDIT.USER_ROLES_UPDATED, targetType: "user", targetId: id, metadata: { roleIds } });
  return toSummary(row);
}

export async function remove(id: string, actor: Actor): Promise<void> {
  if (id === actor.actorId) throw AppError.badRequest("You cannot delete your own account");
  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target) throw AppError.notFound("User");
  await prisma.user.delete({ where: { id } });
  await audit.record({ ...actor, action: AUDIT.USER_DELETED, targetType: "user", targetId: id, metadata: { email: target.email } });
}
