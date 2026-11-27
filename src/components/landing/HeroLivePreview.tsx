"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Activity, Coffee, Music, Volume2 } from "lucide-react";
import { EYVA_EASE, EYVA_SPRING } from "@/components/motion/MotionPrimitives";

type SimStateId = "focused" | "possible" | "alert1" | "break";

interface SimStateMeta {
  id: SimStateId;
  tabLabel: string;
  timerText: string;
  timerCaption: string;
  progress: number;
  statusBadge: string;
  badgeTone: "calm" | "warn" | "break";
  marValue: number;
  eyeState: string;
  voiceLine: string;
  mascotSrc: string;
  soundtrackLabel: string;
}

const SIM_STATES: SimStateMeta[] = [
  {
    id: "focused",
    tabLabel: "Focused",
    timerText: "21 : 40",
    timerCaption: "minutes of me-time",
    progress: 0.22,
    statusBadge: "You look focused",
    badgeTone: "calm",
    marValue: 0.14,
    eyeState: "Eyes open (0.93)",
    voiceLine: "Face detected. You look focused.",
    mascotSrc: "/images/eyva_good.svg",
    soundtrackLabel: "Soft Piano · Playing",
  },
  {
    id: "possible",
    tabLabel: "Possible Drowsiness",
    timerText: "14 : 12",
    timerCaption: "watching cues gently",
    progress: 0.45,
    statusBadge: "Possible drowsiness",
    badgeTone: "warn",
    marValue: 0.36,
    eyeState: "Yawn + MAR 0.36",
    voiceLine: "Heads up, you might be getting a little sleepy.",
    mascotSrc: "/images/eyva_okay.svg",
    soundtrackLabel: "Soft Piano · Gently energized",
  },
  {
    id: "alert1",
    tabLabel: "Alert 1",
    timerText: "11 : 05",
    timerCaption: "timer paused for check-in",
    progress: 0.56,
    statusBadge: "Signs of drowsiness",
    badgeTone: "warn",
    marValue: 0.44,
    eyeState: "Eyes closed 1.8s",
    voiceLine: "Feeling a little sleepy? Take a breath and refocus.",
    mascotSrc: "/images/eyva_tough.svg",
    soundtrackLabel: "Music ducked while speaking",
  },
  {
    id: "break",
    tabLabel: "Break Reset",
    timerText: "04 : 58",
    timerCaption: "restorative break active",
    progress: 0.82,
    statusBadge: "Reset moment",
    badgeTone: "break",
    marValue: 0.16,
    eyeState: "Camera paused on break",
    voiceLine: "Stretch your shoulders and take a few sips of water.",
    mascotSrc: "/images/coffre_break.svg",
    soundtrackLabel: "Session resumes automatically",
  },
];

const SIM_AUTO_INTERVAL_MS = 3800;

