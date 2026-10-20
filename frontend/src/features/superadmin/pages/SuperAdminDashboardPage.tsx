import { Link } from "react-router-dom";
import { BarChart3, Link2, NotebookPen, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { StatCard } from "@/components/StatCard";
import { useSuperAdminStatsQuery } from "@/features/superadmin/hooks/useSuperAdminQueries";
import { normalizeError } from "@/lib/normalizeError";

const numberFormat = new Intl.NumberFormat();

function DashboardLoading() {
  return <div aria-label="Loading platform statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status">{Array.from({ length: 6 }, (_, index) => <Card className="grid min-h-36 content-between gap-5" key={index}><Skeleton className="h-4 w-2/3" /><Skeleton className="h-10 w-1/3" /></Card>)}</div>;
}

export function SuperAdminDashboardPage() {
  const query = useSuperAdminStatsQuery();
  const error = query.isError ? normalizeError(query.error) : undefined;

  return (
    <section className="grid gap-6">
      <PageHeader description="A concise view of activity and approval work across the platform." eyebrow="Platform control" title="Dashboard" />
      {query.isLoading ? <DashboardLoading /> : null}
      {query.isError ? <Card className="grid gap-4"><div><h2 className="text-heading font-semibold text-text">Statistics could not load</h2><p className="mt-2 text-small text-danger">{error?.status === 403 ? "You don't have access to this page" : error?.message}</p></div><div><Button onClick={() => void query.refetch()} variant="secondary">Retry</Button></div></Card> : null}
      {query.data ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<Users size={20} strokeWidth={1.8} />} label="Total admins" value={numberFormat.format(query.data.total_admins)} />
        <StatCard icon={<UserCheck size={20} strokeWidth={1.8} />} label="Approved admins" value={numberFormat.format(query.data.approved_admins)} />
        <Link className="rounded-md focus-visible:ring-2 focus-visible:ring-focus-ring" to="/superadmin/admins?status=pending"><StatCard icon={<ShieldCheck size={20} strokeWidth={1.8} />} label="Pending approval" value={numberFormat.format(query.data.pending_admins)} /></Link>
        <StatCard icon={<NotebookPen size={20} strokeWidth={1.8} />} label="Quizzes" value={numberFormat.format(query.data.total_quizzes)} />
        <StatCard icon={<Link2 size={20} strokeWidth={1.8} />} label="Quiz links" value={numberFormat.format(query.data.total_quiz_links)} />
        <StatCard icon={<BarChart3 size={20} strokeWidth={1.8} />} label="Submitted attempts" value={numberFormat.format(query.data.total_submitted_attempts)} />
      </div> : null}
    </section>
  );
}
