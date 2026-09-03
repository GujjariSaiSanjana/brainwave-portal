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
    <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
      {groups.map(([group, items]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{group}</p>
          <div className="space-y-2">
            {items.map((p) => {
              const id = `perm-${p.id}`;
              return (
                <Label key={p.id} htmlFor={id} className="cursor-pointer items-start font-normal">
                  <Checkbox
                    id={id}
                    className="mt-0.5"
                    disabled={disabled}
                    checked={selected.includes(p.key)}
                    onCheckedChange={(c) => toggle(p.key, c)}
                  />
                  <span className="flex flex-col">
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
