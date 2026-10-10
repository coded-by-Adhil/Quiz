import { useState } from "react";
import {
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/features/auth/useAuth";

export interface WorkspaceNavItem {
  icon: LucideIcon;
  label: string;
  to: string;
}

interface WorkspaceLayoutProps {
  accent: "admin" | "super";
  navItems: WorkspaceNavItem[];
  roleLabel: string;
}

const accentClasses = {
  admin: {
    active: "bg-primary text-primary-contrast",
    mark: "bg-primary text-primary-contrast",
    muted: "text-primary",
  },
  super: {
    active: "bg-info text-surface",
    mark: "bg-info text-surface",
    muted: "text-info",
  },
} as const;

function BrandMark({ accent }: { accent: "admin" | "super" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md font-mono text-small font-semibold ${accentClasses[accent].mark}`}
    >
      Q
    </span>
  );
}

export function WorkspaceLayout({
  accent,
  navItems,
  roleLabel,
}: WorkspaceLayoutProps) {
  const { logout, user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const colors = accentClasses[accent];

  const navigation = (
    <nav aria-label={`${roleLabel} navigation`} className="grid gap-1">
      {navItems.map(({ icon: Icon, label, to }) => (
        <NavLink
          className={({ isActive }) =>
            [
              "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-small font-semibold transition-colors duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-focus-ring",
              isActive
                ? colors.active
                : "text-text-muted hover:bg-surface-raised hover:text-text",
            ].join(" ")
          }
          key={to}
          onClick={() => setMobileNavOpen(false)}
          to={to}
        >
          <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const account = user ? (
    <div className="grid gap-3 border-t border-border pt-4">
      <div className="grid gap-1 px-2">
        <p className="truncate text-small font-semibold text-text">{user.name}</p>
        <p className="truncate font-mono text-label uppercase tracking-[0.08em] text-text-muted">
          {user.role}
        </p>
      </div>
      <Button
        className="w-full justify-start"
        icon={<LogOut aria-hidden="true" size={17} strokeWidth={1.8} />}
        onClick={() => void logout()}
        variant="ghost"
      >
        Log out
      </Button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background text-text">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex min-h-20 items-center gap-3 border-b border-border px-6">
          <BrandMark accent={accent} />
          <div className="grid gap-0.5">
            <span className="font-semibold tracking-[-0.01em] text-text">Quiz Platform</span>
            <span className={`font-mono text-label uppercase tracking-[0.12em] ${colors.muted}`}>
              {roleLabel}
            </span>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-y-auto px-4 py-6">
          {navigation}
          {account}
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <button
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors duration-fast ease-standard hover:border-primary hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={() => setMobileNavOpen((open) => !open)}
            title={mobileNavOpen ? "Close navigation" : "Open navigation"}
            type="button"
          >
            {mobileNavOpen ? (
              <X aria-hidden="true" size={19} strokeWidth={1.8} />
            ) : (
              <Menu aria-hidden="true" size={19} strokeWidth={1.8} />
            )}
          </button>
          <div className="flex items-center gap-2">
            <BrandMark accent={accent} />
            <span className="text-small font-semibold text-text">{roleLabel}</span>
          </div>
          <ThemeToggle />
        </header>

        {mobileNavOpen ? (
          <>
            <button
              aria-label="Close navigation"
              className="fixed inset-0 z-30 bg-text/30 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              type="button"
            />
            <aside className="fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-border bg-surface px-4 py-5 shadow-raised lg:hidden">
              <div className="mb-6 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <BrandMark accent={accent} />
                  <span className="font-semibold text-text">Quiz Platform</span>
                </div>
                <button
                  aria-label="Close navigation"
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
                  onClick={() => setMobileNavOpen(false)}
                  title="Close navigation"
                  type="button"
                >
                  <X aria-hidden="true" size={18} strokeWidth={1.8} />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-y-auto">
                {navigation}
                {account}
              </div>
            </aside>
          </>
        ) : null}

        <header className="hidden min-h-20 items-center justify-end border-b border-border px-8 lg:flex">
          <div className="flex items-center gap-4">
            <span className="font-mono text-label uppercase tracking-[0.12em] text-text-muted">
              {user?.email}
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
