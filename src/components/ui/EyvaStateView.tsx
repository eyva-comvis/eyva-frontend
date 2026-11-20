import Image from "next/image";
import Link from "next/link";
import { RefreshCw, ArrowLeft, WifiOff } from "lucide-react";

interface EyvaLoadingViewProps {
  title?: string;
  subtitle?: string;
  showDashboardSkeleton?: boolean;
}

export function EyvaLoadingView({
  title = "Preparing your study space…",
  subtitle = "Setting up your calm corner so you can jump right into your flow.",
  showDashboardSkeleton = false,
}: EyvaLoadingViewProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen w-full flex-col bg-[#FFFEF9] text-[#351080]"
    >
      {/* Top Bar Brand */}
      <div className="px-6 pt-6 sm:px-8">
        <Image
          src="/images/eyva_icon.svg"
          alt="EYVA Smart Study Companion"
          width={108}
          height={52}
          priority
          className="h-auto w-[108px]"
        />
      </div>

      {/* Main Centered Loader */}
      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        {/* Concentric Eyva Spinner + Mascot */}
        <div className="relative flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[#F2ECFF] p-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 112 112"
            className="pointer-events-none absolute inset-0 h-full w-full motion-safe:animate-spin"
            style={{ animationDuration: "1.8s" }}
          >
            <circle
              cx="56"
              cy="56"
              r="51"
              fill="none"
              stroke="#E2D6FA"
              strokeWidth="5"
            />
            <circle
              cx="56"
              cy="56"
              r="51"
              fill="none"
              stroke="#351080"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="96 225"
            />
            <circle
              cx="56"
              cy="56"
              r="51"
              fill="none"
              stroke="#FFF238"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="24 297"
              strokeDashoffset="-96"
            />
          </svg>

          <div className="relative z-10 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(53,16,128,0.1)]">
            <Image
              src="/images/eyva_start.svg"
              alt=""
              width={62}
              height={52}
              priority
              className="h-auto w-[60px]"
            />
          </div>
        </div>

        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#FFF238] px-3.5 py-1 text-[10px] font-bold tracking-[0.08em] text-[#351080] uppercase">
          <span className="h-[6px] w-[6px] rounded-full bg-[#351080] motion-safe:animate-pulse" />
          Loading Eyva
        </span>

        <h1 className="m-0 mt-3 text-[24px] font-bold tracking-tight text-[#2A1163] sm:text-[26px]">
          {title}
        </h1>
        <p className="m-0 mt-1.5 max-w-[380px] text-[12.5px] leading-[1.6] text-[#7B728E]">
          {subtitle}
        </p>

        {/* Subtle Dashboard Content Skeleton */}
        {showDashboardSkeleton && (
          <div
            aria-hidden="true"
            className="mt-8 grid w-full max-w-[620px] grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="h-[104px] rounded-[18px] bg-[#F2ECFF] p-5 motion-safe:animate-pulse">
              <div className="h-3 w-24 rounded-full bg-[#DDD0FA]" />
              <div className="mt-3.5 h-6 w-32 rounded-full bg-[#CEBDF7]" />
              <div className="mt-3 h-2.5 w-20 rounded-full bg-[#E3D8FA]" />
            </div>
            <div className="h-[104px] rounded-[18px] bg-[#F2ECFF] p-5 motion-safe:animate-pulse">
              <div className="h-3 w-28 rounded-full bg-[#DDD0FA]" />
              <div className="mt-3.5 h-6 w-24 rounded-full bg-[#CEBDF7]" />
              <div className="mt-3 h-2.5 w-36 rounded-full bg-[#E3D8FA]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface EyvaErrorViewProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  variant?: "error" | "not-found" | "network";
}

export function EyvaErrorView({
  eyebrow = "SOMETHING WENT WRONG",
  title = "We hit a small snag",
  description = "This page couldn't finish loading right now. Try again in a moment or head back to your home space.",
  onRetry,
  retryLabel = "Try again",
  homeHref = "/dashboard/home",
  homeLabel = "Back to Home",
  variant = "error",
}: EyvaErrorViewProps) {
  const mascotSrc =
    variant === "not-found" ? "/images/eyva_okay.svg" : "/images/eyva_tough.svg";

  return (
    <div
      role="alert"
      className="flex min-h-screen w-full flex-col bg-[#FFFEF9] text-[#351080]"
    >
      {/* Top Bar Brand */}
      <div className="px-6 pt-6 sm:px-8">
        <Link href={homeHref} aria-label="EYVA Home">
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

      {/* Centered Error Card */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <section className="w-full max-w-[440px] rounded-[24px] border border-[#EAE4F3] bg-white p-7 text-center shadow-[0_14px_40px_rgba(45,10,115,0.08)] sm:p-8">
          {/* Mascot Badge (Concentric: outer rounded-[18px] p-3 + inner rounded-[10px]) */}
          <div className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-[18px] bg-[#FFF238] p-3 shadow-[0_6px_16px_rgba(255,242,56,0.35)]">
            {variant === "network" ? (
              <WifiOff size={36} strokeWidth={2.2} className="text-[#351080]" />
            ) : (
              <Image
                src={mascotSrc}
                alt=""
                width={64}
                height={64}
                className="h-auto w-[62px]"
              />
            )}
          </div>

          <div className="mt-5 text-[10px] font-bold tracking-[0.09em] text-[#7B728E] uppercase">
            {eyebrow}
          </div>
          <h1 className="m-0 mt-1.5 text-[24px] font-bold tracking-tight text-[#2A1163]">
            {title}
          </h1>
          <p className="m-0 mt-2.5 text-[12.5px] leading-[1.6] text-[#7B728E]">
            {description}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "12.5px" }}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[11px] border-0 bg-[#351080] px-5 text-[12.5px] !font-bold !text-white shadow-[0_3px_0_#220856] transition-[background-color,transform] duration-150 hover:bg-[#43189E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] enabled:active:scale-[0.96]"
              >
                <RefreshCw size={14} strokeWidth={2.3} />
                <span>{retryLabel}</span>
              </button>
            )}

            <Link
              href={homeHref}
              style={{ color: "#351080", fontWeight: 700, fontSize: "12.5px" }}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[11px] border border-[#E0D6F5] bg-[#F2ECFF] px-5 text-[12.5px] !font-bold !text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#E7DCFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] active:scale-[0.96]"
            >
              <ArrowLeft size={14} strokeWidth={2.3} />
              <span>{homeLabel}</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
