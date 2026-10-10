import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-primary bg-primary text-primary-contrast hover:bg-primary/90 active:bg-primary/80",
  secondary:
    "border border-border bg-surface text-text hover:border-primary hover:bg-surface-raised active:bg-background",
  ghost:
    "border border-transparent bg-transparent text-text-muted hover:border-border hover:bg-surface-raised hover:text-text active:bg-background",
  danger:
    "border border-danger bg-danger text-primary-contrast hover:bg-danger/90 active:bg-danger/80",
};

export function Button({
  children,
  className,
  disabled = false,
  icon,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-small font-semibold transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-fast ease-standard",
        "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        "active:translate-y-px",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? <Spinner size="sm" label="Loading" /> : icon}
      {children}
    </button>
  );
}
