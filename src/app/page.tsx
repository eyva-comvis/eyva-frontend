
"use client";

import Image from "next/image";
import Link from "next/link";
import AuthGate from "@/components/auth/AuthGate";
import { startGoogleLogin } from "@/services/api/auth";

function LandingPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF0] px-4 py-10">
      {/* Logo Eyva di atas card */}
      <div className="mb-7 flex justify-center">
        <Link href="/" aria-label="EYVA Home">
          <Image
            src="/images/eyva_icon_before_regisORlogin.svg"
            alt="EYVA: Smart Study Companion"
            width={195}
            height={90}
            priority
            className="h-auto w-[180px] sm:w-[195px]"
          />
        </Link>
      </div>

      {/* Main Card */}
      <section className="w-full max-w-[465px] rounded-[20px] border border-[#F2EEF9] bg-white p-8 sm:px-9 sm:py-8 shadow-[0_14px_40px_rgba(53,16,128,0.06)] text-left">
        <h1 className="text-[26px] font-bold tracking-tight text-[#351080] m-0 mb-2">
          Ready to Focus?
        </h1>

        <p className="text-[13.5px] leading-[1.55] text-[#6E6285] m-0 mb-6">
          Your study companion to monitor drowsiness and track your study
          sessions.
        </p>

        {/* Continue with Google */}
        <button
          type="button"
          onClick={startGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#E6E0F0] bg-white py-3 px-4 text-[13px] font-bold text-[#351080] transition hover:bg-[#FAF8FF] active:scale-[0.99]"
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

        {/* Divider "or" */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#EDE8F5]" />
          <span className="text-[11px] font-medium text-[#9A90AD]">or</span>
          <div className="h-px flex-1 bg-[#EDE8F5]" />
        </div>

        {/* Login & Create Account Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            style={{ color: "#FFFFFF" }}
            className="flex w-full items-center justify-center rounded-[10px] bg-[#351080] py-3 px-4 text-[13px] font-bold !text-white transition hover:bg-[#43189E] active:scale-[0.99]"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="flex w-full items-center justify-center rounded-[10px] border border-[#E6E0F0] bg-white py-3 px-4 text-[13px] font-bold text-[#351080] transition hover:bg-[#FAF8FF] active:scale-[0.99]"
          >
            Create Account
          </Link>
        </div>

        {/* Footer Terms */}
        <p className="mt-6 mb-0 text-[11px] leading-relaxed text-[#8C82A0]">
          By signing in, you agree to our{" "}
          <a
            href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/terms`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#6E6285] hover:text-[#351080] hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#6E6285] hover:text-[#351080] hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </section>
    </main>
  );
}


export default function LandingRoute() {
  return (
    <AuthGate require="guest">
      <LandingPage />
    </AuthGate>
  );
}
