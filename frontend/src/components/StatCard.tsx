import type { ReactNode } from "react";
import { Card } from "@/components/Card";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="grid min-h-36 content-between gap-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-small font-semibold text-text-muted">{label}</p>
        <span className="text-info" aria-hidden="true">{icon}</span>
      </div>
      <p className="font-mono text-display font-semibold tabular-nums text-text">{value}</p>
    </Card>
  );
}
