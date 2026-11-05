import type {
  HistoryPeriodFilter,
  HistoryStatusFilter,
  HistorySummaryStats,
  StudySessionHistoryItem,
} from "@/types/session";

/**
 * Separated dummy data for Your Session History.
 * Can be replaced directly by `apiRequest<StudySessionHistoryItem[]>('/sessions/history')`
 * once the backend endpoint is connected.
 */
export const MOCK_SESSION_HISTORY: StudySessionHistoryItem[] = [
  {
    id: "sess-08",
    sessionNumber: "#08",
    title: "Study Session #08",
    date: "2026-11-05",
    displayDate: "Today, Nov 5",
    dateGroup: "Today",
    startTime: "10:30 AM",
    endTime: "11:00 AM",
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    alertCount: 2,
    yawnCount: 2,
    status: "Completed",
    soundtrack: "Soft Piano",
    reflectionMood: "good",
  },
  {
    id: "sess-07",
    sessionNumber: "#07",
    title: "Study Session #07",
    date: "2026-11-04",
    displayDate: "Yesterday, Nov 4",
    dateGroup: "Yesterday",
    startTime: "08:15 PM",
    endTime: "09:10 PM",
    focusDurationMinutes: 45,
    breakDurationMinutes: 10,
    alertCount: 1,
    yawnCount: 1,
    status: "Completed",
    soundtrack: "Ambient Rain",
    reflectionMood: "good",
  },
  {
    id: "sess-06",
    sessionNumber: "#06",
    title: "Study Session #06",
    date: "2026-11-02",
    displayDate: "Nov 2, 2026",
    dateGroup: "Earlier",
    startTime: "02:00 PM",
    endTime: "02:35 PM",
    focusDurationMinutes: 30,
    breakDurationMinutes: 5,
    alertCount: 0,
    yawnCount: 0,
    status: "Interrupted",
    soundtrack: "Lo-Fi Study Beats",
    reflectionMood: "okay",
  },
  {
    id: "sess-05",
    sessionNumber: "#05",
    title: "Study Session #05",
    date: "2026-11-01",
    displayDate: "Nov 1, 2026",
    dateGroup: "Earlier",
    startTime: "04:10 PM",
    endTime: "04:40 PM",
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    alertCount: 1,
    yawnCount: 2,
    status: "Completed",
    soundtrack: "Soft Piano",
    reflectionMood: "good",
  },
  {
    id: "sess-04",
    sessionNumber: "#04",
    title: "Study Session #04",
    date: "2026-10-29",
    displayDate: "Oct 29, 2026",
    dateGroup: "Earlier",
    startTime: "07:30 PM",
    endTime: "08:25 PM",
    focusDurationMinutes: 45,
    breakDurationMinutes: 10,
    alertCount: 2,
    yawnCount: 3,
    status: "Completed",
    soundtrack: "White Noise",
    reflectionMood: "okay",
  },
  {
    id: "sess-03",
    sessionNumber: "#03",
    title: "Study Session #03",
    date: "2026-10-25",
    displayDate: "Oct 25, 2026",
    dateGroup: "Earlier",
    startTime: "01:20 PM",
    endTime: "01:40 PM",
    focusDurationMinutes: 15,
    breakDurationMinutes: 5,
    alertCount: 0,
    yawnCount: 1,
    status: "Interrupted",
    soundtrack: "Soft Piano",
    reflectionMood: "tough",
  },
  {
    id: "sess-02",
    sessionNumber: "#02",
    title: "Study Session #02",
    date: "2026-10-19",
    displayDate: "Oct 19, 2026",
    dateGroup: "Earlier",
    startTime: "09:00 AM",
    endTime: "09:30 AM",
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    alertCount: 1,
    yawnCount: 1,
    status: "Completed",
    soundtrack: "Ambient Rain",
    reflectionMood: "good",
  },
  {
    id: "sess-01",
    sessionNumber: "#01",
    title: "Study Session #01",
    date: "2026-10-12",
    displayDate: "Oct 12, 2026",
    dateGroup: "Earlier",
    startTime: "03:45 PM",
    endTime: "04:15 PM",
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    alertCount: 0,
    yawnCount: 0,
    status: "Completed",
    soundtrack: "Lo-Fi Study Beats",
    reflectionMood: "good",
  },
];

/**
 * Fetches session history list.
 * Currently returns separated dummy data; ready to be swapped with REST API call.
 */
export async function getSessionHistory(): Promise<StudySessionHistoryItem[]> {
  return MOCK_SESSION_HISTORY;
}

/**
 * Filters sessions by period ("all" | "week" | "month") and status ("all" | "Completed" | "Interrupted").
 */
export function filterSessionHistory(
  sessions: StudySessionHistoryItem[],
  period: HistoryPeriodFilter,
  status: HistoryStatusFilter
): StudySessionHistoryItem[] {
  const referenceDate = new Date("2026-11-05T23:59:59");

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
