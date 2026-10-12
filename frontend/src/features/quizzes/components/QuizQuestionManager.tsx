import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  ListChecks,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { Link, useBlocker } from "react-router-dom";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Dialog } from "@/components/Dialog";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Spinner } from "@/components/Spinner";
import { Tooltip } from "@/components/Tooltip";
import { useToast } from "@/components/useToast";
import { QuestionViewDialog } from "@/features/questions/components/QuestionViewDialog";
import { useSetQuizQuestionsMutation } from "@/features/quizzes/hooks/useQuizQueries";
import type { Question } from "@/features/questions/types";
import type { Quiz } from "@/features/quizzes/types";
import { normalizeError } from "@/lib/normalizeError";

interface QuizQuestionManagerProps {
  onReload: () => Promise<void>;
  questions: Question[];
  quiz: Quiz;
  serverVersion: number;
}

function orderedQuestions(quiz: Quiz): Question[] {
  return [...quiz.questions]
    .sort((left, right) => left.pivot.order - right.pivot.order)
    .map((question) => question);
}

function questionIds(questions: Question[]): number[] {
  return questions.map((question) => question.id);
}

function questionTypeLabel(question: Question): string {
  return question.type === "single" ? "Single" : "Multiple";
}

export function QuizQuestionManager({
  onReload,
  questions,
  quiz,
  serverVersion,
}: QuizQuestionManagerProps) {
  const { showToast } = useToast();
  const mutation = useSetQuizQuestionsMutation();
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>(
    orderedQuestions(quiz),
  );
  const [savedIds, setSavedIds] = useState<number[]>(questionIds(orderedQuestions(quiz)));
  const [bankSearch, setBankSearch] = useState("");
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [saveError, setSaveError] = useState<string>();

  useEffect(() => {
    const nextQuestions = orderedQuestions(quiz);
    // Server reloads are the source of truth after an explicit refresh or save.
    // oxlint-disable-next-line react/set-state-in-effect
    setSelectedQuestions(nextQuestions);
    // oxlint-disable-next-line react/set-state-in-effect
    setSavedIds(questionIds(nextQuestions));
    // oxlint-disable-next-line react/set-state-in-effect
    setSaveError(undefined);
  }, [quiz, serverVersion]);

  const selectedIds = useMemo(
    () => questionIds(selectedQuestions),
    [selectedQuestions],
  );
  const isDirty = JSON.stringify(selectedIds) !== JSON.stringify(savedIds);
  const blocker = useBlocker(isDirty && !mutation.isPending);
  const addedIds = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredQuestions = useMemo(() => {
    const normalizedSearch = bankSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return questions;
    }

    return questions.filter((question) =>
      question.question_text.toLowerCase().includes(normalizedSearch),
    );
  }, [bankSearch, questions]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const addQuestion = (question: Question) => {
    if (!addedIds.has(question.id)) {
      setSelectedQuestions((current) => [...current, question]);
    }
  };

  const removeQuestion = (questionId: number) => {
    setSelectedQuestions((current) => current.filter((question) => question.id !== questionId));
  };

  const moveQuestion = (index: number, offset: -1 | 1) => {
    const targetIndex = index + offset;

    if (targetIndex < 0 || targetIndex >= selectedQuestions.length) {
      return;
    }

    setSelectedQuestions((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (moved) {
        next.splice(targetIndex, 0, moved);
      }
      return next;
    });
  };

  const saveQuestions = async () => {
    setSaveError(undefined);

    try {
      const updatedQuiz = await mutation.mutateAsync({
        id: quiz.id,
        questionIds: selectedIds,
      });
      const nextQuestions = orderedQuestions(updatedQuiz);
      setSelectedQuestions(nextQuestions);
      setSavedIds(questionIds(nextQuestions));
      showToast({ message: "Questions saved.", variant: "success" });
    } catch (error: unknown) {
      const normalized = normalizeError(error);
      setSaveError(normalized.message);
    }
  };

  const reloadFromServer = async () => {
    setSaveError(undefined);
    await onReload();
  };

  const correctSummary = selectedQuestions.reduce(
    (total, question) => total + question.marks,
    0,
  );

  return (
    <section className="grid gap-6" aria-labelledby="question-manager-title">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-primary">
            Question set
          </p>
          <h2 className="mt-1 text-heading font-semibold text-text" id="question-manager-title">
            Build the quiz order
          </h2>
          <p className="mt-1 text-small text-text-muted">
            Add questions from your bank, then arrange the order participants will see.
          </p>
        </div>
        <div aria-live="polite" className="flex items-center gap-2 text-small text-text-muted">
          {mutation.isPending ? <Spinner label="Saving questions" size="sm" /> : null}
          {isDirty ? "Unsaved changes" : "All changes saved"}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-heading font-semibold text-text">Question bank</h3>
              <p className="mt-1 text-small text-text-muted">Only your active questions can be added.</p>
            </div>
            <div className="w-full sm:max-w-xs">
              <SearchInput
                aria-label="Search question bank"
                label="Search"
                onChange={(event) => setBankSearch(event.target.value)}
                onClear={() => setBankSearch("")}
                placeholder="Search question text"
                value={bankSearch}
              />
            </div>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              action={
                <Link
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-small font-semibold text-primary-contrast transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-fast ease-standard hover:bg-primary/90 active:translate-y-px active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  to="/admin/questions/new"
                >
                  Create a question
                </Link>
              }
              icon={<ListChecks aria-hidden="true" size={26} strokeWidth={1.7} />}
              description="Create questions in your question bank before building this quiz."
              title="Your question bank is empty"
            />
          ) : filteredQuestions.length === 0 ? (
            <EmptyState
              action={
                <Button onClick={() => setBankSearch("")} variant="secondary">
                  Clear search
                </Button>
              }
              description="Try a different phrase to find a question in your bank."
              title="No matching questions"
            />
          ) : (
            <div className="grid gap-3">
              {filteredQuestions.map((question) => {
                const isAdded = addedIds.has(question.id);

                return (
                  <Card className="grid gap-3" key={question.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Badge variant={question.type === "single" ? "info" : "neutral"}>
                          {questionTypeLabel(question)}
                        </Badge>
                        <span className="text-small text-text-muted">{question.marks} marks</span>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Tooltip label="Preview question">
                          <Button
                            aria-label={`Preview question: ${question.question_text}`}
                            icon={<Eye aria-hidden="true" size={17} strokeWidth={1.8} />}
                            onClick={() => setPreviewQuestion(question)}
                            title="Preview question"
                            variant="ghost"
                          />
                        </Tooltip>
                        <Button
                          aria-label={isAdded ? "Question already added" : "Add question"}
                          disabled={isAdded}
                          icon={
                            isAdded ? (
                              <Check aria-hidden="true" size={17} strokeWidth={1.8} />
                            ) : (
                              <Plus aria-hidden="true" size={17} strokeWidth={1.8} />
                            )
                          }
                          onClick={() => addQuestion(question)}
                          title={isAdded ? "Already added" : "Add question"}
                          variant={isAdded ? "secondary" : "primary"}
                        >
                          {isAdded ? "Added" : "Add"}
                        </Button>
                      </div>
                    </div>
                    <p className="break-words text-small font-semibold text-text">{question.question_text}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid content-start gap-4">
          <div>
            <h3 className="text-heading font-semibold text-text">Selected questions</h3>
            <p className="mt-1 text-small text-text-muted">The order here is the order shown to participants.</p>
          </div>
          <Card className="grid gap-4 bg-surface-raised/40">
            {selectedQuestions.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-small text-text-muted">
                No questions selected. You can save an empty quiz and add questions later.
              </p>
            ) : (
              <ol className="grid gap-2" aria-label="Selected quiz questions">
                {selectedQuestions.map((question, index) => (
                  <li className="grid gap-3 rounded-md border border-border bg-surface px-3 py-3" key={question.id}>
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-label font-semibold text-primary">{index + 1}</span>
                      <p className="min-w-0 flex-1 break-words text-small font-semibold text-text">
                        {question.question_text}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pl-7">
                      <div className="flex items-center gap-2 text-label text-text-muted">
                        <span>{questionTypeLabel(question)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{question.marks} marks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip label="Move up">
                          <Button
                            aria-label={`Move question ${index + 1} up`}
                            disabled={index === 0}
                            icon={<ArrowUp aria-hidden="true" size={16} strokeWidth={1.8} />}
                            onClick={() => moveQuestion(index, -1)}
                            title="Move up"
                            variant="ghost"
                          />
                        </Tooltip>
                        <Tooltip label="Move down">
                          <Button
                            aria-label={`Move question ${index + 1} down`}
                            disabled={index === selectedQuestions.length - 1}
                            icon={<ArrowDown aria-hidden="true" size={16} strokeWidth={1.8} />}
                            onClick={() => moveQuestion(index, 1)}
                            title="Move down"
                            variant="ghost"
                          />
                        </Tooltip>
                        <Tooltip label="Remove question">
                          <Button
                            aria-label={`Remove question ${index + 1}`}
                            icon={<Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />}
                            onClick={() => removeQuestion(question.id)}
                            title="Remove question"
                            variant="danger"
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <div className="grid gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap gap-4 text-small text-text-muted">
                <span>{selectedQuestions.length} questions</span>
                <span>{correctSummary} total marks</span>
              </div>
              {saveError ? (
                <div className="grid gap-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
                  <p>{saveError}</p>
                  <div>
                    <Button
                      icon={<RefreshCw aria-hidden="true" size={16} strokeWidth={1.8} />}
                      onClick={() => void reloadFromServer()}
                      variant="secondary"
                    >
                      Reload from server
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  disabled={!isDirty || mutation.isPending}
                  onClick={() => {
                    const next = orderedQuestions(quiz);
                    setSelectedQuestions(next);
                    setSavedIds(questionIds(next));
                    setSaveError(undefined);
                  }}
                  variant="secondary"
                >
                  Discard
                </Button>
                <Button
                  disabled={!isDirty}
                  icon={<Save aria-hidden="true" size={17} strokeWidth={1.8} />}
                  loading={mutation.isPending}
                  onClick={() => void saveQuestions()}
                >
                  Save questions
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <QuestionViewDialog onClose={() => setPreviewQuestion(null)} question={previewQuestion} />
      <Dialog
        description="You have changed the question order or selection."
        onClose={() => blocker.reset?.()}
        open={blocker.state === "blocked"}
        title="Discard unsaved changes?"
      >
        <div className="grid gap-5">
          <p className="text-small text-text-muted">Leaving now will discard those question changes.</p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={() => blocker.reset?.()} variant="secondary">
              Keep editing
            </Button>
            <Button onClick={() => blocker.proceed?.()} variant="danger">
              Discard changes
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
