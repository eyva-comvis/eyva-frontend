export type DrowsinessStatus =
  | "NORMAL"
  | "POSSIBLE_DROWSINESS"
  | "DROWSY_NEED_REST"
  | "UNCERTAIN/NO_FACE";

/** Ringkasan sesi dari backend (POST /sessions/{id}/end atau GET /sessions/{id}/summary). */
export interface SessionSummary {
  session_id: string;
  status: string;
  title: string;
  reflection: "good" | "okay" | "tough" | null;
  started_at: string | null;
  end_reason: string | null;
  total_study_seconds: number;
  total_break_seconds: number;
  total_pause_seconds: number;
  blocks_completed: number;
  blocks_stopped_early: number;
  blink_count: number;
  yawn_count: number;
  eye_closure_count: number;
  estimated_drowsy_seconds: number;
  alert_1_count: number;
  alert_2_count: number;
}

export interface SessionConfig {
  studyMinutes: number;
  breakMinutes: number;
}

export type SessionStatus = "Completed" | "Interrupted";

export type SessionDateGroup = "Today" | "Yesterday" | "Earlier";

export type HistoryPeriodFilter = "all" | "week" | "month";

export type HistoryStatusFilter = "all" | "Completed" | "Interrupted";

export interface StudySessionHistoryItem {
  id: string;
  sessionNumber: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  displayDate: string; // e.g., "Nov 5, 2026"
  dateGroup: SessionDateGroup;
  startTime: string; // e.g., "10:30 AM"
  endTime: string; // e.g., "11:00 AM"
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  alertCount: number;
  yawnCount?: number;
  status: SessionStatus;
  soundtrack?: string;
  reflectionMood?: "good" | "okay" | "tough";
}

export interface HistorySummaryStats {
  totalSessionsSaved: number;
  totalFocusMinutes: number;
  totalAlertsRecorded: number;
}
