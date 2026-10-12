import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/useToast";
import { QuizForm } from "@/features/quizzes/components/QuizForm";
import { useCreateQuizMutation } from "@/features/quizzes/hooks/useQuizQueries";
import { toQuizPayload, type QuizFormValues } from "@/features/quizzes/schemas";
import { normalizeError } from "@/lib/normalizeError";
import type { ApiError } from "@/types/api";

export function QuizCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mutation = useCreateQuizMutation();
  const [serverError, setServerError] = useState<ApiError>();

  const submit = async (values: QuizFormValues) => {
    setServerError(undefined);
    try {
      const quiz = await mutation.mutateAsync(toQuizPayload(values));
      showToast({ message: "Quiz created. Add questions below.", variant: "success" });
      navigate(`/admin/quizzes/${quiz.id}`);
    } catch (error: unknown) {
      setServerError(normalizeError(error));
    }
  };

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-small font-semibold text-text transition-colors duration-fast ease-standard hover:border-primary hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-focus-ring"
            to="/admin/quizzes"
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
            Back to quizzes
          </Link>
        }
        description="Give the quiz a clear purpose before selecting its question set."
        eyebrow="Quiz workspace"
        title="New quiz"
      />
      <Card className="max-w-3xl">
        <QuizForm mode="create" onSubmit={submit} serverError={serverError} />
      </Card>
    </section>
  );
}
