"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    if (typeof window !== "undefined") {
      localStorage.setItem("eyva_username", username.trim() || "Username");
    }
    router.push("/choose-avatar");
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] via-[#FFFEF9] to-[#FFFDF0] px-4 py-10">
      {/* Header di atas Card */}
      <div className="mb-6 text-center max-w-[465px]">
        <h1 className="m-0 mb-2 text-[32px] font-bold tracking-tight text-[#2A1163]">
          Create your account
        </h1>
        <p className="m-0 text-[12.5px] leading-[1.5] tracking-wide text-[#7B728E]">
          Join <strong className="font-bold text-[#351080]">eyva</strong> to
          track your study sessions, build focus habits, and keep your progress
          simple.
        </p>
      </div>

      {/* Register Card */}
      <section className="w-full max-w-[465px] rounded-[20px] border border-[#F2EEF9] bg-white p-8 sm:px-9 sm:py-8 shadow-[0_14px_40px_rgba(53,16,128,0.06)] text-left">
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Email */}
          <div>
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
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] px-4 py-3 text-[12.5px] text-[#34245B] placeholder-[#9B92AE] outline-none transition focus:border-[#351080] focus:bg-white"
            />
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-[12px] font-bold text-[#351080]"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="ex: Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-[10px] border border-[#E6E0F0] bg-[#F7F6FB] px-4 py-3 text-[12.5px] text-[#34245B] placeholder-[#9B92AE] outline-none transition focus:border-[#351080] focus:bg-white"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[12px] font-bold text-[#351080]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
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

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-[12px] font-bold text-[#351080]"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
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
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 mb-0 text-[11.5px] font-medium text-[#9F3D69]">
                {error}
              </p>
            )}
          </div>

          {/* Create account Button */}
          <button
            type="submit"
            style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13px" }}
            className="mt-2 flex w-full items-center justify-center rounded-full bg-[#351080] py-3 px-4 text-[13px] !font-bold !text-white transition hover:bg-[#43189E] active:scale-[0.99]"
          >
            Create account
          </button>
        </form>

        {/* Continue with Google */}
        <button
          type="button"
          onClick={() =>
            alert("Google authentication will be connected later.")
          }
          style={{ fontWeight: 700, fontSize: "13px" }}
          className="mt-3.5 flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#E6E0F0] bg-white py-3 px-4 text-[13px] !font-bold text-[#351080] transition hover:bg-[#FAF8FF] active:scale-[0.99]"
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

        {/* Footer Link */}
        <p className="mt-5 mb-0 text-center text-[11.5px] text-[#7B728E]">
          Already have an account?{" "}
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
