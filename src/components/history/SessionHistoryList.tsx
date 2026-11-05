"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type {
  HistoryPeriodFilter,
  HistoryStatusFilter,
  SessionDateGroup,
  StudySessionHistoryItem,
} from "@/types/session";
import SessionHistoryFilter from "./SessionHistoryFilter";
import SessionHistoryItem from "./SessionHistoryItem";

interface SessionHistoryListProps {
  sessions: StudySessionHistoryItem[];
  periodFilter: HistoryPeriodFilter;
  statusFilter: HistoryStatusFilter;
  onPeriodChange: (period: HistoryPeriodFilter) => void;
  onStatusChange: (status: HistoryStatusFilter) => void;
  onSelectSession: (session: StudySessionHistoryItem) => void;
  onResetFilters: () => void;
}

const DATE_GROUP_ORDER: SessionDateGroup[] = ["Today", "Yesterday", "Earlier"];
const INITIAL_VISIBLE_COUNT = 4;

export default function SessionHistoryList({
  sessions,
  periodFilter,
  statusFilter,
  onPeriodChange,
  onStatusChange,
  onSelectSession,
  onResetFilters,
}: SessionHistoryListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const visibleSessions = sessions.slice(0, visibleCount);
  const hasMore = visibleCount < sessions.length;
  const canShowLess =
    sessions.length > INITIAL_VISIBLE_COUNT &&
    visibleCount >= sessions.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(sessions.length, prev + 4));
  };

  const handleShowLess = () => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  return (
    <section
      aria-label="Your Session History"
      className="mt-6 rounded-[20px] border border-[#EAE4F3] bg-white p-5 sm:p-7 shadow-[0_6px_24px_rgba(45,10,115,0.05)]"
    >
      {/* Card Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-[18px] sm:text-[20px] font-extrabold tracking-tight text-[#2A1163]">
            Your Session History
          </h2>
          <p className="m-0 mt-0.5 text-[11px] text-[#7B728E]">
            Click any session below to inspect your focus, breaks, and alert
            details
          </p>
        </div>

        <span className="inline-flex items-center rounded-full bg-[#EFE9FF] px-3 py-1 text-[10.5px] font-bold text-[#351080]">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {/* Filters (Period & Status) */}
      <SessionHistoryFilter
        periodFilter={periodFilter}
        statusFilter={statusFilter}
        onPeriodChange={(p) => {
          setVisibleCount(INITIAL_VISIBLE_COUNT);
          onPeriodChange(p);
        }}
        onStatusChange={(s) => {
          setVisibleCount(INITIAL_VISIBLE_COUNT);
          onStatusChange(s);
        }}
      />

      {/* Empty State */}
      {sessions.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[#DDD3F0] bg-[#FAF8FF] px-6 py-10 text-center">
          <div className="mb-3 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#FFF238] text-[#351080]">
            <Sparkles size={20} strokeWidth={2.2} />
          </div>
          <div className="text-[15px] font-bold text-[#2A1163]">
            No study sessions found
          </div>
          <p className="m-0 mt-1 max-w-[320px] text-[11px] leading-relaxed text-[#7B728E]">
            We couldn&apos;t find any sessions matching your active filters. Try
            adjusting the period or status filter.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setVisibleCount(INITIAL_VISIBLE_COUNT);
                onResetFilters();
              }}
              style={{
                color: "#351080",
                fontWeight: 700,
                fontSize: "11px",
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D7CBF0] bg-white px-4 py-2 text-[11px] !font-bold !text-[#351080] transition hover:bg-[#F5F1FF]"
            >
              <RotateCcw size={12} strokeWidth={2.2} />
              <span>Reset filters</span>
            </button>

            <Link
              href="/dashboard/home"
              style={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "11px",
              }}
              className="inline-flex items-center rounded-full bg-[#351080] px-4 py-2 text-[11px] !font-bold !text-white transition hover:bg-[#43189E]"
            >
              Start a session
            </Link>
          </div>
        </div>
      ) : (
        /* Grouped Session List (Today, Yesterday, Earlier) */
        <div className="mt-5 flex flex-col gap-6">
          {DATE_GROUP_ORDER.map((group) => {
            const groupItems = visibleSessions.filter(
              (item) => item.dateGroup === group
            );
            if (groupItems.length === 0) return null;

            return (
              <div key={group}>
                {/* Group Header */}
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-[11px] font-extrabold tracking-[0.06em] text-[#2A1163] uppercase">
                    {group}
                  </span>
                  <span className="h-[1px] flex-1 bg-[#F0ECF8]" />
                </div>

                {/* Sessions in Group */}
                <div className="flex flex-col gap-2.5">
                  {groupItems.map((session) => (
                    <SessionHistoryItem
                      key={session.id}
                      session={session}
                      onSelect={onSelectSession}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More / Show Less Pagination Footer */}
      {(hasMore || canShowLess) && (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 border-t border-[#F2EEF8] pt-4 sm:flex-row sm:justify-between">
          <span className="text-[10.5px] font-medium text-[#7B728E]">
            Showing{" "}
            <strong className="font-bold text-[#2A1163]">
              {visibleSessions.length}
            </strong>{" "}
            of{" "}
            <strong className="font-bold text-[#2A1163]">
              {sessions.length}
            </strong>{" "}
            sessions
          </span>

          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              style={{
                color: "#351080",
                fontWeight: 700,
                fontSize: "11px",
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D8CCF2] bg-[#F5F1FF] px-4 py-2 text-[11px] !font-bold !text-[#351080] transition hover:bg-[#EAE1FF]"
            >
              <span>Load More</span>
              <ChevronDown size={13} strokeWidth={2.3} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleShowLess}
              style={{
                color: "#6E6285",
                fontWeight: 700,
                fontSize: "11px",
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E0F2] bg-white px-4 py-2 text-[11px] !font-bold !text-[#6E6285] transition hover:bg-[#FAF8FF]"
            >
              <span>Show Less</span>
              <ChevronUp size={13} strokeWidth={2.3} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
