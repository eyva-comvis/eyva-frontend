"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroLivePreview from "@/components/landing/HeroLivePreview";
import FeatureBentoGrid from "@/components/landing/FeatureBentoGrid";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import MoodAndFooterSection from "@/components/landing/MoodAndFooterSection";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionPrimitives";
import { hasSession } from "@/lib/authStorage";
import { startGoogleLogin } from "@/services/api/auth";

export default function LandingRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(hasSession());
  }, []);

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-[#FFFEF9] text-[#2A1163]">
      {/* Sticky Glass Pill Navbar */}
      <LandingNavbar isLoggedIn={isLoggedIn} />

      <main id="main-content">
        {/* Kinetic Split Hero with Subtle Warm Ivory-Lavender-Yellow Mesh */}
        <section
          aria-labelledby="hero-heading"
          style={{
            background:
              "radial-gradient(640px circle at 14% 18%, rgba(242, 236, 255, 0.85), transparent 65%), radial-gradient(520px circle at 86% 12%, rgba(255, 242, 56, 0.24), transparent 60%), linear-gradient(180deg, #FFFEF9 0%, #FFFFFF 100%)",
          }}
          className="w-full pt-8 pb-14 sm:pt-12 sm:pb-20"
        >
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
            {/* Left Editorial Pitch (6 cols) */}
            <StaggerContainer
              stagger={0.075}
              className="flex flex-col items-start lg:col-span-6"
            >
              <StaggerItem>
                <h1
                  id="hero-heading"
                  className="m-0 text-[36px] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#2A1163] sm:text-[48px] lg:text-[52px] text-balance"
                >
                  Study in your own rhythm,{" "}
                  <span className="inline-block rounded-[10px] bg-[#FFF238] px-2.5 py-0.5 text-[#351080]">
                    rest on time.
                  </span>
                </h1>
              </StaggerItem>

              <StaggerItem>
                <p className="m-0 mt-4 max-w-[54ch] text-[16px] leading-[1.6] text-[#53466E] text-pretty">
                  Eyva pairs a calm Pomodoro study space with real-time webcam
                  drowsiness check-ins, spoken voice reminders, and ambient or
                  Spotify soundtracks so you know when to refocus and when to take
                  a 5-minute break.
                </p>
              </StaggerItem>

              <StaggerItem className="w-full sm:w-auto">
                <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  {isLoggedIn ? (
                    <Link
                      href="/dashboard/home"
                      style={{ color: "#FFFFFF", fontWeight: 700 }}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#351080] px-7 py-3 text-[14px] !font-bold !text-white shadow-[0_4px_0_#220856] transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                    >
                      Open Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        style={{ color: "#FFFFFF", fontWeight: 700 }}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#351080] px-7 py-3 text-[14px] !font-bold !text-white shadow-[0_4px_0_#220856] transition-[background-color,transform] duration-150 hover:bg-[#43189E] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                      >
                        Start Focusing Free
                      </Link>

                      <button
                        type="button"
                        onClick={startGoogleLogin}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border border-[#DDD3F2] bg-white px-6 py-3 text-[13.5px] font-bold text-[#351080] transition-[background-color,border-color,transform] duration-150 hover:border-[#C2B2E8] hover:bg-[#FAF8FF] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
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
              </StaggerItem>

              {/* Micro Trust Pill */}
              <StaggerItem>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#E5DDF5] bg-[#F7F3FF] px-3.5 py-1.5 text-[12px] font-medium text-[#4D3B7C]">
                  <Shield
                    size={13}
                    strokeWidth={2.3}
                    aria-hidden="true"
                    className="shrink-0 text-[#351080]"
                  />
                  <span>Webcam processed in-memory · Zero video stored</span>
                </div>
              </StaggerItem>
            </StaggerContainer>

            {/* Right Interactive Eyva Focus Simulator (6 cols) */}
            <div className="lg:col-span-6">
              <HeroLivePreview />
            </div>
          </div>
        </section>

        {/* Interactive 5-Card Bento Grid */}
        <FeatureBentoGrid />

        {/* Interactive 4-Step Workflow */}
        <HowItWorksSection />

        {/* Mood Reflection Sampler, Privacy Commitments, Final CTA & Footer */}
        <MoodAndFooterSection isLoggedIn={isLoggedIn} />
      </main>
    </div>
  );
}
