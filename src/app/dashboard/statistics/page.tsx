"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type {
  StatisticsDashboardData,
  StatisticsPeriod,
} from "@/types/statistics";
import {
  buildStatisticsDashboardData,
  getStatisticsByPeriod,
} from "@/services/api/statistics";
import { getCachedProfile } from "@/services/api/profile";
import { errorMessage as describeError } from "@/services/api/client";
import {
  DashboardSidebar,
  DashboardTopBar,
} from "@/components/dashboard/DashboardNav";
import {
  StaggerContainer,
  StaggerItem,
  TactileButton,
} from "@/components/motion/MotionPrimitives";
import StatisticsSummaryCards from "@/components/statistics/StatisticsSummaryCards";
import StatisticsPeriodFilter from "@/components/statistics/StatisticsPeriodFilter";
import FocusTimeOverviewChart from "@/components/statistics/FocusTimeOverviewChart";
import StudyConsistencyChart from "@/components/statistics/StudyConsistencyChart";
import FocusInsightsSection from "@/components/statistics/FocusInsightsSection";
import StatisticsEmptyState from "@/components/statistics/StatisticsEmptyState";

export default function StatisticsPage() {
  const [avatarSrc, setAvatarSrc] = useState("/images/MaleAva.svg");
  const [period, setPeriod] = useState<StatisticsPeriod>("weekly");
  const [dashboardData, setDashboardData] = useState<StatisticsDashboardData>(
    () => buildStatisticsDashboardData("weekly")
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatistics = useCallback(
    async (selectedPeriod: StatisticsPeriod) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await getStatisticsByPeriod(selectedPeriod);
        setDashboardData(data);
      } catch (err) {
        setErrorMessage(
          `Unable to load your study statistics right now. ${describeError(err)}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setAvatarSrc(getCachedProfile().avatarSrc);
  }, []);

  useEffect(() => {
    loadStatistics(period);
  }, [period, loadStatistics]);

  const hasSessions =
    dashboardData.points.length > 0 &&
    dashboardData.summary.totalSessionsSaved > 0;

  return (
    <div className="relative flex min-h-screen w-full bg-white text-[#351080]">
      <DashboardSidebar />

      {/* =========================================================
          MAIN CONTENT AREA
      ========================================================= */}
      <main className="relative flex-1 px-5 pt-6 pb-12 sm:px-8 md:ml-[198px] md:px-12">
        <DashboardTopBar avatarSrc={avatarSrc} />

        {/* Page Title Section */}
        <div className="mt-2 mb-7 text-center">
          <h1 className="m-0 mb-1.5 text-[28px] font-bold tracking-tight text-[#2A1163] sm:text-[30px]">
            Study Statistics
          </h1>
          <p className="m-0 text-[11.5px] tracking-wide text-[#7B728E]">
            Understand your study rhythm and celebrate the consistency
            you&apos;re building.
          </p>
        </div>

        {/* Main Content Container */}
        <StaggerContainer className="mx-auto max-w-[960px]" stagger={0.07}>
          {/* 1. Three Summary Cards (Consistent with HistoryPage) */}
          <StaggerItem>
            <StatisticsSummaryCards stats={dashboardData.summary} />
          </StaggerItem>

          {/* 2. Period Filter (Weekly | Monthly | All Time) */}
          <StaggerItem>
            <StatisticsPeriodFilter
              period={period}
              periodSubtitle={dashboardData.periodSubtitle}
              onChange={setPeriod}
            />
          </StaggerItem>

          {/* Error State */}
          {errorMessage ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-[20px] border border-[#F5DCE6] bg-[#FDF2F6] px-6 py-10 text-center">
              <div className="text-[14px] font-bold text-[#9F3D69]">
                {errorMessage}
              </div>
              <TactileButton
                type="button"
                onClick={() => loadStatistics(period)}
                style={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#9F3D69] px-4 py-2 text-[11px] !font-bold !text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9F3D69]"
              >
                <RotateCcw size={12} strokeWidth={2.2} />
                <span>Try again</span>
              </TactileButton>
            </div>
          ) : isLoading ? (
            /* Loading State */
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="h-[340px] rounded-[20px] border border-[#EAE4F3] bg-[#FAF8FF] motion-safe:animate-pulse" />
              <div className="h-[340px] rounded-[20px] border border-[#EAE4F3] bg-[#FAF8FF] motion-safe:animate-pulse" />
            </div>
          ) : !hasSessions ? (
            /* Empty State ("Your journey starts here!") */
            <StaggerItem>
              <StatisticsEmptyState />
            </StaggerItem>
          ) : (
            /* 3. Charts + Focus Insights */
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <FocusTimeOverviewChart
                  points={dashboardData.points}
                  period={period}
                />

                <StudyConsistencyChart
                  points={dashboardData.points}
                  period={period}
                />
              </div>

              {/* 4. Your Focus Insights */}
              <FocusInsightsSection insights={dashboardData.insights} />
            </>
          )}
        </StaggerContainer>
      </main>
    </div>
  );
}
