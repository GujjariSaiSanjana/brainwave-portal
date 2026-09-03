import { cn } from "@/lib/utils";

export function DefinitionList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn("divide-y divide-border text-sm", className)}>{children}</dl>;
}

export function DefinitionRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-6">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-words", mono && "font-mono text-[13px]")}>{children}</dd>
    </div>
  );
}
