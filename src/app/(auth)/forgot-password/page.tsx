"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

type ForgotPasswordStep = "email" | "verify" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();

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
  const [resendSuccess, setResendSuccess] = useState(false);

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Step 1: Submit Email -> Move to Verification Code
  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setStep("verify");
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

  const handleVerifySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setError("");
    setStep("reset");
  };

  const handleResendCode = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setError("");
    setResendSuccess(true);
    otpInputRefs.current[0]?.focus();
    setTimeout(() => {
      setResendSuccess(false);
    }, 3000);
  };

  // Step 3: Submit New Password -> Redirect to Login
  const handleResetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    router.push("/login");
  };

  return (
    <main
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FFFEF9 50%, #FFFCE8 100%)",
      }}
      className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF0] px-4 py-10"
    >
      {/* Header di atas Card (identik dengan Login & Register) */}
      <div className="mb-6 text-center max-w-[465px]">
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
      </div>

      {/* Main Card (identik dengan Login & Register) */}
      <section className="w-full max-w-[465px] rounded-[20px] border border-[#F2EEF9] bg-white p-8 sm:px-9 sm:py-8 shadow-[0_14px_40px_rgba(53,16,128,0.06)] text-left">
        {/* ================= STEP 1: INPUT EMAIL ================= */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
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
                className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] px-4 py-3 text-[12.5px] text-[#34245B] placeholder-[#9B92AE] outline-none transition focus:border-[#351080] focus:bg-white"
              />
              {error && (
                <p className="mt-1.5 mb-0 text-[11.5px] font-medium text-[#9F3D69]">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
              className="mt-2 flex w-full items-center justify-center rounded-full bg-[#351080] py-3 px-4 text-[13px] !font-bold !text-white transition hover:bg-[#43189E] active:scale-[0.99]"
            >
              Send verification code
            </button>
          </form>
        )}

        {/* ================= STEP 2: INPUT VERIFICATION CODE ================= */}
        {step === "verify" && (
          <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
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
                  className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-bold !text-[#351080] hover:underline"
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
                    className="h-[48px] w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] text-center !text-[16px] !font-bold text-[#2A1163] outline-none transition focus:border-[#351080] focus:bg-white focus:ring-2 focus:ring-[#351080]/15"
                  />
                ))}
              </div>

              {error && (
                <p className="mt-2 mb-0 text-[11.5px] font-medium text-[#9F3D69]">
                  {error}
                </p>
              )}

              {resendSuccess && (
                <p className="mt-2 mb-0 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#351080]">
                  <CheckCircle2 size={13} strokeWidth={2.3} />
                  <span>A new verification code has been sent to your Gmail.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
              className="mt-2 flex w-full items-center justify-center rounded-full bg-[#351080] py-3 px-4 text-[13px] !font-bold !text-white transition hover:bg-[#43189E] active:scale-[0.99]"
            >
              Verify code
            </button>

            <p className="m-0 text-center text-[11.5px] text-[#7B728E]">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                style={{ color: "#351080" }}
                className="border-0 bg-transparent p-0 font-bold !text-[#351080] hover:underline"
              >
                Resend code
              </button>
            </p>
          </form>
        )}

        {/* ================= STEP 3: RESET PASSWORD ================= */}
        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
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
                  className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] pl-4 pr-10 py-3 text-[12.5px] text-[#34245B] placeholder-[#9B92AE] outline-none transition focus:border-[#351080] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center border-0 bg-transparent p-1 text-[#8C7DA8] hover:text-[#351080] transition"
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
                  className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] pl-4 pr-10 py-3 text-[12.5px] text-[#34245B] placeholder-[#9B92AE] outline-none transition focus:border-[#351080] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center border-0 bg-transparent p-1 text-[#8C7DA8] hover:text-[#351080] transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 mb-0 text-[11.5px] font-medium text-[#9F3D69]">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
              className="mt-2 flex w-full items-center justify-center rounded-full bg-[#351080] py-3 px-4 text-[13px] !font-bold !text-white transition hover:bg-[#43189E] active:scale-[0.99]"
            >
              Reset password
            </button>
          </form>
        )}

        {/* Footer Link back to Login */}
        <p className="mt-5 mb-0 text-center text-[11.5px] text-[#7B728E]">
          Remember your password?{" "}
          <Link
            href="/login"
            style={{ color: "#351080" }}
            className="font-bold !text-[#351080] hover:underline"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
