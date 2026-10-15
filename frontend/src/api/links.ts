import { apiClient } from "@/api/client";
import type {
  QuizLink,
  QuizLinkActivePayload,
  QuizLinkPayload,
} from "@/features/links/types";

export async function listForQuiz(quizId: number): Promise<QuizLink[]> {
  const response = await apiClient.get<QuizLink[]>(
    `/api/admin/quizzes/${quizId}/links`,
  );
  return response.data;
}

export async function create(
  quizId: number,
  payload: QuizLinkPayload,
): Promise<QuizLink> {
  const response = await apiClient.post<QuizLink>(
    `/api/admin/quizzes/${quizId}/links`,
    payload,
  );
  return response.data;
}

export async function setActive(
  linkId: number,
  payload: QuizLinkActivePayload,
): Promise<QuizLink> {
  const response = await apiClient.patch<QuizLink>(
    `/api/admin/links/${linkId}`,
    payload,
  );
  return response.data;
}
