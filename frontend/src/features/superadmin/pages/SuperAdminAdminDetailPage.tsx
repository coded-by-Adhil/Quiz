import { ArrowLeft, Link2, ListChecks, NotebookPen, RefreshCw, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { StatCard } from "@/components/StatCard";
import { AdminApprovalControl } from "@/features/superadmin/components/AdminApprovalControl";
import { AdminStatusBadge } from "@/features/superadmin/components/AdminStatusBadge";
import { usePlatformAdminQuery } from "@/features/superadmin/hooks/useSuperAdminQueries";
import { normalizeError } from "@/lib/normalizeError";

function adminId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function BackToAdmins() {
  return <Link className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-small font-semibold text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring" to="/superadmin/admins"><ArrowLeft aria-hidden="true" size={17} />Back to admins</Link>;
}

function DetailLoading() {
  return <div aria-label="Loading admin account" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status">{Array.from({ length: 3 }, (_, index) => <Card className="grid min-h-36 content-between gap-5" key={index}><Skeleton className="h-4 w-2/3" /><Skeleton className="h-10 w-1/3" /></Card>)}</div>;
}

export function SuperAdminAdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const idValue = adminId(id);
  const query = usePlatformAdminQuery(idValue);
  const error = query.isError ? normalizeError(query.error) : undefined;
  const isNotFound = idValue === null || error?.status === 404;

  if (isNotFound) return <section className="grid gap-6"><BackToAdmins /><EmptyState action={<BackToAdmins />} description="This account is unavailable. Super-admin accounts are not managed here." icon={<Users aria-hidden="true" size={26} />} title="Admin not found" /></section>;
  if (query.isLoading) return <section className="grid gap-6"><BackToAdmins /><DetailLoading /></section>;
  if (query.isError) return <section className="grid gap-6"><BackToAdmins /><Card className="grid gap-4"><div><h1 className="text-heading font-semibold text-text">Admin account could not load</h1><p className="mt-2 text-small text-danger">{error?.status === 403 ? "You don't have access to this page" : error?.message}</p></div><div><Button icon={<RefreshCw aria-hidden="true" size={17} />} onClick={() => void query.refetch()} variant="secondary">Retry</Button></div></Card></section>;
  if (!query.data) return null;

  const admin = query.data;
  return <section className="grid gap-6"><BackToAdmins />
    <PageHeader actions={<AdminApprovalControl admin={admin} onMissing={() => void query.refetch()} />} description={admin.email} eyebrow="Admin account" title={admin.name} />
    <div className="flex flex-wrap items-center gap-3 text-small text-text-muted"><AdminStatusBadge isApproved={admin.is_approved} /><span>Created {formatDate(admin.created_at)}</span></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard icon={<ListChecks size={20} strokeWidth={1.8} />} label="Questions" value={new Intl.NumberFormat().format(admin.questions_count)} />
      <StatCard icon={<NotebookPen size={20} strokeWidth={1.8} />} label="Quizzes" value={new Intl.NumberFormat().format(admin.quizzes_count)} />
      <StatCard icon={<Link2 size={20} strokeWidth={1.8} />} label="Quiz links" value={new Intl.NumberFormat().format(admin.quiz_links_count)} />
    </div>
  </section>;
}
