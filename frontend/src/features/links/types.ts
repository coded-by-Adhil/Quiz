import type { QuestionType } from "@/features/questions/types";

export interface QuizLinkQuestion {
  id: number;
  question_text: string;
  type: QuestionType;
  marks: number;
  pivot: {
    order: number;
  };
}

export interface QuizLink {
  id: number;
  quiz_id: number;
  token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions: QuizLinkQuestion[];
}

export interface QuizLinkPayload {
  question_ids: number[];
}

export interface QuizLinkActivePayload {
  is_active: boolean;
}

export interface AllQuizzesData {
  quizzes: Array<{
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number | null;
    owner_id: number;
    created_at: string;
  }>;
  capHit: boolean;
}
