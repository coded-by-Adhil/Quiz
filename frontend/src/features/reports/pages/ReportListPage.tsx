import { useEffect } from "react";
import { CalendarPlus, Clock3, RefreshCw } from "lucide-react";
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
import { normalizeError } from "@/lib/normalizeError";
import { SortableColumnHeader } from "@/features/reports/components/SortableColumnHeader";
import { useQuizzesQuery } from "@/features/quizzes/hooks/useQuizQueries";
import { useQuizListUrlState } from "@/features/quizzes/hooks/useQuizListUrlState";
import type { QuizListItem } from "@/features/quizzes/types";

function durationLabel(duration: number | null): string {
  return duration === null ? "No limit" : `${duration} min`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function ReportLink({ quiz, className = "" }: { quiz: QuizListItem; className?: string }) {
  return (
    <Link
      className={`font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`}
      to={`/admin/quizzes/${quiz.id}/attempts`}
    >
      {quiz.title}
    </Link>
  );
}

function LoadingReports() {
  return (
    <div aria-label="Loading reports" className="grid gap-3" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <Card className="grid gap-3" key={index}>
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/3" />
        </Card>
      ))}
    </div>
  );
}

export function ReportListPage() {
  const { direction, page, params, search, searchInput, setPage, setSearchInput, setSort, sort } = useQuizListUrlState();
  const query = useQuizzesQuery(params);
  const entries = query.data?.data ?? [];
  const totalPages = query.data?.last_page ?? 1;
  const currentPage = Math.min(page, Math.max(1, totalPages));

  useEffect(() => {
    if (!query.isLoading && query.data && page > query.data.last_page) setPage(query.data.last_page);
  }, [page, query.data, query.isLoading, setPage]);

  return (
    <section className="grid gap-6">
      <PageHeader
        description="Choose a quiz to see submitted guest scores. Answers and individual selections stay private."
        eyebrow="Reporting"
        title="Reports"
      />

      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-md">
          <SearchInput label="Search reports" onChange={(event) => setSearchInput(event.target.value)} onClear={() => setSearchInput("")} placeholder="Search by title" value={searchInput} />
        </div>
        <div className="w-full md:w-56">
          <Select label="Sort reports" onChange={(event) => {
            const [nextSort, nextDirection] = event.target.value.split("-");
            if ((nextSort === "title" || nextSort === "created_at") && (nextDirection === "asc" || nextDirection === "desc")) setSort(nextSort, nextDirection);
          }} value={`${sort}-${direction}`}>
            <option value="title-asc">Title A-Z</option>
            <option value="created_at-desc">Newest first</option>
            <option value="created_at-asc">Oldest first</option>
          </Select>
        </div>
      </div>

      {query.isLoading ? <LoadingReports /> : null}
      {query.isError ? (
        <Card className="grid gap-4"><div><h2 className="text-heading font-semibold text-text">Reports could not load</h2><p className="mt-2 text-small text-danger">{normalizeError(query.error).message}</p></div><div><Button icon={<RefreshCw aria-hidden="true" size={17} />} onClick={() => void query.refetch()} variant="secondary">Retry</Button></div></Card>
      ) : null}
      {query.isFetching && !query.isLoading ? <p className="flex items-center gap-2 text-small text-text-muted" role="status"><RefreshCw aria-hidden="true" className="animate-spin" size={15} />Updating reports...</p> : null}
      {!query.isLoading && !query.isError && entries.length === 0 && !search.trim() ? <EmptyState description="Create a quiz first, then its guest attempts will appear here." icon={<CalendarPlus aria-hidden="true" size={26} />} title="No quizzes yet" /> : null}
      {!query.isLoading && !query.isError && entries.length === 0 && search.trim() ? <EmptyState action={<Button onClick={() => setSearchInput("")} variant="secondary">Clear search</Button>} description="Try a different title or clear the search to see every quiz." icon={<CalendarPlus aria-hidden="true" size={26} />} title="No results for this search" /> : null}
      {!query.isLoading && !query.isError && entries.length > 0 ? <>
        <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-subtle md:block">
          <Table><TableHeader><TableRow>
            <SortableColumnHeader direction={direction} onSort={setSort} sort={sort} sortKey="title" className="w-[28%]">Title</SortableColumnHeader>
            <TableHead>Description</TableHead><TableHead>Time limit</TableHead>
            <SortableColumnHeader direction={direction} onSort={setSort} sort={sort} sortKey="created_at">Created</SortableColumnHeader>
          </TableRow></TableHeader><TableBody>{entries.map((quiz) => <TableRow key={quiz.id}>
            <TableCell><ReportLink quiz={quiz} /></TableCell>
            <TableCell><p className="line-clamp-1 break-words text-small text-text-muted" title={quiz.description ?? ""}>{quiz.description}</p></TableCell>
            <TableCell className="text-small text-text-muted"><span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" size={15} />{durationLabel(quiz.duration_minutes)}</span></TableCell>
            <TableCell className="text-label text-text-muted">{formatDate(quiz.created_at)}</TableCell>
          </TableRow>)}</TableBody></Table>
        </div>
        <div className="grid gap-3 md:hidden">{entries.map((quiz) => <Card className="grid gap-3" key={quiz.id}>
          <div className="flex items-start justify-between gap-3"><ReportLink className="min-w-0 break-words" quiz={quiz} /><span className="shrink-0 text-label text-text-muted">{formatDate(quiz.created_at)}</span></div>
          <p className="line-clamp-1 break-words text-small text-text-muted" title={quiz.description ?? ""}>{quiz.description}</p>
          <span className="inline-flex items-center gap-1.5 text-small text-text-muted"><Clock3 aria-hidden="true" size={15} />{durationLabel(quiz.duration_minutes)}</span>
        </Card>)}</div>
        <Pagination ariaLabel="Reports pagination" currentPage={currentPage} onPageChange={setPage} totalPages={totalPages} />
      </> : null}
    </section>
  );
}
