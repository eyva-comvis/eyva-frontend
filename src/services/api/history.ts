import type {
  HistoryPeriodFilter,
  HistoryStatusFilter,
  HistorySummaryStats,
  StudySessionHistoryItem,
} from "@/types/session";

import { listAllSessions, type SessionListItem } from "./sessions";

const pad = (n: number) => String(n).padStart(2, "0");

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateGroupOf(d: Date, now = new Date()): StudySessionHistoryItem["dateGroup"] {
  const today = localDateKey(now);
  const yesterday = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const key = localDateKey(d);
  return key === today ? "Today" : key === yesterday ? "Yesterday" : "Earlier";
}

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Selesai normal (timer habis atau diakhiri pengguna) = Completed; berhenti karena alert/server = Interrupted. */
export function historyStatusOf(item: SessionListItem): StudySessionHistoryItem["status"] {
  if (item.status === "INTERRUPTED") return "Interrupted";
  return item.end_reason === "ENDED_AFTER_SECOND_ALERT" ? "Interrupted" : "Completed";
}

/** Ubah daftar sesi backend (terbaru dulu) ke bentuk yang dipakai halaman History. */
export function toHistoryItems(items: SessionListItem[]): StudySessionHistoryItem[] {
  const finished = items.filter((i) => i.status !== "ACTIVE");
  const total = finished.length;
  return finished.map((i, idx) => {
    const start = new Date(i.started_at);
    const end = i.ended_at ? new Date(i.ended_at) : null;
    const group = dateGroupOf(start);
    const number = pad(total - idx);
    return {
      id: i.id,
      sessionNumber: `#${number}`,
      title: i.title || `Study Session #${number}`,
      date: localDateKey(start),
      displayDate: group === "Earlier" ? dateFmt.format(start) : `${group}, ${dateFmt.format(start).replace(/, \d{4}$/, "")}`,
      dateGroup: group,
      startTime: timeFmt.format(start),
      endTime: end ? timeFmt.format(end) : "—",
      focusDurationMinutes: Math.round(i.total_study_seconds / 60),
      breakDurationMinutes: Math.round(i.total_break_seconds / 60),
      alertCount: i.alert_1_count + i.alert_2_count,
      yawnCount: i.yawn_count,
      status: historyStatusOf(i),
      reflectionMood: i.reflection ?? undefined,
    };
  });
}

export async function getSessionHistory(): Promise<StudySessionHistoryItem[]> {
  return toHistoryItems(await listAllSessions());
}

/**
 * Filters sessions by period ("all" | "week" | "month") and status ("all" | "Completed" | "Interrupted").
 */
export function filterSessionHistory(
  sessions: StudySessionHistoryItem[],
  period: HistoryPeriodFilter,
  status: HistoryStatusFilter
): StudySessionHistoryItem[] {
  const referenceDate = new Date();

  return sessions.filter((session) => {
    // Status filter
    if (status !== "all" && session.status !== status) {
      return false;
    }

    // Period filter
    if (period !== "all") {
      const sessionDate = new Date(`${session.date}T12:00:00`);
      const diffDays =
        (referenceDate.getTime() - sessionDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (period === "week" && diffDays > 7) {
        return false;
      }
      if (period === "month" && diffDays > 30) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculates aggregate summary metrics from a list of sessions.
 */
export function calculateHistorySummary(
  sessions: StudySessionHistoryItem[]
): HistorySummaryStats {
  return sessions.reduce<HistorySummaryStats>(
    (acc, item) => ({
      totalSessionsSaved: acc.totalSessionsSaved + 1,
      totalFocusMinutes: acc.totalFocusMinutes + item.focusDurationMinutes,
      totalAlertsRecorded: acc.totalAlertsRecorded + item.alertCount,
    }),
    {
      totalSessionsSaved: 0,
      totalFocusMinutes: 0,
      totalAlertsRecorded: 0,
    }
  );
}

/**
 * Formats total minutes into human-readable string like "2h 30m" or "45m".
 */
export function formatFocusTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
