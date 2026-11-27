"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  EYVA_EASE,
  EYVA_SPRING,
  FloatingMascot,
  RevealSection,
} from "@/components/motion/MotionPrimitives";
import { API_BASE_URL } from "@/services/api/client";
import { startGoogleLogin } from "@/services/api/auth";

type MoodKey = "good" | "okay" | "tough";

const MOODS: Record<
  MoodKey,
  {
    label: string;
    src: string;
    headline: string;
    reply: string;
    surface: string;
  }
> = {
  good: {
    label: "Good",
    src: "/images/eyva_good.svg",
    headline: "Yay! Glad you did good this time.",
    reply:
      "Logged to your reflection history so you can spot which time of day and soundtrack work best for you.",
    surface: "border-[#E9DF9A]/85 bg-[#FFFEF2]/80 backdrop-blur-md",
  },
  okay: {
    label: "Okay",
    src: "/images/eyva_okay.svg",
    headline: "Nice! Steady progress still counts.",
    reply:
      "Showing up on an ordinary afternoon builds the habit just as much as a marathon study night.",
    surface: "border-white/85 bg-[#F5F0FF]/75 backdrop-blur-md",
  },
  tough: {
    label: "Tough",
    src: "/images/eyva_tough.svg",
    headline: "Aww, hang in there! You still made it through.",
    reply:
      "Tough sessions happen. Eyva notes your breaks and fatigue cues without guilt or streak shaming.",
    surface: "border-white/85 bg-[#F2F8FE]/80 backdrop-blur-md",
  },
};

