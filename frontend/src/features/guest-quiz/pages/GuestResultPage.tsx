import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, CircleMinus, RotateCcw, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { normalizeError } from "@/lib/normalizeError";
import {
  useGuestQuizQuery,
  useGuestResultQuery,
  useStartGuestQuizMutation,
} from "@/features/guest-quiz/hooks/useGuestQuizQueries";
import {
  clearStoredGuestAttempt,
  createGuestAttemptStorage,
  setStoredGuestAttempt,
} from "@/features/guest-quiz/storage";
import { ScoreSummary } from "@/features/guest-quiz/components/ScoreSummary";
import { GuestStateArtwork } from "@/features/guest-quiz/components/GuestArtwork";
import { GuestReveal } from "@/features/guest-quiz/components/GuestMotion";
import type { GuestBreakdownItem, GuestOption } from "@/features/guest-quiz/types";

function tierMessage(percentage: number): string {
  if (percentage >= 80) {
    return "Congratulations";
  }

  if (percentage >= 50) {
    return "Good effort";
  }

  return "Keep practising";
}

function percentageFor(score: number, totalMarks: number): number {
  return totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
}

function errorText(error: unknown): string {
  const apiError = normalizeError(error);

  if (apiError.status === 404) {
    return "This quiz result could not be found.";
  }

  if (apiError.status === 403) {
    return apiError.message || "This quiz is no longer available.";
  }

  return apiError.status === null
    ? "The result could not be reached. Check your connection and try again."
    : apiError.message;
}

function OptionList({
  emptyLabel,
  options,
}: {
  emptyLabel: string;
  options: GuestOption[];
}) {
  if (options.length === 0) {
    return <p className="flex items-center gap-2 text-small text-text-muted"><CircleMinus aria-hidden="true" size={17} />{emptyLabel}</p>;
  }

  return (
    <ul className="grid gap-1 text-small text-text">
      {options.map((option) => (
        <li key={option.id}>{option.option_text}</li>
      ))}
    </ul>
  );
}

function ReviewItem({ item }: { item: GuestBreakdownItem }) {
  return (
    <article className="grid gap-4 border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-body font-semibold text-text">{item.question_text}</h3>
        <span className="shrink-0 font-mono text-small text-text-muted">
          {item.awarded_marks} / {item.marks}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <p className="text-small font-semibold text-text">Your answer</p>
          <OptionList emptyLabel="No answer" options={item.selected_options} />
        </div>
        <div className="grid gap-1">
          <p className="text-small font-semibold text-text">Correct answer</p>
          <OptionList emptyLabel="No answer" options={item.correct_options} />
        </div>
      </div>
      <p className={item.is_correct ? "flex items-center gap-2 text-small font-semibold text-success" : "flex items-center gap-2 text-small font-semibold text-danger"}>
        {item.is_correct ? (
          <CheckCircle2 aria-hidden="true" size={17} strokeWidth={1.8} />
        ) : (
          <XCircle aria-hidden="true" size={17} strokeWidth={1.8} />
        )}
        {item.is_correct ? "Correct" : "Incorrect"}
      </p>
    </article>
  );
}

