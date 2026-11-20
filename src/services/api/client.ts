import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  type AuthTokens,
} from "@/lib/authStorage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public readonly isTimeout: boolean = false
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

async function send(
  path: string,
  init: RequestInit,
  token: string | null,
  timeoutMs: number
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const externalSignal = init.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch {
    if (timedOut) {
      throw new ApiError(
        408,
        "The Eyva server is taking too long to respond. Please check your connection and try again.",
        true
      );
    }
    if (externalSignal?.aborted) {
      throw new ApiError(0, "Request cancelled.");
    }
    throw new ApiError(
      0,
      "Can't reach the Eyva server. Check your connection and try again."
    );
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

let refreshing: Promise<boolean> | null = null;

/** Tukar refresh token dengan token baru. Satu permintaan refresh dipakai bersama bila beberapa request gagal sekaligus. */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) return false;
      const r = await send(
        "/auth/refresh",
        { method: "POST", body: JSON.stringify({ refresh_token: rt }) },
        null,
        DEFAULT_TIMEOUT_MS
      );
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
 * Dilengkapi batas waktu (timeoutMs) agar UI tidak menggantung saat jaringan/server lambat.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const useAuth = options.auth ?? true;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let res = await send(path, init, useAuth ? getAccessToken() : null, timeoutMs);
  if (useAuth && res.status === 401) {
    if (!(await refreshSession())) sessionExpired();
    res = await send(path, init, getAccessToken(), timeoutMs);
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
