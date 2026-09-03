import { cn } from "@/lib/utils";

interface Props {
  tone?: "amber" | "stone" | "red";
  children: React.ReactNode;
  className?: string;
}

const tones = {
  amber: "border-l-warning bg-warning/8",
  stone: "border-l-muted-foreground/40 bg-muted/60",
  red: "border-l-destructive bg-destructive/6",
};

export function InlineNotice({ tone = "amber", children, className }: Props) {
  return (
    <div className={cn("rounded-r-md border-l-[3px] px-3.5 py-2.5 text-[13.5px] leading-relaxed", tones[tone], className)}>
      {children}
    </div>
  );
}
