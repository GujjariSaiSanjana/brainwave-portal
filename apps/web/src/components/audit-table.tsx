"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AuditEntry } from "@/lib/types";
import { formatDateTime, fullName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusPill, type PillTone } from "@/components/status-pill";
import { DataBody, DataCell, DataEmpty, DataHead, DataHeader, DataRow, DataTable } from "@/components/data-table";
import { TableCell, TableRow } from "@/components/ui/table";

function actionTone(action: string): PillTone {
  if (action.endsWith(".failed") || action.endsWith(".deleted") || action.endsWith(".disconnected")) return "red";
  if (action.startsWith("zoho.")) return "blue";
  if (action.startsWith("auth.")) return "stone";
  return "amber";
}

function Row({ entry, compact }: { entry: AuditEntry; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasMeta = entry.metadata && Object.keys(entry.metadata).length > 0;
  const span = compact ? 4 : 6;

  return (
    <>
      <DataRow>
        <DataCell className="font-mono text-[12.5px] whitespace-nowrap text-muted-foreground">
          {formatDateTime(entry.createdAt)}
        </DataCell>
        <DataCell>
          <StatusPill tone={actionTone(entry.action)} className="font-mono font-normal">
            {entry.action}
          </StatusPill>
        </DataCell>
        <DataCell className="whitespace-nowrap">
          {entry.actor ? (
            <div className="flex flex-col">
              <span>{fullName(entry.actor)}</span>
              {!compact ? (
                <span className="font-mono text-[12px] text-muted-foreground">{entry.actor.email}</span>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DataCell>
        {!compact ? (
          <>
            <DataCell className="font-mono text-[12.5px] whitespace-nowrap text-muted-foreground">
              {entry.targetType ? `${entry.targetType}${entry.targetId ? ` · ${entry.targetId.slice(0, 8)}` : ""}` : "—"}
            </DataCell>
            <DataCell className="font-mono text-[12.5px] whitespace-nowrap text-muted-foreground">
              {entry.ip ?? "—"}
            </DataCell>
          </>
        ) : null}
        <DataCell className="w-12 text-right">
          {hasMeta ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Hide details" : "Show details"}
              aria-expanded={open}
            >
              {open ? <ChevronDown /> : <ChevronRight />}
            </Button>
          ) : null}
        </DataCell>
      </DataRow>
      {open && hasMeta ? (
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableCell colSpan={span} className="px-5 py-3">
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
            {entry.userAgent ? (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">{entry.userAgent}</p>
            ) : null}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function AuditTable({ entries, compact }: { entries: AuditEntry[]; compact?: boolean }) {
  return (
    <DataTable>
      <DataHeader>
        <DataHead>Time</DataHead>
        <DataHead>Action</DataHead>
        <DataHead>Actor</DataHead>
        {!compact ? (
          <>
            <DataHead>Target</DataHead>
            <DataHead>IP</DataHead>
          </>
        ) : null}
        <DataHead className="w-12" />
      </DataHeader>
      <DataBody>
        {entries.length === 0 ? (
          <DataEmpty colSpan={compact ? 4 : 6}>No activity recorded.</DataEmpty>
        ) : (
          entries.map((e) => <Row key={e.id} entry={e} compact={compact} />)
        )}
      </DataBody>
    </DataTable>
  );
}
