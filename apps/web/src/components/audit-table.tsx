"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AuditEntry } from "@/lib/types";
import { formatDateTime, fullName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.endsWith(".failed") || action.endsWith(".deleted")) return "destructive";
  if (action.startsWith("auth.")) return "outline";
  return "secondary";
}

function Row({ entry, compact }: { entry: AuditEntry; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasMeta = entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <>
      <TableRow>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatDateTime(entry.createdAt)}
        </TableCell>
        <TableCell>
          <Badge variant={actionVariant(entry.action)} className="font-mono">
            {entry.action}
          </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {entry.actor ? (
            <div className="flex flex-col">
              <span>{fullName(entry.actor)}</span>
              <span className="text-xs text-muted-foreground">{entry.actor.email}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        {!compact ? (
          <>
            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
              {entry.targetType ? `${entry.targetType}${entry.targetId ? ` · ${entry.targetId.slice(0, 8)}` : ""}` : "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
              {entry.ip ?? "—"}
            </TableCell>
          </>
        ) : null}
        <TableCell className="w-10">
          {hasMeta ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Hide details" : "Show details"}
            >
              {open ? <ChevronDown /> : <ChevronRight />}
            </Button>
          ) : null}
        </TableCell>
      </TableRow>
      {open && hasMeta ? (
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableCell colSpan={compact ? 4 : 6}>
            <pre className="overflow-x-auto font-mono text-xs whitespace-pre-wrap">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
            {entry.userAgent ? (
              <p className="mt-2 text-xs text-muted-foreground">{entry.userAgent}</p>
            ) : null}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function AuditTable({ entries, compact }: { entries: AuditEntry[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            {!compact ? (
              <>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
              </>
            ) : null}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 4 : 6} className="py-10 text-center text-muted-foreground">
                No activity recorded.
              </TableCell>
            </TableRow>
          ) : (
            entries.map((e) => <Row key={e.id} entry={e} compact={compact} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
