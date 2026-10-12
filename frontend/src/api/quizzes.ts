import { apiClient } from "@/api/client";
import type { Paginated } from "@/types/api";
import type {
  Quiz,
  QuizDeleteResponse,
  QuizListItem,
  QuizListParams,
  QuizPayload,
} from "@/features/quizzes/types";

export async function listQuizzes(
  params: QuizListParams,
): Promise<Paginated<QuizListItem>> {
  const response = await apiClient.get<Paginated<QuizListItem>>(
    "/api/admin/quizzes",
    { params },
  );
  return response.data;
}

export async function getQuiz(id: number): Promise<Quiz> {
  const response = await apiClient.get<Quiz>(`/api/admin/quizzes/${id}`);
  return response.data;
}

export async function createQuiz(payload: QuizPayload): Promise<Quiz> {
  const response = await apiClient.post<Quiz>("/api/admin/quizzes", payload);
  return response.data;
}

export async function updateQuiz(id: number, payload: QuizPayload): Promise<Quiz> {
  const response = await apiClient.put<Quiz>(`/api/admin/quizzes/${id}`, payload);
  return response.data;
}

export async function deleteQuiz(id: number): Promise<QuizDeleteResponse> {
  const response = await apiClient.delete<QuizDeleteResponse>(
    `/api/admin/quizzes/${id}`,
  );
  return response.data;
}

export async function setQuizQuestions(
  id: number,
  questionIds: number[],
): Promise<Quiz> {
  const response = await apiClient.post<Quiz>(
    `/api/admin/quizzes/${id}/questions`,
    { question_ids: questionIds },
  );
  return response.data;
}
