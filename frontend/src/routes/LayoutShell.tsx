import type { PropsWithChildren } from "react";

export interface LayoutShellProps extends PropsWithChildren {
  label: string;
}

export function LayoutShell({ children, label }: LayoutShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            {label}
          </p>
        </div>
      </header>
      {children}
    </div>
  );
}
