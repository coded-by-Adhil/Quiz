import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
}

export function EmptyState({
  action,
  description,
  icon = <Inbox aria-hidden="true" size={24} strokeWidth={1.7} />,
  title,
}: EmptyStateProps) {
  return (
    <div className="grid justify-items-center gap-3 rounded-md border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div className="text-primary">{icon}</div>
      <h2 className="text-heading font-semibold text-text">{title}</h2>
      <p className="max-w-md text-small text-text-muted">{description}</p>
      {action}
    </div>
  );
}
