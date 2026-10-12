import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldPath } from "react-hook-form";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { Textarea } from "@/components/Textarea";
import type { ApiError } from "@/types/api";
import {
  emptyQuizValues,
  quizSchema,
  type QuizFormValues,
} from "@/features/quizzes/schemas";

interface QuizFormProps {
  defaultValues?: QuizFormValues;
  mode: "create" | "edit";
  onSubmit: (values: QuizFormValues) => Promise<void>;
  serverError?: ApiError;
}

function isKnownField(field: string): field is FieldPath<QuizFormValues> {
  return field === "title" || field === "description" || field === "duration_minutes";
}

export function QuizForm({
  defaultValues = emptyQuizValues,
  mode,
  onSubmit,
  serverError,
}: QuizFormProps) {
  const [formLevelMessage, setFormLevelMessage] = useState<string>();
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<QuizFormValues>({
    defaultValues,
    resolver: zodResolver(quizSchema),
  });
  // RHF's watch subscription is the intended way to conditionally render the duration field.
  // oxlint-disable-next-line react/incompatible-library
  const setTimeLimit = watch("setTimeLimit");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    clearErrors("root");
    setFormLevelMessage(undefined);

    if (!serverError) {
      return;
    }

    if (!serverError.fieldErrors) {
      setFormLevelMessage(serverError.message);
      return;
    }

    let mappedFieldError = false;
    const unmappedMessages: string[] = [];

    for (const [field, messages] of Object.entries(serverError.fieldErrors)) {
      const message = messages[0];

      if (message && isKnownField(field)) {
        setError(field, { message, type: "server" });
        mappedFieldError = true;
      } else if (message) {
        unmappedMessages.push(message);
      }
    }

    if (unmappedMessages.length > 0) {
      setFormLevelMessage(unmappedMessages.join(" "));
    } else if (!mappedFieldError) {
      setFormLevelMessage(serverError.message);
    }
  }, [clearErrors, serverError, setError]);

  const submit = handleSubmit(async (values) => {
    clearErrors();
    setFormLevelMessage(undefined);
    await onSubmit(values);
  });

  return (
    <form className="grid gap-6" noValidate onSubmit={(event) => void submit(event)}>
      {formLevelMessage ? (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-small text-danger" role="alert">
          {formLevelMessage}
        </div>
      ) : null}

      <div className="grid gap-5">
        <Input
          error={errors.title?.message}
          id="quiz-title"
          label="Title"
          placeholder="e.g. General knowledge"
          {...register("title")}
        />
        <Textarea
          error={errors.description?.message}
          id="quiz-description"
          label="Description"
          placeholder="Describe what participants will learn or practise."
          {...register("description")}
        />
      </div>

      <div className="grid gap-4 border-t border-border pt-5">
        <Switch
          description="Leave this off for a quiz with no time limit."
          id="quiz-set-time-limit"
          label="Set a time limit"
          {...register("setTimeLimit")}
        />
        {setTimeLimit ? (
          <div className="max-w-xs">
            <Input
              error={errors.duration_minutes?.message}
              id="quiz-duration"
              label="Time limit in minutes"
              min={1}
              placeholder="15"
              step={1}
              type="number"
              {...register("duration_minutes", {
                setValueAs: (value: unknown) =>
                  value === "" || value === null ? undefined : Number(value),
              })}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
        <Button
          icon={<Save aria-hidden="true" size={17} strokeWidth={1.8} />}
          loading={isSubmitting}
          type="submit"
        >
          {mode === "create" ? "Create quiz" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
