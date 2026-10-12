import { useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/useToast";
import { QuizForm } from "@/features/quizzes/components/QuizForm";
import {
  useQuizQuery,
  useUpdateQuizMutation,
} from "@/features/quizzes/hooks/useQuizQueries";
import {
  quizValuesFromModel,
  toQuizPayload,
  type QuizFormValues,
} from "@/features/quizzes/schemas";
import { normalizeError } from "@/lib/normalizeError";
import type { ApiError } from "@/types/api";

function BackLink() {
  return (
    <Link
      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-small font-semibold text-text transition-colors duration-fast ease-standard hover:border-primary hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-focus-ring"
      to="/admin/quizzes"
    >
      <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
      Back to quizzes
    </Link>
  );
}

export function QuizEditPage() {
  const { id } = useParams<{ id: string }>();
  const quizId = id && /^\d+$/.test(id) ? Number(id) : null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const query = useQuizQuery(quizId);
  const mutation = useUpdateQuizMutation();
  const [serverError, setServerError] = useState<ApiError>();
  const defaultValues = useMemo<QuizFormValues | undefined>(
    () => (query.data ? quizValuesFromModel(query.data) : undefined),
    [query.data],
  );
  const normalizedError = query.error ? normalizeError(query.error) : undefined;
  const notFound = quizId === null || normalizedError?.status === 403 || normalizedError?.status === 404;

  const submit = async (values: QuizFormValues) => {
    if (quizId === null) {
      return;
    }
    setServerError(undefined);
    try {
      await mutation.mutateAsync({ id: quizId, payload: toQuizPayload(values) });
      showToast({ message: "Quiz updated.", variant: "success" });
      navigate(`/admin/quizzes/${quizId}`);
    } catch (error: unknown) {
      setServerError(normalizeError(error));
    }
  };

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={<BackLink />}
        description="Update the quiz details without changing its question order."
        eyebrow="Quiz workspace"
        title="Edit quiz"
      />
      {query.isLoading ? (
        <Card className="grid max-w-3xl gap-5" role="status" aria-label="Loading quiz">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-28" />
          <Skeleton className="h-10 w-1/2" />
        </Card>
      ) : null}
      {notFound && !query.isLoading ? (
        <EmptyState
          action={<BackLink />}
          description="This quiz does not exist or does not belong to your account."
          title="Quiz not found"
        />
      ) : null}
      {query.isError && !notFound ? (
        <Card className="grid max-w-2xl gap-4">
          <div>
            <h2 className="text-heading font-semibold text-text">Quiz could not load</h2>
            <p className="mt-2 text-small text-danger">{normalizedError?.message ?? "The quiz could not be loaded."}</p>
          </div>
          <Button icon={<RefreshCw aria-hidden="true" size={17} strokeWidth={1.8} />} onClick={() => void query.refetch()} variant="secondary">
            Retry
          </Button>
        </Card>
      ) : null}
      {query.data && defaultValues ? (
        <Card className="max-w-3xl">
          <QuizForm defaultValues={defaultValues} mode="edit" onSubmit={submit} serverError={serverError} />
        </Card>
      ) : null}
    </section>
  );
}