export function GuestResultPage() {
  const { attemptId = "", token = "" } = useParams<{
    attemptId: string;
    token: string;
  }>();
  const navigate = useNavigate();
  const resultQuery = useGuestResultQuery(token, attemptId);
  const metaQuery = useGuestQuizQuery(token);
  const retryMutation = useStartGuestQuizMutation();
  const [showReview, setShowReview] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string>();

  useEffect(() => {
    document.title = metaQuery.data?.title
      ? metaQuery.data.title + " · Results"
      : "Quiz results · Quiz Platform";

    return () => {
      document.title = "Quiz Platform";
    };
  }, [metaQuery.data?.title]);

  if (resultQuery.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status">
        <div className="flex items-center gap-3 text-small text-text-muted">
          <Spinner />
          <span>Loading result...</span>
        </div>
      </div>
    );
  }

  if (resultQuery.isError) {
    const apiError = normalizeError(resultQuery.error);

    return (
      <section className="guest-state grid min-h-[60vh] content-center gap-5">
        <GuestStateArtwork kind={apiError.status === 404 ? "not-found" : apiError.status === 403 ? "unavailable" : "network"} />
        <Badge variant={apiError.status === 404 ? "warning" : "danger"}>
          {apiError.status === 404 ? "Result not found" : "Could not load"}
        </Badge>
        <div className="grid gap-3">
          <h1 className="text-title font-semibold text-text">
            {apiError.status === 404 ? "This result is not available" : "We could not load your result"}
          </h1>
          <p className="max-w-xl text-body text-text-muted">{errorText(resultQuery.error)}</p>
        </div>
        {apiError.status === 404 ? (
          <Link
            className="guest-link inline-flex w-fit items-center"
            to={"/q/" + token}
          >
            Start again
          </Link>
        ) : (
          <Button
            icon={<RotateCcw aria-hidden="true" size={17} strokeWidth={1.8} />}
            onClick={() => void resultQuery.refetch()}
            variant="secondary"
          >
            Retry
          </Button>
        )}
      </section>
    );
  }

  if (!resultQuery.data) {
    return null;
  }

  const result = resultQuery.data;
  const percentage = percentageFor(result.score, result.total_marks);

  const tryAgain = async () => {
    setRetryMessage(undefined);
    clearStoredGuestAttempt();

    try {
      const response = await retryMutation.mutateAsync({
        participantName: result.participant_name,
        token,
      });
      const snapshot = createGuestAttemptStorage(
        token,
        response,
        metaQuery.data?.title ?? "Quiz",
      );
      setStoredGuestAttempt(snapshot);
      navigate("/q/" + token + "/attempt/" + response.attempt_id);
    } catch (error: unknown) {
      const apiError = normalizeError(error);
      setRetryMessage(
        apiError.status === 429
          ? "Too many attempts, try again shortly."
          : apiError.status === null
            ? "The quiz could not be reached. Try again."
            : apiError.message,
      );
    }
  };

  return (
    <section className="guest-result grid gap-6 py-8 sm:py-14">
      <div className="grid gap-2">
        <p className="text-small font-semibold uppercase tracking-[0.1em] text-primary">Complete</p>
        <h1 className="text-title font-semibold text-text">Your result</h1>
        <p className="text-small text-text-muted">Thanks for taking the quiz, {result.participant_name}.</p>
      </div>

      <ScoreSummary
        message={tierMessage(percentage)}
        percentage={percentage}
        score={result.score}
        totalMarks={result.total_marks}
      />

      {retryMessage ? (
        <div className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} strokeWidth={1.8} />
          <span>{retryMessage}</span>
        </div>
      ) : null}

      <div className="guest-result-actions flex flex-wrap items-center gap-4">
        <Button
          aria-expanded={showReview}
          icon={showReview ? <ChevronUp aria-hidden="true" size={17} strokeWidth={1.8} /> : <ChevronDown aria-hidden="true" size={17} strokeWidth={1.8} />}
          onClick={() => setShowReview((current) => !current)}
          variant="secondary"
        >
          {showReview ? "Hide answers" : "Review answers"}
        </Button>
        <Button
          icon={<RotateCcw aria-hidden="true" size={17} strokeWidth={1.8} />}
          loading={retryMutation.isPending}
          onClick={() => void tryAgain()}
          variant="primary"
        >
          Try again
        </Button>
      </div>

      <GuestReveal open={showReview}>
        <Card className="guest-review grid gap-5">
          <div className="grid gap-1">
            <h2 className="text-heading font-semibold text-text">Answer review</h2>
            <p className="text-small text-text-muted">
              See what you selected and the correct answer for each question.
            </p>
          </div>
          <div>
            {result.breakdown.map((item) => (
              <ReviewItem item={item} key={item.question_id} />
            ))}
          </div>
        </Card>
      </GuestReveal>
    </section>
  );
}
