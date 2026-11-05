"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Home as HomeIcon,
  History as HistoryIcon,
  BarChart2,
  Settings,
} from "lucide-react";
import type {
  HistoryPeriodFilter,
  HistoryStatusFilter,
  StudySessionHistoryItem,
} from "@/types/session";
import {
  calculateHistorySummary,
  filterSessionHistory,
  getSessionHistory,
  MOCK_SESSION_HISTORY,
} from "@/services/api/history";
import HistorySummaryCards from "@/components/history/HistorySummaryCards";
import SessionHistoryList from "@/components/history/SessionHistoryList";
import SessionDetailModal from "@/components/history/SessionDetailModal";

export default function HistoryPage() {
  const [avatarSrc, setAvatarSrc] = useState("/images/MaleAva.svg");
  const [sessions, setSessions] =
    useState<StudySessionHistoryItem[]>(MOCK_SESSION_HISTORY);
  const [periodFilter, setPeriodFilter] = useState<HistoryPeriodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");
  const [selectedSession, setSelectedSession] =
    useState<StudySessionHistoryItem | null>(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem("eyva_avatar");
    if (savedAvatar) {
      setAvatarSrc(savedAvatar);
    }

    let isMounted = true;
    getSessionHistory().then((data) => {
      if (isMounted) {
        setSessions(data);
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
      {/* =========================================================
          SIDEBAR (Desktop Fixed Left Sidebar matching HomePage)
      ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden w-[198px] flex-col justify-between border-r border-[#EAE5F2] bg-white px-4 pt-6 pb-0 transition-all duration-200 md:flex ${
          selectedSession ? "blur-[3px] pointer-events-none select-none" : ""
        }`}
      >
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

          {/* Navigation (History Active) */}
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
              style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full bg-[#351080] px-4 py-2.5 text-[12.5px] !font-bold !text-white transition"
            >
              <HistoryIcon size={16} strokeWidth={2.2} />
              <span>History</span>
            </Link>

            <Link
              href="/dashboard/statistics"
              style={{ color: "#351080", fontWeight: 700, fontSize: "12.5px" }}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[12.5px] !font-bold !text-[#351080] transition hover:bg-[#F5F1FC]"
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
      <main
        className={`relative flex-1 px-5 pt-6 pb-12 sm:px-8 md:ml-[198px] md:px-12 transition-all duration-200 ${
          selectedSession ? "blur-[3px] pointer-events-none select-none" : ""
        }`}
      >
        {/* Top Row: Mobile Logo & Nav + Top Right Profile Avatar */}
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
            style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "11.5px" }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#351080] px-3.5 py-1.5 text-[11.5px] !font-bold !text-white"
          >
            <HistoryIcon size={14} strokeWidth={2.2} />
            <span>History</span>
          </Link>
          <Link
            href="/dashboard/statistics"
            style={{ color: "#351080", fontWeight: 700, fontSize: "11.5px" }}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] !font-bold !text-[#351080] hover:bg-[#F5F1FC]"
          >
            <BarChart2 size={14} strokeWidth={2.2} />
            <span>Statistics</span>
          </Link>
        </nav>

        {/* Page Title Section */}
        <div className="mt-2 mb-7 text-center">
          <h1 className="m-0 mb-1.5 text-[28px] sm:text-[30px] font-bold tracking-tight text-[#2A1163]">
            Session History
          </h1>
          <p className="m-0 text-[11.5px] tracking-wide text-[#7B728E]">
            Every little effort counts. Here&apos;s a look back at the sessions
            you&apos;ve shown up for.
          </p>
        </div>

        {/* Main Content Container */}
        <div className="mx-auto max-w-[960px]">
          {/* 1. Three Summary Cards */}
          <HistorySummaryCards stats={summaryStats} />

          {/* 2. Your Session History Card (Filters + Grouped List + Load More) */}
          <SessionHistoryList
            sessions={filteredSessions}
            periodFilter={periodFilter}
            statusFilter={statusFilter}
            onPeriodChange={setPeriodFilter}
            onStatusChange={setStatusFilter}
            onSelectSession={setSelectedSession}
            onResetFilters={handleResetFilters}
          />
        </div>
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
