"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import {
  EYVA_EASE,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  TactileButton,
} from "@/components/motion/MotionPrimitives";
import { ApiError, errorMessage } from "@/services/api/client";
import { login, startGoogleLogin } from "@/services/api/auth";
import { landingPathAfterLogin } from "@/services/api/profile";

function LoginPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired")) setNotice("Your session has ended. Please log in again.");
    if (params.get("reset")) setNotice("Password updated. Log in with your new password.");
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/dashboard") ? next : await landingPathAfterLogin());
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        router.push(`/register?verify=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(errorMessage(err));
      setErrorKey((k) => k + 1);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF0] px-4 py-10">
      <PageTransition className="flex w-full flex-col items-center">
        {/* Header above Card */}
        <div className="mb-6 max-w-[465px] text-center">
          <Link
            href="/"
            aria-label="Back to EYVA home page"
            className="mb-4 inline-block rounded-[10px] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#351080]"
          >
            <Image
              src="/images/eyva_icon.svg"
              alt="EYVA Smart Study Companion"
              width={96}
              height={46}
              priority
              className="h-auto w-[92px]"
            />
          </Link>
          <h1 className="m-0 mb-2 text-[32px] font-bold tracking-tight text-[#2A1163]">
            Log in to your account
          </h1>
          <p className="m-0 text-[12.5px] leading-[1.5] tracking-wide text-[#7B728E]">
            Log in to <strong className="font-bold text-[#351080]">eyva</strong>{" "}
            to track your study sessions, build focus habits, and keep your
            progress simple.
          </p>
        </div>

        {/* Login Card */}
        <motion.section
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: EYVA_EASE }}
          className="w-full max-w-[465px] rounded-[20px] border border-[#F2EEF9] bg-white p-8 text-left shadow-[0_14px_40px_rgba(53,16,128,0.06)] sm:px-9 sm:py-8"
        >
          <form onSubmit={handleLogin}>
            <StaggerContainer className="flex flex-col gap-4" stagger={0.055}>
              {/* Email */}
              <StaggerItem>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[12px] font-bold text-[#351080]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ex: name@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] px-4 py-3 text-[16px] text-[#34245B] placeholder-[#9B92AE] outline-none transition-[border-color,background-color,box-shadow] duration-150 focus:border-[#351080] focus:bg-white focus:ring-2 focus:ring-[#351080]/12 sm:text-[12.5px]"
                />
              </StaggerItem>

              {/* Password */}
              <StaggerItem>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-bold text-[#351080]"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    style={{ color: "#351080" }}
                    className="rounded-[4px] text-[11.5px] font-bold !text-[#351080] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    Forget password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] py-3 pr-11 pl-4 text-[16px] text-[#34245B] placeholder-[#9B92AE] outline-none transition-[border-color,background-color,box-shadow] duration-150 focus:border-[#351080] focus:bg-white focus:ring-2 focus:ring-[#351080]/12 sm:text-[12.5px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-[8px] border-0 bg-transparent text-[#8C7DA8] transition-colors duration-150 hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#351080]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </StaggerItem>

              <AnimatePresence mode="wait">
                {(error || notice) && (
                  <motion.p
                    key={error ? `err-${errorKey}` : `notice-${notice}`}
                    role={error ? "alert" : "status"}
                    initial={{ opacity: 0, y: -4 }}
                    animate={
                      error && !prefersReduced
                        ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                        : { opacity: 1, y: 0 }
                    }
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.28, ease: EYVA_EASE }}
                    className={`m-0 rounded-[9px] px-3 py-2 text-[11.5px] font-medium ${
                      error
                        ? "border border-[#F5DCE6] bg-[#FDF2F6] text-[#9F3D69]"
                        : "border border-[#E5DCF8] bg-[#F7F3FF] text-[#351080]"
                    }`}
                  >
                    {error || notice}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Log in Button */}
              <StaggerItem>
                <TactileButton
                  type="submit"
                  disabled={isSubmitting}
                  style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
                  className="mt-1 flex w-full items-center justify-center rounded-full bg-[#351080] px-4 py-3 text-[13px] !font-bold !text-white transition-colors duration-150 hover:bg-[#43189E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] disabled:opacity-70"
                >
                  {isSubmitting ? "Logging in…" : "Log in"}
                </TactileButton>
              </StaggerItem>
            </StaggerContainer>
          </form>

          {/* Continue with Google */}
          <TactileButton
            type="button"
            onClick={startGoogleLogin}
            style={{ fontWeight: 700, fontSize: "13px" }}
            className="mt-3.5 flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#E6E0F0] bg-white px-4 py-3 text-[13px] !font-bold text-[#351080] transition-colors duration-150 hover:bg-[#FAF8FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
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
          </TactileButton>

          {/* Footer Link */}
          <p className="mt-5 mb-0 text-center text-[11.5px] text-[#7B728E]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{ color: "#351080" }}
              className="rounded-[4px] font-bold !text-[#351080] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
            >
              Create account
            </Link>
          </p>
        </motion.section>
      </PageTransition>
    </main>
  );
}

export default function LoginRoute() {
  return (
    <AuthGate require="guest">
      <LoginPage />
    </AuthGate>
  );
}
