import type { ReactNode } from "react";

export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface BadgeProps {
  children: ReactNode;
  icon?: ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-raised text-text-muted",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
  info: "border-info/40 bg-info/10 text-info",
};

export function Badge({ children, icon, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-label font-semibold",
        variantClasses[variant],
      ].join(" ")}
    >
      {icon}
      {children}
    </span>
  );
}
