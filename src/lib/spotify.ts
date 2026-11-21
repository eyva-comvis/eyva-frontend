// Parser, validator, preset publik, dan penyimpanan lokal untuk musik latar Spotify (100% frontend).

export type MusicSource = "builtin" | "spotify";

export type SpotifyItemType = "playlist" | "track" | "album" | "episode";

export interface SpotifyItem {
  type: SpotifyItemType;
  id: string;
  uri: string;
  url: string;
  title: string;
  thumbnailUrl?: string | null;
  providerName?: string;
}

export interface ParsedSpotifyRef {
  type: SpotifyItemType;
  id: string;
  uri: string;
  url: string;
}

export interface SpotifyPreset extends SpotifyItem {
  subtitle: string;
}

export type SpotifyValidateErrorCode =
  | "EMPTY"
  | "INVALID_FORMAT"
  | "NOT_FOUND_OR_PRIVATE"
  | "TIMEOUT"
  | "NETWORK";

export type SpotifyValidateResult =
  | { ok: true; item: SpotifyItem }
  | { ok: false; code: SpotifyValidateErrorCode; message: string };

export const SPOTIFY_SAVED_KEY = "eyva_spotify_saved";
const MAX_SAVED_ITEMS = 12;
export const BACKEND_SOUNDTRACK_MAX_LEN = 40;

const SUPPORTED_TYPES = new Set<SpotifyItemType>([
  "playlist",
  "track",
  "album",
  "episode",
]);

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{10,32}$/;

export const FORMAT_ERROR_MESSAGE =
  "Format tidak dikenali. Tempel link open.spotify.com (playlist/track/album/episode), URI spotify:playlist:..., atau kode <iframe embed>.";

export const PRIVATE_OR_MISSING_MESSAGE =
  "Playlist tidak ditemukan atau masih Private. Ubah visibilitas playlist Spotify ke Public lalu coba lagi.";

/** Daftar playlist belajar publik Spotify yang sudah diverifikasi via oEmbed. */
export const CURATED_SPOTIFY_PRESETS: SpotifyPreset[] = [
  {
    type: "playlist",
    id: "37i9dQZF1DWWQRwui0ExPn",
    uri: "spotify:playlist:37i9dQZF1DWWQRwui0ExPn",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
    title: "Lofi Beats",
    subtitle: "Chill beats untuk fokus belajar",
    thumbnailUrl:
      "https://i.scdn.co/image/ab67706f00000002266beb50b0032b0f140a749e",
    providerName: "Spotify",
  },
  {
    type: "playlist",
    id: "37i9dQZF1DWZeKCadgRdKQ",
    uri: "spotify:playlist:37i9dQZF1DWZeKCadgRdKQ",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
    title: "Deep Focus",
    subtitle: "Ambient & post-rock tenang",
    thumbnailUrl:
      "https://i.scdn.co/image/ab67706f000000026020f2f6476db518ef747da4",
    providerName: "Spotify",
  },
  {
    type: "playlist",
    id: "37i9dQZF1DX4sWSpwq3LiO",
    uri: "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
    title: "Peaceful Piano",
    subtitle: "Piano lembut tanpa lirik",
    thumbnailUrl:
      "https://i.scdn.co/image/ab67706f0000000270e1fb7db7b45809d6a80377",
    providerName: "Spotify",
  },
  {
    type: "playlist",
    id: "37i9dQZF1DX9sIqqvKsjG8",
    uri: "spotify:playlist:37i9dQZF1DX9sIqqvKsjG8",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX9sIqqvKsjG8",
    title: "Instrumental Study",
    subtitle: "Instrumental halus untuk baca",
    thumbnailUrl:
      "https://i.scdn.co/image/ab67706f000000026cb530ab9aafafdaab62f4bb",
    providerName: "Spotify",
  },
  {
    type: "playlist",
    id: "37i9dQZF1DX8NTLI2TtZa6",
    uri: "spotify:playlist:37i9dQZF1DX8NTLI2TtZa6",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6",
    title: "Intense Studying",
    subtitle: "Klasik fokus untuk tugas berat",
    thumbnailUrl:
      "https://i.scdn.co/image/ab67706f00000002f87d8382976ebff84930bfc1",
    providerName: "Spotify",
  },
  {
    type: "playlist",
    id: "37i9dQZF1DX3PFzdbtx1Us",
    uri: "spotify:playlist:37i9dQZF1DX3PFzdbtx1Us",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX3PFzdbtx1Us",
    title: "Music for Concentration",
    subtitle: "Minimalis untuk konsentrasi lama",
    thumbnailUrl:
      "https://i.scdn.co/image/ab67706f0000000213cdea04aa0650887a6bddce",
    providerName: "Spotify",
  },
];

export const DEFAULT_SPOTIFY_ITEM: SpotifyItem = CURATED_SPOTIFY_PRESETS[0];

