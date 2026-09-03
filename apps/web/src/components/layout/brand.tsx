import { cn } from "@/lib/utils";

export function Brand({ className, dark = true }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="font-display flex size-7 items-center justify-center rounded-md bg-primary text-[15px] font-semibold text-white"
      >
        B
      </span>
      <span className={cn("font-display text-[17px] font-semibold", dark ? "text-white" : "text-foreground")}>
        Brainwave
      </span>
    </span>
  );
}
