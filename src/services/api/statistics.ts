import type {
  FocusInsightsData,
  StatisticsDashboardData,
  StatisticsDataPoint,
  StatisticsPeriod,
} from "@/types/statistics";
import type { HistorySummaryStats } from "@/types/session";

/**
 * Separated dummy datasets per period.
 * Ready to be replaced by REST API call `apiRequest<StatisticsDataPoint[]>('/sessions/statistics?period=...')`
 * when backend integration is active.
 */
export const MOCK_STATISTICS_POINTS_BY_PERIOD: Record<
  StatisticsPeriod,
  StatisticsDataPoint[]
> = {
  weekly: [
    {
      label: "Mon",
      fullLabel: "Monday",
      focusMinutes: 25,
      totalSessions: 1,
      completedSessions: 1,
      alertsRecorded: 1,
    },
    {
      label: "Tue",
      fullLabel: "Tuesday",
      focusMinutes: 45,
      totalSessions: 2,
      completedSessions: 1,
      alertsRecorded: 2,
    },
    {
      label: "Wed",
      fullLabel: "Wednesday",
      focusMinutes: 30,
      totalSessions: 1,
      completedSessions: 1,
      alertsRecorded: 0,
    },
    {
      label: "Thu",
      fullLabel: "Thursday",
      focusMinutes: 0,
      totalSessions: 0,
      completedSessions: 0,
      alertsRecorded: 0,
    },
    {
      label: "Fri",
      fullLabel: "Friday",
      focusMinutes: 50,
      totalSessions: 2,
      completedSessions: 2,
      alertsRecorded: 1,
    },
    {
      label: "Sat",
      fullLabel: "Saturday",
      focusMinutes: 70,
      totalSessions: 2,
      completedSessions: 2,
      alertsRecorded: 2,
    },
    {
      label: "Sun",
      fullLabel: "Sunday",
      focusMinutes: 15,
      totalSessions: 1,
      completedSessions: 0,
      alertsRecorded: 1,
    },
  ],
  monthly: [
    {
      label: "Week 1",
      fullLabel: "Week 1 (Oct 8 – Oct 14)",
      focusMinutes: 110,
      totalSessions: 4,
      completedSessions: 3,
      alertsRecorded: 3,
    },
    {
      label: "Week 2",
      fullLabel: "Week 2 (Oct 15 – Oct 21)",
      focusMinutes: 145,
      totalSessions: 5,
      completedSessions: 4,
      alertsRecorded: 4,
    },
    {
      label: "Week 3",
      fullLabel: "Week 3 (Oct 22 – Oct 28)",
      focusMinutes: 185,
      totalSessions: 6,
      completedSessions: 5,
      alertsRecorded: 3,
    },
    {
      label: "Week 4",
      fullLabel: "Week 4 (Oct 29 – Nov 5)",
      focusMinutes: 235,
      totalSessions: 9,
      completedSessions: 7,
      alertsRecorded: 7,
    },
  ],
  "all-time": [
    {
      label: "Aug",
      fullLabel: "August 2026",
      focusMinutes: 320,
      totalSessions: 11,
      completedSessions: 9,
      alertsRecorded: 8,
    },
    {
      label: "Sep",
      fullLabel: "September 2026",
      focusMinutes: 460,
      totalSessions: 15,
      completedSessions: 13,
      alertsRecorded: 11,
    },
    {
      label: "Oct",
      fullLabel: "October 2026",
      focusMinutes: 590,
      totalSessions: 20,
      completedSessions: 16,
      alertsRecorded: 14,
    },
    {
      label: "Nov",
      fullLabel: "November 2026",
      focusMinutes: 235,
      totalSessions: 9,
      completedSessions: 7,
      alertsRecorded: 7,
    },
  ],
};

const PERIOD_SUBTITLES: Record<StatisticsPeriod, string> = {
  weekly: "Mon – Sun · Current week overview",
  monthly: "Last 4 weeks · Monthly progression",
  "all-time": "Aug – Nov 2026 · Overall study journey",
};

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
  const points = customPoints ?? MOCK_STATISTICS_POINTS_BY_PERIOD[period] ?? [];
  const summary = computeSummaryFromPoints(points);
  const insights = computeFocusInsights(points, period);

  return {
    period,
    periodSubtitle: PERIOD_SUBTITLES[period],
    summary,
    points,
    insights,
  };
}

/**
 * Async service function to fetch statistics for the selected period.
 */
export async function getStatisticsByPeriod(
  period: StatisticsPeriod
): Promise<StatisticsDashboardData> {
  return buildStatisticsDashboardData(period);
}
