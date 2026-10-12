import type { Question } from "@/features/questions/types";

export type QuizSort = "title" | "created_at";
export type SortDirection = "asc" | "desc";

export interface QuizListItem {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface QuizQuestion extends Question {
  pivot: {
    quiz_id: number;
    question_id: number;
    order: number;
  };
}

export interface Quiz extends QuizListItem {
  deleted_at?: string | null;
  updated_at?: string;
  questions: QuizQuestion[];
}

export interface QuizPayload {
  title: string;
  description: string;
  duration_minutes: number | null;
}

export interface QuizDeleteResponse {
  message: string;
}

export interface QuizListParams {
  page: number;
  search?: string;
  sort: QuizSort;
  direction: SortDirection;
}
