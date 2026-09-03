import { cn } from "@/lib/utils";

export type PillTone = "green" | "red" | "amber" | "stone" | "blue";

const tones: Record<PillTone, string> = {
  green: "bg-success/12 text-success",
  red: "bg-destructive/10 text-destructive",
  amber: "bg-warning/15 text-warning",
  stone: "bg-muted text-muted-foreground",
  blue: "bg-service-crm/12 text-service-crm",
};

const GREEN = /^(open|active|paid|qualified|connected|success|resolved)$/i;
const RED = /^(closed|junk|junk lead|overdue|inactive|disabled|failed|void|escalated)$/i;
const AMBER = /^(on hold|sent|contacted|pending|partially_paid|partially paid|draft|on notice|not contacted|mock)$/i;

export function toneFor(value: string | number | null | undefined): PillTone {
  const v = String(value ?? "").trim();
  if (GREEN.test(v)) return "green";
  if (RED.test(v)) return "red";
  if (AMBER.test(v)) return "amber";
  return "stone";
}

interface Props {
  children: React.ReactNode;
  tone?: PillTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusPill({ children, tone = "stone", size = "sm", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" && "h-5 px-2 text-[11px]",
        size === "md" && "h-6 px-2.5 text-xs",
        size === "lg" && "h-7 px-3 text-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
