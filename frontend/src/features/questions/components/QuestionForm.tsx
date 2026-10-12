import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  type FieldPath,
} from "react-hook-form";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { ApiError } from "@/types/api";
import { QuestionOptionEditor } from "@/features/questions/components/QuestionOptionEditor";
import {
  emptyQuestionValues,
  questionSchema,
  type QuestionFormValues,
} from "@/features/questions/schemas";
import type { QuestionType } from "@/features/questions/types";

interface QuestionFormProps {
  defaultValues?: QuestionFormValues;
  mode: "create" | "edit";
  onSubmit: (values: QuestionFormValues) => Promise<void>;
  serverError?: ApiError;
}

function isKnownField(field: string): field is FieldPath<QuestionFormValues> {
  return (
    field === "question_text" ||
    field === "type" ||
    field === "marks" ||
    field === "options" ||
    /^options\.\d+\.option_text$/.test(field) ||
    /^options\.\d+\.is_correct$/.test(field)
  );
}

export function QuestionForm({
  defaultValues = emptyQuestionValues,
  mode,
  onSubmit,
  serverError,
}: QuestionFormProps) {
  const [singleSwitchNotice, setSingleSwitchNotice] = useState<string>();
  const [formLevelMessage, setFormLevelMessage] = useState<string>();
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<QuestionFormValues>({
    defaultValues,
    resolver: zodResolver(questionSchema),
  });
  const typeRegistration = register("type");
  // RHF field arrays intentionally expose a mutable field model for dynamic rows.
  // oxlint-disable-next-line react/incompatible-library
  const { append, fields, remove } = useFieldArray({
    control,
    name: "options",
  });
  // RHF's watch subscription is the intended way to react to form values here.
  // oxlint-disable-next-line react/incompatible-library
  const type = watch("type");
  // oxlint-disable-next-line react/incompatible-library
  const optionValues = watch("options");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    clearErrors("root");
    setFormLevelMessage(undefined);

    if (!serverError) {
      return;
    }

    const fieldErrors = serverError.fieldErrors;

    if (!fieldErrors) {
      setFormLevelMessage(serverError.message);
      return;
    }

    let mappedFieldError = false;
    const unmappedMessages: string[] = [];

    for (const [field, messages] of Object.entries(fieldErrors)) {
      const message = messages[0];

      if (isKnownField(field)) {
        setError(field, { message, type: "server" });
        mappedFieldError = true;
      } else {
        unmappedMessages.push(message);
      }
    }

    if (unmappedMessages.length > 0) {
      setFormLevelMessage(unmappedMessages.join(" "));
    } else if (!mappedFieldError) {
      setFormLevelMessage(serverError.message);
    }
  }, [clearErrors, serverError, setError]);

  const setSingleCorrect = (index: number) => {
    const options = getValues("options");
    setValue(
      "options",
      options.map((option, optionIndex) => ({
        ...option,
        is_correct: optionIndex === index,
      })),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleTypeChange = (nextType: QuestionType) => {
    const currentOptions = getValues("options");
    setSingleSwitchNotice(undefined);

    if (type === "multiple" && nextType === "single") {
      const firstCorrectIndex = currentOptions.findIndex((option) => option.is_correct);
      const correctCount = currentOptions.filter((option) => option.is_correct).length;

      if (correctCount > 1) {
        setValue(
          "options",
          currentOptions.map((option, index) => ({
            ...option,
            is_correct: index === firstCorrectIndex,
          })),
          { shouldDirty: true, shouldValidate: true },
        );
        setSingleSwitchNotice(
          "Single choice allows one correct option, so the first correct option was kept.",
        );
      }
    }

    setValue("type", nextType, { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit(async (values) => {
    clearErrors();
    setFormLevelMessage(undefined);
    await onSubmit(values);
  });

  const questionTextError = errors.question_text?.message;
  const marksError = errors.marks?.message;
  return (
    <form className="grid gap-6" noValidate onSubmit={(event) => void submit(event)}>
      {formLevelMessage ? (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-small text-danger" role="alert">
          {formLevelMessage}
        </div>
      ) : null}
      <div className="grid gap-5">
        <div className="grid gap-2">
          <label className="text-small font-semibold text-text" htmlFor="question-text">
            Question text
          </label>
          <textarea
            aria-describedby={questionTextError ? "question-text-error" : undefined}
            aria-invalid={questionTextError ? true : undefined}
            className="min-h-32 rounded-md border border-border bg-surface px-3 py-2 text-body text-text outline-none transition-[background-color,border-color,box-shadow,color] duration-fast ease-standard placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-focus-ring focus:ring-offset-1 focus:ring-offset-surface"
            id="question-text"
            placeholder="Write the question clearly"
            {...register("question_text")}
          />
          {questionTextError ? (
            <p className="text-small text-danger" id="question-text-error" role="alert">
              {questionTextError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-small font-semibold text-text" htmlFor="question-type">
              Answer type
            </label>
            <select
              className="min-h-10 rounded-md border border-border bg-surface px-3 py-2 text-body text-text outline-none transition-[background-color,border-color,box-shadow,color] duration-fast ease-standard focus:border-primary focus:ring-2 focus:ring-focus-ring focus:ring-offset-1 focus:ring-offset-surface"
              id="question-type"
              {...typeRegistration}
              onChange={(event) => {
                const nextType = event.target.value;

                if (nextType === "single" || nextType === "multiple") {
                  typeRegistration.onChange(event);
                  handleTypeChange(nextType);
                }
              }}
            >
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choice</option>
            </select>
          </div>
          <Input
            error={marksError}
            id="question-marks"
            label="Marks"
            min={1}
            step={1}
            type="number"
            {...register("marks", { valueAsNumber: true })}
          />
        </div>
      </div>

      <QuestionOptionEditor
        errors={errors}
        fields={fields}
        onAddOption={() => append({ is_correct: false, option_text: "" })}
        onRemoveOption={remove}
        onSetSingleCorrect={setSingleCorrect}
        optionValues={optionValues}
        register={register}
        setSingleSwitchNotice={singleSwitchNotice}
        type={type}
      />
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
        <Button
          disabled={isSubmitting}
          icon={<Save aria-hidden="true" size={17} strokeWidth={1.8} />}
          loading={isSubmitting}
          type="submit"
        >
          {mode === "create" ? "Create question" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
