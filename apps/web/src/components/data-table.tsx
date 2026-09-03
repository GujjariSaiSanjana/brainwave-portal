import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Card-wrapped table with the shared header treatment.
export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-xl border bg-card", className)}>
      <Table className="text-[13.5px]">{children}</Table>
    </div>
  );
}

export function DataHeader({ children }: { children: React.ReactNode }) {
  return (
    <TableHeader className="bg-muted/60">
      <TableRow className="hover:bg-transparent">{children}</TableRow>
    </TableHeader>
  );
}

export function DataHead({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <TableHead
      className={cn(
        "h-10 px-4 text-[11.5px] font-medium tracking-[0.06em] text-muted-foreground uppercase first:pl-5 last:pr-5",
        className,
      )}
    >
      {children}
    </TableHead>
  );
}

export function DataCell({ children, className, ...rest }: React.ComponentProps<typeof TableCell>) {
  return (
    <TableCell className={cn("px-4 py-3 first:pl-5 last:pr-5", className)} {...rest}>
      {children}
    </TableCell>
  );
}

export function DataEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}

export { TableBody as DataBody, TableRow as DataRow };
