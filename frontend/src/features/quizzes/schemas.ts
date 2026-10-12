import { z } from "zod";
import type { QuizPayload } from "@/features/quizzes/types";

export const quizSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  setTimeLimit: z.boolean(),
  duration_minutes: z.number().int("Time limit must be a whole number.").min(1, "Time limit must be at least 1 minute.").optional(),
});

export type QuizFormValues = z.infer<typeof quizSchema>;

export const emptyQuizValues: QuizFormValues = {
  title: "",
  description: "",
  setTimeLimit: false,
  duration_minutes: undefined,
};

export function toQuizPayload(values: QuizFormValues): QuizPayload {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    duration_minutes: values.setTimeLimit ? values.duration_minutes ?? null : null,
  };
}

export function quizValuesFromModel(quiz: {
  title: string;
  description: string | null;
  duration_minutes: number | null;
}): QuizFormValues {
  return {
    title: quiz.title,
    description: quiz.description ?? "",
    setTimeLimit: quiz.duration_minutes !== null,
    duration_minutes: quiz.duration_minutes ?? undefined,
  };
}
