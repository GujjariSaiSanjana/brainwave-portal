"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequest } from "@/hooks/use-request";
import { Lock, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";
import { can, PERMISSIONS } from "@/lib/permissions";
import { useAuth } from "@/components/auth-provider";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoleDialog } from "@/components/admin/role-dialog";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function groupOf(key: string): string {
  return key.split(":")[0] ?? key;
}

function PermissionChips({ keys }: { keys: string[] }) {
  if (keys.length === 0) return <p className="text-sm text-muted-foreground">No permissions</p>;
  const groups = new Map<string, string[]>();
  for (const k of keys) groups.set(groupOf(k), [...(groups.get(groupOf(k)) ?? []), k]);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {Array.from(groups.entries()).map(([g, list]) => (
        <div key={g} className="flex flex-wrap items-center gap-1">
          {list.map((k) => (
            <span key={k} className="rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground/80">
              {k}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function RolesView() {
  const { user: me } = useAuth();
  const writable = can(me, PERMISSIONS.rolesWrite);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const fetcher = useCallback(
    () =>
      Promise.all([
        api.get<{ items: Role[] }>("/api/roles"),
        api.get<{ items: Permission[] }>("/api/permissions"),
      ]).then(([r, p]) => ({ roles: r.items, permissions: p.items })),
    [],
  );
  const { data, error, reload: load } = useRequest(fetcher);
  const roles = data?.roles ?? null;
  const permissions = data?.permissions ?? [];

  useEffect(() => {
    if (error) toast.error(errorMessage(error, "Unable to load roles"));
  }, [error]);

  const openDialog = (role: Role | null) => {
    setEditing(role);
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/api/roles/${deleting.id}`);
      toast.success("Role deleted");
      await load();
    } catch (err) {
      toast.error(errorMessage(err, "Unable to delete role"));
      throw err;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Roles"
        description="Roles group permissions. Users may hold several roles; their permissions are combined."
        actions={
          writable ? (
            <Button onClick={() => openDialog(null)}>
              <Plus data-icon="inline-start" />
              New role
            </Button>
          ) : undefined
        }
      />

      {roles === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <article key={role.id} className="flex flex-col rounded-xl border bg-card">
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display flex items-center gap-2 text-[18px] leading-tight font-semibold">
                      {role.name}
                      {role.isSystem ? (
                        <StatusPill tone="stone" className="font-sans">
                          <Lock className="size-3" />
                          System
                        </StatusPill>
                      ) : null}
                    </h3>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">{role.description ?? "No description"}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    {role.userCount}
                  </span>
                </div>
                <div className="mt-4">
                  <PermissionChips keys={role.permissions} />
                </div>
              </div>
              {writable ? (
                <div className="flex items-center gap-2 border-t bg-muted/30 px-5 py-3">
                  <Button variant="outline" size="sm" onClick={() => openDialog(role)}>
                    Edit
                  </Button>
                  {!role.isSystem ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/8 hover:text-destructive"
                      onClick={() => setDeleting(role)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <RoleDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={editing}
        permissions={permissions}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title="Delete role"
        description={
          deleting
            ? `Users holding "${deleting.name}" will lose its permissions. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={remove}
      />
    </>
  );
}

export default function RolesPage() {
  return (
    <RequirePermission permission={PERMISSIONS.rolesRead}>
      <RolesView />
    </RequirePermission>
  );
}
