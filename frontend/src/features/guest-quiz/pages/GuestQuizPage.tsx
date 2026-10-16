import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, RotateCcw, Send } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { Dialog } from "@/components/Dialog";
import { RadioGroup } from "@/components/RadioGroup";
import { normalizeError } from "@/lib/normalizeError";
import {
  useStartGuestQuizMutation,
  useSubmitGuestQuizMutation,
} from "@/features/guest-quiz/hooks/useGuestQuizQueries";
import { useGuestTimer } from "@/features/guest-quiz/hooks/useGuestTimer";
import { useGuestAttempt } from "@/features/guest-quiz/hooks/useGuestAttempt";
import {
  createGuestAttemptStorage,
  setStoredGuestAttempt,
  clearStoredGuestAttempt,
} from "@/features/guest-quiz/storage";
import { ProgressBar } from "@/features/guest-quiz/components/ProgressBar";
import { Timer } from "@/features/guest-quiz/components/Timer";
import { GuestStateArtwork } from "@/features/guest-quiz/components/GuestArtwork";
import { QuestionTransition } from "@/features/guest-quiz/components/GuestMotion";

function errorText(error: unknown): string {
  const apiError = normalizeError(error);

  return apiError.status === null
    ? "The answer could not reach the server. Your answers are still saved. Try again."
    : apiError.message;
}

