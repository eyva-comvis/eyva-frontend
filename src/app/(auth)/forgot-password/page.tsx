"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import {
  EYVA_EASE,
  PageTransition,
  TactileButton,
} from "@/components/motion/MotionPrimitives";
import { errorMessage } from "@/services/api/client";
import { forgotPassword, resetPassword, verifyResetCode } from "@/services/api/auth";
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH } from "@/lib/validation";

type ForgotPasswordStep = "email" | "verify" | "reset";

const STEP_INDEX: Record<ForgotPasswordStep, number> = {
  email: 0,
  verify: 1,
  reset: 2,
};

function ForgotPasswordPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const triggerError = (msg: string) => {
    setError(msg);
    setErrorKey((k) => k + 1);
  };

  // Step 1: Submit Email -> Move to Verification Code
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      triggerError("Please enter your email address.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setStep("verify");
    } catch (err) {
      triggerError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle 6-Digit OTP Input
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    if (error) setError("");

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);
    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length < 6) {
      triggerError("Please enter the complete 6-digit verification code.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      setResetToken(await verifyResetCode(email.trim(), fullCode));
      setStep("reset");
    } catch (err) {
      triggerError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setError("");
    otpInputRefs.current[0]?.focus();
    try {
      await forgotPassword(email.trim());
      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err) {
      triggerError(errorMessage(err));
    }
  };

  // Step 3: Submit New Password -> Redirect to Login
  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      triggerError(PASSWORD_HINT);
      return;
    }
    if (password !== confirmPassword) {
      triggerError("Passwords do not match.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await resetPassword(resetToken, password);
      router.push("/login?reset=1");
    } catch (err) {
      triggerError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  const currentIdx = STEP_INDEX[step];

  return (
    <main
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FFFEF9 50%, #FFFCE8 100%)",
      }}
      className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF0] px-4 py-10"
    >
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

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EYVA_EASE }}
            >
              <h1 className="m-0 mb-2 text-[32px] font-bold tracking-tight text-[#2A1163]">
                {step === "email" && "Forgot your password?"}
                {step === "verify" && "Check your email"}
                {step === "reset" && "Reset your password"}
              </h1>
              <p className="m-0 text-[12.5px] leading-[1.5] tracking-wide text-[#7B728E]">
                {step === "email" && (
                  <>
                    Enter the email connected to your{" "}
                    <strong className="font-bold text-[#351080]">eyva</strong> account
                    and we&apos;ll send a verification code to your Gmail.
                  </>
                )}
                {step === "verify" && (
                  <>
                    We&apos;ve sent a 6-digit verification code to{" "}
                    <strong className="font-bold text-[#351080]">
                      {email || "your Gmail"}
                    </strong>
                    . Enter the code below to continue.
                  </>
                )}
                {step === "reset" && (
                  <>
                    Create a new password for your{" "}
                    <strong className="font-bold text-[#351080]">eyva</strong> account
                    so you can get back to your study sessions.
                  </>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Main Card */}
        <motion.section
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: EYVA_EASE }}
          className="w-full max-w-[465px] rounded-[20px] border border-[#F2EEF9] bg-white p-8 text-left shadow-[0_14px_40px_rgba(53,16,128,0.06)] sm:px-9 sm:py-8"
        >
          {/* Subtle 3-step indicator */}
          <div
            aria-label={`Step ${currentIdx + 1} of 3`}
            className="mb-5 flex items-center gap-1.5"
          >
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`h-[4px] flex-1 rounded-full transition-colors duration-200 ${
                  idx <= currentIdx ? "bg-[#351080]" : "bg-[#EDE6FA]"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {/* ================= STEP 1: INPUT EMAIL ================= */}
            {step === "email" && (
              <motion.form
                key="step-email"
                onSubmit={handleEmailSubmit}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -14 }}
                transition={{ duration: 0.22, ease: EYVA_EASE }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-1.5 block text-[12px] font-bold text-[#351080]"
                  >
                    Email
                  </label>
                  <input
                    id="forgot-email"
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
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        key={`email-err-${errorKey}`}
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={
                          prefersReduced
                            ? { opacity: 1, y: 0 }
                            : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                        }
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.28, ease: EYVA_EASE }}
                        className="mt-2 mb-0 rounded-[9px] border border-[#F5DCE6] bg-[#FDF2F6] px-3 py-2 text-[11.5px] font-medium text-[#9F3D69]"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <TactileButton
                  type="submit"
                  disabled={isSubmitting}
                  style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
                  className="mt-2 flex w-full items-center justify-center rounded-full bg-[#351080] px-4 py-3 text-[13px] !font-bold !text-white transition-colors duration-150 hover:bg-[#43189E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] disabled:opacity-70"
                >
                  {isSubmitting ? "Sending…" : "Send verification code"}
                </TactileButton>
              </motion.form>
            )}

            {/* ================= STEP 2: INPUT VERIFICATION CODE ================= */}
            {step === "verify" && (
              <motion.form
                key="step-verify"
                onSubmit={handleVerifySubmit}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: EYVA_EASE }}
                className="flex flex-col gap-4"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="otp-0"
                      className="block text-[12px] font-bold text-[#351080]"
                    >
                      Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep("email");
                      }}
                      style={{ color: "#351080" }}
                      className="inline-flex items-center gap-1 rounded-[4px] border-0 bg-transparent p-0 text-[11px] font-bold !text-[#351080] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                    >
                      <ArrowLeft size={12} strokeWidth={2.3} />
                      <span>Change email</span>
                    </button>
                  </div>

                  {/* 6-Digit OTP Boxes */}
                  <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        aria-label={`Verification digit ${index + 1}`}
                        style={{ fontWeight: 700, fontSize: "16px" }}
                        className="h-[48px] w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] text-center !text-[16px] !font-bold text-[#2A1163] tabular-nums outline-none transition-[border-color,background-color,box-shadow] duration-150 focus:border-[#351080] focus:bg-white focus:ring-2 focus:ring-[#351080]/15"
                      />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        key={`verify-err-${errorKey}`}
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={
                          prefersReduced
                            ? { opacity: 1, y: 0 }
                            : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                        }
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.28, ease: EYVA_EASE }}
                        className="mt-2.5 mb-0 rounded-[9px] border border-[#F5DCE6] bg-[#FDF2F6] px-3 py-2 text-[11.5px] font-medium text-[#9F3D69]"
                      >
                        {error}
                      </motion.p>
                    )}

                    {resendSuccess && !error && (
                      <motion.p
                        key="resend-ok"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22, ease: EYVA_EASE }}
                        className="mt-2.5 mb-0 inline-flex items-center gap-1.5 rounded-[9px] border border-[#E5DCF8] bg-[#F7F3FF] px-3 py-2 text-[11.5px] font-semibold text-[#351080]"
                      >
                        <CheckCircle2 size={13} strokeWidth={2.3} className="shrink-0" />
                        <span>A new verification code has been sent to your email.</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <TactileButton
                  type="submit"
                  disabled={isSubmitting}
                  style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
                  className="mt-2 flex w-full items-center justify-center rounded-full bg-[#351080] px-4 py-3 text-[13px] !font-bold !text-white transition-colors duration-150 hover:bg-[#43189E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] disabled:opacity-70"
                >
                  {isSubmitting ? "Checking…" : "Verify code"}
                </TactileButton>

                <p className="m-0 text-center text-[11.5px] text-[#7B728E]">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    style={{ color: "#351080" }}
                    className="rounded-[4px] border-0 bg-transparent p-0 font-bold !text-[#351080] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    Resend code
                  </button>
                </p>
              </motion.form>
            )}

            {/* ================= STEP 3: RESET PASSWORD ================= */}
            {step === "reset" && (
              <motion.form
                key="step-reset"
                onSubmit={handleResetSubmit}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: EYVA_EASE }}
                className="flex flex-col gap-4"
              >
                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-[12px] font-bold text-[#351080]"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a new password"
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
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="mb-1.5 block text-[12px] font-bold text-[#351080]"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      required
                      className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] py-3 pr-11 pl-4 text-[16px] text-[#34245B] placeholder-[#9B92AE] outline-none transition-[border-color,background-color,box-shadow] duration-150 focus:border-[#351080] focus:bg-white focus:ring-2 focus:ring-[#351080]/12 sm:text-[12.5px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute top-1/2 right-2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-[8px] border-0 bg-transparent text-[#8C7DA8] transition-colors duration-150 hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#351080]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        key={`reset-err-${errorKey}`}
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={
                          prefersReduced
                            ? { opacity: 1, y: 0 }
                            : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                        }
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.28, ease: EYVA_EASE }}
                        className="mt-2 mb-0 rounded-[9px] border border-[#F5DCE6] bg-[#FDF2F6] px-3 py-2 text-[11.5px] font-medium text-[#9F3D69]"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <TactileButton
                  type="submit"
                  disabled={isSubmitting}
                  style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
                  className="mt-2 flex w-full items-center justify-center rounded-full bg-[#351080] px-4 py-3 text-[13px] !font-bold !text-white transition-colors duration-150 hover:bg-[#43189E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] disabled:opacity-70"
                >
                  {isSubmitting ? "Saving…" : "Reset password"}
                </TactileButton>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer Link back to Login */}
          <p className="mt-5 mb-0 text-center text-[11.5px] text-[#7B728E]">
            Remember your password?{" "}
            <Link
              href="/login"
              style={{ color: "#351080" }}
              className="rounded-[4px] font-bold !text-[#351080] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
            >
              Log in
            </Link>
          </p>
        </motion.section>
      </PageTransition>
    </main>
  );
}

export default function ForgotPasswordRoute() {
  return (
    <AuthGate require="guest">
      <ForgotPasswordPage />
    </AuthGate>
  );
}
