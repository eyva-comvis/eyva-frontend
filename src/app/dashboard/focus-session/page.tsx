"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Settings,
  Music,
  Volume2,
  VolumeX,
  Activity,
  Sliders,
  Sprout,
  ArrowRight,
} from "lucide-react";
import { useFocusMonitor } from "@/hooks/useFocusMonitor";
import { sessionsApi, type DrowsinessStatus } from "@/services/api/sessions";

const WAVEFORM_HEIGHTS = [
  10, 18, 8, 22, 14, 10, 26, 16, 10, 20, 12, 24, 15, 9, 28, 18, 12, 22, 14, 10,
  24, 16, 10, 20, 14, 18, 10,
];

export default function FocusSessionPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [avatarSrc, setAvatarSrc] = useState("/images/MaleAva.svg");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(24 * 60 + 36);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundtrack, setSoundtrack] = useState("Soft Piano");
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraConnected, setCameraConnected] = useState(true);
  const [activeAlert, setActiveAlert] = useState<
    null | "alert1" | "alert2" | "quick-reset"
  >(null);
  const [isEnding, setIsEnding] = useState(false);
  const [sessionNumber, setSessionNumber] = useState("01");

  // Nomor sesi = jumlah sesi pengguna (termasuk yang sedang berjalan)
  useEffect(() => {
    sessionsApi
      .list(100)
      .then(({ items }) => setSessionNumber(String(Math.max(items.length, 1)).padStart(2, "0")))
      .catch(() => undefined);
  }, []);

  const monitor = useFocusMonitor(
    videoRef,
    isHydrated && !isPaused && cameraConnected && activeAlert === null && !isEnding,
    () => router.replace("/dashboard/home")
  );

  // Alert dari model kantuk -> tampilkan modal yang sesuai
  useEffect(() => {
    if (!monitor.alert) return;
    localStorage.setItem("eyva_focus_remaining_seconds", String(secondsLeftRef.current));
    setActiveAlert(monitor.alert.level === 1 ? "alert1" : "alert2");
  }, [monitor.alert]);

  // Load user avatar, session config, and any remaining seconds from pre-break state
  useEffect(() => {
    const savedAvatar = localStorage.getItem("eyva_avatar");
    if (savedAvatar) {
      setAvatarSrc(savedAvatar);
    }

    let configuredTotalSecs = 25 * 60;
    const savedConfig = localStorage.getItem("eyva_session_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.durationMinutes) {
          configuredTotalSecs = Number(parsed.durationMinutes) * 60;
        }
        if (parsed.soundtrack) {
          setSoundtrack(parsed.soundtrack);
        }
        if (typeof parsed.musicEnabled === "boolean") {
          setIsMusicPlaying(parsed.musicEnabled);
        }
      } catch {
        // Use defaults
      }
    }

    const savedTotal = localStorage.getItem("eyva_focus_total_seconds");
    if (savedTotal !== null && !Number.isNaN(Number(savedTotal)) && Number(savedTotal) > 0) {
      configuredTotalSecs = Number(savedTotal);
    }
    setTotalSeconds(configuredTotalSecs);

    const savedRemaining = localStorage.getItem("eyva_focus_remaining_seconds");
    if (savedRemaining !== null) {
      const remSecs = Number(savedRemaining);
      if (!Number.isNaN(remSecs) && remSecs > 0) {
        setSecondsLeft(remSecs);
        setIsHydrated(true);
        return;
      }
    }

    if (savedConfig) {
      setSecondsLeft(configuredTotalSecs);
      localStorage.setItem(
        "eyva_focus_remaining_seconds",
        String(configuredTotalSecs)
      );
      localStorage.setItem(
        "eyva_focus_total_seconds",
        String(configuredTotalSecs)
      );
    }
    setIsHydrated(true);
  }, []);

  // Connect live webcam stream via getUserMedia
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          activeStream = stream;
          setCameraConnected(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch {
        setCameraConnected(false);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const secondsLeftRef = useRef(secondsLeft);
  secondsLeftRef.current = secondsLeft;

  // Countdown timer (automatically pauses when manually paused OR when an alert modal is active)
  useEffect(() => {
    if (!isHydrated || isPaused || activeAlert !== null || !monitor.ready || isEnding) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        localStorage.setItem("eyva_focus_remaining_seconds", String(next));
        localStorage.setItem("eyva_focus_total_seconds", String(totalSeconds));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isHydrated, isPaused, activeAlert, totalSeconds, monitor.ready, isEnding]);

  const goToSummary = () => {
    localStorage.removeItem("eyva_focus_remaining_seconds");
    localStorage.removeItem("eyva_focus_total_seconds");
    router.push("/dashboard/summary");
  };

  const handleEndSession = async () => {
    if (isEnding) return;
    setIsEnding(true);
    if (monitor.alert) await monitor.endFromAlert();
    else await monitor.endSession("MANUAL");
    goToSummary();
  };

  // Timer habis: blok belajar selesai, sesi berakhir normal
  useEffect(() => {
    if (!isHydrated || !monitor.ready || secondsLeft > 0 || isEnding) return;
    setIsEnding(true);
    monitor.completeSession().then(goToSummary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isHydrated, monitor.ready]);

  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    monitor.setPaused(next);
  };

  const statusLabel = (status: DrowsinessStatus | null, face: boolean): string => {
    if (!cameraConnected) return "Camera is off · detection paused";
    if (!monitor.ready) return "Preparing your session…";
    if (isPaused) return "Paused";
    if (status === null) return "Starting detection…";
    if (!face) return "Face not detected";
    if (status === "DROWSY_NEED_REST") return "Signs of drowsiness";
    if (status === "POSSIBLE_DROWSINESS") return "Possible drowsiness";
    return "You look focused";
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  const focusedMinutes = Math.max(
    0,
    Math.floor((totalSeconds - secondsLeft) / 60)
  );

  // Progress ratio (0 to 1) & SVG arc calculation for circular timer ring
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const progressRatio =
    totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
  const ringRadius = 113.5; // (236 - 9) / 2
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference * (1 - progressRatio);

  return (
    <div className="relative min-h-screen w-full bg-white text-[#351080]">
      {/* PAGE CONTENT WRAPPER (Blurred when alert modal is open) */}
      <div
        className={`min-h-screen w-full pl-6 pr-8 pt-6 pb-12 sm:pr-12 transition-all duration-200 ${
          activeAlert ? "blur-[4px] pointer-events-none select-none" : ""
        }`}
      >
        {/* TOP BAR: LOGO LEFT & AVATAR RIGHT (Exact same coordinates as HomePage) */}
        <div className="flex items-start justify-between">
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

          <Link
            href="/dashboard/profile"
            aria-label="Edit Profile"
            className="relative inline-block transition-transform hover:scale-105"
          >
            <div className="h-[38px] w-[38px] overflow-hidden rounded-full border-2 border-[#351080] bg-[#F9E8FF]">
              <Image
                src={avatarSrc}
                alt="User Avatar"
                width={38}
                height={38}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-white bg-[#EDE6FA] text-[#351080] shadow-xs">
              <Settings size={10} strokeWidth={2.5} />
            </span>
          </Link>
        </div>

        {/* HEADER CENTER */}
        <div className="-mt-3 mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
            <span className="inline-flex h-[8px] w-[8px] items-center justify-center rounded-full bg-[#FFF238]">
              <span className="h-[4px] w-[4px] rounded-full bg-[#FF5A36]" />
            </span>
            <span>FOCUS MODE IS ON</span>
          </div>
          <h1 className="m-0 mt-1 text-[30px] font-bold tracking-tight text-[#2A1163]">
            You&apos;re doing lovely
          </h1>
        </div>

        {monitor.error && (
          <div
            role="alert"
            className="mx-auto mb-5 flex max-w-[980px] flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#F5DCE6] bg-[#FDF2F6] px-5 py-3 text-[11.5px] font-medium text-[#9F3D69]"
          >
            <span>{monitor.error}</span>
            <Link href="/dashboard/home" className="font-bold !text-[#9F3D69] underline">
              Back to Home
            </Link>
          </div>
        )}
        {!cameraConnected && (
          <div className="mx-auto mb-5 max-w-[980px] rounded-[14px] border border-[#EAE4F3] bg-[#FAF8FF] px-5 py-3 text-[11.5px] text-[#5A5070]">
            Eyva can&apos;t see your camera, so drowsiness detection is off. Allow camera access in your browser and reload this page to turn it on.
          </div>
        )}

        {/* MAIN TWO-COLUMN GRID */}
        <div className="mx-auto grid max-w-[980px] grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT CARD: PURPLE TIMER CARD */}
          <section className="flex flex-col justify-between rounded-[20px] bg-[#2D0A73] p-7 text-white shadow-[0_10px_30px_rgba(45,10,115,0.16)]">
            {/* Card Top Row */}
            <div className="flex items-center justify-between">
              <span
                style={{ color: "#2D0A73", fontWeight: 700, fontSize: "10px" }}
                className="inline-flex items-center rounded-full bg-[#FFF238] px-4 py-1.5 text-[10px] !font-bold !text-[#2D0A73]"
              >
                Stay in your flow
              </span>

              <span className="text-[10px] font-semibold tracking-[0.08em] text-white/60 uppercase">
                SESSION {sessionNumber}
              </span>
            </div>

            {/* Circular Timer */}
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="relative flex h-[236px] w-[236px] items-center justify-center rounded-full p-[9px]">
                {/* Animated SVG Progress Ring */}
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 236 236"
                >
                  {/* Base Track Ring */}
                  <circle
                    cx="118"
                    cy="118"
                    r={ringRadius}
                    fill="none"
                    stroke="#684FA1"
                    strokeWidth="9"
                  />
                  {/* Yellow Progress Ring that grows as time elapses */}
                  <circle
                    cx="118"
                    cy="118"
                    r={ringRadius}
                    fill="none"
                    stroke="#FFF238"
                    strokeWidth="9"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                </svg>

                {/* Initial Top Yellow Tick (so even at 0s elapsed the yellow start mark is visible) */}
                <span className="pointer-events-none absolute top-0 left-1/2 h-[9px] w-[6px] -translate-x-1/2 bg-[#FFF238]" />

                {/* White Inner Circle */}
                <div className="relative z-10 flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                  <span className="text-[9.5px] font-semibold tracking-[0.06em] text-[#8F82AA] uppercase">
                    TIME TO FOCUS
                  </span>
                  <strong className="my-2 text-[44px] font-extrabold leading-none tracking-tight text-[#4D3382]">
                    {formattedMinutes} : {formattedSeconds}
                  </strong>
                  <span className="text-[10px] font-medium text-[#8F82AA]">
                    minutes of me-time
                  </span>
                </div>
              </div>

              {/* Pause & End Session Buttons */}
              <div className="mt-8 flex items-center justify-center gap-3.5">
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={!monitor.ready || isEnding}
                  style={{
                    color: "#5C438E",
                    fontWeight: 700,
                    fontSize: "11px",
                  }}
                  className="flex h-[38px] min-w-[92px] items-center justify-center gap-2 rounded-[10px] border-0 bg-white px-4 text-[11px] !font-bold !text-[#5C438E] shadow-xs transition hover:bg-[#F7F4FC] active:scale-[0.98]"
                >
                  <span className="text-[10px] tracking-tighter">
                    {isPaused ? "▶" : "❚❚"}
                  </span>
                  <span>{isPaused ? "Resume" : "Pause"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEndSession}
                  disabled={isEnding}
                  style={{
                    color: "#A34870",
                    fontWeight: 700,
                    fontSize: "11px",
                  }}
                  className="flex h-[38px] min-w-[92px] items-center justify-center rounded-[10px] border-0 bg-[#FDF0F5] px-4 text-[11px] !font-bold !text-[#A34870] shadow-xs transition hover:bg-[#FBE4EE] active:scale-[0.98]"
                >
                  {isEnding ? "Ending…" : "End session"}
                </button>
              </div>
            </div>

            {/* Card Bottom Row */}
            <div className="flex items-center justify-between border-t border-white/20 pt-3.5 text-[10px] text-white/80">
              <span>{focusedMinutes} min focused</span>
              <span className="inline-flex items-center gap-1.5">
                <Music size={11} />
                <span>
                  {isMusicPlaying && !isMuted ? "Music on" : "Music off"}
                </span>
              </span>
            </div>
          </section>

          {/* RIGHT COLUMN: CAMERA CARD + MUSIC CARD */}
          <div className="flex flex-col gap-6">
            {/* TOP RIGHT CARD: FOCUS CHECK-IN (WEBCAM) */}
            <section className="rounded-[20px] border border-[#EAE4F3] bg-white p-6 shadow-[0_6px_24px_rgba(45,10,115,0.06)]">
              {/* Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFF238] text-[#351080]">
                    <Activity size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#2A1163]">
                      Focus check-in
                    </div>
                    <div className="text-[10px] text-[#7B728E]">
                      Webcam monitoring preview
                    </div>
                  </div>
                </div>

                {/* Live drowsiness status from the model */}
                <span
                  role="status"
                  className={`rounded-[8px] px-2.5 py-1.5 text-[9px] font-bold ${
                    monitor.status === "DROWSY_NEED_REST" || monitor.status === "POSSIBLE_DROWSINESS"
                      ? "bg-[#FDF0F5] text-[#A34870]"
                      : "bg-[#F2ECFF] text-[#2A1163]"
                  }`}
                >
                  {statusLabel(monitor.status, monitor.faceDetected)}
                </span>
              </div>

              {/* Lavender Outer Frame + Black Camera Box */}
              <div className="mt-4 rounded-[16px] bg-[#F2ECFF] p-4">
                <div className="relative h-[185px] w-full overflow-hidden rounded-[12px] bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover -scale-x-100"
                  />

                  {/* Camera connected indicator */}
                  <div className="absolute bottom-3 left-3.5 inline-flex items-center gap-1.5 text-[9.5px] font-medium text-white">
                    <span className="inline-flex h-[8px] w-[8px] items-center justify-center rounded-full bg-[#FFF238]">
                      <span
                        className={`h-[4px] w-[4px] rounded-full ${
                          cameraConnected ? "bg-[#FF5A36]" : "bg-gray-500"
                        }`}
                      />
                    </span>
                    <span>
                      {cameraConnected ? "Camera connected" : "Camera not available"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* BOTTOM RIGHT CARD: BACKGROUND CALM (MUSIC) */}
            <section className="rounded-[20px] border border-[#EAE4F3] bg-white p-6 shadow-[0_6px_24px_rgba(45,10,115,0.06)]">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFF238] text-[#351080]">
                    <Sliders size={17} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#2A1163]">
                      A little background calm
                    </div>
                    <div className="text-[10px] text-[#7B728E]">
                      {isMusicPlaying && !isMuted
                        ? "Music is on"
                        : "Music is paused"}
                    </div>
                  </div>
                </div>

                {/* Volume Button */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? "Unmute music" : "Mute music"}
                  className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-[#E5DFEE] bg-white text-[#351080] transition hover:bg-[#F5F1FC]"
                >
                  {isMuted ? (
                    <VolumeX size={15} strokeWidth={2} />
                  ) : (
                    <Volume2 size={15} strokeWidth={2} />
                  )}
                </button>
              </div>

              {/* Track Player Box */}
              <div className="mt-4 flex items-center justify-between rounded-[11px] border border-[#E6E2DC] bg-[#F8F7F2] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Music
                    size={16}
                    strokeWidth={2.2}
                    className="text-[#2D0A73]"
                  />
                  <div>
                    <div className="text-[10.5px] font-bold text-[#2A1163]">
                      {soundtrack}
                    </div>
                    <div className="text-[8.5px] text-[#7B728E]">
                      Soft Instrumental
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                  aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                  style={{ color: "#FFFFFF", fontSize: "9px", fontWeight: 700 }}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-0 bg-[#2D0A73] !text-white transition hover:bg-[#43189E]"
                >
                  {isMusicPlaying ? "❚❚" : "▶"}
                </button>
              </div>

              {/* Purple Waveform Bars */}
              <div className="mt-4 flex h-[32px] items-center justify-center gap-[4px]">
                {WAVEFORM_HEIGHTS.map((height, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: `${isMusicPlaying && !isMuted ? height : 6}px`,
                    }}
                    className="w-[3px] rounded-full bg-[#9D84F6] transition-all duration-300"
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL OVERLAY: DEMO ALERT 1 ("Feeling a little sleepy?")
      ========================================================= */}
      {activeAlert === "alert1" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351080]/18 px-4 py-6">
          <div className="relative w-full max-w-[395px] rounded-[20px] bg-[#FFFEF9] p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)]">
            {/* Yellow Bell Icon Box */}
            <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-[13px] bg-[#FFF238] text-[#5C3D99]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
              </svg>
            </div>

            {/* Eyebrow & Heading */}
            <div className="text-[9.5px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
              A GENTLE CHECK-IN
            </div>
            <h2 className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#2A1163]">
              Feeling a little sleepy?
            </h2>
            <p className="m-0 mt-2 text-[10.5px] leading-[1.6] text-[#7B728E]">
              We noticed some possible signs of drowsiness.
              <br />
              Take a breath, adjust your posture, and check in with yourself
            </p>

            {/* Yellow Reminder Banner */}
            <div className="mt-5 flex items-center gap-2.5 rounded-[10px] bg-[#FFF566] px-3.5 py-2.5 text-[9.5px] font-medium text-[#4D387A]">
              <Sprout size={14} strokeWidth={2} className="shrink-0 text-[#4D387A]" />
              <span>
                You&apos;re still in your session. This is just a friendly
                reminder.
              </span>
            </div>

            {/* Got it, I'll refocus button */}
            <button
              type="button"
              onClick={async () => {
                await monitor.acknowledge();
                setActiveAlert(null);
              }}
              style={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "11.5px",
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[9px] border-0 bg-[#624794] py-3 px-4 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#2A1163] transition hover:bg-[#553B87] active:translate-y-[1px]"
            >
              <span>Got it, I&apos;ll refocus</span>
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>

            {/* End my session button */}
            <button
              type="button"
              onClick={handleEndSession}
              style={{
                color: "#9F3D69",
                fontWeight: 700,
                fontSize: "11px",
              }}
              className="mt-3.5 flex w-full items-center justify-center gap-1.5 border-0 bg-transparent py-1 text-center text-[11px] !font-bold !text-[#9F3D69] transition hover:opacity-80"
            >
              <span className="inline-flex h-[13px] w-[13px] items-center justify-center rounded-full bg-[#9F3D69] text-[8px] leading-none text-white">
                ✕
              </span>
              <span>End my session</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL OVERLAY: DEMO ALERT 2 ("Let's listen to your body")
      ========================================================= */}
      {activeAlert === "alert2" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351080]/18 px-4 py-6">
          <div className="relative w-full max-w-[395px] rounded-[20px] bg-[#FFFEF9] p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)]">
            {/* Yellow Ringing Bell Icon Box */}
            <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-[13px] bg-[#FFF238] text-[#5C3D99]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Left & Right Ringing Arcs */}
                <path
                  d="M4.2 8.2C4.8 6.4 6.1 4.9 7.8 4.1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M19.8 8.2C19.2 6.4 17.9 4.9 16.2 4.1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Solid Bell Body */}
                <path
                  d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* Eyebrow & Heading */}
            <div className="text-[9.5px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
              TIME TO CHECK-IN
            </div>
            <h2 className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#2A1163]">
              Let&apos;s listen to your body
            </h2>
            <p className="m-0 mt-2 text-[10.5px] leading-[1.6] text-[#7B728E]">
              Possible drowsiness is still being detected. What would feel
              <br />
              right for you?
            </p>

            {/* Option 1: I'll do a quick reset */}
            <button
              type="button"
              onClick={async () => {
                await monitor.chooseReset();
                setActiveAlert("quick-reset");
              }}
              className="mt-5 flex w-full items-center justify-between rounded-[12px] border border-[#E4DCFA] bg-[#F2ECFF] px-4 py-3.5 text-left transition hover:bg-[#EAE1FF] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                {/* Purple Circle Icon */}
                <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#5C3D99] text-white">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.5 8.5L8.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <div>
                  <div
                    style={{ fontSize: "11px", fontWeight: 700 }}
                    className="!text-[11px] !font-bold text-[#4A2E86]"
                  >
                    I&apos;ll do a quick reset
                  </div>
                  <div
                    style={{ fontSize: "9.5px", fontWeight: 400 }}
                    className="mt-0.5 !text-[9.5px] !font-normal text-[#5A5070]"
                  >
                    Get a small suggestion before continuing
                  </div>
                </div>
              </div>

              <ArrowRight
                size={15}
                strokeWidth={2}
                className="shrink-0 text-[#351080]"
              />
            </button>

            {/* Option 2: End my session */}
            <button
              type="button"
              onClick={handleEndSession}
              className="mt-3 flex w-full items-center justify-between rounded-[12px] border border-[#F5DCE6] bg-[#FDF2F6] px-4 py-3.5 text-left transition hover:bg-[#FCE6EE] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                {/* Berry Circle X Icon */}
                <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#9F3D69] text-[10px] font-bold leading-none text-white">
                  ✕
                </span>

                <div>
                  <div
                    style={{ fontSize: "11px", fontWeight: 700 }}
                    className="!text-[11px] !font-bold text-[#9F3D69]"
                  >
                    End my session
                  </div>
                  <div
                    style={{ fontSize: "9.5px", fontWeight: 400 }}
                    className="mt-0.5 !text-[9.5px] !font-normal text-[#5A5070]"
                  >
                    Finish here and see my summary
                  </div>
                </div>
              </div>

              <ArrowRight
                size={15}
                strokeWidth={2}
                className="shrink-0 text-[#3A2A35]"
              />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL OVERLAY: QUICK RESET ("Take a tiny pause")
      ========================================================= */}
      {activeAlert === "quick-reset" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351080]/18 px-4 py-6">
          <div className="relative w-full max-w-[395px] rounded-[20px] bg-[#FFFEF9] p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)]">
            {/* Yellow Coffee Cup Icon Box */}
            <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-[13px] bg-[#FFF238] text-[#5C3D99]">
              <svg
                width="26"
                height="24"
                viewBox="2 5 21 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 6H17V14C17 17.3137 14.3137 20 11 20H9C5.68629 20 3 17.3137 3 14V6Z"
                  fill="currentColor"
                />
                <path
                  d="M17 8H19C20.6569 8 22 9.34315 22 11C22 12.6569 20.6569 14 19 14H17"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Eyebrow & Heading */}
            <div className="text-[9.5px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
              A MINI RESET
            </div>
            <h2 className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#2A1163]">
              Take a tiny pause
            </h2>
            <p className="m-0 mt-2 text-[10.5px] leading-[1.6] text-[#7B728E]">
              Before you get back to it, try one small thing. No need to overdo
              it.
            </p>

            {/* 3 Numbered Reset Suggestions */}
            <div className="mt-5 flex flex-col gap-3.5">
              {/* 01: Breathe */}
              <div className="flex items-center gap-3">
                <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full bg-[#FFF799] text-[9px] font-extrabold text-[#2A1163]">
                  01
                </span>
                <div>
                  <div className="text-[10.5px] font-bold text-[#2A1163]">
                    Breathe
                  </div>
                  <div className="mt-0.5 text-[8.5px] text-[#7B728E]">
                    Take three slow, deep breaths and gently relax your
                    shoulders.
                  </div>
                </div>
              </div>

              {/* 02: Rest your eyes */}
              <div className="flex items-center gap-3">
                <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full bg-[#FFF799] text-[9px] font-extrabold text-[#2A1163]">
                  02
                </span>
                <div>
                  <div className="text-[10.5px] font-bold text-[#2A1163]">
                    Rest your eyes
                  </div>
                  <div className="mt-0.5 text-[8.5px] text-[#7B728E]">
                    Look away from your screen and focus on something in the
                    distance.
                  </div>
                </div>
              </div>

              {/* 03: Relax your hands */}
              <div className="flex items-center gap-3">
                <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full bg-[#FFF799] text-[9px] font-extrabold text-[#2A1163]">
                  03
                </span>
                <div>
                  <div className="text-[10.5px] font-bold text-[#2A1163]">
                    Relax your hands
                  </div>
                  <div className="mt-0.5 text-[8.5px] text-[#7B728E]">
                    Release your grip, stretch your fingers, and loosen your
                    wrists.
                  </div>
                </div>
              </div>
            </div>

            {/* Start a 5-min break button */}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(
                  "eyva_focus_remaining_seconds",
                  String(secondsLeft)
                );
                monitor.startResetBreak();
                setActiveAlert(null);
                router.push("/dashboard/break-session");
              }}
              style={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "11.5px",
              }}
              className="mt-6 flex w-full items-center justify-center rounded-[9px] border-0 bg-[#624794] py-3 px-4 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#2A1163] transition hover:bg-[#553B87] active:translate-y-[1px]"
            >
              Start a 5-min break
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
