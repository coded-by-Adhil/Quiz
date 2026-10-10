import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export function GuestLayout() {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="mx-auto flex min-h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary font-mono text-label font-semibold text-primary-contrast">
            Q
          </span>
          <span className="text-small font-semibold">Quiz Platform</span>
        </div>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
