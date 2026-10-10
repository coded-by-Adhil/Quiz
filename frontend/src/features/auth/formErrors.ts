import type {
  FieldValues,
  Path,
  UseFormSetError,
} from "react-hook-form";
import type { FieldErrors } from "@/types/api";

export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  fieldErrors: FieldErrors | undefined,
  fields: readonly Path<TFieldValues>[],
  setError: UseFormSetError<TFieldValues>,
  aliases: Readonly<Record<string, Path<TFieldValues>>> = {},
): string | undefined {
  if (!fieldErrors) {
    return undefined;
  }

  const knownFields = new Set<string>(fields);
  const formMessages: string[] = [];

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const targetField = aliases[field] ?? field;

    if (knownFields.has(targetField)) {
      setError(targetField as Path<TFieldValues>, {
        message: messages.join(" "),
        type: "server",
      });
      continue;
    }

    formMessages.push(messages.join(" "));
  }

  return formMessages.length > 0 ? formMessages.join(" ") : undefined;
}
