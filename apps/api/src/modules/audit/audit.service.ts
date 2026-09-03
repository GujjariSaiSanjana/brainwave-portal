import type { Prisma } from "@prisma/client";
import type { AuditAction } from "../../config/audit-actions.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMeta } from "../../lib/request-meta.js";

export interface AuditEvent extends RequestMeta {
  action: AuditAction;
  actorId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}

const auditSelect = {
  id: true,
  action: true,
  targetType: true,
  targetId: true,
  ip: true,
  userAgent: true,
  metadata: true,
  createdAt: true,
  actor: { select: { id: true, email: true, firstName: true, lastName: true } },
} satisfies Prisma.AuditLogSelect;

export type AuditEntry = Prisma.AuditLogGetPayload<{ select: typeof auditSelect }>;

// Audit writes never fail the request they belong to.
export async function record(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: event.action,
        actorId: event.actorId ?? null,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        ip: event.ip,
        userAgent: event.userAgent,
        metadata: event.metadata,
      },
    });
  } catch (err) {
    logger.error({ err, action: event.action }, "Failed to write audit log");
  }
}

export interface AuditQuery {
  page: number;
  pageSize: number;
  action?: string;
  actorId?: string;
  actorIds?: string[];
}

export async function list(query: AuditQuery): Promise<{ items: AuditEntry[]; total: number }> {
  const where: Prisma.AuditLogWhereInput = {};
  if (query.action) where.action = query.action;
  if (query.actorId) where.actorId = query.actorId;
  if (query.actorIds) where.actorId = { in: query.actorIds };

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      select: auditSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}