/** Buat URL iframe embed resmi Spotify dengan tema terang-netral. */
export function buildSpotifyEmbedUrl(type: SpotifyItemType, id: string): string {
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

/** Label tipe konten Spotify untuk badge UI. */
export function spotifyTypeLabel(type: SpotifyItemType): string {
  switch (type) {
    case "playlist":
      return "Playlist";
    case "track":
      return "Track";
    case "album":
      return "Album";
    case "episode":
      return "Episode";
  }
}

/**
 * Parse berbagai format input Spotify:
 * 1. Web URL (`https://open.spotify.com/...`, termasuk `/intl-id/`, `/user/.../playlist/...`, `/embed/...`, `?si=...`)
 * 2. Spotify URI (`spotify:playlist:{id}`, `spotify:track:{id}`, `spotify:album:{id}`, `spotify:episode:{id}`, `spotify:user:{u}:playlist:{id}`)
 * 3. Embed HTML (`<iframe ... src="https://open.spotify.com/embed/..."></iframe>`)
 */
export function parseSpotifyInput(rawInput: string): ParsedSpotifyRef | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  // Alternatif 2: Embed code <iframe ... src="...">
  if (candidate.toLowerCase().includes("<iframe")) {
    const srcMatch = candidate.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch?.[1]) return null;
    candidate = srcMatch[1].trim();
  }

  // Alternatif 1: Spotify URI (spotify:playlist:ID atau spotify:user:xxx:playlist:ID)
  if (/^spotify:/i.test(candidate)) {
    const parts = candidate.split(":").filter(Boolean);
    let typeRaw: string | undefined;
    let id: string | undefined;
    if (parts.length === 3) {
      typeRaw = parts[1].toLowerCase();
      id = parts[2];
    } else if (parts.length === 5 && parts[1].toLowerCase() === "user") {
      typeRaw = parts[3].toLowerCase();
      id = parts[4];
    }
    if (
      typeRaw &&
      id &&
      SUPPORTED_TYPES.has(typeRaw as SpotifyItemType) &&
      SPOTIFY_ID_RE.test(id)
    ) {
      const type = typeRaw as SpotifyItemType;
      return {
        type,
        id,
        uri: `spotify:${type}:${id}`,
        url: `https://open.spotify.com/${type}/${id}`,
      };
    }
    return null;
  }

  // Link web Spotify (boleh tanpa skema https://)
  let normalizedUrl = candidate;
  if (/^(open|play)\.spotify\.com\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (host !== "open.spotify.com" && host !== "play.spotify.com") {
    return null;
  }

  // Filter segmen path: buang prefix locale (`/intl-id`, `/intl-en`), `/embed`, atau `/user/{username}`
  const segments = parsedUrl.pathname
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  let idx = 0;
  while (idx < segments.length) {
    const seg = segments[idx].toLowerCase();
    if (seg === "embed" || seg === "embed-podcast" || seg.startsWith("intl-")) {
      idx += 1;
      continue;
    }
    if (seg === "user" && idx + 1 < segments.length) {
      idx += 2;
      continue;
    }
    break;
  }

  const typeRaw = segments[idx]?.toLowerCase();
  const id = segments[idx + 1];
  if (
    !typeRaw ||
    !id ||
    !SUPPORTED_TYPES.has(typeRaw as SpotifyItemType) ||
    !SPOTIFY_ID_RE.test(id)
  ) {
    return null;
  }

  const type = typeRaw as SpotifyItemType;
  return {
    type,
    id,
    uri: `spotify:${type}:${id}`,
    url: `https://open.spotify.com/${type}/${id}`,
  };
}

/** Validasi objek SpotifyItem mentah (mis. dari localStorage) agar aman dipakai UI. */
export function sanitizeSpotifyItem(raw: unknown): SpotifyItem | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const uriOrUrl =
    typeof obj.uri === "string"
      ? obj.uri
      : typeof obj.url === "string"
        ? obj.url
        : "";
  const parsed = parseSpotifyInput(uriOrUrl);
  if (!parsed) return null;

  const title =
    typeof obj.title === "string" && obj.title.trim()
      ? obj.title.trim()
      : `Spotify ${spotifyTypeLabel(parsed.type)}`;
  const thumbnailUrl =
    typeof obj.thumbnailUrl === "string" && /^https?:\/\//i.test(obj.thumbnailUrl)
      ? obj.thumbnailUrl
      : null;

  return {
    ...parsed,
    title,
    thumbnailUrl,
    providerName:
      typeof obj.providerName === "string" && obj.providerName.trim()
        ? obj.providerName.trim()
        : "Spotify",
  };
}

/**
 * Format nilai `soundtrack` yang aman dikirim ke `POST /sessions` backend (`max_length=40`).
 * Nilai yang dikembalikan dijamin `null` atau string dengan panjang <= 40 karakter.
 */
