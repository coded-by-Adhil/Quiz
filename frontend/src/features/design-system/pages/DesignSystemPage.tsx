import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Database,
  Info,
  LockKeyhole,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Dialog } from "@/components/Dialog";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { Spinner } from "@/components/Spinner";
import { Toast } from "@/components/Toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const colorTokens = [
  "background",
  "surface",
  "surface-raised",
  "border",
  "text",
  "text-muted",
  "primary",
  "primary-contrast",
  "success",
  "warning",
  "danger",
  "info",
  "focus-ring",
] as const;

const typeTokens = [
  ["display", "Display", "text-display"],
  ["title", "Title", "text-title"],
  ["heading", "Heading", "text-heading"],
  ["body", "Body", "text-body"],
  ["small", "Small", "text-small"],
  ["label", "Label", "text-label"],
] as const;

const spacingTokens = [
  ["1", "4px"],
  ["2", "8px"],
  ["3", "12px"],
  ["4", "16px"],
  ["6", "24px"],
  ["8", "32px"],
] as const;

const radiusTokens = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
] as const;

const shadowTokens = [
  ["subtle", "Subtle"],
  ["raised", "Raised"],
  ["overlay", "Overlay"],
] as const;

function TokenSection({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <h3 className="text-heading font-semibold text-text">Color roles</h3>
        <p className="text-small text-text-muted">
          Semantic roles stay stable while the values adapt to the theme.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {colorTokens.map((token) => (
          <div className="grid gap-2" key={token}>
            <div
              className="flex min-h-16 items-end rounded-md border border-border p-2 text-label font-semibold"
              style={{
                backgroundColor: `var(--token-${token})`,
                color:
                  token === "primary" || token === "danger" || token === "success"
                    ? "var(--token-primary-contrast)"
                    : "var(--token-text)",
              }}
            >
              {theme}
            </div>
            <span className="font-mono text-label text-text-muted">{token}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-5 border-t border-border pt-5">
        <div className="grid gap-2">
          <h3 className="text-heading font-semibold text-text">Type scale</h3>
          <p className="text-small text-text-muted">Six sizes with paired line heights.</p>
        </div>
        <div className="grid gap-4">
          {typeTokens.map(([token, label, className]) => (
            <div className="grid gap-1 border-b border-border pb-3 last:border-0" key={token}>
              <span className="font-mono text-label uppercase tracking-[0.1em] text-text-muted">
                {label} · {token}
              </span>
              <p className={`${className} text-text`}>
                Clear questions create confident answers.
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 border-t border-border pt-5 md:grid-cols-3">
        <div className="grid gap-3 md:col-span-1">
          <h3 className="text-heading font-semibold text-text">Spacing</h3>
          {spacingTokens.map(([token, value]) => (
            <div className="flex items-center gap-3" key={token}>
              <span
                className="block h-3 rounded-sm bg-primary"
                style={{ width: `calc(var(--token-space-${token}) * 2)` }}
              />
              <span className="font-mono text-label text-text-muted">
                {token} · {value}
              </span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:col-span-1">
          <h3 className="text-heading font-semibold text-text">Radius</h3>
          {radiusTokens.map(([token, label]) => (
            <div className="flex items-center gap-3" key={token}>
              <span
                className="block h-8 w-16 border-2 border-primary bg-surface-raised"
                style={{ borderRadius: `var(--token-radius-${token})` }}
              />
              <span className="font-mono text-label text-text-muted">{label}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:col-span-1">
          <h3 className="text-heading font-semibold text-text">Shadows</h3>
          {shadowTokens.map(([token, label]) => (
            <div
              className="flex min-h-10 items-center rounded-md bg-surface px-3 text-small text-text"
              key={token}
              style={{ boxShadow: `var(--token-shadow-${token})` }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 border-t border-border pt-5">
        <h3 className="text-heading font-semibold text-text">Motion</h3>
        <p className="font-mono text-small text-text-muted">
          fast: 150ms · standard: 200ms · easing: standard · reduced motion supported
        </p>
      </div>
    </div>
  );
}

function ComponentSection({ theme }: { theme: "light" | "dark" }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="grid gap-8 border-t border-border pt-8">
      <div className="grid gap-2">
        <h3 className="text-heading font-semibold text-text">Components</h3>
        <p className="text-small text-text-muted">
          Interactive states use the same focus ring, motion, and status signals in {theme} mode.
        </p>
      </div>

      <section className="grid gap-4">
        <h4 className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
          Buttons
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<Sparkles aria-hidden="true" size={16} strokeWidth={1.8} />}>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" icon={<XCircle aria-hidden="true" size={16} strokeWidth={1.8} />}>
            Danger
          </Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          <h4 className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
            Inputs
          </h4>
          <Input id={`${theme}-default-input`} label="Default" placeholder="Type a response" />
          <Input
            autoFocus={theme === "light"}
            helperText="Helper text explains what belongs here."
            id={`${theme}-focus-input`}
            label="Focus and helper"
            placeholder="Focused on the light preview"
          />
          <Input
            error="This field needs attention."
            id={`${theme}-error-input`}
            label="Error"
            value="Invalid value"
            readOnly
          />
          <Input disabled id={`${theme}-disabled-input`} label="Disabled" value="Unavailable" readOnly />
        </div>
        <div className="grid content-start gap-4">
          <h4 className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
            Badges
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge icon={<CheckCircle2 aria-hidden="true" size={14} />} variant="success">Success</Badge>
            <Badge icon={<AlertTriangle aria-hidden="true" size={14} />} variant="warning">Warning</Badge>
            <Badge icon={<XCircle aria-hidden="true" size={14} />} variant="danger">Danger</Badge>
            <Badge icon={<Info aria-hidden="true" size={14} />} variant="info">Info</Badge>
          </div>
          <h4 className="mt-4 font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
            Card
          </h4>
          <Card>
            <div className="flex items-start gap-3">
              <Database aria-hidden="true" className="mt-1 text-primary" size={20} />
              <div>
                <p className="font-semibold text-text">A framed surface</p>
                <p className="mt-1 text-small text-text-muted">Cards frame tools and repeated items only.</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          <h4 className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
            Loading
          </h4>
          <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <Spinner />
            <Skeleton className="h-4 max-w-xs" />
          </div>
          <Skeleton className="h-20" />
        </div>
        <div className="grid gap-4">
          <h4 className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
            Empty state
          </h4>
          <EmptyState
            action={<Button icon={<CircleHelp aria-hidden="true" size={16} />}>Create one</Button>}
            description="There is nothing here yet, but the next useful action is ready."
            icon={<Users aria-hidden="true" size={24} strokeWidth={1.7} />}
            title="No records yet"
          />
        </div>
      </section>

      <section className="grid gap-4">
        <h4 className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
          Toast variants
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Toast message="Information is available." onDismiss={() => undefined} variant="info" />
          <Toast message="The account is approved." onDismiss={() => undefined} variant="success" />
          <Toast message="Approval is still pending." onDismiss={() => undefined} variant="warning" />
          <Toast message="The request could not be completed." onDismiss={() => undefined} variant="error" />
        </div>
      </section>

      <section className="grid gap-4">
        <h4 className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
          Dialog
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setDialogOpen(true)}>Open native dialog</Button>
          <span className="text-small text-text-muted">Escape closes it and Tab stays inside.</span>
        </div>
        <Dialog
          description="This preview uses the native dialog element with a local focus trap."
          onClose={() => setDialogOpen(false)}
          open={dialogOpen}
          title="Review component state"
        >
          <div className="grid gap-4">
            <p className="text-small text-text-muted">
              The dialog is intentionally reserved for focused decisions and confirmation work.
            </p>
            <Button onClick={() => setDialogOpen(false)} variant="secondary">
              Close dialog
            </Button>
          </div>
        </Dialog>
      </section>
    </div>
  );
}

function ThemePreview({ theme }: { theme: "light" | "dark" }) {
  return (
    <section
      className="grid gap-8 rounded-lg border border-border bg-background p-5 sm:p-8"
      data-theme={theme}
    >
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-label font-semibold uppercase tracking-[0.12em] text-primary">
            Preview theme
          </p>
          <h2 className="mt-1 text-title font-semibold capitalize text-text">{theme} mode</h2>
        </div>
        <Badge variant={theme === "light" ? "neutral" : "info"}>
          {theme === "light" ? "Paper" : "Ink"}
        </Badge>
      </div>
      <TokenSection theme={theme} />
      <ComponentSection theme={theme} />
    </section>
  );
}

export function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-text sm:px-8 lg:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <PageHeader
          actions={<ThemeToggle />}
          description="Copper Ledger is the shared visual language for guest, admin, and super-admin experiences."
          eyebrow="Design system"
          title="Tokens and components"
        />
        <div className="grid gap-8">
          <ThemePreview theme="light" />
          <ThemePreview theme="dark" />
        </div>
        <Card className="flex items-start gap-3 bg-surface-raised">
          <LockKeyhole aria-hidden="true" className="mt-1 shrink-0 text-primary" size={19} strokeWidth={1.8} />
          <p className="text-small text-text-muted">
            This page is a visual QA surface. The app remains token-driven, keyboard-friendly, and free of feature behavior changes.
          </p>
        </Card>
      </div>
    </main>
  );
}
