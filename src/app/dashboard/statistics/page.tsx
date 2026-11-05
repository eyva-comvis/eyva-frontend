"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Home as HomeIcon,
  History as HistoryIcon,
  BarChart2,
  Settings,
  RotateCcw,
} from "lucide-react";
import type {
  StatisticsDashboardData,
  StatisticsPeriod,
} from "@/types/statistics";
import {
  buildStatisticsDashboardData,
  getStatisticsByPeriod,
} from "@/services/api/statistics";
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatistics = useCallback(
    async (selectedPeriod: StatisticsPeriod) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await getStatisticsByPeriod(selectedPeriod);
        setDashboardData(data);
      } catch {
        setErrorMessage(
          "Unable to load your study statistics right now. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const savedAvatar = localStorage.getItem("eyva_avatar");
    if (savedAvatar) {
      setAvatarSrc(savedAvatar);
    }
  }, []);

  useEffect(() => {
    loadStatistics(period);
  }, [period, loadStatistics]);

  const hasSessions =
    dashboardData.points.length > 0 &&
    dashboardData.summary.totalSessionsSaved > 0;

  return (
    <div className="relative flex min-h-screen w-full bg-white text-[#351080]">
      {/* =========================================================
          SIDEBAR (Desktop Fixed Left Sidebar matching Home & History)
      ========================================================= */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[198px] flex-col justify-between border-r border-[#EAE5F2] bg-white px-4 pt-6 pb-0 md:flex">
        <div>
          {/* Brand Logo */}
          <div className="mb-8 px-2">
            <Link href="/dashboard/home" aria-label="EYVA Home">
              <Image
                src="/images/eyva_icon.svg"
                alt="EYVA Smart Study Companion"
                width={108}
                height={52}
                priority
                className="h-auto w-[108px]"
              />
            </Link>
          </div>

          {/* Navigation (Statistics Active) */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/dashboard/home"
              style={{ color: "#351080", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[12.5px] !font-bold !text-[#351080] transition hover:bg-[#F5F1FC]"
            >
              <HomeIcon size={16} strokeWidth={2.2} />
              <span>Home</span>
            </Link>

            <Link
              href="/dashboard/history"
              style={{ color: "#351080", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[12.5px] !font-bold !text-[#351080] transition hover:bg-[#F5F1FC]"
            >
              <HistoryIcon size={16} strokeWidth={2.2} />
              <span>History</span>
            </Link>

            <Link
              href="/dashboard/statistics"
              style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full bg-[#351080] px-4 py-2.5 text-[12.5px] !font-bold !text-white transition"
            >
              <BarChart2 size={16} strokeWidth={2.2} />
              <span>Statistics</span>
            </Link>
          </nav>
        </div>

        {/* Leaf Decoration at Bottom Left */}
        <div className="mt-auto flex justify-center overflow-hidden pt-4">
          <Image
            src="/images/leaf_for_homepage.svg"
            alt="Decorative Leaf"
            width={118}
            height={208}
            className="h-auto w-[115px] select-none pointer-events-none translate-y-1"
          />
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT AREA
      ========================================================= */}
      <main className="relative flex-1 px-5 pt-6 pb-12 sm:px-8 md:ml-[198px] md:px-12">
        {/* Top Row: Mobile Logo & Top Right Profile Avatar */}
        <div className="flex items-center justify-between md:justify-end">
          {/* Mobile Brand Logo */}
          <div className="md:hidden">
            <Link href="/dashboard/home" aria-label="EYVA Home">
              <Image
                src="/images/eyva_icon.svg"
                alt="EYVA Smart Study Companion"
                width={98}
                height={46}
                priority
                className="h-auto w-[98px]"
              />
            </Link>
          </div>

          {/* Top Right Profile Avatar with Gear Icon */}
          <Link
            href="/dashboard/profile"
            aria-label="Edit Profile"
            className="relative inline-block transition-transform hover:scale-105"
          >
            <div className="h-[38px] w-[38px] overflow-hidden rounded-full border-2 border-[#351080] bg-[#F9E8FF]">
              <Image
                src={avatarSrc}
                alt="User Avatar"
                width={38}
                height={38}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-white bg-[#EDE6FA] text-[#351080] shadow-xs">
              <Settings size={10} strokeWidth={2.5} />
            </span>
          </Link>
        </div>

        {/* Mobile Navigation Pills (Shown on screens < md) */}
        <nav className="mt-4 flex items-center gap-2 border-b border-[#EFEAF7] pb-3 md:hidden">
          <Link
            href="/dashboard/home"
            style={{ color: "#351080", fontWeight: 700, fontSize: "11.5px" }}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] !font-bold !text-[#351080] hover:bg-[#F5F1FC]"
          >
            <HomeIcon size={14} strokeWidth={2.2} />
            <span>Home</span>
          </Link>
          <Link
            href="/dashboard/history"
            style={{ color: "#351080", fontWeight: 700, fontSize: "11.5px" }}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] !font-bold !text-[#351080] hover:bg-[#F5F1FC]"
          >
            <HistoryIcon size={14} strokeWidth={2.2} />
            <span>History</span>
          </Link>
          <Link
            href="/dashboard/statistics"
            style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "11.5px" }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#351080] px-3.5 py-1.5 text-[11.5px] !font-bold !text-white"
          >
            <BarChart2 size={14} strokeWidth={2.2} />
            <span>Statistics</span>
          </Link>
        </nav>

        {/* Page Title Section */}
        <div className="mt-2 mb-7 text-center">
          <h1 className="m-0 mb-1.5 text-[28px] sm:text-[30px] font-bold tracking-tight text-[#2A1163]">
            Study Statistics
          </h1>
          <p className="m-0 text-[11.5px] tracking-wide text-[#7B728E]">
            Understand your study rhythm and celebrate the consistency
            you&apos;re building.
          </p>
        </div>

        {/* Main Content Container */}
        <div className="mx-auto max-w-[960px]">
          {/* 1. Three Summary Cards (Consistent with HistoryPage) */}
          <StatisticsSummaryCards stats={dashboardData.summary} />

          {/* 2. Period Filter (Weekly | Monthly | All Time) */}
          <StatisticsPeriodFilter
            period={period}
            periodSubtitle={dashboardData.periodSubtitle}
            onChange={setPeriod}
          />

          {/* Error State */}
          {errorMessage ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-[20px] border border-[#F5DCE6] bg-[#FDF2F6] px-6 py-10 text-center">
              <div className="text-[14px] font-bold text-[#9F3D69]">
                {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => loadStatistics(period)}
                style={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#9F3D69] px-4 py-2 text-[11px] !font-bold !text-white transition hover:opacity-90"
              >
                <RotateCcw size={12} strokeWidth={2.2} />
                <span>Try again</span>
              </button>
            </div>
          ) : isLoading ? (
            /* Loading State */
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="h-[340px] animate-pulse rounded-[20px] border border-[#EAE4F3] bg-[#FAF8FF]" />
              <div className="h-[340px] animate-pulse rounded-[20px] border border-[#EAE4F3] bg-[#FAF8FF]" />
            </div>
          ) : !hasSessions ? (
            /* Empty State ("Your journey starts here!") */
            <StatisticsEmptyState />
          ) : (
            /* 3. Charts + Focus Insights */
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Focus Time Overview (Bar Chart) */}
                <FocusTimeOverviewChart
                  points={dashboardData.points}
                  period={period}
                />

                {/* Study Consistency (Area Chart + Daily Habit Strip) */}
                <StudyConsistencyChart
                  points={dashboardData.points}
                  period={period}
                />
              </div>

              {/* 4. Your Focus Insights */}
              <FocusInsightsSection insights={dashboardData.insights} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
