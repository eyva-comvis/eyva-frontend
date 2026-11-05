"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CheckCircle2 } from "lucide-react";
import type { StatisticsDataPoint, StatisticsPeriod } from "@/types/statistics";

interface StudyConsistencyChartProps {
  points: StatisticsDataPoint[];
  period: StatisticsPeriod;
}

interface ConsistencyTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: StatisticsDataPoint }>;
}

function ConsistencyAreaTooltip({ active, payload }: ConsistencyTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-[12px] border border-[#DFD4F5] bg-[#FFFEF9] px-3.5 py-2.5 shadow-[0_8px_22px_rgba(45,10,115,0.14)]">
      <div className="text-[11px] font-extrabold text-[#2A1163]">
        {data.fullLabel}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-[#5E5278]">
        <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#5C3D99]" />
        <span>
          Completed:{" "}
          <strong className="font-bold text-[#2A1163]">
            {data.completedSessions}{" "}
            {data.completedSessions === 1 ? "session" : "sessions"}
          </strong>
        </span>
      </div>
      <div className="mt-0.5 text-[9.5px] text-[#7B728E]">
        Total started: {data.totalSessions}{" "}
        {data.totalSessions === 1 ? "session" : "sessions"}
      </div>
    </div>
  );
}

export default function StudyConsistencyChart({
  points,
  period,
}: StudyConsistencyChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtitleByPeriod: Record<StatisticsPeriod, string> = {
    weekly: "Completed study sessions per day to track your daily habit",
    monthly: "Completed study sessions per week across the month",
    "all-time": "Completed study sessions across months",
  };

  return (
    <section
      aria-label="Study Consistency"
      className="flex flex-col justify-between rounded-[20px] border border-[#EAE4F3] bg-white p-5 sm:p-6 shadow-[0_6px_24px_rgba(45,10,115,0.05)]"
    >
      {/* Card Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[16px] sm:text-[17px] font-extrabold tracking-tight text-[#2A1163]">
            Study Consistency
          </h2>
          <p className="m-0 mt-0.5 text-[10.5px] text-[#7B728E]">
            {subtitleByPeriod[period]}
          </p>
        </div>

        <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#EFE9FF] text-[#351080]">
          <CheckCircle2 size={16} strokeWidth={2.2} />
        </div>
      </div>

      {/* Area / Line Chart for Completed Sessions */}
      <div className="h-[195px] w-full">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 14, right: 12, left: -18, bottom: 2 }}
            >
              <defs>
                <linearGradient
                  id="eyvaConsistencyGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#624794" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#624794" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#EFEAF7"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5E5278", fontSize: 11, fontWeight: 600 }}
                dy={6}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8E849E", fontSize: 10 }}
              />
              <Tooltip content={<ConsistencyAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="completedSessions"
                stroke="#351080"
                strokeWidth={2.6}
                fillOpacity={1}
                fill="url(#eyvaConsistencyGradient)"
                dot={{
                  r: 4.5,
                  fill: "#FFF238",
                  stroke: "#351080",
                  strokeWidth: 2.2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#351080",
                  stroke: "#FFF238",
                  strokeWidth: 2.5,
                }}
                animationDuration={550}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[12px] bg-[#FAF8FF] text-[11px] text-[#7B728E]">
            Loading chart...
          </div>
        )}
      </div>

      {/* Consistency Habit Strip (Visual Check-in Pills per Day/Bucket) */}
      <div className="mt-3 border-t border-[#F3EFFA] pt-3">
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5">
          {points.map((pt, idx) => {
            const isActive = pt.completedSessions > 0;
            return (
              <div
                key={idx}
                className={`flex min-w-[44px] flex-1 flex-col items-center rounded-[10px] border px-1.5 py-1.5 text-center transition ${
                  isActive
                    ? "border-[#D7C8F8] bg-[#F5F1FF]"
                    : "border-[#F0ECF7] bg-[#FAF9FC] opacity-65"
                }`}
              >
                <span className="text-[9px] font-bold text-[#6E6285]">
                  {pt.label}
                </span>
                <span
                  className={`mt-0.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9.5px] font-extrabold ${
                    isActive
                      ? "bg-[#351080] text-white"
                      : "bg-[#EAE4F3] text-[#8E849E]"
                  }`}
                >
                  {pt.completedSessions}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
