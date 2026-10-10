import { createContext } from "react";
import type { ApiError } from "@/types/api";
import type {
  AuthStatus,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
} from "@/features/auth/types";

export interface AuthContextValue {
  error: ApiError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  recheckSession: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<RegisterResponse>;
  status: AuthStatus;
  user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