export default function HeroLivePreview() {
  const prefersReduced = useReducedMotion();
  const [activeId, setActiveId] = useState<SimStateId>("focused");
  const [isInteracting, setIsInteracting] = useState(false);

  const currentIdx = Math.max(
    0,
    SIM_STATES.findIndex((s) => s.id === activeId)
  );
  const current = SIM_STATES[currentIdx] ?? SIM_STATES[0];

  useEffect(() => {
    if (isInteracting || prefersReduced) return;
    const id = setTimeout(() => {
      const nextIdx = (currentIdx + 1) % SIM_STATES.length;
      setActiveId(SIM_STATES[nextIdx].id);
    }, SIM_AUTO_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [activeId, currentIdx, isInteracting, prefersReduced]);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - current.progress);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const nextIdx = (idx + dir + SIM_STATES.length) % SIM_STATES.length;
    setActiveId(SIM_STATES[nextIdx].id);
  };

  return (
    <div
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsInteracting(false);
        }
      }}
      className="eyva-glass-card rounded-[26px] p-4 sm:p-5"
    >
      {/* Interactive State Selector Tabs */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[#43306E]">
          Interactive session preview
        </span>
        <span className="eyva-glass-inset inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-[#351080]">
          <span
            aria-hidden="true"
            className="h-[6px] w-[6px] rounded-full bg-[#351080]"
          />
          Live simulator
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Simulate Eyva focus states"
        className="eyva-glass-inset grid grid-cols-2 gap-1.5 rounded-[14px] p-1.5 sm:grid-cols-4"
      >
        {SIM_STATES.map((item, idx) => {
          const isSelected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              style={{
                color: isSelected ? "#FFFFFF" : "#351080",
                fontWeight: 700,
              }}
              className={`relative min-h-[38px] rounded-[10px] px-2.5 py-1.5 text-[11px] !font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
                isSelected
                  ? "!text-white"
                  : "!text-[#351080] hover:bg-white/75"
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="eyva-hero-sim-tab"
                  transition={EYVA_SPRING}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[10px] bg-[#351080]/95 shadow-[0_4px_14px_rgba(53,16,128,0.28),inset_0_1px_0_rgba(255,255,255,0.24)]"
                />
              )}
              <span className="relative z-10">{item.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Simulated Focus Session Stage */}
      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-12">
        {/* Left Mini Timer Ring Card */}
        <div
          className={`flex flex-col items-center justify-between rounded-[18px] p-4 sm:col-span-5 transition-colors duration-200 ${
            current.id === "break"
              ? "border border-white/75 bg-[#FFF454]/88 text-[#2A1163] shadow-[0_12px_28px_rgba(53,16,128,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl"
              : "eyva-glass-purple text-white"
          }`}
        >
          <div className="flex w-full items-center justify-between text-[10px] font-bold">
            <span
              className={`rounded-full px-2.5 py-0.5 ${
                current.id === "break"
                  ? "bg-[#351080] text-white"
                  : "bg-[#FFF238] text-[#2D0A73]"
              }`}
            >
              {current.id === "break" ? "Break Mode" : "Focus Flow"}
            </span>
            <span className="tabular-nums opacity-75">25m block</span>
          </div>

          <div className="relative my-3 flex h-[136px] w-[136px] items-center justify-center">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 136 136"
            >
              <circle
                cx="68"
                cy="68"
                r={radius}
                fill="none"
                stroke={current.id === "break" ? "#E2D758" : "#684FA1"}
                strokeWidth="7"
              />
              <circle
                cx="68"
                cy="68"
                r={radius}
                fill="none"
                stroke={current.id === "break" ? "#351080" : "#FFF238"}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-300 ease-out"
              />
            </svg>

            <div className="relative z-10 flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full bg-white/95 text-center text-[#2A1163] shadow-[0_6px_18px_rgba(26,6,68,0.18)] backdrop-blur-md">
              <strong className="text-[21px] font-extrabold leading-none tracking-tight tabular-nums">
                {current.timerText}
              </strong>
              <span className="mt-1 px-2 text-[9px] font-medium leading-tight text-[#6E6285]">
                {current.timerCaption}
              </span>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-1.5 text-[10px] font-semibold opacity-90">
            <Music size={11} aria-hidden="true" />
            <span className="truncate">{current.soundtrackLabel}</span>
          </div>
        </div>

        {/* Right Live Check-in & Companion Response Card */}
        <div className="eyva-glass-lavender flex flex-col justify-between rounded-[18px] p-4 sm:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[#FFF238] text-[#351080] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                {current.id === "break" ? (
                  <Coffee size={14} strokeWidth={2.3} aria-hidden="true" />
                ) : (
                  <Activity size={14} strokeWidth={2.3} aria-hidden="true" />
                )}
              </span>
              <span className="text-[11.5px] font-bold text-[#2A1163]">
                Focus check-in
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={current.statusBadge}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.16, ease: EYVA_EASE }}
                role="status"
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm ${
                  current.badgeTone === "warn"
                    ? "border border-[#9F3D69]/20 bg-[#FDF0F5]/85 text-[#9F3D69]"
                    : current.badgeTone === "break"
                      ? "bg-[#FFF238] text-[#2A1163]"
                      : "border border-white/80 bg-white/70 text-[#351080]"
                }`}
              >
                {current.statusBadge}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Mascot + Live Telemetry Readout */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EYVA_EASE }}
              className="eyva-glass-inset my-3 rounded-[14px] p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[12px] border border-white/80 bg-[#F2ECFF]/80 p-1.5 backdrop-blur-sm">
                  <Image
                    src={current.mascotSrc}
                    alt=""
                    width={44}
                    height={40}
                    priority
                    className="h-auto w-[42px]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-[#2A1163]">
                    {current.eyeState}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[#5A4E74] tabular-nums">
                    <span>Mouth Aspect Ratio (MAR)</span>
                    <strong className="font-bold text-[#351080]">
                      {current.marValue.toFixed(2)} / 0.32
                    </strong>
                  </div>
                  <div className="mt-1 h-[5px] w-full overflow-hidden rounded-full bg-[#E5DCF8]/90">
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((current.marValue / 0.6) * 100))}%`,
                      }}
                      className={`h-full rounded-full transition-[width,background-color] duration-200 ${
                        current.marValue >= 0.32 ? "bg-[#9F3D69]" : "bg-[#351080]"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Spoken Voice Cue Bubble */}
              <div className="mt-2.5 flex items-start gap-2 rounded-[10px] border border-white/75 bg-white/60 px-2.5 py-2 text-[10.5px] leading-snug text-[#34245B]">
                <Volume2
                  size={13}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[#351080]"
                />
                <span>&ldquo;{current.voiceLine}&rdquo;</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interactive Action Row inside Simulator */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-[#5E5278]">
              {current.id === "alert1"
                ? "Action required to resume timer"
                : current.id === "break"
                  ? "Break timer restores your remaining time"
                  : "Frames discarded immediately after scoring"}
            </span>

            {current.id === "alert1" && (
              <button
                type="button"
                onClick={() => setActiveId("focused")}
                style={{ color: "#FFFFFF", fontWeight: 700 }}
                className="shrink-0 rounded-[9px] bg-[#351080]/95 px-3 py-1.5 text-[10.5px] !font-bold !text-white shadow-[0_4px_12px_rgba(53,16,128,0.22)] transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96]"
              >
                Got it, refocus
              </button>
            )}

            {current.id === "break" && (
              <button
                type="button"
                onClick={() => setActiveId("focused")}
                style={{ color: "#FFFFFF", fontWeight: 700 }}
                className="shrink-0 rounded-[9px] bg-[#351080]/95 px-3 py-1.5 text-[10.5px] !font-bold !text-white shadow-[0_4px_12px_rgba(53,16,128,0.22)] transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96]"
              >
                Resume focus
              </button>
            )}

            {current.id === "possible" && (
              <button
                type="button"
                onClick={() => setActiveId("alert1")}
                className="eyva-glass-inset shrink-0 rounded-[9px] px-3 py-1.5 text-[10.5px] font-bold text-[#351080] transition-[background-color,transform] duration-150 hover:bg-white/85 active:scale-[0.96]"
              >
                Preview Alert 1
              </button>
            )}

            {current.id === "focused" && (
              <button
                type="button"
                onClick={() => setActiveId("possible")}
                className="eyva-glass-inset shrink-0 rounded-[9px] px-3 py-1.5 text-[10.5px] font-bold text-[#351080] transition-[background-color,transform] duration-150 hover:bg-white/85 active:scale-[0.96]"
              >
                Test drowsy cue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
