import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getQuiz,
  getResult,
  start,
  submit,
} from "@/api/guestQuiz";
import type {
  GuestSubmitPayload,
} from "@/features/guest-quiz/types";

export const guestQuizKeys = {
  meta: (token: string) => ["guest-quiz", "meta", token] as const,
  result: (token: string, attemptId: string) =>
    ["guest-quiz", "result", token, attemptId] as const,
};

export function useGuestQuizQuery(token: string) {
  return useQuery({
    enabled: Boolean(token),
    queryFn: () => getQuiz(token),
    queryKey: guestQuizKeys.meta(token),
  });
}

export function useGuestResultQuery(token: string, attemptId: string) {
  return useQuery({
    enabled: Boolean(token && attemptId),
    queryFn: () => getResult(token, attemptId),
    queryKey: guestQuizKeys.result(token, attemptId),
  });
}

export function useStartGuestQuizMutation() {
  return useMutation({
    mutationFn: ({ token, participantName }: { token: string; participantName: string }) =>
      start(token, { participant_name: participantName }),
  });
}

export function useSubmitGuestQuizMutation() {
  return useMutation({
    mutationFn: ({
      attemptId,
      payload,
      token,
    }: {
      attemptId: string;
      payload: GuestSubmitPayload;
      token: string;
    }) => submit(token, attemptId, payload),
  });
}
