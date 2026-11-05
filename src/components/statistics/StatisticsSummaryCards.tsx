"use client";

import HistorySummaryCards from "@/components/history/HistorySummaryCards";
import type { HistorySummaryStats } from "@/types/session";

interface StatisticsSummaryCardsProps {
  stats: HistorySummaryStats;
}

/**
 * Renders the 3 top summary cards (Sessions Saved, Total Focus Time, Alerts Recorded)
 * keeping 100% visual consistency with the History page summary cards.
 */
export default function StatisticsSummaryCards({
  stats,
}: StatisticsSummaryCardsProps) {
  return <HistorySummaryCards stats={stats} />;
}
