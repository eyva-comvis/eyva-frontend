import { clearAuth, saveTokens, type AuthTokens } from "@/lib/authStorage";
import { ApiError, apiRequest } from "./client";

export const OTP_LENGTH = 6;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://xdubfbnpyfiwvwtevmdw.supabase.co";

export interface TokenResponse extends AuthTokens {
  token_type: string;
  expires_in: number;
  user: { id: string; email: string | null };
}

interface RegisterResponse {
  requires_verification: boolean;
  message: string;
  tokens: TokenResponse | null;
}

const post = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }, { auth: false });

/** Pesan error berbahasa Inggris sesuai UI, berdasarkan status dari backend. */
function rethrow(err: unknown, messages: Partial<Record<number, string>>): never {
  if (err instanceof ApiError && messages[err.status]) {
    throw new ApiError(err.status, messages[err.status]!);
  }
  throw err;
}

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

export async function login(email: string, password: string): Promise<TokenResponse> {
  try {
    const t = await post<TokenResponse>("/auth/login", { email, password });
    saveTokens(t);
    return t;
  } catch (err) {
    rethrow(err, {
      401: "Incorrect email or password.",
      403: "Please verify your email first.",
      429: TOO_MANY,
    });
  }
}

export async function register(
  email: string,
  password: string,
  username: string
): Promise<RegisterResponse> {
  try {
    const r = await post<RegisterResponse>("/auth/register", { email, password, username });
    if (r.tokens) saveTokens(r.tokens);
    return r;
  } catch (err) {
    rethrow(err, {
      409: "This email is already registered. Please log in instead.",
      429: TOO_MANY,
    });
  }
}

export async function verifyEmail(email: string, code: string): Promise<TokenResponse> {
  try {
    const t = await post<TokenResponse>("/auth/verify-email", { email, code });
    saveTokens(t);
    return t;
  } catch (err) {
    rethrow(err, { 400: "That code is wrong or has expired.", 429: TOO_MANY });
  }
}

export async function resendVerification(email: string): Promise<void> {
  try {
    await post("/auth/resend-verification", { email });
  } catch (err) {
    rethrow(err, { 429: "Please wait a minute before asking for a new code." });
  }
}

export async function forgotPassword(email: string): Promise<void> {
  try {
    await post("/auth/forgot-password", { email });
  } catch (err) {
    rethrow(err, { 429: "Please wait a minute before asking for a new code." });
  }
}

export async function verifyResetCode(email: string, code: string): Promise<string> {
  try {
    const r = await post<{ reset_token: string }>("/auth/verify-reset-code", { email, code });
    return r.reset_token;
  } catch (err) {
    rethrow(err, { 400: "That code is wrong or has expired.", 429: TOO_MANY });
  }
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  try {
    await post("/auth/reset-password", { reset_token: resetToken, new_password: newPassword });
  } catch (err) {
    rethrow(err, {
      400: "This reset link has expired. Please request a new code.",
      422: "Password must be at least 8 characters.",
    });
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // token mungkin sudah mati: tetap keluar di sisi browser
  } finally {
    clearAuth();
  }
}

/** Arahkan browser ke login Google lewat Supabase. Token kembali ke /auth/callback. */
export function startGoogleLogin(): void {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const url = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", redirectTo);
  window.location.assign(url.toString());
}
