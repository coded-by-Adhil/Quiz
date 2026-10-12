import { useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { Tooltip } from "@/components/Tooltip";
import { useToast } from "@/components/useToast";
import { useQuestionsQuery } from "@/features/questions/hooks/useQuestionQueries";
import { QuizDeleteDialog } from "@/features/quizzes/components/QuizDeleteDialog";
import { QuizQuestionManager } from "@/features/quizzes/components/QuizQuestionManager";
import {
  useDeleteQuizMutation,
  useQuizQuery,
} from "@/features/quizzes/hooks/useQuizQueries";
import { normalizeError } from "@/lib/normalizeError";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const quizId = id && /^\d+$/.test(id) ? Number(id) : null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const quizQuery = useQuizQuery(quizId);
  const questionQuery = useQuestionsQuery();
  const deleteMutation = useDeleteQuizMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const normalizedError = quizQuery.error ? normalizeError(quizQuery.error) : undefined;
  const notFound = quizId === null || normalizedError?.status === 403 || normalizedError?.status === 404;

  const confirmDelete = async () => {
    if (quizId === null) {
      return;
    }

    setDeleteError(undefined);
    try {
      const response = await deleteMutation.mutateAsync(quizId);
      showToast({ message: response.message || "Quiz deleted.", variant: "success" });
      navigate("/admin/quizzes");
    } catch (error: unknown) {
      setDeleteError(normalizeError(error).message);
    }
  };

  const reloadFromServer = async () => {
    await Promise.all([quizQuery.refetch(), questionQuery.refetch()]);
  };

  return (
    <section className="grid gap-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-small font-semibold text-text transition-colors duration-fast ease-standard hover:border-primary hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-focus-ring"
              to="/admin/quizzes"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
              Back to quizzes
            </Link>
            {quizQuery.data ? (
              <>
                <Link
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-small font-semibold text-text transition-colors duration-fast ease-standard hover:border-primary hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-focus-ring"
                  to={`/admin/quizzes/${quizQuery.data.id}/edit`}
                >
                  <Pencil aria-hidden="true" size={17} strokeWidth={1.8} />
                  Edit quiz
                </Link>
                <Tooltip label="Delete quiz">
                  <Button
                    aria-label="Delete quiz"
                    icon={<Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />}
                    onClick={() => {
                      deleteMutation.reset();
                      setDeleteError(undefined);
                      setDeleteOpen(true);
                    }}
                    title="Delete quiz"
                    variant="danger"
                  >
                    Delete
                  </Button>
                </Tooltip>
              </>
            ) : null}
          </div>
        }
        description={quizQuery.data?.description ?? "Manage quiz details and choose its question order."}
        eyebrow="Quiz workspace"
        title={quizQuery.data?.title ?? "Quiz details"}
      />

      {quizQuery.isLoading ? (
        <Card className="grid gap-5" role="status" aria-label="Loading quiz details">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-3/5" />
          <div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        </Card>
      ) : null}

      {notFound && !quizQuery.isLoading ? (
        <EmptyState
          action={<Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-small font-semibold text-text focus-visible:ring-2 focus-visible:ring-focus-ring" to="/admin/quizzes"><ArrowLeft aria-hidden="true" size={17} />Back to quizzes</Link>}
          description="This quiz does not exist or does not belong to your account."
          title="Quiz not found"
        />
      ) : null}

      {quizQuery.isError && !notFound ? (
        <Card className="grid max-w-2xl gap-4">
          <div>
            <h2 className="text-heading font-semibold text-text">Quiz could not load</h2>
            <p className="mt-2 text-small text-danger">{normalizedError?.message ?? "The quiz could not be loaded."}</p>
          </div>
          <Button icon={<RefreshCw aria-hidden="true" size={17} strokeWidth={1.8} />} onClick={() => void quizQuery.refetch()} variant="secondary">
            Retry
          </Button>
        </Card>
      ) : null}

      {quizQuery.data && !quizQuery.isError ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="flex items-center gap-3">
              <Clock3 aria-hidden="true" className="text-primary" size={21} strokeWidth={1.8} />
              <div><p className="text-label uppercase tracking-[0.08em] text-text-muted">Time limit</p><p className="mt-1 font-semibold text-text">{quizQuery.data.duration_minutes === null ? "No limit" : `${quizQuery.data.duration_minutes} minutes`}</p></div>
            </Card>
            <Card className="flex items-center gap-3">
              <span aria-hidden="true" className="font-mono text-heading font-semibold text-primary">{quizQuery.data.questions.length}</span>
              <div><p className="text-label uppercase tracking-[0.08em] text-text-muted">Questions</p><p className="mt-1 font-semibold text-text">In this quiz</p></div>
            </Card>
            <Card className="flex items-center gap-3">
              <Badge variant="success">Ready to edit</Badge>
              <div><p className="text-label uppercase tracking-[0.08em] text-text-muted">Created</p><p className="mt-1 text-small text-text">{formatDate(quizQuery.data.created_at)}</p></div>
            </Card>
          </div>

          {questionQuery.isLoading ? (
            <Card className="grid gap-4" role="status" aria-label="Loading question bank">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </Card>
          ) : null}
          {questionQuery.isError ? (
            <Card className="grid gap-4">
              <div><h2 className="text-heading font-semibold text-text">Question bank could not load</h2><p className="mt-2 text-small text-danger">{normalizeError(questionQuery.error).message}</p></div>
              <Button icon={<RefreshCw aria-hidden="true" size={17} strokeWidth={1.8} />} onClick={() => void questionQuery.refetch()} variant="secondary">Retry</Button>
            </Card>
          ) : null}
          {questionQuery.data && !questionQuery.isError ? (
            <QuizQuestionManager
              onReload={reloadFromServer}
              questions={questionQuery.data}
              quiz={quizQuery.data}
              serverVersion={quizQuery.dataUpdatedAt}
            />
          ) : null}
        </>
      ) : null}

      <QuizDeleteDialog
        errorMessage={deleteError}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        quiz={deleteOpen ? quizQuery.data ?? null : null}
      />
    </section>
  );
}
