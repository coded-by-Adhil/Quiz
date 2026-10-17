import { useEffect } from "react";
import { ArrowLeft, Clock3, RefreshCw, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/Table";
import { normalizeError } from "@/lib/normalizeError";
import { SortableColumnHeader } from "@/features/reports/components/SortableColumnHeader";
import { ScoreBar } from "@/features/reports/components/ScoreBar";
import { useQuizAttempts } from "@/features/reports/hooks/useQuizAttempts";
import { useAttemptListUrlState } from "@/features/reports/hooks/useAttemptListUrlState";
import { useQuizQuery } from "@/features/quizzes/hooks/useQuizQueries";
import type { QuizAttempt } from "@/features/reports/types";

function reportQuizId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function submittedLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function scoreLabel(attempt: QuizAttempt): string {
  return `${attempt.score} / ${attempt.total_marks}`;
}

function isNotFoundError(error: unknown): boolean {
  const status = normalizeError(error).status;
  return status === 403 || status === 404;
}

function LoadingAttempts() {
  return (
    <div aria-label="Loading attempts" className="grid gap-3" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <Card className="grid gap-3" key={index}><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-full" /></Card>
      ))}
    </div>
  );
}

function BackToReports() {
  return <Link className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-small font-semibold text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring" to="/admin/reports"><ArrowLeft aria-hidden="true" size={17} />Back to reports</Link>;
}

export function QuizAttemptsPage() {
  const { id } = useParams<{ id: string }>();
  const quizId = reportQuizId(id);
  const { direction, page, params, search, searchInput, setPage, setSearchInput, setSort, sort } = useAttemptListUrlState();
  const quizQuery = useQuizQuery(quizId);
  const attemptsQuery = useQuizAttempts(quizId, params);
  const entries = attemptsQuery.data?.data ?? [];
  const totalPages = attemptsQuery.data?.last_page ?? 1;
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const isMissing = quizId === null || (attemptsQuery.isError && isNotFoundError(attemptsQuery.error));

  useEffect(() => {
    document.title = quizQuery.data ? `${quizQuery.data.title} reports · Quiz Platform` : "Quiz reports · Quiz Platform";
    return () => { document.title = "Quiz Platform"; };
  }, [quizQuery.data]);

  useEffect(() => {
    if (!attemptsQuery.isLoading && attemptsQuery.data && page > attemptsQuery.data.last_page) setPage(attemptsQuery.data.last_page);
  }, [attemptsQuery.data, attemptsQuery.isLoading, page, setPage]);

  if (isMissing) {
    return <section className="grid gap-6"><BackToReports /><EmptyState action={<BackToReports />} description="This quiz does not exist or is not available to your account." icon={<UsersRound aria-hidden="true" size={26} />} title="Report not found" /></section>;
  }

  if (quizQuery.isLoading || attemptsQuery.isLoading) {
    return <section className="grid gap-6"><BackToReports /><LoadingAttempts /></section>;
  }

  if (attemptsQuery.isError || (!quizQuery.data && !quizQuery.isError)) {
    const error = attemptsQuery.error;
    return <section className="grid gap-6"><BackToReports /><Card className="grid gap-4"><div><h1 className="text-heading font-semibold text-text">Report could not load</h1><p className="mt-2 text-small text-danger">{normalizeError(error).message}</p></div><div><Button icon={<RefreshCw aria-hidden="true" size={17} />} onClick={() => { void quizQuery.refetch(); void attemptsQuery.refetch(); }} variant="secondary">Retry</Button></div></Card></section>;
  }

  return (
    <section className="grid gap-6">
      <BackToReports />
      <PageHeader description={quizQuery.data?.description ?? undefined} eyebrow="Quiz report" title={quizQuery.data?.title ?? "Quiz report"} />
      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-md"><SearchInput label="Search participants" onChange={(event) => setSearchInput(event.target.value)} onClear={() => setSearchInput("")} placeholder="Search by participant name" value={searchInput} /></div>
        <div className="w-full md:w-56"><Select label="Sort attempts" onChange={(event) => {
          const [nextSort, nextDirection] = event.target.value.split("-");
          if ((nextSort === "participant_name" || nextSort === "score") && (nextDirection === "asc" || nextDirection === "desc")) setSort(nextSort, nextDirection);
        }} value={`${sort}-${direction}`}><option value="participant_name-asc">Participant A-Z</option><option value="participant_name-desc">Participant Z-A</option><option value="score-desc">Highest score</option><option value="score-asc">Lowest score</option></Select></div>
      </div>
      {attemptsQuery.isFetching ? <p className="flex items-center gap-2 text-small text-text-muted" role="status"><RefreshCw aria-hidden="true" className="animate-spin" size={15} />Updating attempts...</p> : null}
      {entries.length === 0 && !search.trim() ? <EmptyState action={<Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-small font-semibold text-primary-contrast transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-fast ease-standard hover:bg-primary/90 active:translate-y-px active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" to={`/admin/links?quiz=${quizId}`}>Quiz links</Link>} description="Share an active quiz link, then submitted guest results will appear here." icon={<UsersRound aria-hidden="true" size={26} />} title="Nobody has finished this quiz yet" /> : null}
      {entries.length === 0 && search.trim() ? <EmptyState action={<Button onClick={() => setSearchInput("")} variant="secondary">Clear search</Button>} description="Try a different participant name or clear the search." icon={<UsersRound aria-hidden="true" size={26} />} title="No results for this search" /> : null}
      {entries.length > 0 ? <>
        <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-subtle md:block"><Table><TableHeader><TableRow>
          <SortableColumnHeader className="w-[27%]" direction={direction} onSort={setSort} sort={sort} sortKey="participant_name">Participant</SortableColumnHeader>
          <SortableColumnHeader direction={direction} onSort={setSort} sort={sort} sortKey="score">Score</SortableColumnHeader>
          <TableHead>Percent</TableHead><TableHead>Submitted</TableHead>
        </TableRow></TableHeader><TableBody>{entries.map((attempt, index) => <TableRow key={`${attempt.participant_name}-${attempt.submitted_at}-${index}`}>
          <TableCell><span className="block truncate font-semibold" title={attempt.participant_name}>{attempt.participant_name}</span></TableCell>
          <TableCell className="font-mono tabular-nums">{scoreLabel(attempt)}</TableCell>
          <TableCell><ScoreBar score={attempt.score} totalMarks={attempt.total_marks} /></TableCell>
          <TableCell className="whitespace-nowrap text-label text-text-muted">{submittedLabel(attempt.submitted_at)}</TableCell>
        </TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 md:hidden">{entries.map((attempt, index) => <Card className="grid gap-3" key={`${attempt.participant_name}-${attempt.submitted_at}-${index}`}>
          <div className="flex items-start justify-between gap-3"><span className="min-w-0 truncate font-semibold" title={attempt.participant_name}>{attempt.participant_name}</span><span className="shrink-0 font-mono text-small tabular-nums">{scoreLabel(attempt)}</span></div>
          <ScoreBar score={attempt.score} totalMarks={attempt.total_marks} />
          <span className="inline-flex items-center gap-1.5 text-small text-text-muted"><Clock3 aria-hidden="true" size={15} />{submittedLabel(attempt.submitted_at)}</span>
        </Card>)}</div>
        <Pagination ariaLabel="Attempt pagination" currentPage={currentPage} onPageChange={setPage} totalPages={totalPages} />
      </> : null}
    </section>
  );
}
