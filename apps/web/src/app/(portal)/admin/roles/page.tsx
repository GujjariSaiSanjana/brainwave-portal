"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequest } from "@/hooks/use-request";
import { Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";
import { can, PERMISSIONS } from "@/lib/permissions";
import { useAuth } from "@/components/auth-provider";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoleDialog } from "@/components/admin/role-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {role.name}
                  {role.isSystem ? <Lock className="size-3.5 text-muted-foreground" aria-label="System role" /> : null}
                </CardTitle>
                <CardDescription>
                  {role.description ?? "No description"} · {role.userCount} user
                  {role.userCount === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {role.permissions.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No permissions</span>
                  ) : (
                    role.permissions.map((p) => (
                      <Badge key={p} variant="outline" className="font-mono">
                        {p}
                      </Badge>
                    ))
                  )}
                </div>
                {writable ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(role)}>
                      Edit
                    </Button>
                    {!role.isSystem ? (
                      <Button variant="destructive" size="sm" onClick={() => setDeleting(role)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
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
