"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequest } from "@/hooks/use-request";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Department, Paginated, Role, UserSummary } from "@/lib/types";
import { can, PERMISSIONS } from "@/lib/permissions";
import { useAuth } from "@/components/auth-provider";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { UserTable } from "@/components/user-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserDialog } from "@/components/admin/user-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 20;

function UsersView() {
  const { user: me } = useAuth();
  const writable = can(me, PERMISSIONS.usersWrite);

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [deleting, setDeleting] = useState<UserSummary | null>(null);

  const fetcher = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (query) params.set("search", query);
    return api.get<Paginated<UserSummary>>(`/api/users?${params}`);
  }, [page, query]);
  const { data, error, reload: load } = useRequest(fetcher);

  const canReadRoles = can(me, PERMISSIONS.rolesRead);
  const lookupFetcher = useCallback(
    () =>
      Promise.all([
        api.get<{ items: Department[] }>("/api/departments"),
        canReadRoles ? api.get<{ items: Role[] }>("/api/roles") : Promise.resolve({ items: [] as Role[] }),
      ]).then(([d, r]) => ({ departments: d.items, roles: r.items })),
    [canReadRoles],
  );
  const { data: lookups } = useRequest(lookupFetcher);
  const roles = lookups?.roles ?? [];
  const departments = lookups?.departments ?? [];

  useEffect(() => {
    if (error) toast.error(errorMessage(error, "Unable to load users"));
  }, [error]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openDialog = (u: UserSummary | null) => {
    setEditing(u);
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/api/users/${deleting.id}`);
      toast.success("User deleted");
      await load();
    } catch (err) {
      toast.error(errorMessage(err, "Unable to delete user"));
      throw err;
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage portal accounts, departments, and role assignments."
        actions={
          writable ? (
            <Button onClick={() => openDialog(null)}>
              <Plus data-icon="inline-start" />
              New user
            </Button>
          ) : undefined
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {data ? (
        <UserTable
          users={data.items}
          renderActions={
            writable
              ? (u) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" aria-label="User actions" />}
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDialog(u)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={u.id === me?.id}
                        onClick={() => setDeleting(u)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              : undefined
          }
        />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}

      {data ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} user{data.total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <UserDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        roles={roles}
        departments={departments}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title="Delete user"
        description={
          deleting ? `${deleting.email} will lose access immediately. This cannot be undone.` : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={remove}
      />
    </>
  );
}

export default function UsersPage() {
  return (
    <RequirePermission permission={PERMISSIONS.usersRead}>
      <UsersView />
    </RequirePermission>
  );
}
