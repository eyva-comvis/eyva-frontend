"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { Clock } from "lucide-react";
import type { StatisticsDataPoint, StatisticsPeriod } from "@/types/statistics";

interface FocusTimeOverviewChartProps {
  points: StatisticsDataPoint[];
  period: StatisticsPeriod;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: StatisticsDataPoint }>;
}

function FocusBarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-[12px] border border-[#DFD4F5] bg-[#FFFEF9] px-3.5 py-2.5 shadow-[0_8px_22px_rgba(45,10,115,0.14)]">
      <div className="text-[11px] font-extrabold text-[#2A1163]">
        {data.fullLabel}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-[#5E5278]">
        <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#351080]" />
        <span>
          Focus Duration:{" "}
          <strong className="font-bold text-[#2A1163]">
            {data.focusMinutes} minutes
          </strong>
        </span>
      </div>
      <div className="mt-0.5 text-[9.5px] text-[#7B728E]">
        {data.totalSessions}{" "}
        {data.totalSessions === 1 ? "session" : "sessions"} ({data.completedSessions}{" "}
        completed)
      </div>
    </div>
  );
}

export default function FocusTimeOverviewChart({
  points,
  period,
}: FocusTimeOverviewChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const maxFocusMinutes = points.reduce(
    (max, pt) => (pt.focusMinutes > max ? pt.focusMinutes : max),
    0
  );

  const subtitleByPeriod: Record<StatisticsPeriod, string> = {
    weekly: "Daily focus duration in minutes (Monday – Sunday)",
    monthly: "Weekly focus duration in minutes across the month",
    "all-time": "Total focus duration progression across months",
  };

  return (
    <section
      aria-label="Focus Time Overview"
      className="flex flex-col justify-between rounded-[20px] border border-[#EAE4F3] bg-white p-5 sm:p-6 shadow-[0_6px_24px_rgba(45,10,115,0.05)]"
    >
      {/* Card Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[16px] sm:text-[17px] font-extrabold tracking-tight text-[#2A1163]">
            Focus Time Overview
          </h2>
          <p className="m-0 mt-0.5 text-[10.5px] text-[#7B728E]">
            {subtitleByPeriod[period]}
          </p>
        </div>

        <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#EFE9FF] text-[#351080]">
          <Clock size={16} strokeWidth={2.2} />
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="h-[245px] w-full">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={points}
              margin={{ top: 22, right: 10, left: -12, bottom: 4 }}
            >
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
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8E849E", fontSize: 10 }}
                tickFormatter={(val) => `${val}m`}
              />
              <Tooltip
                content={<FocusBarTooltip />}
                cursor={{ fill: "#F5F1FF", radius: 8 }}
              />
              <Bar
                dataKey="focusMinutes"
                radius={[8, 8, 4, 4]}
                maxBarSize={42}
                animationDuration={550}
              >
                <LabelList
                  dataKey="focusMinutes"
                  position="top"
                  formatter={(val: number) => (val > 0 ? `${val}m` : "")}
                  style={{
                    fill: "#351080",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                />
                {points.map((entry, index) => {
                  const isPeak =
                    maxFocusMinutes > 0 &&
                    entry.focusMinutes === maxFocusMinutes;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isPeak ? "#351080" : "#8A6AD6"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[12px] bg-[#FAF8FF] text-[11px] text-[#7B728E]">
            Loading chart...
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F3EFFA] pt-3 text-[10px] text-[#7B728E]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#351080]" />
            <span>Highest focus</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#8A6AD6]" />
            <span>Focus minutes</span>
          </span>
        </div>
        <span>Hover or tap bars for details</span>
      </div>
    </section>
  );
}
