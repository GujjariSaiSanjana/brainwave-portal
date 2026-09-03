"use client";

import type { Department } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";

interface Props {
  id?: string;
  departments: Department[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function DepartmentSelect({ id, departments, value, onChange }: Props) {
  const items = [
    { value: NONE, label: "No department" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <Select
      items={items}
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE || v == null ? null : String(v))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
