import { z } from "zod";

export const createLinkSchema = z.object({
  quiz_id: z.number().int().positive("Choose a quiz."),
  question_ids: z
    .array(z.number().int().positive())
    .min(1, "Select at least one question.")
    .max(10, "Select no more than 10 questions."),
});

export type CreateLinkFormValues = z.infer<typeof createLinkSchema>;
