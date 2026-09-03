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
import { launchService } from "@/components/service-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NAMES: Record<string, string> = {
  crm: "Zoho CRM",
  people: "Zoho People",
  desk: "Zoho Desk",
  books: "Zoho Books",
};

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

  return (
    <>
      <PageHeader
        title={title}
        description={data ? `${data.service.resourceLabel} fetched ${formatDateTime(data.fetchedAt)}` : undefined}
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
          <Alert variant="destructive">
            <AlertTitle>Access denied</AlertTitle>
            <AlertDescription>
              Your role does not include access to {title}.{" "}
              <Link href="/dashboard" className="underline underline-offset-4">
                Back to dashboard
              </Link>
            </AlertDescription>
          </Alert>
        ) : code === "ZOHO_NOT_CONNECTED" ? (
          <Alert>
            <AlertTitle>Zoho is not connected</AlertTitle>
            <AlertDescription>
              {can(user, PERMISSIONS.integrationsManage) ? (
                <span>
                  Connect the Zoho service account to load live data.{" "}
                  <Link href="/admin/integrations" className="underline underline-offset-4">
                    Open integrations
                  </Link>
                </span>
              ) : (
                "An administrator needs to connect the Zoho service account before data can be loaded."
              )}
            </AlertDescription>
          </Alert>
        ) : code === "NOT_FOUND" ? (
          <Alert variant="destructive">
            <AlertTitle>Unknown service</AlertTitle>
            <AlertDescription>There is no service with the key &quot;{key}&quot;.</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Unable to load data</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )
      ) : null}

      {loading && !data ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : data && !error ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={data.columns.length} className="py-10 text-center text-muted-foreground">
                    No {data.service.resourceLabel.toLowerCase()} found.
                  </TableCell>
                </TableRow>
              ) : (
                data.rows.map((row, i) => (
                  <TableRow key={i}>
                    {data.columns.map((c) => (
                      <TableCell key={c.key} className="whitespace-nowrap">
                        {row[c.key] ?? "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </>
  );
}
