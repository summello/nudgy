"use client";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "overdue" | "paid" | "processing" | "needs-review" | "default";
}

export const Badge = ({ className, variant = "default", children, ...props }: BadgeProps) => {
  const variantClasses = {
    overdue: "badge-overdue",
    paid: "badge-paid",
    processing: "badge-processing",
    "needs-review": "badge-needs-review",
    default: "badge bg-surface-subtle text-ink-muted border border-border",
  };

  return (
    <span className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </span>
  );
};