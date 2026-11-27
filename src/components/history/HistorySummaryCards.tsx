"use client";

import { History, Clock, AlertCircle } from "lucide-react";
import {
  AnimatedCounter,
  InteractiveCard,
} from "@/components/motion/MotionPrimitives";
import type { HistorySummaryStats } from "@/types/session";

interface HistorySummaryCardsProps {
  stats: HistorySummaryStats;
}

export default function HistorySummaryCards({
  stats,
}: HistorySummaryCardsProps) {
  const focusHours = Math.floor(stats.totalFocusMinutes / 60);
  const focusRemainingMins = stats.totalFocusMinutes % 60;

  return (
    <section
      aria-label="History Summary Statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
    >
      {/* Card 1 - Sessions Saved */}
      <InteractiveCard
        lift={-2}
        spotlightColor="rgba(255, 242, 56, 0.2)"
        className="rounded-[16px] border border-[#ECE6F8] bg-[#F5F1FF] text-[#2A1163] shadow-[0_4px_14px_rgba(45,10,115,0.05)]"
      >
        <div className="flex h-full flex-col justify-between px-5 py-4">
          <div className="text-[9.5px] font-bold tracking-[0.08em] text-[#2A1163] uppercase">
            Sessions Saved
          </div>

          <div className="my-2.5 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 text-[#2A1163]">
              <strong className="text-[25px] font-extrabold leading-none tracking-tight">
                <AnimatedCounter value={stats.totalSessionsSaved} />
              </strong>
              <span className="text-[11px] font-semibold text-[#6E6285]">
                sessions
              </span>
            </div>

            <div className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-[#351080] text-white">
              <History size={15} strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-[10px] text-[#6E6285]">Every session matters</div>
        </div>
      </InteractiveCard>

      {/* Card 2 - Total Focus Time */}
      <InteractiveCard
        lift={-2}
        spotlightColor="rgba(255, 242, 56, 0.2)"
        className="rounded-[16px] border border-[#ECE6F8] bg-[#F5F1FF] text-[#2A1163] shadow-[0_4px_14px_rgba(45,10,115,0.05)]"
      >
        <div className="flex h-full flex-col justify-between px-5 py-4">
          <div className="text-[9.5px] font-bold tracking-[0.08em] text-[#2A1163] uppercase">
            Total Focus Time
          </div>

          <div className="my-2.5 flex items-center justify-between">
            <div className="flex items-baseline gap-2 text-[#2A1163]">
              {focusHours > 0 && (
                <span className="inline-flex items-baseline gap-1">
                  <strong className="text-[25px] font-extrabold leading-none tracking-tight">
                    <AnimatedCounter value={focusHours} />
                  </strong>
                  <span className="text-[11px] font-semibold text-[#6E6285]">
                    h
                  </span>
                </span>
              )}
              {(focusRemainingMins > 0 || focusHours === 0) && (
                <span className="inline-flex items-baseline gap-1">
                  <strong className="text-[25px] font-extrabold leading-none tracking-tight">
                    <AnimatedCounter value={focusRemainingMins} />
                  </strong>
                  <span className="text-[11px] font-semibold text-[#6E6285]">
                    m
                  </span>
                </span>
              )}
            </div>

            <div className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-[#351080] text-white">
              <Clock size={15} strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-[10px] text-[#6E6285]">Time spent showing up</div>
        </div>
      </InteractiveCard>

      {/* Card 3 - Alerts Recorded */}
      <InteractiveCard
        lift={-2}
        spotlightColor="rgba(255, 242, 56, 0.2)"
        className="rounded-[16px] border border-[#ECE6F8] bg-[#F5F1FF] text-[#2A1163] shadow-[0_4px_14px_rgba(45,10,115,0.05)]"
      >
        <div className="flex h-full flex-col justify-between px-5 py-4">
          <div className="text-[9.5px] font-bold tracking-[0.08em] text-[#2A1163] uppercase">
            Alerts Recorded
          </div>

          <div className="my-2.5 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 text-[#2A1163]">
              <strong className="text-[25px] font-extrabold leading-none tracking-tight">
                <AnimatedCounter value={stats.totalAlertsRecorded} />
              </strong>
              <span className="text-[11px] font-semibold text-[#6E6285]">
                alerts
              </span>
            </div>

            <div className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-[#351080] text-white">
              <AlertCircle size={15} strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-[10px] text-[#6E6285]">
            Gentle reminders along the way
          </div>
        </div>
      </InteractiveCard>
    </section>
  );
}
