import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-[0.18em] border",
  {
    variants: {
      variant: {
        default: "border-ink text-ink bg-paper",
        solid: "border-ink bg-ink text-paper",
        muted: "border-line text-muted-foreground bg-paper",
        outline: "border-line text-ink bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
