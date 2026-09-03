"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequest } from "@/hooks/use-request";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { AUDIT_ACTIONS, type AuditEntry, type Paginated } from "@/lib/types";
import { PERMISSIONS } from "@/lib/permissions";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { AuditTable } from "@/components/audit-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 25;
const ALL = "__all__";

function AuditView() {
  const [action, setAction] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const fetcher = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (action !== ALL) params.set("action", action);
    return api.get<Paginated<AuditEntry>>(`/api/audit?${params}`);
  }, [page, action]);
  const { data, error, reload } = useRequest(fetcher);

  useEffect(() => {
    if (error) toast.error(errorMessage(error, "Unable to load audit log"));
  }, [error]);

  const items = [{ value: ALL, label: "All actions" }, ...AUDIT_ACTIONS.map((a) => ({ value: a, label: a }))];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Authentication events, administrative changes, and Zoho access."
        actions={
          <Button variant="outline" onClick={() => void reload()}>
            Refresh
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          items={items}
          value={action}
          onValueChange={(v) => {
            setAction(v == null ? ALL : String(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-card font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.value} value={i.value} className="font-mono text-xs">
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data ? <AuditTable entries={data.items} /> : <Skeleton className="h-64 w-full rounded-xl" />}

      {data ? (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} event{data.total === 1 ? "" : "s"}
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
    </>
  );
}

export default function AuditPage() {
  return (
    <RequirePermission permission={PERMISSIONS.auditRead}>
      <AuditView />
    </RequirePermission>
  );
}
