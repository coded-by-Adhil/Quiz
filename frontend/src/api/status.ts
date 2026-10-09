import { apiClient } from "@/api/client";
import type { HealthResponse, PingResponse } from "@/features/status/types";

export async function getPing(): Promise<PingResponse> {
  const response = await apiClient.get<PingResponse>("/api/ping");
  return response.data;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>("/api/health");
  return response.data;
}
