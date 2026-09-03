import { cn } from "@/lib/utils";
import { serviceTheme } from "@/lib/service-theme";

interface Props {
  serviceKey: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "size-8 text-base rounded-md",
  md: "size-10 text-lg rounded-lg",
  lg: "size-12 text-xl rounded-lg",
};

export function ServiceTile({ serviceKey, size = "md", className }: Props) {
  const theme = serviceTheme(serviceKey);
  return (
    <span
      aria-hidden
      className={cn(
        "font-display inline-flex shrink-0 items-center justify-center font-semibold",
        sizes[size],
        theme.tint,
        theme.text,
        className,
      )}
    >
      {theme.monogram}
    </span>
  );
}
