import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAttempts } from "@/api/reports";
import type { QuizAttemptListParams } from "@/features/reports/types";

export const reportKeys = {
  attempts: (quizId: number, params: QuizAttemptListParams) => ["reports", quizId, params] as const,
};

export function useQuizAttempts(quizId: number | null, params: QuizAttemptListParams) {
  return useQuery({
    enabled: quizId !== null,
    placeholderData: keepPreviousData,
    queryKey: quizId === null ? ["reports", "invalid"] : reportKeys.attempts(quizId, params),
    queryFn: () => listAttempts(quizId as number, params),
  });
}
