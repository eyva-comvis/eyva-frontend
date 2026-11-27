"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  HistoryPeriodFilter,
  HistoryStatusFilter,
  StudySessionHistoryItem,
} from "@/types/session";
import {
  calculateHistorySummary,
  filterSessionHistory,
  getSessionHistory,
} from "@/services/api/history";
import { getCachedProfile } from "@/services/api/profile";
import { errorMessage } from "@/services/api/client";
import {
  DashboardSidebar,
  DashboardTopBar,
} from "@/components/dashboard/DashboardNav";
import { StaggerContainer, StaggerItem } from "@/components/motion/MotionPrimitives";
import HistorySummaryCards from "@/components/history/HistorySummaryCards";
import SessionHistoryList from "@/components/history/SessionHistoryList";
import SessionDetailModal from "@/components/history/SessionDetailModal";

export default function HistoryPage() {
  const [avatarSrc, setAvatarSrc] = useState("/images/MaleAva.svg");
  const [sessions, setSessions] =
    useState<StudySessionHistoryItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [periodFilter, setPeriodFilter] = useState<HistoryPeriodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");
  const [selectedSession, setSelectedSession] =
    useState<StudySessionHistoryItem | null>(null);

  useEffect(() => {
    setAvatarSrc(getCachedProfile().avatarSrc);

    let isMounted = true;
    getSessionHistory()
      .then((data) => {
        if (isMounted) {
          setSessions(data);
          setLoadState("ready");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(errorMessage(err));
          setLoadState("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSessions = useMemo(
    () => filterSessionHistory(sessions, periodFilter, statusFilter),
    [sessions, periodFilter, statusFilter]
  );

  const summaryStats = useMemo(
    () => calculateHistorySummary(filteredSessions),
    [filteredSessions]
  );

  const handleResetFilters = () => {
    setPeriodFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="relative flex min-h-screen w-full bg-white text-[#351080]">
      <DashboardSidebar blurred={Boolean(selectedSession)} />

      {/* =========================================================
          MAIN CONTENT AREA
      ========================================================= */}
      <main
        className={`relative flex-1 px-5 pt-6 pb-12 transition-[filter] duration-200 sm:px-8 md:ml-[198px] md:px-12 ${
          selectedSession ? "blur-[3px] pointer-events-none select-none" : ""
        }`}
      >
        <DashboardTopBar avatarSrc={avatarSrc} />

        {/* Page Title Section */}
        <div className="mt-2 mb-7 text-center">
          <h1 className="m-0 mb-1.5 text-[28px] font-bold tracking-tight text-[#2A1163] sm:text-[30px]">
            Session History
          </h1>
          <p className="m-0 text-[11.5px] tracking-wide text-[#7B728E]">
            Every little effort counts. Here&apos;s a look back at the sessions
            you&apos;ve shown up for.
          </p>
        </div>

        {/* Main Content Container */}
        <StaggerContainer className="mx-auto max-w-[960px]" stagger={0.07}>
          {/* 1. Three Summary Cards */}
          <StaggerItem>
            <HistorySummaryCards stats={summaryStats} />
          </StaggerItem>

          {loadState === "loading" && (
            <p className="mt-5 text-center text-[11.5px] text-[#7B728E]" role="status">
              Loading your sessions…
            </p>
          )}
          {loadState === "error" && (
            <p className="mt-5 text-center text-[11.5px] font-medium text-[#9F3D69]" role="alert">
              {loadError}
            </p>
          )}

          {/* 2. Your Session History Card (Filters + Grouped List + Load More) */}
          <StaggerItem>
            <SessionHistoryList
              sessions={filteredSessions}
              periodFilter={periodFilter}
              statusFilter={statusFilter}
              onPeriodChange={setPeriodFilter}
              onStatusChange={setStatusFilter}
              onSelectSession={setSelectedSession}
              onResetFilters={handleResetFilters}
            />
          </StaggerItem>
        </StaggerContainer>
      </main>

      {/* =========================================================
          MODAL: SESSION DETAIL POPUP
      ========================================================= */}
      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
