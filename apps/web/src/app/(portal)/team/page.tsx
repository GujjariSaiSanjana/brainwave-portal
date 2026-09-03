"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { TeamResponse } from "@/lib/types";
import { PERMISSIONS } from "@/lib/permissions";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { UserTable } from "@/components/user-table";
import { AuditTable } from "@/components/audit-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function TeamView() {
  const [data, setData] = useState<TeamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<TeamResponse>("/api/team")
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load team</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={data.department ? `${data.department.name} team` : "Team"}
        description={
          data.department
            ? `${data.members.length} member${data.members.length === 1 ? "" : "s"} in your department.`
            : "You are not assigned to a department."
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Members</h2>
        <UserTable users={data.members} emptyMessage="No members in this department." />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Recent activity</h2>
        <AuditTable entries={data.activity} compact />
      </section>
    </>
  );
}

export default function TeamPage() {
  return (
    <RequirePermission permission={PERMISSIONS.teamRead}>
      <TeamView />
    </RequirePermission>
  );
}
