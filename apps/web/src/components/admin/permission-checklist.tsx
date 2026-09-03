"use client";

import { useMemo } from "react";
import type { Permission } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  permissions: Permission[];
  selected: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}

export function PermissionChecklist({ permissions, selected, onChange, disabled }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  const toggle = (key: string, checked: boolean) => {
    onChange(checked ? [...selected, key] : selected.filter((k) => k !== key));
  };

  return (
    <div className="max-h-80 space-y-5 overflow-y-auto rounded-lg border bg-muted/30 p-3 pr-2">
      {groups.map(([group, items]) => (
        <div key={group}>
          <p className="mb-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{group}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {items.map((p) => {
              const id = `perm-${p.id}`;
              const checked = selected.includes(p.key);
              return (
                <Label
                  key={p.id}
                  htmlFor={id}
                  className={`cursor-pointer items-start rounded-md border px-2.5 py-2 font-normal transition-colors ${
                    checked ? "border-primary/40 bg-card" : "border-transparent bg-card/60 hover:bg-card"
                  }`}
                >
                  <Checkbox
                    id={id}
                    className="mt-0.5"
                    disabled={disabled}
                    checked={checked}
                    onCheckedChange={(c) => toggle(p.key, c)}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-xs">{p.key}</span>
                    <span className="text-xs text-muted-foreground">{p.description}</span>
                  </span>
                </Label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
