"use client";

import Image from "next/image";
import {
  X,
  Clock,
  Coffee,
  Bell,
  Calendar,
  Music,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { StudySessionHistoryItem } from "@/types/session";

interface SessionDetailModalProps {
  session: StudySessionHistoryItem | null;
  onClose: () => void;
}

const MOOD_META = {
  good: {
    label: "Good",
    image: "/images/eyva_good.svg",
    bg: "bg-[#FFFCE0] border-[#EDE49A]",
  },
  okay: {
    label: "Okay",
    image: "/images/eyva_okay.svg",
    bg: "bg-[#FAF8F2] border-[#E5DEC9]",
  },
  tough: {
    label: "Tough",
    image: "/images/eyva_tough.svg",
    bg: "bg-[#EEF5FA] border-[#D5E3F0]",
  },
} as const;

export default function SessionDetailModal({
  session,
  onClose,
}: SessionDetailModalProps) {
  if (!session) return null;

  const isCompleted = session.status === "Completed";
  const moodInfo = session.reflectionMood
    ? MOOD_META[session.reflectionMood]
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#351080]/20 px-4 py-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[430px] rounded-[20px] border border-[#EAE4F3] bg-[#FFFEF9] p-6 sm:p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close session detail"
          className="absolute top-4 right-4 flex h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-[#E5DFEE] bg-white text-[#6C5B8D] transition hover:bg-[#F5F1FC] hover:text-[#351080]"
        >
          <X size={15} strokeWidth={2.2} />
        </button>

        {/* Top Badge & Session ID */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold ${
              isCompleted
                ? "bg-[#EFE9FF] text-[#351080]"
                : "bg-[#FDF0F5] text-[#9F3D69]"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 size={11} strokeWidth={2.3} />
            ) : (
              <XCircle size={11} strokeWidth={2.3} />
            )}
            <span>{session.status}</span>
          </span>

          <span className="text-[9.5px] font-semibold tracking-[0.06em] text-[#8E849E] uppercase">
            ID: {session.id}
          </span>
        </div>

        {/* Title & Date/Time */}
        <h2
          id="session-detail-title"
          className="m-0 mt-2 text-[21px] font-extrabold tracking-tight text-[#2A1163]"
        >
          {session.title}
        </h2>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#7B728E]">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} strokeWidth={2} className="text-[#351080]" />
            <span>{session.displayDate}</span>
          </span>
          <span>·</span>
          <span>
            {session.startTime} – {session.endTime}
          </span>
        </div>

        {/* 3 Stat Mini Cards */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {/* Focus Duration */}
          <div className="rounded-[12px] border border-[#ECE6F8] bg-[#F5F1FF] p-3 text-center">
            <div className="mx-auto mb-1 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#351080] text-white">
              <Clock size={12} strokeWidth={2.2} />
            </div>
            <div className="text-[15px] font-extrabold text-[#2A1163]">
              {session.focusDurationMinutes}m
            </div>
            <div className="text-[9px] font-semibold text-[#6E6285]">
              Focus Time
            </div>
          </div>

          {/* Break Duration */}
          <div className="rounded-[12px] border border-[#ECE6F8] bg-[#F5F1FF] p-3 text-center">
            <div className="mx-auto mb-1 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#351080] text-white">
              <Coffee size={12} strokeWidth={2.2} />
            </div>
            <div className="text-[15px] font-extrabold text-[#2A1163]">
              {session.breakDurationMinutes}m
            </div>
            <div className="text-[9px] font-semibold text-[#6E6285]">
              Break Time
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-[12px] border border-[#ECE6F8] bg-[#F5F1FF] p-3 text-center">
            <div className="mx-auto mb-1 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#351080] text-white">
              <Bell size={12} strokeWidth={2.2} />
            </div>
            <div className="text-[15px] font-extrabold text-[#2A1163]">
              {session.alertCount}
            </div>
            <div className="text-[9px] font-semibold text-[#6E6285]">
              Alerts
            </div>
          </div>
        </div>

        {/* Additional Session Metadata */}
        <div className="mt-4 flex flex-col gap-2.5 rounded-[13px] border border-[#EAE4F3] bg-white p-3.5">
          {session.soundtrack && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-[#7B728E]">
                <Music size={13} className="text-[#351080]" />
                <span>Focus Soundtrack</span>
              </span>
              <span className="font-bold text-[#2A1163]">
                {session.soundtrack}
              </span>
            </div>
          )}

          {typeof session.yawnCount === "number" && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#7B728E]">Total Yawns Detected</span>
              <span className="font-bold text-[#2A1163]">
                {session.yawnCount}x
              </span>
            </div>
          )}

          {moodInfo && (
            <div className="flex items-center justify-between border-t border-[#F2EEF8] pt-2.5 text-[11px]">
              <span className="text-[#7B728E]">Session Reflection</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 font-bold text-[#2A1163] ${moodInfo.bg}`}
              >
                <Image
                  src={moodInfo.image}
                  alt={moodInfo.label}
                  width={20}
                  height={18}
                  className="h-auto w-[20px]"
                />
                <span>{moodInfo.label}</span>
              </span>
            </div>
          )}
        </div>

        {/* Close CTA */}
        <button
          type="button"
          onClick={onClose}
          style={{
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "11.5px",
          }}
          className="mt-5 flex w-full items-center justify-center rounded-[10px] border-0 bg-[#351080] py-2.5 px-4 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#220856] transition hover:bg-[#43189E] active:translate-y-[1px]"
        >
          Close details
        </button>
      </div>
    </div>
  );
}