export function formatBackendSoundtrack(opts: {
  musicEnabled?: boolean;
  musicSource?: MusicSource;
  soundtrack?: string | null;
  spotifyItem?: SpotifyItem | null;
}): string | null {
  if (opts.musicEnabled === false) return null;

  if (opts.musicSource === "spotify") {
    const cleanTitle = opts.spotifyItem?.title?.trim();
    if (!cleanTitle) return "Spotify";
    const prefixed = `Spotify: ${cleanTitle}`;
    return prefixed.slice(0, BACKEND_SOUNDTRACK_MAX_LEN).trimEnd();
  }

  const clean = opts.soundtrack?.trim();
  if (!clean) return null;
  return clean.slice(0, BACKEND_SOUNDTRACK_MAX_LEN).trimEnd();
}

/** Validasi ketersediaan publik item Spotify melalui Route Handler oEmbed internal. */
export async function validateSpotifyViaOEmbed(
  rawInput: string,
  timeoutMs = 9000
): Promise<SpotifyValidateResult> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      ok: false,
      code: "EMPTY",
      message: "Masukkan link, URI, atau kode embed Spotify terlebih dahulu.",
    };
  }

  const parsed = parseSpotifyInput(trimmed);
  if (!parsed) {
    return {
      ok: false,
      code: "INVALID_FORMAT",
      message: FORMAT_ERROR_MESSAGE,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `/api/spotify/oembed?url=${encodeURIComponent(parsed.url)}`,
      { signal: controller.signal, cache: "no-store" }
    );
    const data = (await res.json().catch(() => null)) as
      | {
          ok?: boolean;
          code?: SpotifyValidateErrorCode;
          message?: string;
          item?: SpotifyItem;
        }
      | null;

    if (!res.ok || !data?.ok || !data.item) {
      if (res.status === 404 || data?.code === "NOT_FOUND_OR_PRIVATE") {
        return {
          ok: false,
          code: "NOT_FOUND_OR_PRIVATE",
          message: data?.message || PRIVATE_OR_MISSING_MESSAGE,
        };
      }
      if (res.status === 400 || data?.code === "INVALID_FORMAT") {
        return {
          ok: false,
          code: "INVALID_FORMAT",
          message: data?.message || FORMAT_ERROR_MESSAGE,
        };
      }
      return {
        ok: false,
        code: res.status === 504 ? "TIMEOUT" : "NETWORK",
        message:
          data?.message ||
          "Gagal memverifikasi link Spotify. Coba lagi sebentar atau pilih dari preset.",
      };
    }

    const sanitized = sanitizeSpotifyItem(data.item);
    if (!sanitized) {
      return {
        ok: false,
        code: "INVALID_FORMAT",
        message: FORMAT_ERROR_MESSAGE,
      };
    }
    return { ok: true, item: sanitized };
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      code: isAbort ? "TIMEOUT" : "NETWORK",
      message: isAbort
        ? "Koneksi ke Spotify terlalu lama. Coba lagi atau pilih preset belajar di bawah."
        : "Tidak bisa terhubung untuk mengecek link Spotify. Periksa koneksi internetmu.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Baca daftar Saved / Recent Spotify dari localStorage secara SSR-safe. */
export function readSavedSpotifyItems(): SpotifyItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SPOTIFY_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: SpotifyItem[] = [];
    const seen = new Set<string>();
    for (const entry of parsed) {
      const item = sanitizeSpotifyItem(entry);
      if (item && !seen.has(item.uri)) {
        seen.add(item.uri);
        out.push(item);
      }
    }
    return out.slice(0, MAX_SAVED_ITEMS);
  } catch {
    return [];
  }
}

/** Simpan atau pindahkan item Spotify ke urutan paling atas daftar Saved / Recent. */
export function saveSpotifyItem(item: SpotifyItem): SpotifyItem[] {
  const clean = sanitizeSpotifyItem(item);
  if (!clean) return readSavedSpotifyItems();
  const current = readSavedSpotifyItems().filter((x) => x.uri !== clean.uri);
  const next = [clean, ...current].slice(0, MAX_SAVED_ITEMS);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SPOTIFY_SAVED_KEY, JSON.stringify(next));
    } catch {
      // abaikan jika storage penuh / diblokir
    }
  }
  return next;
}

/** Hapus satu item Spotify dari daftar Saved / Recent berdasarkan URI. */
export function removeSavedSpotifyItem(uri: string): SpotifyItem[] {
  const next = readSavedSpotifyItems().filter((x) => x.uri !== uri);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SPOTIFY_SAVED_KEY, JSON.stringify(next));
    } catch {
      // abaikan
    }
  }
  return next;
}

/** Buat URL pencarian Spotify di tab baru berdasarkan kata kunci opsional. */
export function buildSpotifySearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "https://open.spotify.com/search";
  return `https://open.spotify.com/search/${encodeURIComponent(trimmed)}`;
}
