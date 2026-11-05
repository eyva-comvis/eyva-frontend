"use client";

import { CalendarRange } from "lucide-react";
import type { StatisticsPeriod } from "@/types/statistics";

interface StatisticsPeriodFilterProps {
  period: StatisticsPeriod;
  periodSubtitle: string;
  onChange: (period: StatisticsPeriod) => void;
}

const PERIOD_OPTIONS: { value: StatisticsPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "all-time", label: "All Time" },
];

export default function StatisticsPeriodFilter({
  period,
  periodSubtitle,
  onChange,
}: StatisticsPeriodFilterProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-[16px] border border-[#EAE4F3] bg-white px-5 py-3.5 shadow-[0_4px_14px_rgba(45,10,115,0.04)] sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Active Period Context */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[9px] bg-[#FFF238] text-[#351080]">
          <CalendarRange size={16} strokeWidth={2.2} />
        </div>
        <div>
          <div className="text-[11.5px] font-bold text-[#2A1163]">
            Activity Overview Period
          </div>
          <div className="text-[10px] text-[#7B728E]">{periodSubtitle}</div>
        </div>
      </div>

      {/* Right: Segmented Control (Weekly | Monthly | All Time) */}
      <div
        role="tablist"
        aria-label="Select statistics period"
        className="inline-flex items-center gap-1 rounded-full bg-[#F5F1FF] p-1"
      >
        {PERIOD_OPTIONS.map((option) => {
          const isActive = period === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.value)}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: isActive ? "#FFFFFF" : "#351080",
              }}
              className={`rounded-full px-4 py-1.5 text-[11px] !font-bold transition-all ${
                isActive
                  ? "bg-[#351080] !text-white shadow-xs"
                  : "bg-transparent !text-[#351080] hover:bg-[#EAE1FF]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
