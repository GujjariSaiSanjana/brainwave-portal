"use client";

import type { UserSummary } from "@/lib/types";
import { formatDateTime, fullName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  users: UserSummary[];
  renderActions?: (user: UserSummary) => React.ReactNode;
  emptyMessage?: string;
}

export function UserTable({ users, renderActions, emptyMessage = "No users found." }: Props) {
  const cols = renderActions ? 6 : 5;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last login</TableHead>
            {renderActions ? <TableHead /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={cols} className="py-10 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{fullName(u)}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      u.roles.map((r) => (
                        <Badge key={r.id} variant="secondary">
                          {r.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{u.department?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "outline" : "destructive"}>
                    {u.isActive ? "Active" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(u.lastLoginAt)}
                </TableCell>
                {renderActions ? (
                  <TableCell className="text-right">{renderActions(u)}</TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
