export type QuestionType = "single" | "multiple";

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  created_by: number;
  question_text: string;
  type: QuestionType;
  marks: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  options: QuestionOption[];
}

export interface QuestionOptionPayload {
  option_text: string;
  is_correct: boolean;
}

export interface QuestionPayload {
  question_text: string;
  type: QuestionType;
  marks: number;
  options: QuestionOptionPayload[];
}

export interface QuestionDeleteResponse {
  message: string;
}
