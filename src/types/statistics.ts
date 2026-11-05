import type { HistorySummaryStats } from "./session";

export type StatisticsPeriod = "weekly" | "monthly" | "all-time";

export interface StatisticsDataPoint {
  /** Short label displayed on horizontal X-axis (e.g. "Mon", "Week 1", "Oct") */
  label: string;
  /** Full label displayed in tooltips and insights (e.g. "Monday", "Week 1 (Nov 1–7)", "October 2026") */
  fullLabel: string;
  /** Total focus duration in minutes for this day/bucket */
  focusMinutes: number;
  /** Total sessions saved (completed + interrupted) in this bucket */
  totalSessions: number;
  /** Number of completed study sessions in this bucket */
  completedSessions: number;
  /** Number of drowsiness alerts recorded in this bucket */
  alertsRecorded: number;
}

export interface FocusInsightsData {
  mostFocusedDay: {
    label: string;
    focusMinutes: number;
  };
  averageFocusDurationMinutes: number;
  totalCompletedSessions: number;
  totalSessions: number;
  consistency: {
    activeBuckets: number;
    totalBuckets: number;
    percentage: number;
    summaryLabel: string;
    description: string;
  };
}

export interface StatisticsDashboardData {
  period: StatisticsPeriod;
  periodSubtitle: string;
  summary: HistorySummaryStats;
  points: StatisticsDataPoint[];
  insights: FocusInsightsData;
}