export function GuestQuizPage() {
  const { attemptId = "", token = "" } = useParams<{
    attemptId: string;
    token: string;
  }>();
  const navigate = useNavigate();
  const submitMutation = useSubmitGuestQuizMutation();
  const restartMutation = useStartGuestQuizMutation();
  const [attempt, dispatchAttempt] = useGuestAttempt(token, attemptId);
  const [submitError, setSubmitError] = useState<string>();
  const [timeLimitError, setTimeLimitError] = useState(false);
  const [restartError, setRestartError] = useState<string>();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [timerSubmitting, setTimerSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submissionInFlightRef = useRef(false);
  const currentIndexForFocus = attempt?.currentIndex;

  useEffect(() => {
    if (attempt) {
      setStoredGuestAttempt(attempt);
    }
  }, [attempt]);

  useEffect(() => {
    document.title = attempt
      ? attempt.quizTitle + " · Quiz Platform"
      : "Quiz Platform";
    return () => {
      document.title = "Quiz Platform";
    };
  }, [attempt]);

  useEffect(() => {
    if (!attempt) {
      return;
    }

    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [attempt]);

  const submitAttempt = useCallback(async () => {
    if (!attempt || submissionInFlightRef.current) {
      return;
    }

    submissionInFlightRef.current = true;
    setSubmitError(undefined);
    setTimeLimitError(false);
    setTimerSubmitting(true);
    submitMutation.reset();

    try {
      const payload = {
        answers: attempt.questions.map((question) => ({
          option_ids: attempt.answers[String(question.id)] ?? [],
          question_id: question.id,
        })),
      };

      await submitMutation.mutateAsync({
        attemptId: attempt.attemptId,
        payload,
        token: attempt.token,
      });
      clearStoredGuestAttempt();
      navigate("/q/" + attempt.token + "/attempt/" + attempt.attemptId + "/result");
    } catch (error: unknown) {
      const apiError = normalizeError(error);
      const attemptMessage = apiError.fieldErrors?.attempt?.[0] ?? apiError.message;

      if (apiError.status === 422 && attemptMessage === "This attempt has already been submitted.") {
        clearStoredGuestAttempt();
        navigate("/q/" + attempt.token + "/attempt/" + attempt.attemptId + "/result");
        return;
      }

      if (
        apiError.status === 422 &&
        attemptMessage === "The time limit has been exceeded."
      ) {
        setTimeLimitError(true);
        setSubmitError(
          "Time ran out before your answers reached the server. This attempt was not scored.",
        );
        return;
      }

      setSubmitError(errorText(error));
    } finally {
      submissionInFlightRef.current = false;
      setTimerSubmitting(false);
    }
  }, [attempt, navigate, submitMutation]);

  const handleTimerExpire = useCallback(() => {
    void submitAttempt();
  }, [submitAttempt]);

  const timer = useGuestTimer(
    attempt?.startedAtClient ?? 0,
    attempt?.durationMinutes ?? null,
    handleTimerExpire,
  );

  useEffect(() => {
    if (currentIndexForFocus === undefined) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [currentIndexForFocus]);

  if (!attempt) {
    return (
      <section className="guest-state grid min-h-[60vh] content-center gap-5">
        <GuestStateArtwork kind="session" />
        <h1 className="text-title font-semibold text-text">Your session was lost</h1>
        <p className="max-w-xl text-body text-text-muted">
          This attempt is no longer available in this browser. Start again to receive a new attempt.
        </p>
        <Link
          className="guest-link inline-flex w-fit items-center gap-2"
          to={"/q/" + token}
        >
          Start again
        </Link>
      </section>
    );
  }

  const currentIndex = Math.min(
    Math.max(attempt.currentIndex, 0),
    Math.max(attempt.questions.length - 1, 0),
  );
  const question = attempt.questions[currentIndex];
  const selectedOptionIds = attempt.answers[String(question.id)] ?? [];
  const isLastQuestion = currentIndex === attempt.questions.length - 1;
  const isSubmitting = submitMutation.isPending || timerSubmitting;

  const updateAnswers = (optionIds: number[]) => {
    dispatchAttempt({
      optionIds,
      questionId: question.id,
      type: "set_answers",
    });
  };

  const goPrevious = () => {
    dispatchAttempt({
      index: Math.max(attempt.currentIndex - 1, 0),
      type: "set_index",
    });
  };

  const goNext = () => {
    if (selectedOptionIds.length === 0) {
      return;
    }

    dispatchAttempt({
      index: Math.min(attempt.currentIndex + 1, attempt.questions.length - 1),
      type: "set_index",
    });
  };

  const confirmRestart = async () => {
    setRestartError(undefined);
    clearStoredGuestAttempt();

    try {
      const response = await restartMutation.mutateAsync({
        participantName: attempt.participantName,
        token: attempt.token,
      });
      const nextAttempt = createGuestAttemptStorage(
        attempt.token,
        response,
        attempt.quizTitle,
      );
      setStoredGuestAttempt(nextAttempt);
      dispatchAttempt({ attempt: nextAttempt, type: "replace" });
      setRestartDialogOpen(false);
      navigate("/q/" + attempt.token + "/attempt/" + response.attempt_id);
    } catch (error: unknown) {
      const apiError = normalizeError(error);
      setRestartError(
        apiError.status === 429
          ? "Too many attempts, try again shortly."
          : apiError.status === null
            ? "The quiz could not be reached. Try again."
            : apiError.message,
      );
    }
  };

  return (
    <section className="guest-quiz grid gap-5 py-5 pb-28 sm:gap-7 sm:py-10" style={{ "--guest-duration-seconds": (attempt.durationMinutes ?? 20) * 60 } as CSSProperties}>
      <header className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-small font-semibold text-text-muted">
            Hi, {attempt.participantName}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {timer.remainingSeconds !== null ? (
              <Timer
                isCritical={timer.isCritical}
                remainingSeconds={timer.remainingSeconds}
              />
            ) : null}
            <Button
              aria-label="Restart quiz"
              icon={<RotateCcw aria-hidden="true" size={17} strokeWidth={1.8} />}
              onClick={() => {
                setRestartError(undefined);
                setRestartDialogOpen(true);
              }}
              title="Restart quiz"
              variant="ghost"
            >
              Restart
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-small font-semibold text-primary">
            Question {currentIndex + 1} of {attempt.questions.length}
          </p>
          <ProgressBar current={currentIndex + 1} total={attempt.questions.length} />
          <p aria-live="polite" className="sr-only">
            Question {currentIndex + 1} of {attempt.questions.length}
          </p>
          <p aria-live="polite" className="sr-only" id="guest-timer-announcement">
            {timer.announcement}
          </p>
        </div>
      </header>

      {submitError ? (
        <div className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} strokeWidth={1.8} />
          <div className="grid gap-3">
            {timeLimitError ? <GuestStateArtwork kind="timeout" /> : null}
            <span>{submitError}</span>
            <Button
              className="w-fit"
              icon={<RotateCcw aria-hidden="true" size={16} strokeWidth={1.8} />}
              loading={isSubmitting}
              onClick={() => {
                if (timeLimitError) {
                  clearStoredGuestAttempt();
                  navigate("/q/" + token);
                  return;
                }
                void submitAttempt();
              }}
              variant="secondary"
            >
              {timeLimitError ? "Try again" : "Retry"}
            </Button>
          </div>
        </div>
      ) : null}

      <QuestionTransition index={currentIndex}>
      <Card className="guest-question grid gap-6">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3 text-small text-text-muted">
            <span>{question.marks} {question.marks === 1 ? "mark" : "marks"}</span>
            <span className="font-mono text-label uppercase tracking-[0.1em]">{question.type}</span>
          </div>
          <h1
            className="text-heading font-semibold text-text sm:text-title"
            ref={headingRef}
            tabIndex={-1}
          >
            {question.question_text}
          </h1>
        </div>

        {question.type === "multiple" ? (
          <div className="grid gap-3">
            <p className="text-small text-text-muted">
              Select all that apply. Every correct option is needed to earn the mark.
            </p>
            <CheckboxGroup
              legend="Select all that apply"
              onToggle={(id, checked) => {
                const next = checked
                  ? [...selectedOptionIds, id]
                  : selectedOptionIds.filter((selectedId) => selectedId !== id);
                updateAnswers(Array.from(new Set(next)));
              }}
              optionSize="comfortable"
              options={question.options.map((option) => ({
                checked: selectedOptionIds.includes(option.id),
                id: option.id,
                label: option.option_text,
              }))}
            />
          </div>
        ) : (
          <RadioGroup
            legend="Select one answer"
            onSelect={(id) => updateAnswers([id])}
            options={question.options.map((option) => ({
              id: option.id,
              label: option.option_text,
            }))}
            selectedId={selectedOptionIds[0] ?? null}
          />
        )}
      </Card>
      </QuestionTransition>

      <div className="guest-action-bar sticky bottom-0 z-10 border-t border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Button
            icon={<ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />}
            onClick={goPrevious}
            variant="secondary"
          >
            Prev
          </Button>
          {isLastQuestion ? (
            <Button
              disabled={selectedOptionIds.length === 0}
              icon={<Send aria-hidden="true" size={17} strokeWidth={1.8} />}
              loading={isSubmitting}
              onClick={() => setSubmitDialogOpen(true)}
            >
              Submit
            </Button>
          ) : (
            <Button
              disabled={selectedOptionIds.length === 0}
              icon={<ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />}
              onClick={goNext}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      <Dialog
        description="This can't be undone."
        onClose={() => {
          if (!isSubmitting) {
            setSubmitDialogOpen(false);
          }
        }}
        open={submitDialogOpen}
        title="Submit your answers?"
      >
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            disabled={isSubmitting}
            onClick={() => setSubmitDialogOpen(false)}
            variant="secondary"
          >
            Keep working
          </Button>
          <Button
            icon={<Send aria-hidden="true" size={16} strokeWidth={1.8} />}
            loading={isSubmitting}
            onClick={() => {
              setSubmitDialogOpen(false);
              void submitAttempt();
            }}
          >
            Submit answers
          </Button>
        </div>
      </Dialog>

      <Dialog
        description="Your answers will be discarded."
        onClose={() => {
          if (!restartMutation.isPending) {
            setRestartDialogOpen(false);
          }
        }}
        open={restartDialogOpen}
        title="Leave this attempt?"
      >
        <div className="grid gap-4">
          {restartError ? (
            <p className="text-small text-danger" role="alert">
              {restartError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              disabled={restartMutation.isPending}
              onClick={() => setRestartDialogOpen(false)}
              variant="secondary"
            >
              Keep working
            </Button>
            <Button
              icon={<RotateCcw aria-hidden="true" size={16} strokeWidth={1.8} />}
              loading={restartMutation.isPending}
              onClick={() => void confirmRestart()}
            >
              Start new attempt
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
