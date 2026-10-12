import { Plus, Trash2 } from "lucide-react";
import { get, type FieldArrayWithId, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { QuestionFormValues } from "@/features/questions/schemas";
import type { QuestionType } from "@/features/questions/types";

interface QuestionOptionEditorProps {
  errors: FieldErrors<QuestionFormValues>;
  fields: FieldArrayWithId<QuestionFormValues, "options", "id">[];
  optionValues: QuestionFormValues["options"];
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onSetSingleCorrect: (index: number) => void;
  register: UseFormRegister<QuestionFormValues>;
  setSingleSwitchNotice?: string;
  type: QuestionType;
}

function readMessage(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("message" in value)) {
    return undefined;
  }

  const message = value.message;
  return typeof message === "string" ? message : undefined;
}

export function QuestionOptionEditor({
  errors,
  fields,
  onAddOption,
  onRemoveOption,
  onSetSingleCorrect,
  optionValues,
  register,
  setSingleSwitchNotice,
  type,
}: QuestionOptionEditorProps) {
  const groupError = readMessage(get(errors, "options"));

  return (
    <fieldset className="grid gap-4 rounded-md border border-border bg-surface-raised/40 p-4">
      <legend className="px-1 text-small font-semibold text-text">Answer options</legend>
      <p className="text-small text-text-muted">
        {type === "single"
          ? "Choose exactly one correct option."
          : "Choose at least one correct option."}
      </p>
      {setSingleSwitchNotice ? (
        <p className="rounded-md border border-info/40 bg-info/10 px-3 py-2 text-small text-info" role="status">
          {setSingleSwitchNotice}
        </p>
      ) : null}
      <div className="grid gap-3">
        {fields.map((field, index) => {
          const optionTextError = readMessage(
            get(errors, `options.${index}.option_text`),
          );

          return (
            <div
              className="grid gap-3 rounded-md border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
              key={field.id}
            >
              <Input
                error={optionTextError}
                id={`question-option-${field.id}`}
                label={`Option ${index + 1}`}
                placeholder="Enter an answer option"
                {...register(`options.${index}.option_text`)}
              />
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <label className="inline-flex min-h-10 items-center gap-2 text-small font-semibold text-text">
                  {type === "single" ? (
                    <input
                      aria-label={`Mark option ${index + 1} correct`}
                      checked={optionValues[index]?.is_correct ?? field.is_correct}
                      className="h-4 w-4 accent-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                      name="single-correct-option"
                      onChange={() => onSetSingleCorrect(index)}
                      type="radio"
                    />
                  ) : (
                    <input
                      aria-label={`Mark option ${index + 1} correct`}
                      className="h-4 w-4 accent-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                      type="checkbox"
                      {...register(`options.${index}.is_correct`)}
                    />
                  )}
                  Correct
                </label>
                <Button
                  aria-label={`Remove option ${index + 1}`}
                  disabled={fields.length <= 2}
                  icon={<Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />}
                  onClick={() => onRemoveOption(index)}
                  title={fields.length <= 2 ? "At least 2 options are required" : "Remove option"}
                  variant="ghost"
                />
              </div>
            </div>
          );
        })}
      </div>
      {groupError ? (
        <p className="text-small text-danger" role="alert">
          {groupError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label text-text-muted">{fields.length} of 6 options</p>
        <Button
          disabled={fields.length >= 6}
          icon={<Plus aria-hidden="true" size={16} strokeWidth={1.8} />}
          onClick={onAddOption}
          variant="secondary"
        >
          Add option
        </Button>
      </div>
    </fieldset>
  );
}
