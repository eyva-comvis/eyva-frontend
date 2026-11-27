"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { EYVA_EASE, EYVA_SPRING } from "@/components/motion/MotionPrimitives";

interface FlowStep {
  num: string;
  title: string;
  summary: string;
  detailTitle: string;
  detailPoints: string[];
  visualSrc: string;
  badgeText: string;
}

const STEPS: FlowStep[] = [
  {
    num: "01",
    title: "Set Your Focus & Soundtrack",
    summary:
      "Name what you are studying, choose 15 to 180 minutes, and audition Eyva Calm or a public Spotify playlist before starting.",
    detailTitle: "Custom session setup in seconds",
    detailPoints: [
      "Preset durations (15, 25, 45, 60 min) or custom minutes",
      "Pre-session audio preview for Soft Piano, Rain, Lo-Fi, or Spotify",
      "Camera permission prompt stays optional if you prefer timer-only study",
    ],
    visualSrc: "/images/eyva_start.svg",
    badgeText: "Step 01 · Focus Setup",
  },
  {
    num: "02",
    title: "Camera Check-In While You Work",
    summary:
      "Eyva quietly checks visual cues in memory so your timer, music, and focus stay uninterrupted while you read or type.",
    detailTitle: "Hybrid visual & landmark scoring",
    detailPoints: [
      "Tracks prolonged eye closure, head posture, and Mouth Aspect Ratio",
      "Ignores normal mouth movement from reading or speaking",
      "Toggle spoken voice announcements on or off at any moment",
    ],
    visualSrc: "/images/eyva_good.svg",
    badgeText: "Step 02 · Active Flow",
  },
  {
    num: "03",
    title: "Gentle Alerts & Guided Break",
    summary:
      "When real signs of sleepiness persist, Eyva pauses your countdown, guides a 5-minute stretch reset, and resumes where you left off.",
    detailTitle: "Rest without losing your session",
    detailPoints: [
      "Stage 1 gentle check-in lets you breathe and refocus immediately",
      "Stage 2 offers a guided 5-minute coffee & stretch break",
      "Remaining study seconds restore automatically after your break",
    ],
    visualSrc: "/images/coffre_break.svg",
    badgeText: "Step 03 · Restorative Reset",
  },
  {
    num: "04",
    title: "Reflect & See Your Study Rhythm",
    summary:
      "Check in on how the session felt, read concise session notes, and watch your weekly consistency build over time.",
    detailTitle: "Honest progress without pressure",
    detailPoints: [
      "One-tap mood reflection: Good, Okay, or Tough",
      "Session recap of focus minutes, breaks taken, and check-ins",
      "Weekly and monthly charts highlight your most focused study days",
    ],
    visualSrc: "/images/eyva_okay.svg",
    badgeText: "Step 04 · Session Summary",
  },
];

export default function HowItWorksSection() {
  const prefersReduced = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoCycle, setAutoCycle] = useState(false);

  useEffect(() => {
    if (!autoCycle || prefersReduced) return;
    const id = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % STEPS.length);
    }, 4200);
    return () => clearInterval(id);
  }, [autoCycle, prefersReduced]);

  const active = STEPS[activeIdx];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="border-y border-[#ECE6F7] bg-[#FAF7FF] py-16 sm:py-22"
    >
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-[600px]">
            <h2
              id="how-heading"
              className="m-0 text-[28px] font-extrabold leading-[1.16] tracking-[-0.02em] text-[#2A1163] sm:text-[36px] text-balance"
            >
              How a study session flows with Eyva
            </h2>
            <p className="m-0 mt-2.5 text-[15px] leading-[1.6] text-[#5E5278] text-pretty">
              Four clear stages from setting your goal to wrapping up with a calm
              reflection. Click any step to inspect what happens.
            </p>
          </div>

          {!prefersReduced && (
            <button
              type="button"
              onClick={() => setAutoCycle((prev) => !prev)}
              aria-pressed={autoCycle}
              className="inline-flex min-h-[38px] w-fit items-center gap-1.5 rounded-full border border-[#D8CCF2] bg-white px-4 py-1.5 text-[11.5px] font-bold text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#EFE9FF] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
            >
              {autoCycle ? (
                <>
                  <Pause size={12} fill="currentColor" aria-hidden="true" />
                  <span>Pause walkthrough</span>
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" aria-hidden="true" />
                  <span>Auto-play steps</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div
          aria-hidden="true"
          className="mt-8 grid grid-cols-4 gap-2"
        >
          {STEPS.map((s, idx) => (
            <div
              key={s.num}
              className="h-[5px] overflow-hidden rounded-full bg-[#E4DCF5]"
            >
              <div
                style={{ width: idx <= activeIdx ? "100%" : "0%" }}
                className="h-full rounded-full bg-[#351080] transition-[width] duration-300 ease-out"
              />
            </div>
          ))}
        </div>

        {/* Interactive 2-Column Stepper + Stage Card */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Step List */}
          <div
            role="tablist"
            aria-label="Eyva workflow steps"
            className="flex flex-col gap-2.5 lg:col-span-6"
          >
            {STEPS.map((step, idx) => {
              const isSelected = idx === activeIdx;
              return (
                <button
                  key={step.num}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveIdx(idx);
                    setAutoCycle(false);
                  }}
                  className={`relative flex w-full items-start gap-4 rounded-[18px] border p-4 sm:p-5 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
                    isSelected
                      ? "border-[#351080] bg-white shadow-[0_10px_28px_rgba(45,10,115,0.08)]"
                      : "border-[#E6DFF4] bg-white/65 hover:border-[#CBBCEB] hover:bg-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="eyva-how-active-pill"
                      transition={EYVA_SPRING}
                      aria-hidden="true"
                      className="mt-0.5 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFF238] text-[12px] font-extrabold text-[#2A1163] tabular-nums"
                    >
                      {step.num}
                    </motion.span>
                  )}
                  {!isSelected && (
                    <span className="mt-0.5 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#EFE9FF] text-[12px] font-extrabold text-[#351080] tabular-nums">
                      {step.num}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-[#2A1163]">
                      {step.title}
                    </div>
                    <p className="m-0 mt-1 text-[12.5px] leading-[1.55] text-[#5E5278]">
                      {step.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Stage Visual Card */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.num}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: EYVA_EASE }}
                role="tabpanel"
                className="flex h-full flex-col justify-between rounded-[22px] border border-[#DDD3F2] bg-white p-6 sm:p-8 shadow-[0_12px_36px_rgba(45,10,115,0.08)]"
              >
                <div>
                  <span className="inline-flex items-center rounded-full bg-[#FFF238] px-3.5 py-1 text-[11px] font-extrabold text-[#2A1163]">
                    {active.badgeText}
                  </span>

                  <div className="my-6 flex min-h-[160px] items-center justify-center rounded-[18px] bg-[#F5F1FF] p-6">
                    <Image
                      src={active.visualSrc}
                      alt=""
                      width={136}
                      height={116}
                      className="h-auto w-[124px] sm:w-[136px]"
                    />
                  </div>

                  <h3 className="m-0 text-[21px] font-extrabold leading-[1.25] text-[#2A1163]">
                    {active.detailTitle}
                  </h3>
                </div>

                <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
                  {active.detailPoints.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-2.5 rounded-[11px] bg-[#FAF8FF] px-3.5 py-2.5 text-[12.5px] font-medium leading-[1.45] text-[#34245B]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-[6px] w-[6px] shrink-0 rounded-full bg-[#351080]"
                      />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
