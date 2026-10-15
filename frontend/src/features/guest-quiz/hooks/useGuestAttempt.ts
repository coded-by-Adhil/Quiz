import { useReducer } from "react";
import { getStoredGuestAttempt } from "@/features/guest-quiz/storage";
import type { GuestAttemptStorage } from "@/features/guest-quiz/types";

type GuestAttemptAction =
  | { type: "replace"; attempt: GuestAttemptStorage }
  | { type: "set_answers"; optionIds: number[]; questionId: number }
  | { type: "set_index"; index: number };

function guestAttemptReducer(
  state: GuestAttemptStorage | null,
  action: GuestAttemptAction,
): GuestAttemptStorage | null {
  if (!state) {
    return action.type === "replace" ? action.attempt : state;
  }

  switch (action.type) {
    case "replace":
      return action.attempt;
    case "set_answers":
      return {
        ...state,
        answers: {
          ...state.answers,
          [String(action.questionId)]: action.optionIds,
        },
      };
    case "set_index":
      return { ...state, currentIndex: action.index };
  }
}

export function useGuestAttempt(token: string, attemptId: string) {
  return useReducer(
    guestAttemptReducer,
    null,
    () => {
      const stored = getStoredGuestAttempt();
      return stored?.token === token && stored.attemptId === attemptId
        ? stored
        : null;
    },
  );
}

export type { GuestAttemptAction };
