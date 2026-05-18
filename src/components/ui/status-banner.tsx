import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BannerVariant = "info" | "warning" | "success" | "error" | "neutral";

const styles: Record<BannerVariant, { wrap: string; dot: string }> = {
  info:    { wrap: "bg-blue-50/60 border-blue-200 text-blue-900",    dot: "bg-blue-500"       },
  warning: { wrap: "bg-yellow-50/60 border-yellow-300 text-yellow-900", dot: "bg-yellow-500"  },
  success: { wrap: "bg-green-50/60 border-green-300 text-green-900",  dot: "bg-green-500"     },
  error:   { wrap: "bg-destructive/5 border-destructive/30 text-destructive", dot: "bg-destructive" },
  neutral: { wrap: "bg-muted/40 border-line text-muted-foreground",   dot: "bg-muted-foreground" },
};

interface StatusBannerProps {
  variant?: BannerVariant;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  pulse?: boolean;
}

export function StatusBanner({
  variant = "info",
  icon,
  title,
  description,
  action,
  className,
  pulse = false,
}: StatusBannerProps) {
  const s = styles[variant];
  return (
    <div className={cn("border px-5 py-4 flex items-start gap-4", s.wrap, className)}>
      <div className="shrink-0 mt-0.5">
        {icon ?? (
          <span
            className={cn(
              "block h-2 w-2 rounded-full mt-1",
              s.dot,
              pulse && "animate-pulse",
            )}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {description && (
          <p className="text-xs mt-1 leading-relaxed opacity-80">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
