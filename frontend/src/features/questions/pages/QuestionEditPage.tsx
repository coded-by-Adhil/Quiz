import { useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/useToast";
import { normalizeError } from "@/lib/normalizeError";
import { QuestionForm } from "@/features/questions/components/QuestionForm";
import {
  useQuestionQuery,
  useUpdateQuestionMutation,
} from "@/features/questions/hooks/useQuestionQueries";
import { toQuestionPayload, type QuestionFormValues } from "@/features/questions/schemas";
import type { ApiError } from "@/types/api";

function BackLink() {
  return (
    <Link
      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-small font-semibold text-text transition-colors duration-fast ease-standard hover:border-primary hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-focus-ring"
      to="/admin/questions"
    >
      <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
      Back to questions
    </Link>
  );
}

function QuestionNotFound() {
  return (
    <EmptyState
      action={<BackLink />}
      description="This question does not exist or does not belong to your account."
      title="Question not found"
    />
  );
}

function EditSkeleton() {
  return (
    <Card className="grid max-w-4xl gap-5" role="status" aria-label="Loading question">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-32" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-36" />
    </Card>
  );
}

export function QuestionEditPage() {
  const { id } = useParams<{ id: string }>();
  const questionId = id && /^\d+$/.test(id) ? Number(id) : null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const query = useQuestionQuery(questionId);
  const mutation = useUpdateQuestionMutation();
  const [serverError, setServerError] = useState<ApiError>();
  const defaultValues = useMemo<QuestionFormValues | undefined>(() => {
    if (!query.data) {
      return undefined;
    }

    return {
      marks: query.data.marks,
      options: query.data.options.map((option) => ({
        is_correct: option.is_correct,
        option_text: option.option_text,
      })),
      question_text: query.data.question_text,
      type: query.data.type,
    };
  }, [query.data]);

  const submit = async (values: QuestionFormValues) => {
    if (questionId === null) {
      return;
    }

    setServerError(undefined);

    try {
      await mutation.mutateAsync({
        id: questionId,
        payload: toQuestionPayload(values),
      });
      showToast({ message: "Question updated.", variant: "success" });
      navigate("/admin/questions");
    } catch (error: unknown) {
      setServerError(normalizeError(error));
    }
  };

  const normalizedError = query.error ? normalizeError(query.error) : undefined;
  const notFound = questionId === null || normalizedError?.status === 403 || normalizedError?.status === 404;

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={<BackLink />}
        description="Update the question text, answer type, marks, or options."
        eyebrow="Question bank"
        title="Edit question"
      />

      {query.isLoading ? <EditSkeleton /> : null}
      {notFound && !query.isLoading ? <QuestionNotFound /> : null}
      {query.isError && !notFound ? (
        <Card className="grid max-w-2xl gap-4">
          <div>
            <h2 className="text-heading font-semibold text-text">Question could not load</h2>
            <p className="mt-2 text-small text-danger">
              {normalizedError?.message ?? "The question could not be loaded."}
            </p>
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
      {query.data && defaultValues ? (
        <Card className="max-w-4xl">
          <QuestionForm
            defaultValues={defaultValues}
            mode="edit"
            onSubmit={submit}
            serverError={serverError}
          />
        </Card>
      ) : null}
    </section>
  );
}
