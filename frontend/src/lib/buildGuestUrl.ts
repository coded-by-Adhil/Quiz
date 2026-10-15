export function buildGuestUrl(token: string): string {
  const origin = window.location.origin;
  const basePath = import.meta.env.BASE_URL || "/";
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;

  return new URL(`q/${encodeURIComponent(token)}`, `${origin}${normalizedBase}`).toString();
}
