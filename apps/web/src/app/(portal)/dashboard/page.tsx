"use client";

import Link from "next/link";
import { Inbox, Info, Plug } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useZohoServices } from "@/hooks/use-zoho-services";
import { can, PERMISSIONS } from "@/lib/permissions";
import { errorMessage } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ServiceCard } from "@/components/service-card";
import { EmptyState } from "@/components/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading } = useZohoServices();
  const manages = can(user, PERMISSIONS.integrationsManage);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.firstName ?? ""}`}
        description="Services you are authorized to use are listed below."
      />

      {data?.mock ? (
        <Alert>
          <Info />
          <AlertTitle>Mock mode</AlertTitle>
          <AlertDescription>
            The API is returning sample data because Zoho credentials are not configured.
          </AlertDescription>
        </Alert>
      ) : null}

      {data && !data.connected && !data.mock ? (
        <Alert>
          <Plug />
          <AlertTitle>Zoho is not connected</AlertTitle>
          <AlertDescription>
            {manages ? (
              <span>
                Data views will be unavailable until an administrator connects the Zoho service
                account.{" "}
                <Link href="/admin/integrations" className="underline underline-offset-4">
                  Open integrations
                </Link>
              </span>
            ) : (
              "Data views are unavailable until an administrator connects the Zoho service account."
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load services</AlertTitle>
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
