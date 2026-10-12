import { apiClient } from "@/api/client";
import type {
  Question,
  QuestionDeleteResponse,
  QuestionPayload,
} from "@/features/questions/types";

export async function listQuestions(): Promise<Question[]> {
  const response = await apiClient.get<Question[]>('/api/admin/questions');
  return response.data;
}

export async function getQuestion(id: number): Promise<Question> {
  const response = await apiClient.get<Question>(`/api/admin/questions/${id}`);
  return response.data;
}

export async function createQuestion(payload: QuestionPayload): Promise<Question> {
  const response = await apiClient.post<Question>('/api/admin/questions', payload);
  return response.data;
}

export async function updateQuestion(
  id: number,
  payload: QuestionPayload,
): Promise<Question> {
  const response = await apiClient.put<Question>(`/api/admin/questions/${id}`, payload);
  return response.data;
}

export async function deleteQuestion(id: number): Promise<QuestionDeleteResponse> {
  const response = await apiClient.delete<QuestionDeleteResponse>(
    `/api/admin/questions/${id}`,
  );
  return response.data;
}
