"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Droplet, EyeOff, Brain, Clock } from "lucide-react";

export default function BreakSessionPage() {
  const router = useRouter();

  const [totalBreakSeconds, setTotalBreakSeconds] = useState(5 * 60);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);

  // Load break duration if configured, otherwise default to full 5 min (05:00)
  useEffect(() => {
    const savedConfig = localStorage.getItem("eyva_session_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.breakDurationMinutes) {
          const secs = Number(parsed.breakDurationMinutes) * 60;
          setTotalBreakSeconds(secs);
          setSecondsLeft(secs);
        }
      } catch {
        // Use default 5 minutes
      }
    }
  }, []);

  // Countdown timer from 05:00 down to 00:00
  useEffect(() => {
    if (secondsLeft <= 0) {
      const timeout = setTimeout(() => {
        router.push("/dashboard/focus-session");
      }, 800);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, router]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  // Progress bar percentage (100% full at 05:00 -> 0% empty at 00:00)
  const progressPercent =
    totalBreakSeconds > 0
      ? Math.min(100, Math.max(0, (secondsLeft / totalBreakSeconds) * 100))
      : 0;

  return (
    <div className="min-h-screen w-full bg-white text-[#351080] lg:grid lg:grid-cols-[45.5%_54.5%]">
      {/* =========================================================
          LEFT COLUMN: LOGO, COFFEE ILLUSTRATION, RESET REMINDERS
      ========================================================= */}
      <div className="flex flex-col justify-between border-b border-[#EFEBF7] bg-white pl-6 pr-8 pt-6 pb-10 lg:min-h-screen lg:border-b-0 lg:border-r">
        {/* TOP BAR LOGO (Exact same coordinates: left 24px, top 24px as HomePage) */}
        <div>
          <Link href="/dashboard/home" aria-label="EYVA Home">
            <Image
              src="/images/eyva_icon.svg"
              alt="EYVA Smart Study Companion"
              width={108}
              height={52}
              priority
              className="h-auto w-[108px]"
            />
          </Link>
        </div>

        {/* CENTER COFFEE BREAK ILLUSTRATION (With Animated Rising Steam Waves) */}
        <div className="my-2 flex items-center justify-center">
          <svg
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Coffee Break Illustration"
            className="h-auto w-[310px] sm:w-[355px]"
          >
            {/* Yellow Oval Background */}
            <path
              d="M300 505.909C451.376 505.909 574.091 419.215 574.091 312.273C574.091 205.33 451.376 118.636 300 118.636C148.624 118.636 25.9092 205.33 25.9092 312.273C25.9092 419.215 148.624 505.909 300 505.909Z"
              fill="#FFF34A"
            />
            {/* Saucer Base & Rim */}
            <path
              d="M300 456.818C382.089 456.818 448.636 448.271 448.636 437.727C448.636 427.184 382.089 418.636 300 418.636C217.91 418.636 151.363 427.184 151.363 437.727C151.363 448.271 217.91 456.818 300 456.818Z"
              fill="#351080"
            />
            <path
              d="M300 443.182C370.793 443.182 428.182 437.687 428.182 430.909C428.182 424.131 370.793 418.636 300 418.636C229.207 418.636 171.818 424.131 171.818 430.909C171.818 437.687 229.207 443.182 300 443.182Z"
              fill="#D4C4FF"
            />
            {/* Cup Handle */}
            <path
              d="M380.454 279.545H410.454C458.181 279.545 460.909 357.273 414.545 362.727H383.181"
              strokeWidth="21.8182"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke="#D4C4FF"
            />
            {/* Cup Body */}
            <path
              d="M201.818 271.364C201.818 261.364 207.273 256.364 218.182 256.364H368.182C379.091 256.364 384.546 261.364 384.546 271.364V364.091C384.546 402.273 365.455 421.364 327.273 421.364H259.091C220.909 421.364 201.818 402.273 201.818 364.091V271.364Z"
              fill="#8B5CF6"
            />
            <path
              d="M201.818 360C204.546 387.273 223.182 400.909 257.727 400.909H328.637C356.818 400.909 375.455 387.273 384.546 360V366.818C384.546 403.182 365.455 421.364 327.273 421.364H259.091C220.909 421.364 201.818 403.182 201.818 366.818V360Z"
              fill="#7350CA"
            />
            {/* Cup Rim & Coffee Surface */}
            <path
              d="M293.182 287.727C342.135 287.727 381.819 279.791 381.819 270C381.819 260.21 342.135 252.273 293.182 252.273C244.23 252.273 204.546 260.21 204.546 270C204.546 279.791 244.23 287.727 293.182 287.727Z"
              fill="#D4C4FF"
            />
            <path
              d="M293.182 283.637C334.603 283.637 368.182 278.752 368.182 272.727C368.182 266.703 334.603 261.818 293.182 261.818C251.76 261.818 218.182 266.703 218.182 272.727C218.182 278.752 251.76 283.637 293.182 283.637Z"
              fill="#351080"
            />
            {/* Cup Highlight */}
            <path
              d="M233.182 304.091V340.909"
              strokeWidth="9.54545"
              strokeLinecap="round"
              stroke="#D4C4FF"
            />

            {/* Animated Rising Steam Wave 1 (Left) */}
            <path
              className="eyva-steam-wave-1"
              d="M272.728 231.818C245.455 208.636 298.637 197.727 274.091 171.818"
              strokeWidth="8.18182"
              strokeLinecap="round"
              stroke="#351080"
            />
            {/* Animated Rising Steam Wave 2 (Right) */}
            <path
              className="eyva-steam-wave-2"
              d="M315 220.909C290.455 200.454 338.182 185.454 316.364 158.182"
              strokeWidth="8.18182"
              strokeLinecap="round"
              stroke="#351080"
            />

            {/* Sparkle Star */}
            <path
              className="eyva-coffee-sparkle"
              d="M441.818 205.909C441.818 215.909 436.818 220.909 426.818 220.909C436.818 220.909 441.818 225.909 441.818 235.909C441.818 225.909 446.818 220.909 456.818 220.909C446.818 220.909 441.818 215.909 441.818 205.909Z"
              fill="#9473C4"
            />
          </svg>
        </div>

        {/* BOTTOM LEFT TEXT & 3 REMINDERS */}
        <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:pl-3">
          {/* Eyebrow with Pink Heart Pulse Icon */}
          <div className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold tracking-[0.06em] text-[#8E849E] uppercase">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B84B7C"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
            </svg>
            <span>YOUR RESET MOMENT</span>
          </div>

          <h1 className="m-0 mt-1.5 text-[28px] sm:text-[31px] font-extrabold tracking-tight text-[#2A1163]">
            Rest is productive, too.
          </h1>
          <p className="m-0 mt-1.5 text-[11px] text-[#7B728E]">
            A little movement and a moment away from the screen
          </p>

          {/* 3 Bullet Items */}
          <div className="mt-6 flex flex-col gap-4">
            {/* Item 1: Drink some water */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#351080]">
                <Droplet size={17} strokeWidth={1.9} />
              </div>
              <div>
                <div className="text-[11.5px] font-bold text-[#2A1163]">
                  Drink some water
                </div>
                <div className="mt-0.5 text-[9.5px] text-[#7B728E]">
                  Take a few sips and hydrate
                </div>
              </div>
            </div>

            {/* Item 2: Rest your eyes */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#351080]">
                <EyeOff size={17} strokeWidth={1.9} />
              </div>
              <div>
                <div className="text-[11.5px] font-bold text-[#2A1163]">
                  Rest your eyes
                </div>
                <div className="mt-0.5 text-[9.5px] text-[#7B728E]">
                  Look away from the screen for a moment
                </div>
              </div>
            </div>

            {/* Item 3: Mind pause */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#351080]">
                <Brain size={17} strokeWidth={1.9} />
              </div>
              <div>
                <div className="text-[11.5px] font-bold text-[#2A1163]">
                  Mind pause
                </div>
                <div className="mt-0.5 text-[9.5px] text-[#7B728E]">
                  Stop studying during this little reset
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT COLUMN: MANDATORY BREAK TIMER + 3 STRETCH CARDS
      ========================================================= */}
      <div className="flex flex-col justify-center bg-[#FAF9F6] px-6 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-[560px]">
          {/* 1. MANDATORY BREAK YELLOW BANNER */}
          <section className="relative rounded-[18px] bg-gradient-to-r from-[#FFF238] via-[#FFF677] to-[#FFFDF0] px-6 py-6 text-center shadow-[0_8px_24px_rgba(45,10,115,0.08)]">
            {/* Small Demo Skip Button (Absolute so layout never shifts) */}
            <button
              type="button"
              onClick={() => router.push("/dashboard/focus-session")}
              style={{
                color: "#2A1163",
                fontWeight: 700,
                fontSize: "8.5px",
              }}
              className="absolute right-3.5 top-3.5 rounded-[7px] border border-[#2A1163]/15 bg-white/75 px-2.5 py-1 text-[8.5px] !font-bold !text-[#2A1163] backdrop-blur-xs transition hover:bg-white active:scale-95"
            >
              Skip demo →
            </button>

            <div className="text-[9.5px] font-semibold tracking-[0.06em] text-[#5E5278] uppercase">
              MANDATORY BREAK
            </div>

            <div className="mt-1 text-[46px] sm:text-[52px] font-extrabold leading-none tracking-tight text-[#2A1163]">
              {formattedTime}
            </div>

            {/* Progress Bar */}
            <div className="mx-auto mt-3.5 h-[4px] w-full max-w-[395px] overflow-hidden rounded-full bg-[#DDD5C0]">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#2A1163] via-[#5C3D99] to-[#9B6BFF] transition-all duration-700 ease-linear"
              />
            </div>

            {/* Auto-resume Caption */}
            <div className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[9.5px] font-medium text-[#3F2E66]">
              <Clock size={11} strokeWidth={2.2} className="shrink-0" />
              <span>
                Your study session resumes automatically when the timer ends.
              </span>
            </div>
          </section>

          {/* 2. SECTION HEADER */}
          <div className="mt-7 mb-4 flex items-baseline justify-between">
            <h2 className="m-0 text-[18px] font-extrabold tracking-tight text-[#2A1163]">
              3 little stretches
            </h2>
            <span className="text-[8.5px] font-semibold tracking-[0.06em] text-[#8E849E] uppercase">
              GENTLE MOVEMENT
            </span>
          </div>

          {/* 3. STRETCH CARDS LIST */}
          <div className="flex flex-col gap-4">
            {/* Stretch 01: Reach for the sky */}
            <div className="flex items-center gap-4 rounded-[16px] border border-[#F0ECF7] bg-white p-4 shadow-[0_4px_14px_rgba(45,10,115,0.04)]">
              {/* Illustration 01 */}
              <div className="relative flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#FFF238]">
                <svg
                  width="74"
                  height="74"
                  viewBox="0 0 74 74"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Lighter bottom dome */}
                  <circle cx="37" cy="64" r="24" fill="#FFF899" />

                  {/* Animated Upward Arrows */}
                  <g className="eyva-stretch-arrows">
                    <path
                      d="M14 27V17M14 17L11 20M14 17L17 20"
                      stroke="#351080"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M60 27V17M60 17L57 20M60 17L63 20"
                      stroke="#351080"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>

                  {/* Legs (Anchored) */}
                  <path
                    d="M33 54V69"
                    stroke="#2A1163"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M41 54V69"
                    stroke="#2A1163"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />

                  {/* Upper Body + Arms Reaching Up */}
                  <g className="eyva-reach-body">
                    {/* Left Arm Reaching Up */}
                    <path
                      className="eyva-reach-arm-left"
                      d="M29 33C25 25 25 16 26 11"
                      stroke="#351080"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    {/* Right Arm Reaching Up */}
                    <path
                      className="eyva-reach-arm-right"
                      d="M45 33C49 25 49 16 48 11"
                      stroke="#351080"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    {/* Torso */}
                    <rect
                      x="28"
                      y="30"
                      width="18"
                      height="24"
                      rx="7"
                      fill="#8E6CE4"
                    />
                    {/* Head */}
                    <circle cx="37" cy="21" r="6.5" fill="#2A1163" />
                  </g>
                </svg>
              </div>

              <div>
                <div className="text-[9.5px] font-semibold text-[#9A90AC]">
                  01
                </div>
                <div className="mt-0.5 text-[13px] font-extrabold text-[#2A1163]">
                  Reach for the sky
                </div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-[#7B728E]">
                  Raise both arms overhead and stretch gently. Hold for 15–20
                  seconds.
                </div>
              </div>
            </div>

            {/* Stretch 02: Shoulder rolls */}
            <div className="flex items-center gap-4 rounded-[16px] border border-[#F0ECF7] bg-white p-4 shadow-[0_4px_14px_rgba(45,10,115,0.04)]">
              {/* Illustration 02 */}
              <div className="relative flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#E8DFFF]">
                <svg
                  width="74"
                  height="74"
                  viewBox="0 0 74 74"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Lighter bottom dome */}
                  <circle cx="37" cy="64" r="24" fill="#F2ECFF" />

                  {/* Left & Right Shoulder Roll Curved Arrows */}
                  <g className="eyva-roll-arrows">
                    <path
                      d="M15 32C13 26 18 21 24 23"
                      stroke="#5C3D99"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M22 21L24.5 23.2L21.8 24.8"
                      stroke="#5C3D99"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M59 32C61 26 56 21 50 23"
                      stroke="#5C3D99"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M52 21L49.5 23.2L52.2 24.8"
                      stroke="#5C3D99"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>

                  {/* Legs (Anchored) */}
                  <path
                    d="M33 54V69"
                    stroke="#2A1163"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M41 54V69"
                    stroke="#2A1163"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />

                  {/* Rolling Shoulders + Arms */}
                  <g className="eyva-shoulder-left">
                    <path
                      d="M28 33L16 45"
                      stroke="#2A1163"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </g>
                  <g className="eyva-shoulder-right">
                    <path
                      d="M46 33L58 45"
                      stroke="#2A1163"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Torso */}
                  <rect
                    className="eyva-shoulder-torso"
                    x="28"
                    y="30"
                    width="18"
                    height="24"
                    rx="7"
                    fill="#8E6CE4"
                  />
                  {/* Head */}
                  <circle cx="37" cy="20" r="6.5" fill="#2A1163" />
                </svg>
              </div>

              <div>
                <div className="text-[9.5px] font-semibold text-[#9A90AC]">
                  02
                </div>
                <div className="mt-0.5 text-[13px] font-extrabold text-[#2A1163]">
                  Shoulder rolls
                </div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-[#7B728E]">
                  Roll your shoulders back slowly, then relax. Repeat 5 times.
                </div>
              </div>
            </div>

            {/* Stretch 03: Gentle neck stretch */}
            <div className="flex items-center gap-4 rounded-[16px] border border-[#F0ECF7] bg-white p-4 shadow-[0_4px_14px_rgba(45,10,115,0.04)]">
              {/* Illustration 03 */}
              <div className="relative flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#FCE2F0]">
                <svg
                  width="74"
                  height="74"
                  viewBox="0 0 74 74"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Lighter bottom dome */}
                  <circle cx="37" cy="64" r="24" fill="#FDF0F7" />

                  {/* Curved Double Arrow Above Head */}
                  <g className="eyva-neck-arrow">
                    <path
                      d="M23 12C31 7 43 7 51 12"
                      stroke="#8A3D68"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M25.5 9.5L22.5 12.2L26 13.5"
                      stroke="#8A3D68"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M48.5 9.5L51.5 12.2L48 13.5"
                      stroke="#8A3D68"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>

                  {/* Arms angled down */}
                  <path
                    d="M28 34L19 48"
                    stroke="#2A1163"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M46 34L55 48"
                    stroke="#2A1163"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  {/* Torso */}
                  <rect
                    x="28"
                    y="31"
                    width="18"
                    height="23"
                    rx="7"
                    fill="#8E6CE4"
                  />

                  {/* Neck + Head Tilting Gently Left & Right */}
                  <g className="eyva-neck-tilt">
                    <path
                      d="M37 31V24"
                      stroke="#2A1163"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <ellipse cx="37" cy="20" rx="6.6" ry="6.2" fill="#2A1163" />
                  </g>

                  {/* Legs */}
                  <path
                    d="M33 54V69"
                    stroke="#2A1163"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M41 54V69"
                    stroke="#2A1163"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <div className="text-[9.5px] font-semibold text-[#9A90AC]">
                  03
                </div>
                <div className="mt-0.5 text-[13px] font-extrabold text-[#2A1163]">
                  Gentle neck stretch
                </div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-[#7B728E]">
                  Tilt your head to each side without forcing it. Hold 10
                  seconds per side.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          KEYFRAME ANIMATIONS FOR THE 3 STRETCHES
      ========================================================= */}
      <style jsx global>{`
        /* 01: Reach for the sky — upper body & arms reach up and hold gently */
        @keyframes eyvaReachBody {
          0%,
          100% {
            transform: translateY(1px) scaleY(0.98);
          }
          35%,
          65% {
            transform: translateY(-2.5px) scaleY(1.04);
          }
        }
        @keyframes eyvaReachArmLeft {
          0%,
          100% {
            transform: rotate(-10deg);
          }
          35%,
          65% {
            transform: rotate(5deg) translateY(-1.5px);
          }
        }
        @keyframes eyvaReachArmRight {
          0%,
          100% {
            transform: rotate(10deg);
          }
          35%,
          65% {
            transform: rotate(-5deg) translateY(-1.5px);
          }
        }
        @keyframes eyvaStretchArrows {
          0%,
          100% {
            transform: translateY(1.5px);
            opacity: 0.55;
          }
          40%,
          60% {
            transform: translateY(-2.5px);
            opacity: 1;
          }
        }

        /* 02: Shoulder rolls — circular rolling motion of shoulders & torso */
        @keyframes eyvaShoulderLeftRoll {
          0% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          25% {
            transform: translate(0.5px, -3.2px) rotate(6deg);
          }
          50% {
            transform: translate(-1.8px, -1.2px) rotate(-5deg);
          }
          75% {
            transform: translate(0px, 1.2px) rotate(-2deg);
          }
          100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
        }
        @keyframes eyvaShoulderRightRoll {
          0% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          25% {
            transform: translate(-0.5px, -3.2px) rotate(-6deg);
          }
          50% {
            transform: translate(1.8px, -1.2px) rotate(5deg);
          }
          75% {
            transform: translate(0px, 1.2px) rotate(2deg);
          }
          100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
        }
        @keyframes eyvaShoulderTorso {
          0%,
          100% {
            transform: translateY(0px) scaleX(1);
          }
          25% {
            transform: translateY(-2.2px) scaleX(1.03);
          }
          50% {
            transform: translateY(-0.8px) scaleX(1.05);
          }
          75% {
            transform: translateY(0.8px) scaleX(0.99);
          }
        }
        @keyframes eyvaRollArrows {
          0%,
          100% {
            opacity: 0.6;
            transform: translateY(0px);
          }
          35% {
            opacity: 1;
            transform: translateY(-1.5px);
          }
        }

        /* 03: Gentle neck stretch — head tilts slowly left, holds, then tilts right, holds */
        @keyframes eyvaNeckTilt {
          0%,
          100% {
            transform: rotate(-22deg);
          }
          15% {
            transform: rotate(-22deg);
          }
          50% {
            transform: rotate(22deg);
          }
          65% {
            transform: rotate(22deg);
          }
        }
        @keyframes eyvaNeckArrow {
          0%,
          15%,
          100% {
            transform: rotate(-4deg);
          }
          50%,
          65% {
            transform: rotate(4deg);
          }
        }

        .eyva-reach-body {
          transform-origin: 37px 54px;
          animation: eyvaReachBody 3.2s ease-in-out infinite;
        }
        .eyva-reach-arm-left {
          transform-origin: 29px 33px;
          animation: eyvaReachArmLeft 3.2s ease-in-out infinite;
        }
        .eyva-reach-arm-right {
          transform-origin: 45px 33px;
          animation: eyvaReachArmRight 3.2s ease-in-out infinite;
        }
        .eyva-stretch-arrows {
          animation: eyvaStretchArrows 3.2s ease-in-out infinite;
        }

        .eyva-shoulder-left {
          transform-origin: 28px 33px;
          animation: eyvaShoulderLeftRoll 2.4s ease-in-out infinite;
        }
        .eyva-shoulder-right {
          transform-origin: 46px 33px;
          animation: eyvaShoulderRightRoll 2.4s ease-in-out infinite;
        }
        .eyva-shoulder-torso {
          transform-origin: 37px 42px;
          animation: eyvaShoulderTorso 2.4s ease-in-out infinite;
        }
        .eyva-roll-arrows {
          animation: eyvaRollArrows 2.4s ease-in-out infinite;
        }

        .eyva-neck-tilt {
          transform-origin: 37px 31px;
          animation: eyvaNeckTilt 3.8s ease-in-out infinite;
        }
        .eyva-neck-arrow {
          transform-origin: 37px 12px;
          animation: eyvaNeckArrow 3.8s ease-in-out infinite;
        }

        /* Coffee Cup Steam Rising Waves */
        @keyframes eyvaSteamRise1 {
          0% {
            transform: translateY(10px) translateX(0px) scaleY(0.92);
            opacity: 0;
          }
          25% {
            opacity: 0.95;
          }
          55% {
            transform: translateY(-4px) translateX(-3px) scaleY(1.03);
            opacity: 1;
          }
          85% {
            opacity: 0.65;
          }
          100% {
            transform: translateY(-18px) translateX(2px) scaleY(0.96);
            opacity: 0;
          }
        }

        @keyframes eyvaSteamRise2 {
          0% {
            transform: translateY(10px) translateX(0px) scaleY(0.92);
            opacity: 0;
          }
          25% {
            opacity: 0.95;
          }
          55% {
            transform: translateY(-5px) translateX(3px) scaleY(1.04);
            opacity: 1;
          }
          85% {
            opacity: 0.65;
          }
          100% {
            transform: translateY(-19px) translateX(-2px) scaleY(0.96);
            opacity: 0;
          }
        }

        @keyframes eyvaCoffeeSparkle {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        .eyva-steam-wave-1 {
          transform-origin: 273px 205px;
          animation: eyvaSteamRise1 3.4s ease-in-out infinite;
        }
        .eyva-steam-wave-2 {
          transform-origin: 315px 192px;
          animation: eyvaSteamRise2 3.4s ease-in-out 1.4s infinite;
        }
        .eyva-coffee-sparkle {
          transform-origin: 442px 221px;
          animation: eyvaCoffeeSparkle 2.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
