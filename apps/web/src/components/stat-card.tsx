interface Props {
  label: string;
  children: React.ReactNode;
}

export function StatCard({ label, children }: Props) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <div className="mt-1 flex min-h-6 flex-wrap items-center gap-1.5 text-sm font-medium">{children}</div>
    </div>
  );
}
