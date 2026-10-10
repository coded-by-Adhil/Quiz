export type AuthRole = "admin" | "super_admin";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginResponse {
  token: string;
  token_type: "Bearer";
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}
