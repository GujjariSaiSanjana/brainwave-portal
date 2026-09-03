"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRequest } from "@/hooks/use-request";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { ZohoStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DefinitionList, DefinitionRow } from "@/components/definition-list";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Unable to copy");
    }
  };
  return (
    <Button variant="ghost" size="icon-xs" onClick={copy} aria-label="Copy" className="shrink-0">
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}

const STEPS = [
  { title: "Open the Zoho API console", body: "Sign in at api-console.zoho.in (or .com for the US data centre) with the account that owns the Zoho One organisation." },
  { title: "Create a server-based client", body: "Choose \"Server-based Applications\" and name it after this portal." },
  { title: "Set the redirect URI", body: "Paste the redirect URI shown on this page as the authorised redirect URL." },
  { title: "Configure the API", body: "Copy the client ID and secret into apps/api/.env as ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET, set ZOHO_MOCK=false and restart." },
  { title: "Grant consent", body: "Return here and select Connect Zoho. Approve the read-only scopes on the consent screen." },
];

function IntegrationsView() {
  const router = useRouter();
  const params = useSearchParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fetcher = useCallback(() => api.get<ZohoStatus & { redirectUri?: string }>("/api/zoho/status"), []);
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

  const redirectUri =
    status?.redirectUri ??
    (typeof window !== "undefined" ? `${window.location.origin}/api/zoho/oauth/callback` : "");

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Integrations"
        description="A single Zoho service account is used for all backend API calls. Employees never see Zoho credentials."
      />

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
            <div>
              <h2 className="font-display text-[20px] leading-tight font-semibold">Zoho One</h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                OAuth 2.0 service account for CRM, People, Desk and Books.
              </p>
            </div>
            {status ? (
              status.connected ? (
                <StatusPill tone="green" size="lg">Connected</StatusPill>
              ) : status.mock ? (
                <StatusPill tone="amber" size="lg">Mock mode</StatusPill>
              ) : (
                <StatusPill tone="stone" size="lg">Not connected</StatusPill>
              )
            ) : null}
          </div>

          <div className="px-6">
            {status ? (
              <DefinitionList>
                <DefinitionRow label="Region">{status.region}</DefinitionRow>
                <DefinitionRow label="Accounts server" mono>{status.accountsServer ?? "—"}</DefinitionRow>
                <DefinitionRow label="API domain" mono>{status.apiDomain ?? "—"}</DefinitionRow>
                <DefinitionRow label="Redirect URI" mono>
                  <span className="flex items-center gap-1">
                    <span className="truncate">{redirectUri}</span>
                    {redirectUri ? <CopyButton value={redirectUri} /> : null}
                  </span>
                </DefinitionRow>
                <DefinitionRow label="Scopes">
                  {status.scopes.length === 0 ? (
                    "—"
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {status.scopes.map((s) => (
                        <span key={s} className="rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-[11.5px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </DefinitionRow>
                <DefinitionRow label="Connected by" mono>{status.connectedBy?.email ?? "—"}</DefinitionRow>
                <DefinitionRow label="Connected at">{formatDateTime(status.connectedAt)}</DefinitionRow>
              </DefinitionList>
            ) : (
              <Skeleton className="my-4 h-48 w-full" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-6 py-4">
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
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/8 hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Unplug data-icon="inline-start" />
                Disconnect
              </Button>
            ) : null}
            {status?.mock ? (
              <p className="basis-full text-[13px] text-muted-foreground">
                Mock mode is active because client credentials are not configured on the API. Complete the
                checklist and restart the API to enable the real connection.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-display text-[20px] leading-tight font-semibold">Setup checklist</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">One-time configuration for the service account.</p>
          <ol className="mt-5 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3.5">
                <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
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
