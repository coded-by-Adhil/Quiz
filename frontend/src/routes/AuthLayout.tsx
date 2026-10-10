import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="flex min-h-20 items-center justify-between border-b border-border px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary font-mono text-small font-semibold text-primary-contrast">
            Q
          </span>
          <div className="grid gap-0.5">
            <span className="font-semibold tracking-[-0.01em]">Quiz Platform</span>
            <span className="font-mono text-label uppercase tracking-[0.12em] text-text-muted">
              Secure workspace access
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <Outlet />
    </div>
  );
}
