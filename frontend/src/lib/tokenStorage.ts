const tokenKey = "quiz_platform_token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(tokenKey);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(tokenKey, token);
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(tokenKey);
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}
