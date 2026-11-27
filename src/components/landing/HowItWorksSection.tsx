"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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

const STEP_AUTO_INTERVAL_MS = 4200;

export default function HowItWorksSection() {
  const prefersReduced = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const elapsedMsRef = useRef(0);
  const activeBarRef = useRef<HTMLDivElement | null>(null);

  const handleSelectStep = (idx: number) => {
    elapsedMsRef.current = 0;
    if (activeBarRef.current) {
      activeBarRef.current.style.transform = prefersReduced
        ? "scaleX(1)"
        : "scaleX(0)";
    }
    setActiveIdx(idx);
  };

  useEffect(() => {
    const syncBar = () => {
      if (!activeBarRef.current) return;
      if (prefersReduced) {
        activeBarRef.current.style.transform = "scaleX(1)";
        return;
      }
      const ratio = Math.min(1, elapsedMsRef.current / STEP_AUTO_INTERVAL_MS);
      activeBarRef.current.style.transform = `scaleX(${ratio})`;
    };

    syncBar();
    if (isInteracting || prefersReduced) return;

    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(Math.max(0, now - lastTs), 100);
      lastTs = now;
      elapsedMsRef.current += dt;

      if (elapsedMsRef.current >= STEP_AUTO_INTERVAL_MS) {
        elapsedMsRef.current = 0;
        if (activeBarRef.current) {
          activeBarRef.current.style.transform = "scaleX(1)";
        }
        setActiveIdx((prev) => (prev + 1) % STEPS.length);
        return;
      }

      syncBar();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeIdx, isInteracting, prefersReduced]);

  const active = STEPS[activeIdx];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="border-y border-white/75 bg-white/28 py-16 backdrop-blur-sm sm:py-22"
    >
      <div
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onFocusCapture={() => setIsInteracting(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setIsInteracting(false);
          }
        }}
        className="mx-auto max-w-[1120px] px-4 sm:px-6"
      >
        <div className="max-w-[620px]">
          <h2
            id="how-heading"
            className="m-0 text-[28px] font-extrabold leading-[1.16] tracking-[-0.02em] text-[#2A1163] sm:text-[36px] text-balance"
          >
            How a study session flows with Eyva
          </h2>
          <p className="m-0 mt-2.5 text-[15px] leading-[1.6] text-[#4E416B] text-pretty">
            Four clear stages from setting your goal to wrapping up with a calm
            reflection. Steps cycle automatically or click any stage to inspect.
          </p>
        </div>

        {/* Animated Segmented Progress Bar (====== ====== ====== ======) */}
        <div aria-hidden="true" className="mt-8 grid grid-cols-4 gap-2.5">
          {STEPS.map((s, idx) => {
            const isPast = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={s.num}
                className="h-[6px] overflow-hidden rounded-full bg-white/75 shadow-[inset_0_1px_2px_rgba(53,16,128,0.08)] ring-1 ring-[#351080]/10"
              >
                {isCurrent ? (
                  <div
                    key={`${s.num}-${activeIdx}`}
                    ref={activeBarRef}
                    style={{
                      transform: prefersReduced ? "scaleX(1)" : "scaleX(0)",
                    }}
                    className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#351080] via-[#5125B5] to-[#6B3FE0] will-change-transform"
                  />
                ) : (
                  <div
                    style={{ transform: isPast ? "scaleX(1)" : "scaleX(0)" }}
                    className="h-full w-full origin-left rounded-full bg-[#351080] transition-transform duration-300 ease-out"
                  />
                )}
              </div>
            );
          })}
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
                  onClick={() => handleSelectStep(idx)}
                  className={`relative flex w-full items-start gap-4 rounded-[18px] p-4 sm:p-5 text-left transition-[background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
                    isSelected
                      ? "eyva-glass-card ring-1 ring-[#351080]/35"
                      : "eyva-glass-inset hover:bg-white/75"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="eyva-how-active-pill"
                      transition={EYVA_SPRING}
                      aria-hidden="true"
                      className="mt-0.5 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFF238] text-[12px] font-extrabold text-[#2A1163] tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                    >
                      {step.num}
                    </motion.span>
                  )}
                  {!isSelected && (
                    <span className="mt-0.5 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#EFE9FF]/90 text-[12px] font-extrabold text-[#351080] tabular-nums">
                      {step.num}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-[#2A1163]">
                      {step.title}
                    </div>
                    <p className="m-0 mt-1 text-[12.5px] leading-[1.55] text-[#4E416B]">
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
                className="eyva-glass-card flex h-full flex-col justify-between rounded-[24px] p-6 sm:p-8"
              >
                <div>
                  <span className="inline-flex items-center rounded-full bg-[#FFF238] px-3.5 py-1 text-[11px] font-extrabold text-[#2A1163] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    {active.badgeText}
                  </span>

                  <div className="eyva-glass-lavender my-6 flex min-h-[160px] items-center justify-center rounded-[18px] p-6">
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
                      className="eyva-glass-inset flex items-start gap-2.5 rounded-[11px] px-3.5 py-2.5 text-[12.5px] font-medium leading-[1.45] text-[#34245B]"
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
