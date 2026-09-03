"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { TeamResponse } from "@/lib/types";
import { PERMISSIONS } from "@/lib/permissions";
import { RequirePermission } from "@/components/require-permission";
import { PageHeader } from "@/components/page-header";
import { UserTable } from "@/components/user-table";
import { AuditTable } from "@/components/audit-table";
import { InlineNotice } from "@/components/inline-notice";
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
      <InlineNotice tone="red">
        <strong className="font-medium">Unable to load team.</strong> {error}
      </InlineNotice>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const count = data.members.length;

  return (
    <>
      <PageHeader
        eyebrow="Your department"
        title={data.department ? data.department.name : "Team"}
        description={
          data.department
            ? `${count} member${count === 1 ? "" : "s"} report into this department.`
            : "You are not assigned to a department."
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[3fr_2fr]">
        <section className="min-w-0">
          <h2 className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Members</h2>
          <UserTable users={data.members} emptyMessage="No members in this department." />
        </section>
        <section className="min-w-0">
          <h2 className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Recent activity</h2>
          <AuditTable entries={data.activity} compact />
        </section>
      </div>
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
