"use client";

import type { Role } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  roles: Role[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function RoleChecklist({ roles, selected, onChange }: Props) {
  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...selected, id] : selected.filter((r) => r !== id));
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.map((role) => {
        const id = `role-${role.id}`;
        return (
          <Label key={role.id} htmlFor={id} className="cursor-pointer font-normal">
            <Checkbox
              id={id}
              checked={selected.includes(role.id)}
              onCheckedChange={(c) => toggle(role.id, c)}
            />
            <span>{role.name}</span>
          </Label>
        );
      })}
    </div>
  );
}
