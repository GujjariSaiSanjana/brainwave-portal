"use client";

import type { UserSummary } from "@/lib/types";
import { formatDateTime, fullName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { DataBody, DataCell, DataEmpty, DataHead, DataHeader, DataRow, DataTable } from "@/components/data-table";

interface Props {
  users: UserSummary[];
  renderActions?: (user: UserSummary) => React.ReactNode;
  emptyMessage?: string;
}

export function UserTable({ users, renderActions, emptyMessage = "No users found." }: Props) {
  const cols = renderActions ? 6 : 5;
  return (
    <DataTable>
      <DataHeader>
        <DataHead>Name</DataHead>
        <DataHead>Roles</DataHead>
        <DataHead>Department</DataHead>
        <DataHead>Status</DataHead>
        <DataHead>Last sign-in</DataHead>
        {renderActions ? <DataHead className="w-12" /> : null}
      </DataHeader>
      <DataBody>
        {users.length === 0 ? (
          <DataEmpty colSpan={cols}>{emptyMessage}</DataEmpty>
        ) : (
          users.map((u) => (
            <DataRow key={u.id}>
              <DataCell>
                <div className="flex flex-col">
                  <span className="font-medium">{fullName(u)}</span>
                  <span className="font-mono text-[12.5px] text-muted-foreground">{u.email}</span>
                </div>
              </DataCell>
              <DataCell>
                <div className="flex flex-wrap gap-1">
                  {u.roles.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    u.roles.map((r) => (
                      <Badge key={r.id} variant="outline" className="text-xs">
                        {r.name}
                      </Badge>
                    ))
                  )}
                </div>
              </DataCell>
              <DataCell className="whitespace-nowrap">{u.department?.name ?? <span className="text-muted-foreground">—</span>}</DataCell>
              <DataCell>
                <StatusPill tone={u.isActive ? "green" : "stone"}>{u.isActive ? "Active" : "Inactive"}</StatusPill>
              </DataCell>
              <DataCell className="font-mono text-[13px] whitespace-nowrap text-muted-foreground">
                {formatDateTime(u.lastLoginAt)}
              </DataCell>
              {renderActions ? <DataCell className="text-right">{renderActions(u)}</DataCell> : null}
            </DataRow>
          ))
        )}
      </DataBody>
    </DataTable>
  );
}
