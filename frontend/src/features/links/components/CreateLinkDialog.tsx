import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, RefreshCw } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { Dialog } from "@/components/Dialog";
import { EmptyState } from "@/components/EmptyState";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/useToast";
import { useQuizQuery } from "@/features/quizzes/hooks/useQuizQueries";
import { useAllQuizzes } from "@/features/quizzes/hooks/useAllQuizzes";
import { useCreateLinkMutation } from "@/features/links/hooks/useLinkQueries";
import { createLinkSchema, type CreateLinkFormValues } from "@/features/links/schemas";
import { normalizeError } from "@/lib/normalizeError";
import type { ApiError } from "@/types/api";

interface CreateLinkDialogProps {
  defaultQuizId: number | null;
  onClose: () => void;
  onCreated: (quizId: number) => void;
  open: boolean;
}

function isOwnershipMessage(message: string | undefined): boolean {
  return message ===
    "Every selected question must belong to the authenticated admin and already be attached to this quiz.";
}

export function CreateLinkDialog({
  defaultQuizId,
  onClose,
  onCreated,
  open,
}: CreateLinkDialogProps) {
  const { data: allQuizzes } = useAllQuizzes();
  const mutation = useCreateLinkMutation();
  const resetMutation = mutation.reset;
  const wasOpen = useRef(false);
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<ApiError>();
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<CreateLinkFormValues>({
    defaultValues: {
      question_ids: [],
      quiz_id: defaultQuizId ?? 0,
    },
    resolver: zodResolver(createLinkSchema),
  });
  // RHF's watch subscription is used to keep the selection count and question list in sync.
  // oxlint-disable-next-line react/incompatible-library
  const selectedQuizId = watch("quiz_id");
  // oxlint-disable-next-line react/incompatible-library
  const selectedQuestionIds = watch("question_ids") ?? [];
  const quizQuery = useQuizQuery(selectedQuizId > 0 ? selectedQuizId : null);
  const selectedQuiz = quizQuery.data;

  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }

    if (wasOpen.current) {
      return;
    }

    wasOpen.current = true;
    reset({
      question_ids: [],
      quiz_id: defaultQuizId ?? 0,
    });
    setServerError(undefined);
    resetMutation();
  }, [defaultQuizId, open, reset, resetMutation]);

  const selected = new Set(selectedQuestionIds);
  const orderedSelectedIds = selectedQuiz
    ? selectedQuiz.questions
        .filter((question) => selected.has(question.id))
        .map((question) => question.id)
    : selectedQuestionIds;

  const selectRegistration = register("quiz_id", { valueAsNumber: true });
  register("question_ids");

  const handleQuizChange = (value: number) => {
    clearErrors();
    setServerError(undefined);
    setValue("quiz_id", value, { shouldDirty: true, shouldValidate: true });
    setValue("question_ids", [], { shouldDirty: true, shouldValidate: true });
  };

  const handleQuestionToggle = (questionId: number, checked: boolean) => {
    const next = checked
      ? [...selectedQuestionIds, questionId]
      : selectedQuestionIds.filter((id) => id !== questionId);
    setValue("question_ids", next, { shouldDirty: true, shouldValidate: true });
    clearErrors("question_ids");
    setServerError(undefined);
  };

  const submit = handleSubmit(async () => {
    if (!selectedQuiz) {
      return;
    }

    setServerError(undefined);
    try {
      await mutation.mutateAsync({
        payload: { question_ids: orderedSelectedIds },
        quizId: selectedQuiz.id,
      });
      onCreated(selectedQuiz.id);
      showToast({ message: "Link created", variant: "success" });
      onClose();
    } catch (error: unknown) {
      const normalized = normalizeError(error);
      setServerError(normalized);
      if (normalized.fieldErrors?.question_ids?.[0]) {
        setError("question_ids", {
          message: normalized.fieldErrors.question_ids[0],
          type: "server",
        });
      }
    }
  });

  const questionError = serverError?.fieldErrors?.question_ids?.[0] ?? errors.question_ids?.message;
  const isAtLimit = selectedQuestionIds.length === 10;
  const isInvalidCount = selectedQuestionIds.length < 1 || selectedQuestionIds.length > 10;
  const createDisabled =
    isSubmitting ||
    mutation.isPending ||
    !selectedQuiz ||
    selectedQuiz.questions.length === 0 ||
    isInvalidCount;
  const formLevelError = serverError?.fieldErrors
    ? Object.entries(serverError.fieldErrors)
        .filter(([field]) => field !== "question_ids")
        .flatMap(([, messages]) => messages)
        .join(" ")
    : serverError?.message;

  const reloadQuestions = async () => {
    setServerError(undefined);
    setValue("question_ids", [], { shouldDirty: true, shouldValidate: true });
    await quizQuery.refetch();
  };

  return (
    <Dialog
      description="Choose between 1 and 10 questions already attached to the quiz."
      onClose={() => {
        if (!isSubmitting && !mutation.isPending) {
          onClose();
        }
      }}
      open={open}
      title="Create shareable link"
    >
      <form className="grid gap-5" noValidate onSubmit={(event) => void submit(event)}>
        <div className="max-h-[min(68vh,42rem)] overflow-y-auto pr-1">
          <div className="grid gap-5">
            {formLevelError ? (
              <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
                {formLevelError}
              </div>
            ) : null}

            <Select
              error={errors.quiz_id?.message}
              id="link-quiz"
              label="Quiz"
              {...selectRegistration}
              onChange={(event) => {
                selectRegistration.onChange(event);
                handleQuizChange(Number(event.target.value));
              }}
            >
              <option value={0}>Choose a quiz</option>
              {(allQuizzes?.quizzes ?? []).map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </Select>

            {quizQuery.isLoading ? (
              <div className="grid gap-2" role="status" aria-label="Loading quiz questions">
                {Array.from({ length: 4 }, (_, index) => <Skeleton className="h-16" key={index} />)}
              </div>
            ) : null}

            {quizQuery.isError ? (
              <Card className="grid gap-3">
                <p className="text-small text-danger">{normalizeError(quizQuery.error).message}</p>
                <Button icon={<RefreshCw aria-hidden="true" size={16} />} onClick={() => void quizQuery.refetch()} variant="secondary">
                  Retry
                </Button>
              </Card>
            ) : null}

            {selectedQuiz && !quizQuery.isError && !quizQuery.isLoading ? (
              selectedQuiz.questions.length === 0 ? (
                <EmptyState
                  action={<Link className="text-small font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring" to={`/admin/quizzes/${selectedQuiz.id}`}>Add questions first</Link>}
                  description="This quiz has no questions yet. Add questions first."
                  icon={<CircleHelp aria-hidden="true" size={24} />}
                  title="No questions available"
                />
              ) : (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p aria-live="polite" className={[
                      "text-small font-semibold",
                      isAtLimit ? "text-warning" : "text-text-muted",
                    ].join(" ")}>
                      {selectedQuestionIds.length} of 10 selected
                    </p>
                    {isAtLimit ? <span className="inline-flex items-center gap-1 text-small text-warning"><AlertTriangle aria-hidden="true" size={15} />Maximum reached</span> : null}
                  </div>
                  {questionError ? (
                    <div className="grid gap-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
                      <p>{questionError}</p>
                      {isOwnershipMessage(questionError) ? (
                        <div>
                          <Button icon={<RefreshCw aria-hidden="true" size={16} />} onClick={() => void reloadQuestions()} variant="secondary">
                            Reload questions
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <CheckboxGroup
                    legend="Questions"
                    onToggle={handleQuestionToggle}
                    options={selectedQuiz.questions.map((question) => ({
                      checked: selectedQuestionIds.includes(question.id),
                      disabled: !selectedQuestionIds.includes(question.id) && selectedQuestionIds.length >= 10,
                      id: question.id,
                      label: (
                        <div className="grid min-w-0 gap-2">
                          <span className="line-clamp-2 break-words text-small font-semibold text-text">{question.question_text}</span>
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge icon={<CheckCircle2 aria-hidden="true" size={13} />} variant={question.type === "single" ? "info" : "neutral"}>{question.type === "single" ? "Single" : "Multiple"}</Badge>
                            <span className="text-label text-text-muted">{question.marks} marks</span>
                          </span>
                        </div>
                      ),
                    }))}
                  />
                </div>
              )
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          {isInvalidCount && selectedQuiz?.questions.length ? (
            <p className="mr-auto text-small text-warning" role="status">
              Select at least one question to create a link.
            </p>
          ) : null}
          <Button disabled={isSubmitting || mutation.isPending} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={createDisabled} loading={isSubmitting || mutation.isPending} type="submit">
            Create link
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
