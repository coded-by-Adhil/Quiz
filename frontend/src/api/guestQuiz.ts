import { guestClient } from "@/api/guestClient";
import type {
  GuestQuizMeta,
  GuestResult,
  GuestStartResponse,
  GuestSubmitPayload,
  GuestSubmitResponse,
} from "@/features/guest-quiz/types";

function pathPart(value: string): string {
  return encodeURIComponent(value);
}

export async function getQuiz(token: string): Promise<GuestQuizMeta> {
  const response = await guestClient.get<GuestQuizMeta>(
    `/api/quiz/${pathPart(token)}`,
  );
  return response.data;
}

export async function start(
  token: string,
  payload: { participant_name: string },
): Promise<GuestStartResponse> {
  const response = await guestClient.post<GuestStartResponse>(
    `/api/quiz/${pathPart(token)}/start`,
    payload,
  );
  return response.data;
}

export async function submit(
  token: string,
  attemptId: string,
  payload: GuestSubmitPayload,
): Promise<GuestSubmitResponse> {
  const response = await guestClient.post<GuestSubmitResponse>(
    `/api/quiz/${pathPart(token)}/attempts/${pathPart(attemptId)}/submit`,
    payload,
  );
  return response.data;
}

export async function getResult(
  token: string,
  attemptId: string,
): Promise<GuestResult> {
  const response = await guestClient.get<GuestResult>(
    `/api/quiz/${pathPart(token)}/attempts/${pathPart(attemptId)}/result`,
  );
  return response.data;
}
