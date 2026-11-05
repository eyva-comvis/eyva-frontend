import type {
  FocusInsightsData,
  StatisticsDashboardData,
  StatisticsDataPoint,
  StatisticsPeriod,
} from "@/types/statistics";
import type { HistorySummaryStats } from "@/types/session";

import { listAllSessions, type SessionListItem } from "./sessions";
import { historyStatusOf } from "./history";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthLong = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const dayShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function emptyPoint(label: string, fullLabel: string): StatisticsDataPoint {
  return { label, fullLabel, focusMinutes: 0, totalSessions: 0, completedSessions: 0, alertsRecorded: 0 };
}

function add(pt: StatisticsDataPoint, s: SessionListItem): void {
  pt.focusMinutes += Math.round(s.total_study_seconds / 60);
  pt.totalSessions += 1;
  if (historyStatusOf(s) === "Completed") pt.completedSessions += 1;
  pt.alertsRecorded += s.alert_1_count + s.alert_2_count;
}

/** Kelompokkan sesi per hari (minggu ini), per minggu (4 minggu terakhir), atau per bulan (semua waktu). */
export function buildPoints(
  sessions: SessionListItem[],
  period: StatisticsPeriod,
  now = new Date()
): StatisticsDataPoint[] {
  const done = sessions.filter((s) => s.status !== "ACTIVE");
  const today = startOfDay(now);

  if (period === "weekly") {
    const monday = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY_MS);
    const points = WEEKDAYS.map((name) => emptyPoint(name.slice(0, 3), name));
    for (const s of done) {
      const idx = Math.floor((startOfDay(new Date(s.started_at)).getTime() - monday.getTime()) / DAY_MS);
      if (idx >= 0 && idx < 7) add(points[idx], s);
    }
    return points;
  }

  if (period === "monthly") {
    const first = new Date(today.getTime() - 27 * DAY_MS);
    const points = [0, 1, 2, 3].map((w) => {
      const from = new Date(first.getTime() + w * 7 * DAY_MS);
      const to = new Date(from.getTime() + 6 * DAY_MS);
      return emptyPoint(`Week ${w + 1}`, `Week ${w + 1} (${dayShort.format(from)} – ${dayShort.format(to)})`);
    });
    for (const s of done) {
      const idx = Math.floor((startOfDay(new Date(s.started_at)).getTime() - first.getTime()) / (7 * DAY_MS));
      if (idx >= 0 && idx < 4) add(points[idx], s);
    }
    return points;
  }

  // all-time: per bulan, dari bulan sesi pertama (maks. 12 bulan terakhir) sampai bulan ini
  const oldest = done.length ? new Date(done[done.length - 1].started_at) : now;
  let cursor = new Date(oldest.getFullYear(), oldest.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const minStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  if (cursor < minStart) cursor = minStart;
  const points: StatisticsDataPoint[] = [];
  const index = new Map<string, StatisticsDataPoint>();
  while (cursor <= lastMonth) {
    const pt = emptyPoint(monthShort.format(cursor), monthLong.format(cursor));
    points.push(pt);
    index.set(`${cursor.getFullYear()}-${cursor.getMonth()}`, pt);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  for (const s of done) {
    const d = new Date(s.started_at);
    const pt = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (pt) add(pt, s);
  }
  return points;
}

function periodSubtitle(period: StatisticsPeriod, points: StatisticsDataPoint[]): string {
  if (period === "weekly") return "Mon – Sun · Current week overview";
  if (period === "monthly") return "Last 4 weeks · Monthly progression";
  const first = points[0]?.label ?? "";
  const last = points[points.length - 1]?.fullLabel ?? "";
  return points.length > 1 ? `${first} – ${last} · Overall study journey` : `${last} · Overall study journey`;
}


/**
 * Dynamically computes summary card metrics from data points.
 */
export function computeSummaryFromPoints(
  points: StatisticsDataPoint[]
): HistorySummaryStats {
  return points.reduce<HistorySummaryStats>(
    (acc, pt) => ({
      totalSessionsSaved: acc.totalSessionsSaved + pt.totalSessions,
      totalFocusMinutes: acc.totalFocusMinutes + pt.focusMinutes,
      totalAlertsRecorded: acc.totalAlertsRecorded + pt.alertsRecorded,
    }),
    {
      totalSessionsSaved: 0,
      totalFocusMinutes: 0,
      totalAlertsRecorded: 0,
    }
  );
}

/**
 * Dynamically calculates all 4 Focus Insights from the dataset.
 * Safely handles empty arrays or 1–2 sessions without dividing by zero.
 */
export function computeFocusInsights(
  points: StatisticsDataPoint[],
  period: StatisticsPeriod
): FocusInsightsData {
  if (!points || points.length === 0) {
    return {
      mostFocusedDay: { label: "—", focusMinutes: 0 },
      averageFocusDurationMinutes: 0,
      totalCompletedSessions: 0,
      totalSessions: 0,
      consistency: {
        activeBuckets: 0,
        totalBuckets: 0,
        percentage: 0,
        summaryLabel: "No sessions yet",
        description: "Complete your first study session to see your habit consistency.",
      },
    };
  }

  let bestPoint = points[0];
  let totalFocusMinutes = 0;
  let totalCompletedSessions = 0;
  let totalSessions = 0;
  let activeBuckets = 0;

  for (const pt of points) {
    totalFocusMinutes += pt.focusMinutes;
    totalCompletedSessions += pt.completedSessions;
    totalSessions += pt.totalSessions;
    if (pt.completedSessions > 0 || pt.focusMinutes > 0) {
      activeBuckets += 1;
    }
    if (pt.focusMinutes > bestPoint.focusMinutes) {
      bestPoint = pt;
    }
  }

  const denominator =
    totalCompletedSessions > 0 ? totalCompletedSessions : totalSessions;
  const averageFocusDurationMinutes =
    denominator > 0 ? Math.round(totalFocusMinutes / denominator) : 0;

  const totalBuckets = points.length;
  const percentage =
    totalBuckets > 0 ? Math.round((activeBuckets / totalBuckets) * 100) : 0;

  const unitWord =
    period === "weekly"
      ? "days"
      : period === "monthly"
        ? "weeks"
        : "months";

  let summaryLabel = `${activeBuckets} of ${totalBuckets} ${unitWord} active`;
  let description =
    "Steady rhythm! Regular focus sessions help maintain a comfortable study flow.";

  if (percentage >= 80) {
    description =
      "Consistent study routine across this period. Keep pacing yourself with regular breaks.";
  } else if (percentage >= 50) {
    description =
      "Balanced study rhythm. Showing up several times a week builds lasting momentum.";
  } else if (percentage > 0) {
    description =
      "Getting started! Even a few focused sessions make a meaningful difference.";
  } else {
    summaryLabel = "No active sessions";
    description =
      "Start a focus session whenever you feel ready to build your study rhythm.";
  }

  return {
    mostFocusedDay: {
      label: bestPoint.focusMinutes > 0 ? bestPoint.fullLabel : "—",
      focusMinutes: bestPoint.focusMinutes,
    },
    averageFocusDurationMinutes,
    totalCompletedSessions,
    totalSessions,
    consistency: {
      activeBuckets,
      totalBuckets,
      percentage,
      summaryLabel,
      description,
    },
  };
}

/**
 * Builds the complete dashboard payload for a given period.
 */
export function buildStatisticsDashboardData(
  period: StatisticsPeriod,
  customPoints?: StatisticsDataPoint[]
): StatisticsDashboardData {
  const points = customPoints ?? [];
  const summary = computeSummaryFromPoints(points);
  const insights = computeFocusInsights(points, period);

  return {
    period,
    periodSubtitle: periodSubtitle(period, points),
    summary,
    points,
    insights,
  };
}

/**
 * Async service function to fetch statistics for the selected period.
 */
let cachedSessions: { at: number; items: SessionListItem[] } | null = null;

export async function getStatisticsByPeriod(
  period: StatisticsPeriod
): Promise<StatisticsDashboardData> {
  // Daftar sesi dipakai ulang 30 detik agar ganti filter tidak memanggil server berulang kali
  if (!cachedSessions || Date.now() - cachedSessions.at > 30_000) {
    cachedSessions = { at: Date.now(), items: await listAllSessions() };
  }
  return buildStatisticsDashboardData(period, buildPoints(cachedSessions.items, period));
}
