"use client";

import type {
  HistoryPeriodFilter,
  HistoryStatusFilter,
} from "@/types/session";

interface SessionHistoryFilterProps {
  periodFilter: HistoryPeriodFilter;
  statusFilter: HistoryStatusFilter;
  onPeriodChange: (period: HistoryPeriodFilter) => void;
  onStatusChange: (status: HistoryStatusFilter) => void;
}

const PERIOD_OPTIONS: { value: HistoryPeriodFilter; label: string }[] = [
  { value: "all", label: "All Sessions" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const STATUS_OPTIONS: { value: HistoryStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Completed", label: "Completed" },
  { value: "Interrupted", label: "Interrupted" },
];

export default function SessionHistoryFilter({
  periodFilter,
  statusFilter,
  onPeriodChange,
  onStatusChange,
}: SessionHistoryFilterProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#EFEAF7] pb-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Period Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-bold tracking-[0.06em] text-[#7B728E] uppercase">
          Period:
        </span>
        {PERIOD_OPTIONS.map((option) => {
          const isActive = periodFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onPeriodChange(option.value)}
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: isActive ? "#FFFFFF" : "#351080",
              }}
              className={`rounded-full px-3 py-1.5 text-[10.5px] !font-bold transition ${
                isActive
                  ? "bg-[#351080] !text-white shadow-xs"
                  : "bg-[#F5F1FF] !text-[#351080] hover:bg-[#EAE1FF]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-bold tracking-[0.06em] text-[#7B728E] uppercase">
          Status:
        </span>
        {STATUS_OPTIONS.map((option) => {
          const isActive = statusFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: isActive ? "#2A1163" : "#6E6285",
              }}
              className={`rounded-full border px-3 py-1.5 text-[10.5px] !font-bold transition ${
                isActive
                  ? "border-[#351080] bg-[#FFF238] !text-[#2A1163] shadow-xs"
                  : "border-[#E6E0F2] bg-white !text-[#6E6285] hover:border-[#351080]/40 hover:bg-[#FAF8FF]"
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
