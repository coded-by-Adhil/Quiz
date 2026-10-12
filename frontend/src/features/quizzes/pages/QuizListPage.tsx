import { useEffect, useState } from "react";
import {
  CalendarPlus,
  Clock3,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { SearchInput } from "@/components/SearchInput";
import { Skeleton } from "@/components/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/Table";
import { Tooltip } from "@/components/Tooltip";
import { useToast } from "@/components/useToast";
import { normalizeError } from "@/lib/normalizeError";
import { QuizDeleteDialog } from "@/features/quizzes/components/QuizDeleteDialog";
import {
  useDeleteQuizMutation,
  useQuizzesQuery,
} from "@/features/quizzes/hooks/useQuizQueries";
import { useQuizListUrlState } from "@/features/quizzes/hooks/useQuizListUrlState";
import type { QuizListItem } from "@/features/quizzes/types";

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function durationLabel(duration: number | null): string {
  return duration === null ? "No limit" : `${duration} min`;
}

function QuizActions({
  onDelete,
  quiz,
}: {
  onDelete: (quiz: QuizListItem) => void;
  quiz: QuizListItem;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip label="View quiz">
        <Link
          aria-label={`View quiz ${quiz.title}`}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
          title="View quiz"
          to={`/admin/quizzes/${quiz.id}`}
        >
          <Eye aria-hidden="true" size={17} strokeWidth={1.8} />
        </Link>
      </Tooltip>
      <Tooltip label="Edit quiz">
        <Link
          aria-label={`Edit quiz ${quiz.title}`}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
          title="Edit quiz"
          to={`/admin/quizzes/${quiz.id}/edit`}
        >
          <Pencil aria-hidden="true" size={17} strokeWidth={1.8} />
        </Link>
      </Tooltip>
      <Tooltip label="Delete quiz">
        <Button
          aria-label={`Delete quiz ${quiz.title}`}
          icon={<Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />}
          onClick={() => onDelete(quiz)}
          title="Delete quiz"
          variant="danger"
        />
      </Tooltip>
    </div>
  );
}

function LoadingQuizzes() {
  return (
    <div className="grid gap-3" role="status" aria-label="Loading quizzes">
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

export function QuizListPage() {
  const {
    direction,
    page,
    params,
    search,
    searchInput,
    setPage,
    setSearchInput,
    setSort,
    sort,
  } = useQuizListUrlState();
  const query = useQuizzesQuery(params);
  const deleteMutation = useDeleteQuizMutation();
  const { showToast } = useToast();
  const [deleteQuiz, setDeleteQuiz] = useState<QuizListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  const entries = query.data?.data ?? [];
  const totalPages = query.data?.last_page ?? 1;
  const currentPage = Math.min(page, Math.max(1, totalPages));

  useEffect(() => {
    if (!query.isLoading && query.data && page > query.data.last_page) {
      setPage(query.data.last_page);
    }
  }, [page, query.data, query.isLoading, setPage]);

  const openDeleteDialog = (quiz: QuizListItem) => {
    deleteMutation.reset();
    setDeleteError(undefined);
    setDeleteQuiz(quiz);
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) {
      return;
    }
    setDeleteQuiz(null);
    setDeleteError(undefined);
    deleteMutation.reset();
  };

  const confirmDelete = async () => {
    if (!deleteQuiz) {
      return;
    }

    setDeleteError(undefined);
    try {
      const response = await deleteMutation.mutateAsync(deleteQuiz.id);
      setDeleteQuiz(null);
      showToast({ message: response.message || "Quiz deleted.", variant: "success" });
    } catch (error: unknown) {
      setDeleteError(normalizeError(error).message);
    }
  };

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-small font-semibold text-primary-contrast transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-fast ease-standard hover:bg-primary/90 active:translate-y-px active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            to="/admin/quizzes/new"
          >
            <Plus aria-hidden="true" size={17} strokeWidth={1.8} />
            New quiz
          </Link>
        }
        description="Create focused assessments, choose their question order, and prepare them for sharing."
        eyebrow="Quiz workspace"
        title="Quizzes"
      />

      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-md">
          <SearchInput
            label="Search quizzes"
            onChange={(event) => setSearchInput(event.target.value)}
            onClear={() => setSearchInput("")}
            placeholder="Search by title"
            value={searchInput}
          />
        </div>
        <div className="grid gap-1.5 md:min-w-56">
          <label className="text-small font-semibold text-text" htmlFor="quiz-sort">
            Sort quizzes
          </label>
          <select
            className="min-h-10 rounded-md border border-border bg-surface px-3 py-2 text-body text-text outline-none transition-[background-color,border-color,box-shadow,color] duration-fast ease-standard focus:border-primary focus:ring-2 focus:ring-focus-ring focus:ring-offset-1 focus:ring-offset-background"
            id="quiz-sort"
            onChange={(event) => {
              const value = event.target.value;
              if (value === "title-asc" || value === "created_at-desc" || value === "created_at-asc") {
                const [nextSort, nextDirection] = value.split("-") as [typeof sort, typeof direction];
                setSort(nextSort, nextDirection);
              }
            }}
            value={`${sort}-${direction}`}
          >
            <option value="title-asc">Title A–Z</option>
            <option value="created_at-desc">Newest first</option>
            <option value="created_at-asc">Oldest first</option>
          </select>
        </div>
      </div>

      {query.isLoading ? <LoadingQuizzes /> : null}

      {query.isError ? (
        <Card className="grid gap-4">
          <div>
            <h2 className="text-heading font-semibold text-text">Quizzes could not load</h2>
            <p className="mt-2 text-small text-danger">{normalizeError(query.error).message}</p>
          </div>
          <div>
            <Button
              icon={<RefreshCw aria-hidden="true" size={17} strokeWidth={1.8} />}
              onClick={() => void query.refetch()}
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {query.isFetching && !query.isLoading ? (
        <p className="flex items-center gap-2 text-small text-text-muted" role="status">
          <RefreshCw aria-hidden="true" className="animate-spin" size={15} /> Updating list…
        </p>
      ) : null}

      {!query.isLoading && !query.isError && entries.length === 0 && !search.trim() ? (
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-small font-semibold text-primary-contrast transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-fast ease-standard hover:bg-primary/90 active:translate-y-px active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              to="/admin/quizzes/new"
            >
              <Plus aria-hidden="true" size={17} strokeWidth={1.8} />
              Create your first quiz
            </Link>
          }
          icon={<CalendarPlus aria-hidden="true" size={26} strokeWidth={1.7} />}
          description="Build a quiz from your question bank when you are ready to share an assessment."
          title="No quizzes yet"
        />
      ) : null}

      {!query.isLoading && !query.isError && entries.length === 0 && search.trim() ? (
        <EmptyState
          action={<Button onClick={() => setSearchInput("")} variant="secondary">Clear search</Button>}
          description="Try a different title or clear the search to see every quiz."
          icon={<CalendarPlus aria-hidden="true" size={26} strokeWidth={1.7} />}
          title="No matching quizzes"
        />
      ) : null}

      {!query.isLoading && !query.isError && entries.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-subtle md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Time limit</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell>
                      <Link className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring" to={`/admin/quizzes/${quiz.id}`}>
                        {quiz.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-1 break-words text-small text-text-muted" title={quiz.description ?? ""}>
                        {quiz.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-small text-text-muted">
                      <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" size={15} />{durationLabel(quiz.duration_minutes)}</span>
                    </TableCell>
                    <TableCell className="text-label text-text-muted">{formatDate(quiz.created_at)}</TableCell>
                    <TableCell><QuizActions onDelete={openDeleteDialog} quiz={quiz} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {entries.map((quiz) => (
              <Card className="grid gap-4" key={quiz.id}>
                <div className="flex items-start justify-between gap-3">
                  <Link className="min-w-0 break-words font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring" to={`/admin/quizzes/${quiz.id}`}>
                    {quiz.title}
                  </Link>
                  <span className="shrink-0 text-label text-text-muted">{formatDate(quiz.created_at)}</span>
                </div>
                <p className="line-clamp-2 break-words text-small text-text-muted">{quiz.description}</p>
                <div className="flex items-center gap-2 text-small text-text-muted"><Clock3 aria-hidden="true" size={15} />{durationLabel(quiz.duration_minutes)}</div>
                <QuizActions onDelete={openDeleteDialog} quiz={quiz} />
              </Card>
            ))}
          </div>

          <Pagination
            ariaLabel="Quiz pagination"
            currentPage={currentPage}
            onPageChange={setPage}
            totalPages={totalPages}
          />
        </>
      ) : null}

      <QuizDeleteDialog
        errorMessage={deleteError}
        isDeleting={deleteMutation.isPending}
        onClose={closeDeleteDialog}
        onConfirm={() => void confirmDelete()}
        quiz={deleteQuiz}
      />
    </section>
  );
}
