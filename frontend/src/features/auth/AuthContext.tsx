import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, loginAdmin, logoutAdmin, registerAdmin } from "@/api/auth";
import {
  registerUnauthorizedHandler,
  resetUnauthorizedHandling,
} from "@/api/client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { normalizeError } from "@/lib/normalizeError";
import { clearToken, getToken, setToken } from "@/lib/tokenStorage";
import type { ApiError } from "@/types/api";
import { AuthContext } from "@/features/auth/context";
import type {
  AuthRole,
  AuthStatus,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/features/auth/types";
const sessionEndedNotice = "Your session has ended. Please sign in again.";

function homeForRole(role: AuthRole): string {
  return role === "admin" ? "/admin/quizzes" : "/superadmin";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAllowedReturnPath(role: AuthRole, value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  const zone = role === "admin" ? "/admin" : "/superadmin";
  return value === zone || value.startsWith(`${zone}/`);
}

function returnPathForLogin(role: AuthRole, locationState: unknown): string {
  if (isRecord(locationState) && isAllowedReturnPath(role, locationState.from)) {
    return locationState.from;
  }

  return homeForRole(role);
}

interface AuthRestoreStateProps {
  error: ApiError | null;
  loading: boolean;
  onRetry: () => void;
}

function AuthRestoreState({
  error,
  loading,
  onRetry,
}: AuthRestoreStateProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-text">
      <Card className="w-full max-w-md shadow-raised">
        {loading ? (
          <div className="flex items-center gap-3">
            <Spinner />
            <h1 className="text-heading font-semibold">Restoring your session...</h1>
          </div>
        ) : (
          <>
            <h1 className="text-heading font-semibold">We could not restore your session</h1>
            <p className="mt-3 text-small text-danger" role="alert">
              {error?.message ?? "Please try again."}
            </p>
            <Button
              className="mt-5"
              icon={<RotateCcw aria-hidden="true" size={17} strokeWidth={1.8} />}
              onClick={onRetry}
              variant="secondary"
            >
              Retry
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(() =>
    getToken() ? "loading" : "unauthenticated",
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const sessionEndedRef = useRef(false);

  const handleSessionEnded = useCallback(() => {
    if (sessionEndedRef.current) {
      return;
    }

    sessionEndedRef.current = true;
    clearToken();
    queryClient.clear();
    setUser(null);
    setError(null);
    setStatus("unauthenticated");
    navigate("/login", {
      replace: true,
      state: { notice: sessionEndedNotice },
    });
  }, [navigate, queryClient]);

  const restoreSession = useCallback(async () => {
    if (!getToken()) {
      return;
    }

    try {
      const response = await getCurrentUser();
      setUser(response.user);
      setError(null);
      setStatus("authenticated");
      sessionEndedRef.current = false;
    } catch (restoreError: unknown) {
      const apiError = normalizeError(restoreError);

      if (apiError.status === 401) {
        handleSessionEnded();
        return;
      }

      setError(apiError);
      setStatus("error");
    }
  }, [handleSessionEnded]);

  useEffect(() => {
    return registerUnauthorizedHandler(handleSessionEnded);
  }, [handleSessionEnded]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      void restoreSession();
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [restoreSession]);

  const retryRestore = useCallback(() => {
    setError(null);
    setStatus("loading");
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await loginAdmin(credentials);

      setToken(response.token);
      resetUnauthorizedHandling();
      sessionEndedRef.current = false;
      setUser(response.user);
      setError(null);
      setStatus("authenticated");
      navigate(returnPathForLogin(response.user.role, location.state), {
        replace: true,
      });
    },
    [location.state, navigate],
  );

  const register = useCallback(
    (credentials: RegisterCredentials) => registerAdmin(credentials),
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      clearToken();
      resetUnauthorizedHandling();
      sessionEndedRef.current = false;
      queryClient.clear();
      setUser(null);
      setError(null);
      setStatus("unauthenticated");
      navigate("/login", { replace: true });
    }
  }, [navigate, queryClient]);

  const recheckSession = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
      setError(null);
      setStatus("authenticated");
    } catch (recheckError: unknown) {
      const apiError = normalizeError(recheckError);

      if (apiError.status === 401) {
        handleSessionEnded();
        return;
      }

      setError(apiError);
      setStatus("error");
      throw recheckError;
    }
  }, [handleSessionEnded]);

  const contextValue = useMemo(
    () => ({
      error,
      login,
      logout,
      recheckSession,
      register,
      status,
      user,
    }),
    [error, login, logout, recheckSession, register, status, user],
  );

  const content =
    status === "loading" || status === "error" ? (
      <AuthRestoreState
        error={error}
        loading={status === "loading"}
        onRetry={retryRestore}
      />
    ) : (
      children ?? <Outlet />
    );

  return <AuthContext.Provider value={contextValue}>{content}</AuthContext.Provider>;
}
