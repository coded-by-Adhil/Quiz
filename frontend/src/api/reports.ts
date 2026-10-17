import { apiClient } from "@/api/client";
import type { Paginated } from "@/types/api";
import type { QuizAttempt, QuizAttemptListParams } from "@/features/reports/types";

export async function listAttempts(
  quizId: number,
  params: QuizAttemptListParams,
): Promise<Paginated<QuizAttempt>> {
  const response = await apiClient.get<Paginated<QuizAttempt>>(
    `/api/admin/quizzes/${quizId}/attempts`,
    { params },
  );
  return response.data;
}
