"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRequest } from "@/hooks/use-request";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleDashed, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { ZohoStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all">{children}</dd>
    </>
  );
}

function IntegrationsView() {
  const router = useRouter();
  const params = useSearchParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fetcher = useCallback(() => api.get<ZohoStatus>("/api/zoho/status"), []);
  const { data: status, error, reload: load } = useRequest(fetcher);

  useEffect(() => {
    if (error) toast.error(errorMessage(error, "Unable to load integration status"));
  }, [error]);

  useEffect(() => {
    const result = params.get("status");
    if (!result) return;
    if (result === "connected") {
      toast.success("Zoho account connected");
    } else {
      const reason = params.get("reason");
      toast.error(reason ? `Zoho connection failed: ${reason}` : "Zoho connection failed");
    }
    router.replace("/admin/integrations");
  }, [params, router]);

  const disconnect = async () => {
    try {
      await api.delete("/api/zoho/connection");
      toast.success("Zoho account disconnected");
      await load();
    } catch (err) {
      toast.error(errorMessage(err, "Unable to disconnect"));
      throw err;
    }
  };

  return (
    <>
      <PageHeader
        title="Integrations"
        description="A single Zoho service account is used for all backend API calls. Employees never see Zoho credentials."
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Zoho One
              {status ? (
                status.connected ? (
                  <Badge variant="outline">
                    <CheckCircle2 />
                    Connected
                  </Badge>
                ) : status.mock ? (
                  <Badge variant="secondary">
                    <CircleDashed />
                    Mock mode
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not connected</Badge>
                )
              ) : null}
            </CardTitle>
            <CardDescription>
              OAuth 2.0 service-account connection used by the API for CRM, People, Desk, and Books.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <StatusRow label="Region">{status.region}</StatusRow>
                <StatusRow label="Accounts server">{status.accountsServer ?? "—"}</StatusRow>
                <StatusRow label="API domain">{status.apiDomain ?? "—"}</StatusRow>
                <StatusRow label="Connected at">{formatDateTime(status.connectedAt)}</StatusRow>
                <StatusRow label="Connected by">{status.connectedBy?.email ?? "—"}</StatusRow>
                <StatusRow label="Scopes">
                  {status.scopes.length === 0 ? (
                    "—"
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {status.scopes.map((s) => (
                        <Badge key={s} variant="outline" className="font-mono">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </StatusRow>
              </dl>
            ) : (
              <Skeleton className="h-32 w-full" />
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  window.location.assign(new URL("/api/zoho/oauth/start", window.location.origin).href);
                }}
                disabled={!status || status.mock}
              >
                <Plug data-icon="inline-start" />
                {status?.connected ? "Reconnect Zoho" : "Connect Zoho"}
              </Button>
              {status?.connected ? (
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  <Unplug data-icon="inline-start" />
                  Disconnect
                </Button>
              ) : null}
            </div>

            {status?.mock ? (
              <p className="text-sm text-muted-foreground">
                Mock mode is active because Zoho client credentials are not configured on the API.
                Complete the setup checklist and restart the API to enable the real connection.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup checklist</CardTitle>
            <CardDescription>One-time configuration for the service account.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>
                Sign in to the Zoho API console at{" "}
                <code className="font-mono text-xs">api-console.zoho.in</code> with the service account.
              </li>
              <li>Create a client of type &quot;Server-based Applications&quot;.</li>
              <li>
                Set the authorized redirect URI to{" "}
                <code className="font-mono text-xs">{"<API_URL>/api/zoho/oauth/callback"}</code>.
              </li>
              <li>
                Copy the client ID and secret into <code className="font-mono text-xs">apps/api/.env</code>{" "}
                as <code className="font-mono text-xs">ZOHO_CLIENT_ID</code> and{" "}
                <code className="font-mono text-xs">ZOHO_CLIENT_SECRET</code>, then restart the API.
              </li>
              <li>Return here and select Connect Zoho to grant consent.</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Disconnect Zoho"
        description="Stored tokens will be removed and data views will stop working until reconnected."
        confirmLabel="Disconnect"
        destructive
        onConfirm={disconnect}
      />
    </>
  );
}

export default function IntegrationsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.integrationsManage}>
      <Suspense>
        <IntegrationsView />
      </Suspense>
    </RequirePermission>
  );
}
