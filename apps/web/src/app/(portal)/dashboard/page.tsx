"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useZohoServices } from "@/hooks/use-zoho-services";
import { can, PERMISSIONS } from "@/lib/permissions";
import { errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { ServiceCard } from "@/components/service-card";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { InlineNotice } from "@/components/inline-notice";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const today = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading } = useZohoServices();
  const manages = can(user, PERMISSIONS.integrationsManage);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-[34px] leading-[1.1] font-semibold">
          {greeting()}, {user?.firstName ?? ""}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">{today.format(new Date())}</p>
      </div>

      {user ? (
        <div className="mb-10 grid gap-3 sm:grid-cols-3">
          <StatCard label="Roles">
            {user.roles.length === 0 ? (
              <span className="text-muted-foreground">None</span>
            ) : (
              user.roles.map((r) => (
                <Badge key={r.id} variant="outline" className="h-5.5 text-xs">
                  {r.name}
                </Badge>
              ))
            )}
          </StatCard>
          <StatCard label="Department">
            {user.department?.name ?? <span className="text-muted-foreground">Not assigned</span>}
          </StatCard>
          <StatCard label="Last sign-in">
            <span className="font-mono text-[13px] font-normal">{formatDateTime(user.lastLoginAt)}</span>
          </StatCard>
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Your services</h2>
          {data ? (
            <span className="text-xs text-muted-foreground">
              {data.items.length} available
            </span>
          ) : null}
        </div>

        {data?.mock ? (
          <InlineNotice className="mb-4">
            <strong className="font-medium">Sample data.</strong> Zoho credentials are not configured, so the
            portal is serving fixtures through the same permission and audit path.
          </InlineNotice>
        ) : null}

        {data && !data.connected && !data.mock ? (
          <InlineNotice className="mb-4">
            <strong className="font-medium">Zoho is not connected.</strong>{" "}
            {manages ? (
              <>
                Data views will be unavailable until the service account is connected.{" "}
                <Link href="/admin/integrations" className="underline underline-offset-4">
                  Open integrations
                </Link>
              </>
            ) : (
              "Data views are unavailable until an administrator connects the service account."
            )}
          </InlineNotice>
        ) : null}

        {error ? (
          <InlineNotice tone="red" className="mb-4">
            <strong className="font-medium">Unable to load services.</strong> {errorMessage(error)}
          </InlineNotice>
        ) : null}

        {loading ? (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {data.items.map((s) => (
              <ServiceCard key={s.key} service={s} />
            ))}
          </div>
        ) : !error ? (
          <EmptyState
            icon={Inbox}
            title="No services assigned"
            description="Your role does not currently include access to any Zoho application. Ask an administrator to update your role."
            action={
              manages ? (
                <Button variant="outline" nativeButton={false} render={<Link href="/admin/roles" />}>
                  Manage roles
                </Button>
              ) : undefined
            }
          />
        ) : null}
      </section>
    </>
  );
}
