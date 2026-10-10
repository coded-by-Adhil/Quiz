import axios from "axios";
import { getToken } from "@/lib/tokenStorage";

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

function isEndpoint(url: string | undefined, endpoint: string): boolean {
  const path = (url ?? "").split("?")[0];
  return path.endsWith(endpoint);
}

export function registerUnauthorizedHandler(
  handler: UnauthorizedHandler,
): () => void {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export function resetUnauthorizedHandling(): void {
  isHandlingUnauthorized = false;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = error.config?.url;
    const isLoginRequest = isEndpoint(requestUrl, "/api/admin/login");
    const isLogoutRequest = isEndpoint(requestUrl, "/api/admin/logout");
    const token = getToken();

    if (
      !isLoginRequest &&
      !isLogoutRequest &&
      token &&
      unauthorizedHandler &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;
      unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);
