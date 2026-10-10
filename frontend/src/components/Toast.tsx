import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ToastVariant } from "@/components/toastContext";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  variant: ToastVariant;
}

const variantClasses: Record<ToastVariant, string> = {
  info: "border-info/40 bg-info/10 text-info",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  error: "border-danger/40 bg-danger/10 text-danger",
};

const variantIcons: Record<ToastVariant, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export function Toast({ message, onDismiss, variant }: ToastProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-md border bg-surface px-4 py-3 text-small shadow-raised",
        variantClasses[variant],
      ].join(" ")}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={18} strokeWidth={1.8} />
      <span className="min-w-0 flex-1 text-text">{message}</span>
      <button
        aria-label="Dismiss notification"
        className="inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
        onClick={onDismiss}
        title="Dismiss notification"
        type="button"
      >
        <X aria-hidden="true" size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}
