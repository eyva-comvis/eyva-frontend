"use client";

import {
  BookOpen,
  Clock,
  Coffee,
  Bell,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import type { StudySessionHistoryItem } from "@/types/session";

interface SessionHistoryItemProps {
  session: StudySessionHistoryItem;
  onSelect: (session: StudySessionHistoryItem) => void;
}

export default function SessionHistoryItem({
  session,
  onSelect,
}: SessionHistoryItemProps) {
  const isCompleted = session.status === "Completed";

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className="group flex w-full flex-col justify-between gap-3.5 rounded-[15px] border border-[#EAE4F3] bg-[#FDFCFF] px-4 py-3.5 text-left shadow-[0_3px_10px_rgba(45,10,115,0.03)] transition hover:border-[#C9B8F0] hover:bg-[#FAF7FF] sm:flex-row sm:items-center sm:px-5 sm:py-4"
    >
      {/* Left: Icon + Title + Date & Time */}
      <div className="flex items-start gap-3.5 sm:items-center">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#2D0A73] text-white transition-transform group-hover:scale-105">
          <BookOpen size={16} strokeWidth={2.1} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ fontSize: "13px", fontWeight: 700 }}
              className="!text-[13px] !font-bold text-[#2A1163]"
            >
              {session.title}
            </span>

            {/* Date & Time Pill */}
            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#7B728E]">
              <Calendar size={11} strokeWidth={2} className="text-[#624794]" />
              <span>{session.displayDate}</span>
              <span>·</span>
              <span>{session.startTime}</span>
            </span>
          </div>

          {/* Metrics Row: Focus Time, Break Time, Alerts */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-[#5E5278]">
            <span className="inline-flex items-center gap-1">
              <Clock size={11.5} strokeWidth={2.2} className="text-[#351080]" />
              <span>
                Focus Time:{" "}
                <strong className="font-bold text-[#2A1163]">
                  {session.focusDurationMinutes} minutes
                </strong>
              </span>
            </span>

            <span className="inline-flex items-center gap-1">
              <Coffee
                size={11.5}
                strokeWidth={2.2}
                className="text-[#351080]"
              />
              <span>
                Break Time:{" "}
                <strong className="font-bold text-[#2A1163]">
                  {session.breakDurationMinutes} minutes
                </strong>
              </span>
            </span>

            <span className="inline-flex items-center gap-1">
              <Bell size={11.5} strokeWidth={2.2} className="text-[#351080]" />
              <span>
                Alerts:{" "}
                <strong className="font-bold text-[#2A1163]">
                  {session.alertCount}
                </strong>
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Status Badge + Chevron */}
      <div className="flex items-center justify-between gap-3 border-t border-[#F1ECF9] pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0">
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
          }}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] !font-bold ${
            isCompleted
              ? "border border-[#DCD0FA] bg-[#EFE9FF] text-[#351080]"
              : "border border-[#F5D6E3] bg-[#FDF0F5] text-[#9F3D69]"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 size={11} strokeWidth={2.3} />
          ) : (
            <XCircle size={11} strokeWidth={2.3} />
          )}
          <span>{session.status}</span>
        </span>

        <ChevronRight
          size={16}
          strokeWidth={2.3}
          className="shrink-0 text-[#7B728E] transition-transform group-hover:translate-x-0.5 group-hover:text-[#351080]"
        />
      </div>
    </button>
  );
}
