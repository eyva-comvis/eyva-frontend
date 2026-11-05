import type { SessionSummary } from "@/types/session";
import { apiRequest } from "./client";

export type DrowsinessStatus = "NORMAL" | "POSSIBLE_DROWSINESS" | "DROWSY_NEED_REST" | "UNCERTAIN";
export type AlertAction = "ACKNOWLEDGE" | "CONTINUE" | "END_SESSION";
export type EndReason = "MANUAL" | "COMPLETED" | "ENDED_AFTER_SECOND_ALERT";

export interface PredictAlert {
  id: string;
  level: 1 | 2;
  type: string;
  requires_response: boolean;
  actions: AlertAction[];
}

export interface PredictResult {
  session_id: string;
  block_id: string | null;
  status: DrowsinessStatus;
  drowsiness_score: number;
  face_detected: boolean;
  blink_count: number;
  yawn_count: number;
  eye_closure_count: number;
  alert: PredictAlert | null;
  timer_paused: boolean;
}

export interface SessionListItem {
  id: string;
  title: string;
  reflection: "good" | "okay" | "tough" | null;
  soundtrack: string | null;
  status: "ACTIVE" | "ENDED" | "INTERRUPTED";
  started_at: string;
  ended_at: string | null;
  end_reason: string | null;
  total_study_seconds: number;
  total_break_seconds: number;
  estimated_drowsy_seconds: number;
  blink_count: number;
  yawn_count: number;
  eye_closure_count: number;
  alert_1_count: number;
  alert_2_count: number;
}

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const sessionsApi = {
  create: (cfg: { title: string; studyMinutes: number; breakMinutes: number; soundtrack?: string | null }) =>
    apiRequest<{ id: string }>(
      "/sessions",
      json({
        title: cfg.title,
        configured_study_seconds: Math.round(cfg.studyMinutes * 60),
        configured_break_seconds: Math.round(cfg.breakMinutes * 60),
        soundtrack: cfg.soundtrack ?? null,
      })
    ),
  startBlock: (sid: string) => apiRequest<{ id: string }>(`/sessions/${sid}/blocks`, { method: "POST" }),
  completeBlock: (sid: string, bid: string) =>
    apiRequest(`/sessions/${sid}/blocks/${bid}/complete`, { method: "POST" }),
  pause: (sid: string, bid: string) => apiRequest(`/sessions/${sid}/blocks/${bid}/pause`, { method: "POST" }),
  resume: (sid: string, bid: string) => apiRequest(`/sessions/${sid}/blocks/${bid}/resume`, { method: "POST" }),
  predict: (sid: string, imageB64: string, requestId: string) =>
    apiRequest<PredictResult>(
      `/sessions/${sid}/predict`,
      json({ image_b64: imageB64, client_ts: new Date().toISOString(), request_id: requestId })
    ),
  respondAlert: (sid: string, alertId: string, action: AlertAction) =>
    apiRequest<{ session_ended: boolean; show_advice: boolean; advice: string[] }>(
      `/sessions/${sid}/alerts/${alertId}/respond`,
      json({ action })
    ),
  end: (sid: string, reason: EndReason) => apiRequest<SessionSummary>(`/sessions/${sid}/end`, json({ reason })),
  summary: (sid: string) => apiRequest<SessionSummary>(`/sessions/${sid}/summary`),
  reflect: (sid: string, mood: "good" | "okay" | "tough") =>
    apiRequest(`/sessions/${sid}/reflection`, json({ mood })),
  list: (limit = 100, offset = 0) =>
    apiRequest<{ items: SessionListItem[] }>(`/sessions?limit=${limit}&offset=${offset}`),
  /** Rekomendasi AI untuk halaman Summary (LLM; bila tidak tersedia, teks cadangan). */
  insights: (sid: string) => apiRequest<InsightResult>(`/sessions/${sid}/insights`, { method: "POST" }),
  /** Tip AI singkat untuk halaman Break (sesi harus masih berjalan). */
  breakTip: (sid: string) => apiRequest<InsightResult>(`/sessions/${sid}/break-tip`, { method: "POST" }),
};

export interface InsightResult {
  source: "llm" | "fallback";
  text: string;
  model: string | null;
}

export interface StatsResult {
  days: number;
  sessions: number;
  total_focus_seconds: number;
  alerts: number;
  current_streak_days: number;
  mood_counts: Record<string, number>;
  insight: string;
}

export const statsApi = {
  get: (days = 7) => apiRequest<StatsResult>(`/stats?days=${days}`),
};

/** Semua sesi milik pengguna (terbaru dulu), dibaca per halaman 100 sampai habis atau `max`. */
export async function listAllSessions(max = 500): Promise<SessionListItem[]> {
  const out: SessionListItem[] = [];
  for (let offset = 0; offset < max; offset += 100) {
    const { items } = await sessionsApi.list(100, offset);
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

/** Sesi yang sedang berjalan di browser ini (bertahan saat pindah ke halaman Break). */
export interface ActiveSession {
  sessionId: string;
  blockId: string;
  /** true = sedang jeda karena "quick reset" setelah alert 2; blok dilanjutkan saat kembali dari Break */
  resetBreak?: boolean;
}

const ACTIVE_KEY = "eyva_active_session";

export function getActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveSession) : null;
  } catch {
    return null;
  }
}

export function setActiveSession(s: ActiveSession | null): void {
  try {
    if (s) localStorage.setItem(ACTIVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // abaikan
  }
}

/** Ringkasan sesi terakhir untuk halaman Summary. */
export function saveLastSummary(summary: SessionSummary): void {
  try {
    localStorage.setItem("eyva_last_summary", JSON.stringify(summary));
  } catch {
    // abaikan
  }
}

export function getLastSummary(): SessionSummary | null {
  try {
    const raw = localStorage.getItem("eyva_last_summary");
    return raw ? (JSON.parse(raw) as SessionSummary) : null;
  } catch {
    return null;
  }
}
