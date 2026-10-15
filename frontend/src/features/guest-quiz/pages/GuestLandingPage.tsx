import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Clock3, RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import { normalizeError } from "@/lib/normalizeError";
import { useGuestQuizQuery, useStartGuestQuizMutation } from "@/features/guest-quiz/hooks/useGuestQuizQueries";
import { createGuestAttemptStorage, setStoredGuestAttempt } from "@/features/guest-quiz/storage";

const participantSchema = z.object({
  participant_name: z.string().trim().min(1, "Please enter your name.").max(255, "Name must be 255 characters or fewer."),
});

type ParticipantFormValues = z.infer<typeof participantSchema>;

function durationLabel(durationMinutes: number | null): string {
  return durationMinutes === null ? "No time limit" : String(durationMinutes) + " minutes";
}

function errorMessage(error: unknown): string {
  const apiError = normalizeError(error);

  if (apiError.status === 403) {
    return apiError.message || "This quiz link is no longer available.";
  }

  if (apiError.status === 404) {
    return "This quiz could not be found.";
  }

  if (apiError.status === 429) {
    return "Too many requests. Please try again shortly.";
  }

  return apiError.status === null
    ? "The quiz could not be reached. Check your connection and try again."
    : apiError.message;
}

export function GuestLandingPage() {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const query = useGuestQuizQuery(token);
  const startMutation = useStartGuestQuizMutation();
  const [formMessage, setFormMessage] = useState<string>();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<ParticipantFormValues>({
    defaultValues: { participant_name: "" },
    resolver: zodResolver(participantSchema),
  });

  useEffect(() => {
    document.title = query.data?.title
      ? query.data.title + " · Quiz Platform"
      : "Quiz Platform";

    return () => {
      document.title = "Quiz Platform";
    };
  }, [query.data?.title]);

  const onSubmit = handleSubmit(async (values) => {
    setFormMessage(undefined);

    try {
      const response = await startMutation.mutateAsync({
        participantName: values.participant_name.trim(),
        token,
      });
      const snapshot = createGuestAttemptStorage(
        token,
        response,
        query.data?.title ?? "Quiz",
      );
      setStoredGuestAttempt(snapshot);
      navigate("/q/" + token + "/attempt/" + response.attempt_id);
    } catch (error: unknown) {
      const apiError = normalizeError(error);

      if (apiError.status === 422 && apiError.fieldErrors?.participant_name?.[0]) {
        setError("participant_name", {
          message: apiError.fieldErrors.participant_name[0],
        });
        return;
      }

      if (apiError.status === 429) {
        setFormMessage("Too many attempts, try again shortly.");
        return;
      }

      setFormMessage(
        apiError.status === null
          ? "The quiz could not be reached. Check your connection and try again."
          : apiError.message,
      );
    }
  });

  if (query.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status">
        <div className="flex items-center gap-3 text-small text-text-muted">
          <Spinner />
          <span>Loading quiz...</span>
        </div>
      </div>
    );
  }

  if (query.isError) {
    const apiError = normalizeError(query.error);
    const isUnavailable = apiError.status === 403;
    const isNotFound = apiError.status === 404;

    return (
      <section className="grid min-h-[60vh] content-center gap-5">
        <Badge variant={isUnavailable ? "warning" : "danger"}>
          {isUnavailable ? "Unavailable" : isNotFound ? "Not found" : "Could not load"}
        </Badge>
        <div className="grid gap-3">
          <h1 className="text-title font-semibold text-text">
            {isUnavailable
              ? "This quiz is no longer available"
              : isNotFound
                ? "Quiz not found"
                : "We could not load this quiz"}
          </h1>
          <p className="max-w-xl text-body text-text-muted">{errorMessage(query.error)}</p>
        </div>
        {!isUnavailable && !isNotFound ? (
          <Button
            icon={<RotateCcw aria-hidden="true" size={17} strokeWidth={1.8} />}
            onClick={() => void query.refetch()}
            variant="secondary"
          >
            Retry
          </Button>
        ) : null}
      </section>
    );
  }

  if (!query.data) {
    return null;
  }

  return (
    <section className="grid gap-8 py-8 sm:py-14">
      <div className="grid gap-5">
        <Badge variant="info">Guest quiz</Badge>
        <div className="grid gap-3">
          <p className="text-small font-semibold uppercase tracking-[0.1em] text-primary">Welcome</p>
          <h1 className="text-display font-semibold tracking-[-0.03em] text-text">{query.data.title}</h1>
          {query.data.description ? (
            <p className="max-w-2xl text-body text-text-muted">{query.data.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-small font-semibold text-text-muted">
          <Clock3 aria-hidden="true" size={17} strokeWidth={1.8} />
          <span>{durationLabel(query.data.duration_minutes)}</span>
        </div>
      </div>

      <Card className="grid gap-5 shadow-raised">
        <div className="grid gap-2">
          <h2 className="text-heading font-semibold text-text">Before you begin</h2>
          <p className="text-small text-text-muted">
            Enter your name to begin. Your answers will be scored when you submit the quiz.
          </p>
        </div>
        {formMessage ? (
          <div className="flex gap-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} strokeWidth={1.8} />
            <span>{formMessage}</span>
          </div>
        ) : null}
        <form className="grid gap-5" onSubmit={onSubmit}>
          <Input
            autoComplete="name"
            error={errors.participant_name?.message}
            helperText="Maximum 255 characters."
            label="Your name"
            maxLength={255}
            {...register("participant_name")}
          />
          <Button
            className="w-full sm:w-auto sm:justify-self-start"
            icon={<ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />}
            loading={isSubmitting || startMutation.isPending}
            type="submit"
          >
            Start quiz
          </Button>
        </form>
      </Card>

      <p className="text-small text-text-muted">No account is needed.</p>
    </section>
  );
}
