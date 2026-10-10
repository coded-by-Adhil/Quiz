import { apiClient } from "@/api/client";
import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
  RegisterCredentials,
  RegisterResponse,
} from "@/features/auth/types";

export async function loginAdmin(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/api/admin/login",
    credentials,
  );

  return response.data;
}

export async function registerAdmin(
  credentials: RegisterCredentials,
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(
    "/api/admin/register",
    credentials,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>("/api/me");
  return response.data;
}

export async function logoutAdmin(): Promise<void> {
  await apiClient.post("/api/admin/logout");
}
