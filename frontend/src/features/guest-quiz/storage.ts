import type {
  GuestAttemptStorage,
  GuestQuestion,
  GuestQuestionType,
  GuestStartResponse,
} from "@/features/guest-quiz/types";

const storageKey = "quiz_platform_guest_attempt_v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQuestionType(value: unknown): value is GuestQuestionType {
  return value === "single" || value === "multiple";
}

function isQuestion(value: unknown): value is GuestQuestion {
  if (!isRecord(value) || !Array.isArray(value.options)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.question_text === "string" &&
    isQuestionType(value.type) &&
    typeof value.marks === "number" &&
    value.options.every((option) => {
      if (!isRecord(option)) {
        return false;
      }
      return typeof option.id === "number" && typeof option.option_text === "string";
    })
  );
}

function isStorageSnapshot(value: unknown): value is GuestAttemptStorage {
  if (!isRecord(value) || !Array.isArray(value.questions) || !isRecord(value.answers)) {
    return false;
  }

  return (
    typeof value.token === "string" &&
    typeof value.attemptId === "string" &&
    typeof value.quizTitle === "string" &&
    typeof value.participantName === "string" &&
    typeof value.startedAtClient === "number" &&
    (value.durationMinutes === null || typeof value.durationMinutes === "number") &&
    typeof value.currentIndex === "number" &&
    value.questions.every(isQuestion) &&
    Object.values(value.answers).every(
      (optionIds) =>
        Array.isArray(optionIds) &&
        optionIds.every((optionId) => typeof optionId === "number"),
    )
  );
}

export function getStoredGuestAttempt(): GuestAttemptStorage | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isStorageSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setStoredGuestAttempt(snapshot: GuestAttemptStorage): void {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // A blocked or full session store should not prevent the quiz from opening.
  }
}

export function clearStoredGuestAttempt(): void {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Storage cleanup is best effort.
  }
}

export function emptyAnswers(questions: GuestQuestion[]): Record<string, number[]> {
  return Object.fromEntries(questions.map((question) => [String(question.id), []]));
}

export function createGuestAttemptStorage(
  token: string,
  response: GuestStartResponse,
  quizTitle: string,
): GuestAttemptStorage {
  return {
    answers: emptyAnswers(response.questions),
    attemptId: response.attempt_id,
    currentIndex: 0,
    durationMinutes: response.duration_minutes,
    participantName: response.participant_name,
    quizTitle,
    questions: response.questions,
    startedAtClient: Date.now(),
    token,
  };
}
