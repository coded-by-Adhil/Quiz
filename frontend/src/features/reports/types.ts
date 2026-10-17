import type { SortDirection } from "@/features/quizzes/types";

export type AttemptSort = "participant_name" | "score";

/** Aggregate-only reporting data. Answer and option fields must never be added here. */
export interface QuizAttempt {
  participant_name: string;
  score: number;
  total_marks: number;
  submitted_at: string;
}

export interface QuizAttemptListParams {
  direction: SortDirection;
  page: number;
  search?: string;
  sort: AttemptSort;
}
