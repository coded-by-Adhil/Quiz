import { z } from "zod";
import type { QuestionPayload, QuestionType } from "@/features/questions/types";

const questionOptionSchema = z.object({
  option_text: z.string().trim().min(1, "Option text is required."),
  is_correct: z.boolean(),
});

export const questionSchema = z
  .object({
    question_text: z.string().trim().min(1, "Question text is required."),
    type: z.enum(["single", "multiple"]),
    marks: z.number().int("Marks must be a whole number.").min(1, "Marks must be at least 1."),
    options: z.array(questionOptionSchema).min(2, "Add at least 2 options."),
  })
  .superRefine((values, context) => {
    const correctCount = values.options.filter((option) => option.is_correct).length;

    if (values.type === "single" && correctCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "A single question must have exactly one correct option.",
        path: ["options"],
      });
    }

    if (values.type === "multiple" && correctCount < 1) {
      context.addIssue({
        code: "custom",
        message: "A multiple question must have at least one correct option.",
        path: ["options"],
      });
    }
  });

export type QuestionFormValues = z.infer<typeof questionSchema>;

export const emptyQuestionValues: QuestionFormValues = {
  question_text: "",
  type: "single",
  marks: 1,
  options: [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
  ],
};

export function toQuestionPayload(values: QuestionFormValues): QuestionPayload {
  return {
    question_text: values.question_text.trim(),
    type: values.type as QuestionType,
    marks: values.marks,
    options: values.options.map((option) => ({
      option_text: option.option_text.trim(),
      is_correct: option.is_correct,
    })),
  };
}
