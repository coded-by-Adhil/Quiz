import { useEffect } from "react";
import { RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/Table";
import { AdminApprovalControl } from "@/features/superadmin/components/AdminApprovalControl";
import { AdminStatusBadge } from "@/features/superadmin/components/AdminStatusBadge";
import { useAdminListUrlState } from "@/features/superadmin/hooks/useAdminListUrlState";
import { usePlatformAdminsQuery } from "@/features/superadmin/hooks/useSuperAdminQueries";
import { normalizeError } from "@/lib/normalizeError";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function LoadingAdmins() {
  return <div aria-label="Loading admin accounts" className="grid gap-3" role="status">{Array.from({ length: 5 }, (_, index) => <Card className="grid gap-3" key={index}><Skeleton className="h-5 w-1/4" /><Skeleton className="h-4 w-2/5" /><Skeleton className="h-10 w-36" /></Card>)}</div>;
}

export function SuperAdminAdminListPage() {
  const { page, params, perPage, search, searchInput, setPage, setPerPage, setSearchInput, setStatus, status } = useAdminListUrlState();
  const query = usePlatformAdminsQuery(params);
  const admins = query.data?.data ?? [];
  const totalPages = query.data?.last_page ?? 1;
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const error = query.isError ? normalizeError(query.error) : undefined;

  useEffect(() => {
    if (!query.isLoading && query.data && page > query.data.last_page) setPage(query.data.last_page);
  }, [page, query.data, query.isLoading, setPage]);

  const emptyState = () => {
    if (search.trim()) {
      return <EmptyState action={<Button onClick={() => setSearchInput("")} variant="secondary">Clear search</Button>} description="Try a different name or email address, or clear the search." icon={<Users aria-hidden="true" size={26} />} title="No results for this search" />;
    }
    if (status === "pending") {
      return <EmptyState description="Every admin account is currently approved." icon={<Users aria-hidden="true" size={26} />} title="No admins waiting for approval" />;
    }
    return <EmptyState description="New admin accounts will appear here when they register." icon={<Users aria-hidden="true" size={26} />} title="No admins yet" />;
  };

  return (
    <section className="grid gap-6">
      <PageHeader description="Review platform accounts and control which admins can access their workspaces." eyebrow="Platform control" title="Admin accounts" />
      <div className="grid gap-4 border-b border-border pb-5 md:grid-cols-[minmax(0,1fr)_12rem_10rem] md:items-end">
        <SearchInput id="admin-search" label="Search admins" onChange={(event) => setSearchInput(event.target.value)} onClear={() => setSearchInput("")} placeholder="Search by name or email" value={searchInput} />
        <Select id="admin-status" label="Status" onChange={(event) => setStatus(event.target.value === "approved" || event.target.value === "pending" ? event.target.value : undefined)} value={status ?? ""}>
          <option value="">All</option><option value="pending">Not approved</option><option value="approved">Approved</option>
        </Select>
        <Select id="admin-page-size" label="Rows per page" onChange={(event) => setPerPage(Number(event.target.value))} value={String(perPage)}>
          <option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>
        </Select>
      </div>

      {query.isLoading ? <LoadingAdmins /> : null}
      {query.isError ? <Card className="grid gap-4"><div><h2 className="text-heading font-semibold text-text">Admin accounts could not load</h2><p className="mt-2 text-small text-danger">{error?.status === 403 ? "You don't have access to this page" : error?.message}</p></div><div><Button icon={<RefreshCw aria-hidden="true" size={17} />} onClick={() => void query.refetch()} variant="secondary">Retry</Button></div></Card> : null}
      {query.isFetching && !query.isLoading ? <p className="flex items-center gap-2 text-small text-text-muted" role="status"><RefreshCw aria-hidden="true" className="animate-spin" size={15} />Updating accounts...</p> : null}
      {!query.isLoading && !query.isError && admins.length === 0 ? emptyState() : null}
      {!query.isLoading && !query.isError && admins.length > 0 ? <>
        <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-subtle md:block"><Table><TableHeader><TableRow>
          <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Approval</TableHead>
        </TableRow></TableHeader><TableBody>{admins.map((admin) => <TableRow key={admin.id}>
          <TableCell><Link className="font-semibold text-info underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring" to={`/superadmin/admins/${admin.id}`}>{admin.name}</Link></TableCell>
          <TableCell className="break-all text-text-muted">{admin.email}</TableCell>
          <TableCell><AdminStatusBadge isApproved={admin.is_approved} /></TableCell>
          <TableCell className="whitespace-nowrap text-label text-text-muted">{formatDate(admin.created_at)}</TableCell>
          <TableCell><AdminApprovalControl admin={admin} onMissing={() => void query.refetch()} /></TableCell>
        </TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 md:hidden">{admins.map((admin) => <Card className="grid gap-4" key={admin.id}>
          <div className="grid gap-2"><div className="flex items-start justify-between gap-3"><Link className="min-w-0 break-words font-semibold text-info underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring" to={`/superadmin/admins/${admin.id}`}>{admin.name}</Link><AdminStatusBadge isApproved={admin.is_approved} /></div><p className="break-all text-small text-text-muted">{admin.email}</p><p className="text-label text-text-muted">Created {formatDate(admin.created_at)}</p></div>
          <AdminApprovalControl admin={admin} onMissing={() => void query.refetch()} />
        </Card>)}</div>
        <Pagination ariaLabel="Admin accounts pagination" currentPage={currentPage} onPageChange={setPage} totalPages={totalPages} />
      </> : null}
    </section>
  );
}