export default function MoodAndFooterSection({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}) {
  const [selectedMood, setSelectedMood] = useState<MoodKey>("good");
  const mood = MOODS[selectedMood];

  return (
    <>
      {/* Mood Reflection & Honest Architecture Strip */}
      <RevealSection
        id="privacy"
        className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 sm:py-22"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left: Interactive 3-Expression Mood Sampler */}
          <div className="eyva-glass-card rounded-[26px] p-6 sm:p-8 lg:col-span-7">
            <h2 className="m-0 text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#2A1163] sm:text-[28px]">
              Kind check-ins at the end of every session
            </h2>
            <p className="m-0 mt-2 text-[14px] leading-[1.6] text-[#4E416B]">
              Productivity is not robotic. Tap an Eyva expression below to preview
              how end-of-session reflections respond to your energy.
            </p>

            <div
              role="group"
              aria-label="Preview session reflection moods"
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {(["good", "okay", "tough"] as const).map((key) => {
                const item = MOODS[key];
                const active = key === selectedMood;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedMood(key)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.96 }}
                    transition={EYVA_SPRING}
                    className={`flex flex-col items-center justify-center gap-2 rounded-[16px] p-4 text-center transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
                      active
                        ? "eyva-glass-lavender ring-2 ring-[#351080]/35"
                        : "eyva-glass-inset hover:bg-white/80"
                    }`}
                  >
                    <Image
                      src={item.src}
                      alt={item.label}
                      width={56}
                      height={48}
                      className="h-auto w-[52px] sm:w-[56px]"
                    />
                    <span className="text-[12.5px] font-bold text-[#2A1163]">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedMood}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: EYVA_EASE }}
                role="status"
                className={`mt-4 rounded-[16px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ${mood.surface}`}
              >
                <div className="text-[14px] font-extrabold text-[#2A1163]">
                  {mood.headline}
                </div>
                <p className="m-0 mt-1 text-[12.5px] leading-[1.55] text-[#4E416B]">
                  {mood.reply}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Verifiable Privacy & Architecture Commitments */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <h3 className="m-0 text-[22px] font-extrabold leading-[1.2] text-[#2A1163]">
              Transparent about what touches your camera
            </h3>
            <p className="m-0 text-[14px] leading-[1.6] text-[#4E416B]">
              Built at IPB University as a dedicated study companion. Every signal
              has a documented boundary:
            </p>

            <div className="flex flex-col gap-3">
              <div className="eyva-glass-lavender rounded-[18px] p-4">
                <div className="text-[13px] font-bold text-[#2A1163]">
                  No raw photo or video persistence
                </div>
                <p className="m-0 mt-1 text-[12px] leading-[1.55] text-[#4E416B]">
                  Frames are decoded in memory only long enough to compute eye,
                  head, and MAR indicators, then immediately dropped.
                </p>
              </div>

              <div className="eyva-glass-lavender rounded-[18px] p-4">
                <div className="text-[13px] font-bold text-[#2A1163]">
                  Camera permission is always revocable
                </div>
                <p className="m-0 mt-1 text-[12px] leading-[1.55] text-[#4E416B]">
                  Deny or turn off webcam access anytime and continue using Eyva&apos;s
                  focus timer, soundtracks, and session history.
                </p>
              </div>

              <div className="eyva-glass-lavender rounded-[18px] p-4">
                <div className="text-[13px] font-bold text-[#2A1163]">
                  Visual cues, never a medical diagnosis
                </div>
                <p className="m-0 mt-1 text-[12px] leading-[1.55] text-[#4E416B]">
                  Drowsiness alerts are heuristic study reminders designed to
                  support healthier break habits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Closing Luminous Glass Yellow-Purple CTA Banner */}
      <RevealSection className="mx-auto max-w-[1120px] px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="flex flex-col items-center justify-between gap-8 rounded-[28px] border border-white/80 bg-gradient-to-br from-[#FFF454]/92 via-[#FFF238]/90 to-[#FFE924]/86 px-6 py-10 text-[#2A1163] shadow-[0_20px_52px_rgba(45,10,115,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl sm:px-12 sm:py-12 lg:flex-row">
          <div className="max-w-[560px] text-center lg:text-left">
            <h2 className="m-0 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#2A1163] sm:text-[34px] text-balance">
              Ready for a calmer, more sustainable study session?
            </h2>
            <p className="m-0 mt-2.5 text-[14.5px] font-medium leading-[1.6] text-[#462583]">
              Set your focus timer, pick your background calm, and let Eyva nudge
              you when it is time to rest your eyes.
            </p>

            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
              {isLoggedIn ? (
                <Link
                  href="/dashboard/home"
                  style={{ color: "#FFFFFF", fontWeight: 700 }}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#351080]/95 px-7 py-3 text-[14px] !font-bold !text-white shadow-[0_8px_22px_rgba(53,16,128,0.28),inset_0_1px_0_rgba(255,255,255,0.26)] backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    style={{ color: "#FFFFFF", fontWeight: 700 }}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#351080]/95 px-7 py-3 text-[14px] !font-bold !text-white shadow-[0_8px_22px_rgba(53,16,128,0.28),inset_0_1px_0_rgba(255,255,255,0.26)] backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    Start Focusing Free
                  </Link>
                  <button
                    type="button"
                    onClick={startGoogleLogin}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-full border border-white/85 bg-white/75 px-6 py-3 text-[13.5px] font-bold text-[#351080] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-white/95 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
                        stroke="#351080"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <FloatingMascot className="shrink-0">
            <Image
              src="/images/eyva_start.svg"
              alt="Eyva study companion mascot"
              width={185}
              height={154}
              className="h-auto w-[160px] sm:w-[185px]"
            />
          </FloatingMascot>
        </div>
      </RevealSection>

      {/* Clean Single-Row Glass Footer blended into main canvas */}
      <footer className="border-t border-white/75 bg-white/35 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-5 px-4 sm:flex-row sm:px-6">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <Image
              src="/images/eyva_icon.svg"
              alt="EYVA"
              width={88}
              height={42}
              className="h-auto w-[84px]"
            />
            <span className="text-[12px] text-[#6E6285]">
              Smart Study Companion · Focus &amp; Drowsiness Check-In
            </span>
          </div>

          <nav
            aria-label="Footer Links"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-semibold text-[#4A3875]"
          >
            <a href="#features" className="hover:text-[#351080] hover:underline">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#351080] hover:underline"
            >
              How It Works
            </a>
            <a
              href={`${API_BASE_URL}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#351080] hover:underline"
            >
              Terms of Service
            </a>
            <a
              href={`${API_BASE_URL}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#351080] hover:underline"
            >
              Privacy Policy
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
