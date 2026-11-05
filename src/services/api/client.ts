import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  type AuthTokens,
} from "@/lib/authStorage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function detailMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const field = (detail[0]?.loc ?? []).slice(-1)[0];
    return field ? `Please check the ${field} field.` : "Please check your input.";
  }
  if (status >= 500) return "The server is having trouble right now. Please try again.";
  return `Request failed (${status}).`;
}

async function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach the Eyva server. Check your connection and try again.");
  }
}

let refreshing: Promise<boolean> | null = null;

/** Tukar refresh token dengan token baru. Satu permintaan refresh dipakai bersama bila beberapa request gagal sekaligus. */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) return false;
      const r = await send("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: rt }) }, null);
      if (!r.ok) return false;
      saveTokens((await r.json()) as AuthTokens);
      return true;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

function sessionExpired(): never {
  clearAuth();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login?expired=1");
  }
  throw new ApiError(401, "Your session has ended. Please log in again.");
}

/**
 * Panggil backend. `auth: true` (bawaan) mengirim token dan mencoba refresh sekali saat 401;
 * bila tetap gagal, token dihapus dan pengguna diarahkan ke halaman login.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {}
): Promise<T> {
  const useAuth = options.auth ?? true;
  let res = await send(path, init, useAuth ? getAccessToken() : null);
  if (useAuth && res.status === 401) {
    if (!(await refreshSession())) sessionExpired();
    res = await send(path, init, getAccessToken());
    if (res.status === 401) sessionExpired();
  }
  let body: unknown = null;
  if (res.status !== 204) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  }
  if (!res.ok) throw new ApiError(res.status, detailMessage(body, res.status));
  return body as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Something went wrong. Please try again.";
}
