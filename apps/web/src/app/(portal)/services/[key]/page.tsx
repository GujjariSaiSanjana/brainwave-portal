"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { ZohoRecordsResponse } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/components/auth-provider";
import { can, PERMISSIONS } from "@/lib/permissions";
import { useRequest } from "@/hooks/use-request";
import { PageHeader } from "@/components/page-header";
import { ServiceTile } from "@/components/service-tile";
import { StatusPill, toneFor } from "@/components/status-pill";
import { InlineNotice } from "@/components/inline-notice";
import { launchService } from "@/components/service-card";
import { DataBody, DataCell, DataEmpty, DataHead, DataHeader, DataRow, DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const NAMES: Record<string, string> = {
  crm: "Zoho CRM",
  people: "Zoho People",
  desk: "Zoho Desk",
  books: "Zoho Books",
};

const STATUS_COLUMNS = new Set(["status", "priority"]);
const MONO_COLUMNS = new Set(["number", "employeeId", "email", "phone", "createdAt", "date", "dueDate", "joined"]);

const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

function Cell({ column, value }: { column: string; value: string | number | null }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (STATUS_COLUMNS.has(column)) return <StatusPill tone={toneFor(value)}>{String(value)}</StatusPill>;
  if (typeof value === "number") return <span className="font-mono tabular-nums">{value.toLocaleString()}</span>;
  if (MONO_COLUMNS.has(column)) return <span className="font-mono text-[13px] text-muted-foreground">{value}</span>;
  return <>{value}</>;
}

export default function ServicePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const { user } = useAuth();
  const [launching, setLaunching] = useState(false);
  const fetcher = useCallback(
    () => api.get<ZohoRecordsResponse>(`/api/zoho/services/${key}/records`),
    [key],
  );
  const { data, error, loading, reload } = useRequest(fetcher);

  const open = async () => {
    setLaunching(true);
    try {
      await launchService(key);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to open service"));
    } finally {
      setLaunching(false);
    }
  };

  const title = data?.service.name ?? NAMES[key] ?? "Service";
  const code = error instanceof ApiError ? error.code : null;
  const message = errorMessage(error);
  const manages = can(user, PERMISSIONS.integrationsManage);

  return (
    <>
      <PageHeader
        leading={<ServiceTile serviceKey={key} size="lg" />}
        eyebrow={data ? `${data.service.name} · ${data.service.resourceLabel}` : "Zoho service"}
        title={data ? data.service.resourceLabel : title}
        description={data?.service.description}
        actions={
          <>
            <Button variant="outline" onClick={() => void reload()} disabled={loading}>
              <RefreshCw data-icon="inline-start" className={loading ? "animate-spin" : undefined} />
              Refresh
            </Button>
            <Button onClick={open} disabled={launching || code === "FORBIDDEN"}>
              <ExternalLink data-icon="inline-start" />
              Open in Zoho
            </Button>
          </>
        }
      />

      {error ? (
        code === "FORBIDDEN" ? (
          <InlineNotice tone="red">
            <strong className="font-medium">Access denied.</strong> Your role does not include access to {title}.{" "}
            <Link href="/dashboard" className="underline underline-offset-4">
              Back to dashboard
            </Link>
          </InlineNotice>
        ) : code === "ZOHO_NOT_CONNECTED" ? (
          <InlineNotice>
            <strong className="font-medium">Zoho is not connected.</strong>{" "}
            {manages ? (
              <>
                Connect the service account to load live data.{" "}
                <Link href="/admin/integrations" className="underline underline-offset-4">
                  Open integrations
                </Link>
              </>
            ) : (
              "An administrator needs to connect the Zoho service account before data can be loaded."
            )}
          </InlineNotice>
        ) : code === "NOT_FOUND" ? (
          <InlineNotice tone="red">
            <strong className="font-medium">Unknown service.</strong> There is no service with the key &quot;{key}&quot;.
          </InlineNotice>
        ) : (
          <InlineNotice tone="red">
            <strong className="font-medium">Unable to load data.</strong> {message}
          </InlineNotice>
        )
      ) : null}

      {loading && !data ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : data && !error ? (
        <>
          <DataTable>
            <DataHeader>
              {data.columns.map((c) => (
                <DataHead key={c.key}>{c.label}</DataHead>
              ))}
            </DataHeader>
            <DataBody>
              {data.rows.length === 0 ? (
                <DataEmpty colSpan={data.columns.length}>No {data.service.resourceLabel.toLowerCase()} found.</DataEmpty>
              ) : (
                data.rows.map((row, i) => (
                  <DataRow key={String(row.id ?? i)}>
                    {data.columns.map((c) => (
                      <DataCell key={c.key} className="whitespace-nowrap">
                        <Cell column={c.key} value={row[c.key] ?? null} />
                      </DataCell>
                    ))}
                  </DataRow>
                ))
              )}
            </DataBody>
          </DataTable>
          <p className="mt-3 text-xs text-muted-foreground">
            {data.rows.length} row{data.rows.length === 1 ? "" : "s"} · fetched {time.format(new Date(data.fetchedAt))}
            {" · "}
            {formatDateTime(data.fetchedAt).split(",")[0]}
          </p>
        </>
      ) : null}
    </>
  );
}
