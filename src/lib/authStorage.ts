/**
 * Token login disimpan di localStorage agar tetap masuk setelah tab ditutup.
 * Backend tetap membatasi umur login (12 jam sejak login terakhir), jadi pengguna tidak login selamanya.
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  session_expires_at?: string | null;
}

const ACCESS = "eyva_access_token";
const REFRESH = "eyva_refresh_token";
const EXPIRES = "eyva_session_expires_at";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return read(ACCESS);
}

export function getRefreshToken(): string | null {
  return read(REFRESH);
}

export function saveTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(ACCESS, tokens.access_token);
    localStorage.setItem(REFRESH, tokens.refresh_token);
    if (tokens.session_expires_at) localStorage.setItem(EXPIRES, tokens.session_expires_at);
    else localStorage.removeItem(EXPIRES);
  } catch {
    // storage diblokir browser: login hanya berlaku di halaman ini
  }
}

/** Hapus token dan semua data lokal milik akun ini (profil, sesi berjalan). */
export function clearAuth(): void {
  try {
    [
      ACCESS,
      REFRESH,
      EXPIRES,
      "eyva_username",
      "eyva_avatar",
      "eyva_email",
      "eyva_session_config",
      "eyva_active_session",
      "eyva_last_summary",
      "eyva_focus_remaining_seconds",
      "eyva_focus_total_seconds",
    ].forEach((k) => localStorage.removeItem(k));
  } catch {
    // abaikan
  }
}

/** Login dianggap ada bila token tersimpan dan batas umur login belum lewat. */
export function hasSession(): boolean {
  if (!getAccessToken() && !getRefreshToken()) return false;
  const exp = read(EXPIRES);
  if (exp && new Date(exp).getTime() <= Date.now()) return false;
  return true;
}
