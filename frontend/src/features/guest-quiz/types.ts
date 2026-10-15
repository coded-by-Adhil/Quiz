export type GuestQuestionType = "single" | "multiple";

export interface GuestQuizMeta {
  title: string;
  description: string | null;
  duration_minutes: number | null;
}

export interface GuestOption {
  id: number;
  option_text: string;
}

export interface GuestQuestion {
  id: number;
  question_text: string;
  type: GuestQuestionType;
  marks: number;
  options: GuestOption[];
}

export interface GuestStartResponse {
  attempt_id: string;
  participant_name: string;
  started_at: string;
  duration_minutes: number | null;
  questions: GuestQuestion[];
}

export interface GuestAnswer {
  question_id: number;
  option_ids: number[];
}

export interface GuestSubmitPayload {
  answers: GuestAnswer[];
}

export interface GuestSubmitResponse {
  attempt_id: string;
  score: number;
  total_marks: number;
  submitted_at: string;
}

export interface GuestBreakdownItem {
  question_id: number;
  question_text: string;
  selected_options: GuestOption[];
  correct_options: GuestOption[];
  is_correct: boolean;
  marks: number;
  awarded_marks: number;
}

export interface GuestResult {
  attempt_id: string;
  participant_name: string;
  score: number;
  total_marks: number;
  submitted_at: string;
  breakdown: GuestBreakdownItem[];
}

export interface GuestAttemptStorage {
  token: string;
  attemptId: string;
  quizTitle: string;
  participantName: string;
  startedAtClient: number;
  durationMinutes: number | null;
  questions: GuestQuestion[];
  answers: Record<string, number[]>;
  currentIndex: number;
}
