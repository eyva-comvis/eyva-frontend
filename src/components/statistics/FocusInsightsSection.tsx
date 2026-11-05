"use client";

import { Award, Timer, CheckCircle2, Sparkles } from "lucide-react";
import type { FocusInsightsData } from "@/types/statistics";

interface FocusInsightsSectionProps {
  insights: FocusInsightsData;
}

export default function FocusInsightsSection({
  insights,
}: FocusInsightsSectionProps) {
  return (
    <section aria-label="Your Focus Insights" className="mt-6">
      {/* Section Header */}
      <div className="mb-3.5 flex items-baseline justify-between">
        <div>
          <h2 className="m-0 text-[18px] font-extrabold tracking-tight text-[#2A1163]">
            Your Focus Insights
          </h2>
          <p className="m-0 mt-0.5 text-[11px] text-[#7B728E]">
            Personalized reflections calculated directly from your study
            sessions
          </p>
        </div>
      </div>

      {/* 4 Insight Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* A. Most Focused Day */}
        <div className="flex items-start gap-3.5 rounded-[16px] border border-[#EAE4F3] bg-white p-4 sm:p-5 shadow-[0_4px_14px_rgba(45,10,115,0.04)]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#FFF238] text-[#351080]">
            <Award size={19} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[9.5px] font-bold tracking-[0.07em] text-[#7B728E] uppercase">
              Most Focused Day
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <strong className="text-[18px] font-extrabold text-[#2A1163]">
                {insights.mostFocusedDay.label}
              </strong>
              <span className="rounded-full bg-[#EFE9FF] px-2.5 py-0.5 text-[10px] font-bold text-[#351080]">
                {insights.mostFocusedDay.focusMinutes} minutes
              </span>
            </div>
            <p className="m-0 mt-1 text-[10.5px] leading-relaxed text-[#6E6285]">
              Your highest accumulated focus duration during this selected
              period.
            </p>
          </div>
        </div>

        {/* B. Average Focus Duration */}
        <div className="flex items-start gap-3.5 rounded-[16px] border border-[#EAE4F3] bg-white p-4 sm:p-5 shadow-[0_4px_14px_rgba(45,10,115,0.04)]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#EFE9FF] text-[#351080]">
            <Timer size={19} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[9.5px] font-bold tracking-[0.07em] text-[#7B728E] uppercase">
              Average Focus Duration
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <strong className="text-[18px] font-extrabold text-[#2A1163]">
                {insights.averageFocusDurationMinutes}
              </strong>
              <span className="text-[11px] font-semibold text-[#6E6285]">
                minutes / session
              </span>
            </div>
            <p className="m-0 mt-1 text-[10.5px] leading-relaxed text-[#6E6285]">
              Average time spent focusing per completed study session.
            </p>
          </div>
        </div>

        {/* C. Total Completed Sessions */}
        <div className="flex items-start gap-3.5 rounded-[16px] border border-[#EAE4F3] bg-white p-4 sm:p-5 shadow-[0_4px_14px_rgba(45,10,115,0.04)]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#EFE9FF] text-[#351080]">
            <CheckCircle2 size={19} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[9.5px] font-bold tracking-[0.07em] text-[#7B728E] uppercase">
              Total Completed Sessions
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <strong className="text-[18px] font-extrabold text-[#2A1163]">
                {insights.totalCompletedSessions}
              </strong>
              <span className="text-[11px] font-semibold text-[#6E6285]">
                of {insights.totalSessions}{" "}
                {insights.totalSessions === 1 ? "session" : "sessions"}{" "}
                completed
              </span>
            </div>
            <p className="m-0 mt-1 text-[10.5px] leading-relaxed text-[#6E6285]">
              Sessions where you reached the end of your target focus timer.
            </p>
          </div>
        </div>

        {/* D. Study Consistency */}
        <div className="flex items-start gap-3.5 rounded-[16px] border border-[#EAE4F3] bg-white p-4 sm:p-5 shadow-[0_4px_14px_rgba(45,10,115,0.04)]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#FFF238] text-[#351080]">
            <Sparkles size={19} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[9.5px] font-bold tracking-[0.07em] text-[#7B728E] uppercase">
              Study Consistency
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <strong className="text-[18px] font-extrabold text-[#2A1163]">
                {insights.consistency.summaryLabel}
              </strong>
              <span className="rounded-full bg-[#EFE9FF] px-2.5 py-0.5 text-[10px] font-bold text-[#351080]">
                {insights.consistency.percentage}%
              </span>
            </div>
            <p className="m-0 mt-1 text-[10.5px] leading-relaxed text-[#6E6285]">
              {insights.consistency.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
