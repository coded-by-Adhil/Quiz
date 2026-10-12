import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/useToast";
import { normalizeError } from "@/lib/normalizeError";
import { useCreateQuestionMutation } from "@/features/questions/hooks/useQuestionQueries";
import { QuestionForm } from "@/features/questions/components/QuestionForm";
import { toQuestionPayload, type QuestionFormValues } from "@/features/questions/schemas";
import type { ApiError } from "@/types/api";
import { useState } from "react";

export function QuestionCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mutation = useCreateQuestionMutation();
  const [serverError, setServerError] = useState<ApiError>();

  const submit = async (values: QuestionFormValues) => {
    setServerError(undefined);

    try {
      await mutation.mutateAsync(toQuestionPayload(values));
      showToast({ message: "Question created.", variant: "success" });
      navigate("/admin/questions");
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
            to="/admin/questions"
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
            Back to questions
          </Link>
        }
        description="Add a reusable question with its answer options and correct-answer rule."
        eyebrow="Question bank"
        title="New question"
      />
      <Card className="max-w-4xl">
        <QuestionForm mode="create" onSubmit={submit} serverError={serverError} />
      </Card>
    </section>
  );
}
