"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Clock,
  Calendar,
  Eye,
  BookOpen,
  ChevronRight,
  X,
  Music,
  ChevronDown,
  Play,
  Square,
} from "lucide-react";
import {
  DashboardSidebar,
  DashboardTopBar,
} from "@/components/dashboard/DashboardNav";
import {
  AnimatedCounter,
  EYVA_EASE,
  EYVA_SPRING,
  FloatingMascot,
  InteractiveCard,
  StaggerContainer,
  StaggerItem,
  TactileButton,
} from "@/components/motion/MotionPrimitives";
import SpotifyPicker from "@/components/music/SpotifyPicker";
import { unlockAudio } from "@/lib/audio";
import {
  SOUNDTRACKS,
  getBars,
  getSoundtrackSubtitle,
  setMusicMuted,
  setTrack,
  startMusic,
  stopMusic,
  unlockMusic,
  type SoundtrackName,
} from "@/lib/music";
import {
  DEFAULT_SPOTIFY_ITEM,
  readSavedSpotifyItems,
  sanitizeSpotifyItem,
  type MusicSource,
  type SpotifyItem,
} from "@/lib/spotify";
import { getCachedProfile, getUserProfile } from "@/services/api/profile";
import {
  getActiveSession,
  listAllSessions,
  sessionsApi,
  setActiveSession,
  statsApi,
  type SessionListItem,
  type StatsResult,
} from "@/services/api/sessions";
import { formatFocusTime, toHistoryItems } from "@/services/api/history";
import type { StudySessionHistoryItem } from "@/types/session";

const DAY_MS = 24 * 60 * 60 * 1000;

interface WeekStats {
  focusMinutes: number;
  sessions: number;
  focusDelta: number | null;
  sessionsDelta: number | null;
  recent: StudySessionHistoryItem | null;
}

function percentChange(now: number, before: number): number | null {
  return before > 0 ? Math.round(((now - before) / before) * 100) : null;
}

/** Ringkasan minggu ini (Senin–Minggu) dibanding minggu lalu, plus sesi terakhir. */
function weekStats(items: SessionListItem[]): WeekStats {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monday = start.getTime() - ((start.getDay() + 6) % 7) * DAY_MS;
  const lastMonday = monday - 7 * DAY_MS;
  let focus = 0, count = 0, prevFocus = 0, prevCount = 0;
  for (const s of items) {
    if (s.status === "ACTIVE") continue;
    const t = new Date(s.started_at).getTime();
    const minutes = Math.round(s.total_study_seconds / 60);
    if (t >= monday) {
      focus += minutes;
      count += 1;
    } else if (t >= lastMonday) {
      prevFocus += minutes;
      prevCount += 1;
    }
  }
  return {
    focusMinutes: focus,
    sessions: count,
    focusDelta: percentChange(focus, prevFocus),
    sessionsDelta: percentChange(count, prevCount),
    recent: toHistoryItems(items)[0] ?? null,
  };
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <span className="absolute right-5 bottom-5 inline-flex items-center gap-0.5 rounded-full bg-[#FFF238] px-2.5 py-1 text-[9.5px] font-extrabold text-[#351080]">
      {value >= 0 ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [username, setUsername] = useState("Username");
  const [avatarSrc, setAvatarSrc] = useState("/images/MaleAva.svg");

  // Modal State: null | "focus-setup" | "camera-setup"
  const [modalStep, setModalStep] = useState<
    null | "focus-setup" | "camera-setup"
  >(null);

  useEffect(() => {
    if (!modalStep) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalStep(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalStep]);

  // Focus Setup Form State
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionTitleError, setSessionTitleError] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const [presetMinutes, setPresetMinutes] = useState("");
  const [focusTimeError, setFocusTimeError] = useState("");
  const [soundtrack, setSoundtrack] = useState<SoundtrackName>("Soft Piano");
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicSource, setMusicSource] = useState<MusicSource>("builtin");
  const [spotifyItem, setSpotifyItem] = useState<SpotifyItem>(DEFAULT_SPOTIFY_ITEM);
  const [isPreviewingBuiltin, setIsPreviewingBuiltin] = useState(false);
  const [previewBars, setPreviewBars] = useState<number[]>([4, 4, 4, 4, 4, 4]);

  const [stats, setStats] = useState<WeekStats | null>(null);
  const [rhythm, setRhythm] = useState<StatsResult | null>(null);

  useEffect(() => {
    const cached = getCachedProfile();
    setUsername(cached.username);
    setAvatarSrc(cached.avatarSrc);

    try {
      const savedCfgRaw = localStorage.getItem("eyva_session_config");
      const savedSpotifyList = readSavedSpotifyItems();
      let restoredSpotify: SpotifyItem | null = null;
      if (savedCfgRaw) {
        const parsed = JSON.parse(savedCfgRaw) as {
          musicSource?: unknown;
          spotifyItem?: unknown;
        };
        if (parsed.musicSource === "spotify" || parsed.musicSource === "builtin") {
          setMusicSource(parsed.musicSource);
        }
        restoredSpotify = sanitizeSpotifyItem(parsed.spotifyItem);
      }
      if (restoredSpotify) {
        setSpotifyItem(restoredSpotify);
      } else if (savedSpotifyList[0]) {
        setSpotifyItem(savedSpotifyList[0]);
      }
    } catch {
      // abaikan bila localStorage tidak tersedia
    }

    getUserProfile()
      .then((p) => {
        if (!p.avatarSelected) {
          router.replace("/choose-avatar");
          return;
        }
        setUsername(p.username);
        setAvatarSrc(p.avatarSrc);
      })
      .catch(() => undefined);
    listAllSessions()
      .then((items) => setStats(weekStats(items)))
      .catch(() => setStats(weekStats([])));
    statsApi
      .get(14)
      .then(setRhythm)
      .catch(() => undefined);
  }, [router]);

  // Hentikan preview WebAudio otomatis bila modal ditutup, pindah tab ke Spotify, atau halaman unmount
  useEffect(() => {
    if (
      modalStep !== "focus-setup" ||
      musicSource !== "builtin" ||
      !musicEnabled
    ) {
      if (isPreviewingBuiltin) {
        stopMusic(true);
        setIsPreviewingBuiltin(false);
      }
    }
  }, [modalStep, musicSource, musicEnabled, isPreviewingBuiltin]);

  useEffect(() => {
    return () => {
      stopMusic(true);
    };
  }, []);

  // Animasi mini level bar saat preview Eyva Calm aktif (hormati prefers-reduced-motion)
  useEffect(() => {
    if (!isPreviewingBuiltin) {
      setPreviewBars([4, 4, 4, 4, 4, 4]);
      return;
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setPreviewBars([7, 11, 8, 12, 9, 6]);
      return;
    }

    let rafId = 0;
    let lastTs = 0;
    const tick = (ts: number) => {
      if (ts - lastTs >= 65) {
        lastTs = ts;
        const levels = getBars(6);
        setPreviewBars(
          levels.map((lv, idx) =>
            Math.min(13, Math.max(4, Math.round(4 + lv * 9 + ((idx % 2) * 1.5))))
          )
        );
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPreviewingBuiltin]);

  const handleToggleBuiltinPreview = async () => {
    if (isPreviewingBuiltin) {
      stopMusic(true);
      setIsPreviewingBuiltin(false);
      return;
    }
    setMusicEnabled(true);
    setMusicMuted(false);
    await unlockMusic();
    const started = await startMusic(soundtrack);
    if (started) {
      setIsPreviewingBuiltin(true);
    }
  };

  const handleBuiltinSoundtrackChange = (next: SoundtrackName) => {
    setSoundtrack(next);
    if (isPreviewingBuiltin) {
      setTrack(next);
    }
  };

  const handleContinueToCamera = () => {
    const cleanTitle = sessionTitle.trim();
    const duration = (customMinutes || presetMinutes).trim();
    const numericDuration = Number(duration);

    let hasError = false;

    if (!cleanTitle) {
      setSessionTitleError("Please enter what you are working on first.");
      hasError = true;
    } else {
      setSessionTitleError("");
    }

    if (!duration || Number.isNaN(numericDuration) || numericDuration <= 0) {
      setFocusTimeError(
        "Please type in minutes or choose a preset focus time first."
      );
      hasError = true;
    } else if (numericDuration < 1 || numericDuration > 180) {
      setFocusTimeError("Focus time must be between 1 and 180 minutes.");
      hasError = true;
    } else {
      setFocusTimeError("");
    }

    if (hasError) {
      return;
    }

    // Sesi lama yang tertinggal (mis. tab ditutup di tengah sesi) diakhiri dulu
    const stale = getActiveSession();
    if (stale) {
      sessionsApi.end(stale.sessionId, "MANUAL").catch(() => undefined);
      setActiveSession(null);
    }
    localStorage.removeItem("eyva_last_summary");
    localStorage.removeItem("eyva_focus_remaining_seconds");
    localStorage.removeItem("eyva_focus_total_seconds");
    localStorage.setItem(
      "eyva_session_config",
      JSON.stringify({
        title: cleanTitle,
        durationMinutes: numericDuration,
        soundtrack,
        musicEnabled,
        musicSource,
        spotifyItem,
      })
    );
    stopMusic(true);
    setIsPreviewingBuiltin(false);
    setModalStep("camera-setup");
  };

  const handleAllowCameraAndStart = async () => {
    void unlockAudio();
    if (musicSource === "builtin") {
      void unlockMusic();
    }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      // Proceed to focus session even if permission is denied or no webcam found
    }
    setModalStep(null);
    router.push("/dashboard/focus-session");
  };

  return (
    <div className="relative flex min-h-screen w-full bg-white text-[#351080]">
      {/* SHARED SIDEBAR */}
      <DashboardSidebar blurred={Boolean(modalStep)} />

      {/* MAIN CONTENT */}
      <main
        className={`relative flex-1 px-5 pt-6 pb-12 transition-[filter] duration-200 sm:px-8 md:ml-[198px] md:px-12 ${
          modalStep ? "blur-[4px] pointer-events-none select-none" : ""
        }`}
      >
        <DashboardTopBar avatarSrc={avatarSrc} />

        {/* Greeting Section */}
        <div className="mt-2 mb-7 text-center">
          <h1 className="m-0 mb-1.5 text-[30px] font-bold tracking-tight text-[#2A1163]">
            Hello, {username}!
          </h1>
          <p className="m-0 text-[11.5px] tracking-wide text-[#7B728E]">
            A little progress is still progress. Let&apos;s make this session
            count!
          </p>
        </div>

        {/* Content Container */}
        <StaggerContainer className="mx-auto max-w-[960px]" stagger={0.065}>
          {/* Yellow Hero Banner */}
          <StaggerItem>
            <section className="mx-auto flex max-w-[800px] items-center justify-between gap-4 rounded-[22px] bg-[#FFF238] px-6 py-6 sm:px-11 sm:py-7">
              <div className="flex flex-col items-start">
                <h2 className="m-0 text-[26px] font-bold tracking-tight text-[#351080]">
                  Time to focus
                </h2>
                <p className="m-0 mt-0.5 text-[13px] font-semibold text-[#4B2A88]">
                  Study at your own rhythm
                </p>

                <TactileButton
                  type="button"
                  onClick={() => setModalStep("focus-setup")}
                  style={{
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "12.5px",
                  }}
                  className="mt-7 inline-flex items-center gap-2.5 rounded-full border-0 bg-[#351080] px-7 py-3 text-[12.5px] !font-bold !text-white shadow-[0_4px_10px_rgba(53,16,128,0.3)] transition-colors duration-150 hover:bg-[#43189E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                >
                  <svg
                    width="12"
                    height="14"
                    viewBox="0 0 12 14"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M1.5 1.25L10.5 7L1.5 12.75V1.25Z" />
                  </svg>
                  <span>Start session</span>
                </TactileButton>
              </div>

              <div className="mr-0 shrink-0 sm:mr-6">
                <FloatingMascot amplitude={5} duration={4.2}>
                  <Image
                    src="/images/eyva_start.svg"
                    alt="EYVA Mascot"
                    width={175}
                    height={145}
                    priority
                    className="h-auto w-[132px] sm:w-[175px]"
                  />
                </FloatingMascot>
              </div>
            </section>
          </StaggerItem>

          {/* Two Purple Stat Cards */}
          <StaggerItem>
            <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Total Focus Time */}
              <InteractiveCard
                lift={-3}
                spotlightColor="rgba(255, 242, 56, 0.16)"
                className="rounded-[18px] bg-[#2D0A73] text-white"
              >
                <div className="relative flex min-h-[146px] items-start gap-4 p-6">
                  <div className="mt-0.5 text-white">
                    <Clock size={30} strokeWidth={2} />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[12.5px] font-normal text-white/90">
                      Total focus time
                    </span>
                    <strong className="my-1.5 text-[25px] font-bold tracking-tight text-white tabular-nums">
                      {stats ? (
                        <AnimatedCounter
                          value={stats.focusMinutes}
                          formatter={formatFocusTime}
                        />
                      ) : (
                        "..."
                      )}
                    </strong>
                    <span className="text-[12px] text-white/85">This week</span>
                  </div>

                  <DeltaBadge value={stats?.focusDelta ?? null} />
                </div>
              </InteractiveCard>

              {/* Study Sessions */}
              <InteractiveCard
                lift={-3}
                spotlightColor="rgba(255, 242, 56, 0.16)"
                className="rounded-[18px] bg-[#2D0A73] text-white"
              >
                <div className="relative flex min-h-[146px] items-start gap-4 p-6">
                  <div className="mt-0.5 text-white">
                    <Calendar size={30} strokeWidth={2} />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[12.5px] font-normal text-white/90">
                      Study sessions
                    </span>
                    <strong className="my-1.5 text-[25px] font-bold tracking-tight text-white tabular-nums">
                      {stats ? <AnimatedCounter value={stats.sessions} /> : "..."}
                    </strong>
                    <span className="text-[12px] text-white/85">This week</span>
                  </div>

                  <DeltaBadge value={stats?.sessionsDelta ?? null} />
                </div>
              </InteractiveCard>
            </section>
          </StaggerItem>

          {/* Your Study Rhythm Card */}
          <StaggerItem>
            <section className="mt-4">
              <Link
                href="/dashboard/statistics"
                className="group flex w-full items-center gap-3.5 rounded-[14px] bg-[#EFE9FF] px-5 py-3 transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-[#E6DCFC] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
              >
                <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#2D0A73] text-white">
                  <Eye size={17} strokeWidth={2} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="m-0 text-[12px] font-bold leading-snug text-[#2D0A73]">
                    Your study rhythm
                    {rhythm && rhythm.current_streak_days > 0 && (
                      <span className="ml-2 rounded-full bg-[#FFF238] px-2 py-0.5 text-[9.5px] font-extrabold text-[#351080] tabular-nums">
                        {rhythm.current_streak_days}-day streak
                      </span>
                    )}
                  </div>
                  <p className="m-0 mt-0.5 text-[10.5px] leading-[1.35] text-[#7B728E]">
                    {rhythm
                      ? rhythm.insight
                      : "You're doing great! Keep taking breaks and listening to your body's signals."}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  strokeWidth={2.3}
                  className="shrink-0 text-[#2D0A73] transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            </section>
          </StaggerItem>

          {/* Recent Sessions */}
          <StaggerItem>
            <section className="mt-4">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <div className="m-0 text-[11.5px] font-bold text-[#2D0A73]">
                  Recent Sessions
                </div>
                <Link
                  href="/dashboard/history"
                  style={{ color: "#2D0A73" }}
                  className="rounded-[4px] text-[10.5px] font-bold !text-[#2D0A73] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                >
                  View all
                </Link>
              </div>

              <Link
                href="/dashboard/history"
                className="group flex w-full items-center gap-3.5 rounded-[14px] border border-[#EAE4F3] bg-white px-5 py-3 shadow-[0_3px_10px_rgba(45,10,115,0.06)] transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-[#D5C8EB] hover:shadow-[0_8px_20px_rgba(45,10,115,0.09)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
              >
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#2D0A73] text-white">
                  <BookOpen size={15} strokeWidth={2} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="m-0 text-[11.5px] font-bold leading-snug text-[#2D0A73]">
                    {stats?.recent ? stats.recent.title : stats ? "No sessions yet" : "Loading…"}
                  </div>
                  <p className="m-0 mt-0.5 text-[10.5px] text-[#7B728E]">
                    {stats?.recent
                      ? `${stats.recent.dateGroup === "Earlier" ? stats.recent.displayDate : stats.recent.dateGroup} · ${stats.recent.focusDurationMinutes} minutes`
                      : stats
                        ? "Start your first focus session above"
                        : " "}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  strokeWidth={2.3}
                  className="shrink-0 text-[#2D0A73] transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            </section>
          </StaggerItem>
        </StaggerContainer>
      </main>

      {/* =========================================================
          MODAL OVERLAY (STEP 1: FOCUS SETUP | STEP 2: CAMERA SETUP)
      ========================================================= */}
      <AnimatePresence>
        {modalStep && (
          <motion.div
            key="home-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EYVA_EASE }}
            onClick={() => setModalStep(null)}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-[#351080]/18 px-4 py-6"
          >
            <AnimatePresence mode="wait" initial={false}>
              {/* STEP 1: LET'S SET YOUR FOCUS */}
              {modalStep === "focus-setup" && (
                <motion.div
                  key="focus-setup-card"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="focus-setup-heading"
                  onClick={(e) => e.stopPropagation()}
                  initial={
                    prefersReduced
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: 10 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    prefersReduced
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, y: -8 }
                  }
                  transition={EYVA_SPRING}
                  className={`relative max-h-[calc(100vh-3rem)] w-full overflow-y-auto overscroll-contain rounded-[20px] bg-[#FFFEF9] p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)] transition-[max-width] duration-150 ${
                    musicSource === "spotify" ? "max-w-[460px]" : "max-w-[395px]"
                  }`}
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setModalStep(null)}
                    aria-label="Close modal"
                    className="absolute top-4 right-4 flex h-[28px] w-[28px] items-center justify-center rounded-[7px] border border-[#E5DFEE] bg-white text-[#6C5B8D] transition-colors duration-150 hover:bg-[#F5F1FC] hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    <X size={14} strokeWidth={2.2} />
                  </button>

                  {/* Yellow Play Icon Box */}
                  <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-[13px] bg-[#FFF238] text-[#5C3D99]">
                    <svg
                      width="18"
                      height="20"
                      viewBox="0 0 12 14"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M1.5 1.25L10.5 7L1.5 12.75V1.25Z" />
                    </svg>
                  </div>

                  {/* Eyebrow & Heading */}
                  <div className="text-[9.5px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
                    YOUR NEXT SESSION
                  </div>
                  <h2
                    id="focus-setup-heading"
                    className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#2A1163]"
                  >
                    Let&apos;s set your focus
                  </h2>
                  <p className="m-0 mt-1 text-[10.5px] text-[#7B728E]">
                    Choose what you&apos;re working on and make this session yours
                  </p>

                  {/* What are we working on? */}
                  <div className="mt-5">
                    <label
                      htmlFor="session-title"
                      className="mb-1.5 block text-[11px] font-bold text-[#2A1163]"
                    >
                      What are we working on?
                    </label>
                    <input
                      id="session-title"
                      type="text"
                      value={sessionTitle}
                      onChange={(e) => {
                        setSessionTitle(e.target.value);
                        if (e.target.value.trim()) {
                          setSessionTitleError("");
                        }
                      }}
                      placeholder="ex: Study Session"
                      style={{ fontSize: "11px" }}
                      className={`w-full rounded-[9px] border bg-white px-3.5 py-2.5 !text-[11px] text-[#2A1163] placeholder:text-[#9A90AD] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#351080] ${
                        sessionTitleError
                          ? "border-[#9F3D69] ring-1 ring-[#9F3D69]/20"
                          : "border-[#DFD9EC]"
                      }`}
                    />
                    {sessionTitleError && (
                      <p className="mt-1.5 mb-0 text-[10px] font-semibold text-[#9F3D69]">
                        {sessionTitleError}
                      </p>
                    )}
                  </div>

                  {/* Choose your focus time */}
                  <div className="mt-4">
                    <label className="mb-1.5 block text-[11px] font-bold text-[#2A1163]">
                      Choose your focus time
                    </label>
                    <div className="flex items-center gap-2.5">
                      {/* Type in Minute box */}
                      <div
                        className={`relative flex h-[40px] w-[92px] flex-col items-center justify-center rounded-[9px] border bg-white px-2.5 transition-colors duration-150 ${
                          focusTimeError
                            ? "border-[#9F3D69] ring-1 ring-[#9F3D69]/20"
                            : "border-[#DFD9EC] focus-within:border-[#351080]"
                        }`}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label="Custom focus minutes"
                          value={customMinutes}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setCustomMinutes(val);
                            if (val) {
                              setPresetMinutes("");
                              setFocusTimeError("");
                            }
                          }}
                          placeholder="Type in Minute"
                          style={{ fontSize: "9.5px" }}
                          className="w-full border-0 border-b border-[#D6CEE8] bg-transparent pb-0.5 text-center !text-[9.5px] text-[#2A1163] tabular-nums placeholder:!text-[9.5px] placeholder:text-[#9A90AD] outline-none"
                        />
                      </div>

                      {/* Choose dropdown box */}
                      <div
                        className={`relative flex h-[40px] w-[86px] items-center rounded-[9px] border bg-white transition-colors duration-150 ${
                          focusTimeError
                            ? "border-[#9F3D69] ring-1 ring-[#9F3D69]/20"
                            : "border-[#DFD9EC] focus-within:border-[#351080]"
                        }`}
                      >
                        <select
                          value={presetMinutes}
                          onChange={(e) => {
                            setPresetMinutes(e.target.value);
                            if (e.target.value) {
                              setCustomMinutes("");
                              setFocusTimeError("");
                            }
                          }}
                          aria-label="Choose preset focus time"
                          style={{ fontSize: "10.5px" }}
                          className="h-full w-full cursor-pointer appearance-none bg-transparent pr-6 pl-3 !text-[10.5px] font-medium text-[#7B728E] outline-none"
                        >
                          <option value="">Choose</option>
                          <option value="15">15 min</option>
                          <option value="25">25 min</option>
                          <option value="45">45 min</option>
                          <option value="60">60 min</option>
                        </select>
                        <ChevronDown
                          size={12}
                          className="pointer-events-none absolute right-2.5 text-[#7B728E]"
                        />
                      </div>
                    </div>
                    {focusTimeError && (
                      <p className="mt-1.5 mb-0 text-[10px] font-semibold text-[#9F3D69]">
                        {focusTimeError}
                      </p>
                    )}
                  </div>

                  {/* Focus soundtrack */}
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label
                        htmlFor={
                          musicSource === "builtin" ? "focus-soundtrack" : undefined
                        }
                        className="block text-[11px] font-bold text-[#2A1163]"
                      >
                        Focus soundtrack
                      </label>

                      {/* Tab switcher: Eyva Calm | Spotify */}
                      <div
                        role="tablist"
                        aria-label="Choose background music source"
                        className="inline-flex rounded-[10px] border border-[#E5DFEE] bg-[#F4F0FC] p-[3px]"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={musicSource === "builtin"}
                          onClick={() => setMusicSource("builtin")}
                          className={`relative rounded-[7px] border-0 px-2.5 py-1 text-[10px] font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#351080] ${
                            musicSource === "builtin"
                              ? "!text-white"
                              : "bg-transparent text-[#6C5B8D] hover:text-[#351080]"
                          }`}
                        >
                          {musicSource === "builtin" && (
                            <motion.span
                              layoutId="home-setup-music-tab"
                              transition={EYVA_SPRING}
                              aria-hidden="true"
                              className="absolute inset-0 rounded-[7px] bg-[#351080] shadow-[0_1px_2px_rgba(53,16,128,0.25)]"
                            />
                          )}
                          <span className="relative z-10">Eyva Calm</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={musicSource === "spotify"}
                          onClick={() => setMusicSource("spotify")}
                          className={`relative inline-flex items-center gap-1.5 rounded-[7px] border-0 px-2.5 py-1 text-[10px] font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#351080] ${
                            musicSource === "spotify"
                              ? "!text-white"
                              : "bg-transparent text-[#6C5B8D] hover:text-[#351080]"
                          }`}
                        >
                          {musicSource === "spotify" && (
                            <motion.span
                              layoutId="home-setup-music-tab"
                              transition={EYVA_SPRING}
                              aria-hidden="true"
                              className="absolute inset-0 rounded-[7px] bg-[#351080] shadow-[0_1px_2px_rgba(53,16,128,0.25)]"
                            />
                          )}
                          <span
                            aria-hidden="true"
                            className="relative z-10 inline-block h-[6px] w-[6px] rounded-full bg-[#1DB954]"
                          />
                          <span className="relative z-10">Spotify</span>
                        </button>
                      </div>
                    </div>

                    {musicSource === "builtin" ? (
                      <div className="space-y-2">
                        <div className="flex items-stretch gap-2">
                          <div className="relative flex min-w-0 flex-1 items-center">
                            <select
                              id="focus-soundtrack"
                              value={soundtrack}
                              onChange={(e) =>
                                handleBuiltinSoundtrackChange(
                                  e.target.value as SoundtrackName
                                )
                              }
                              style={{ fontSize: "11px" }}
                              className="w-full cursor-pointer appearance-none rounded-[9px] border border-[#DFD9EC] bg-white px-3.5 py-2.5 pr-9 !text-[11px] text-[#2A1163] outline-none transition-[border-color] duration-150 focus:border-[#351080]"
                            >
                              {SOUNDTRACKS.map((track) => (
                                <option key={track.name} value={track.name}>
                                  {track.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              className="pointer-events-none absolute right-3 text-[#2A1163]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleToggleBuiltinPreview()}
                            aria-pressed={isPreviewingBuiltin}
                            aria-label={
                              isPreviewingBuiltin
                                ? `Stop preview ${soundtrack}`
                                : `Preview ${soundtrack}`
                            }
                            style={
                              isPreviewingBuiltin
                                ? { color: "#FFFFFF", fontWeight: 700, fontSize: "10.5px" }
                                : undefined
                            }
                            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[9px] px-3 text-[10.5px] font-bold transition-[background-color,border-color,color,transform] duration-150 motion-safe:enabled:active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080] ${
                              isPreviewingBuiltin
                                ? "border-0 bg-[#351080] !text-white hover:bg-[#43189E]"
                                : "border border-[#DFD9EC] bg-[#F6F2FF] text-[#351080] hover:border-[#C7BBE3] hover:bg-[#ECE4FF]"
                            }`}
                          >
                            {isPreviewingBuiltin ? (
                              <>
                                <Square size={10} fill="currentColor" aria-hidden="true" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Play size={10} fill="currentColor" aria-hidden="true" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between px-0.5 text-[9.5px] text-[#7B728E]">
                          <span>
                            {getSoundtrackSubtitle(soundtrack)}
                            {isPreviewingBuiltin ? " · Memutar preview" : ""}
                          </span>
                          <span
                            aria-hidden="true"
                            className="inline-flex h-[14px] items-center gap-[2.5px]"
                          >
                            {previewBars.map((h, idx) => (
                              <span
                                key={idx}
                                style={{ height: `${isPreviewingBuiltin ? h : 4}px` }}
                                className={`w-[2.5px] rounded-full transition-[height,background-color] duration-150 ${
                                  isPreviewingBuiltin ? "bg-[#351080]" : "bg-[#D8CEEC]"
                                }`}
                              />
                            ))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[12px] border border-[#EAE4F3] bg-[#FDFCFE] p-2.5">
                        <SpotifyPicker
                          enablePreview
                          previewPaused={!musicEnabled}
                          selected={spotifyItem}
                          onSelect={(item) => {
                            setSpotifyItem(item);
                            setMusicEnabled(true);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Music during focus toggle */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#EFEBF7] pt-3.5">
                    <div
                      style={{ color: "#6E7F6A" }}
                      className="flex items-center gap-2 text-[10.5px] font-medium !text-[#6E7F6A]"
                    >
                      <Music size={13} style={{ color: "#6E7F6A" }} />
                      <span>Music during focus</span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={musicEnabled}
                      aria-label="Toggle music during focus"
                      onClick={() => setMusicEnabled(!musicEnabled)}
                      style={{
                        backgroundColor: musicEnabled ? "#6E7F6A" : "#D5CEE4",
                      }}
                      className="relative inline-flex h-[18px] w-[34px] shrink-0 items-center rounded-full border-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                    >
                      <span
                        className={`inline-block h-[13px] w-[13px] transform rounded-full bg-white transition-transform ${
                          musicEnabled ? "translate-x-[17px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Continue to camera setup button */}
                  <TactileButton
                    type="button"
                    onClick={handleContinueToCamera}
                    style={{
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "11.5px",
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-[9px] border-0 bg-[#624794] px-4 py-3 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#2A1163] transition-colors duration-150 hover:bg-[#553B87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    <svg
                      width="10"
                      height="12"
                      viewBox="0 0 12 14"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M1.5 1.25L10.5 7L1.5 12.75V1.25Z" />
                    </svg>
                    <span>Continue to camera setup</span>
                  </TactileButton>
                </motion.div>
              )}

              {/* STEP 2: CAN WE USE YOUR CAMERA? */}
              {modalStep === "camera-setup" && (
                <motion.div
                  key="camera-setup-card"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="camera-setup-heading"
                  onClick={(e) => e.stopPropagation()}
                  initial={
                    prefersReduced
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: 10 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    prefersReduced
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, y: -8 }
                  }
                  transition={EYVA_SPRING}
                  className="relative w-full max-w-[395px] rounded-[20px] bg-[#FFFEF9] p-7 shadow-[0_20px_60px_rgba(42,17,99,0.22)]"
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setModalStep(null)}
                    aria-label="Close modal"
                    className="absolute top-4 right-4 flex h-[28px] w-[28px] items-center justify-center rounded-[7px] border border-[#E5DFEE] bg-white text-[#6C5B8D] transition-colors duration-150 hover:bg-[#F5F1FC] hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    <X size={14} strokeWidth={2.2} />
                  </button>

                  {/* Yellow Shield Check Icon Box */}
                  <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-[13px] bg-[#FFF238] text-[#5C3D99]">
                    <svg
                      width="22"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M12 2L4 5.4V11.4C4 16.65 7.41 21.56 12 22.8C16.59 21.56 20 16.65 20 11.4V5.4L12 2ZM10.4 15.6L7.2 12.4L8.61 10.99L10.4 12.77L15.39 7.78L16.8 9.2L10.4 15.6Z" />
                    </svg>
                  </div>

                  {/* Eyebrow & Heading */}
                  <div className="text-[9.5px] font-semibold tracking-[0.08em] text-[#7B728E] uppercase">
                    BEFORE WE BEGIN
                  </div>
                  <h2
                    id="camera-setup-heading"
                    className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#2A1163]"
                  >
                    Can we use your camera?
                  </h2>
                  <p className="m-0 mt-2 text-[10.5px] leading-[1.6] text-[#7B728E]">
                    Eyva needs camera access for the focus check-in feature.
                    <br />
                    The camera will be active during this session. The drowsiness
                    detection will analyze visual cues to identify possible signs
                    of sleepiness and provide timely break reminders.
                  </p>

                  {/* Lavender Info Box */}
                  <div className="mt-4 rounded-[10px] bg-[#F2ECFF] px-3.5 py-3 text-center text-[9.5px] leading-[1.55] text-[#6B5794]">
                    Your browser may show its own permission popup after you choose
                    &ldquo;Allow camera &amp; start&rdquo;. You can choose not to
                    continue if you prefer
                  </div>

                  {/* Allow camera & start button */}
                  <TactileButton
                    type="button"
                    onClick={handleAllowCameraAndStart}
                    style={{
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "11.5px",
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-[9px] border-0 bg-[#624794] px-4 py-3 text-[11.5px] !font-bold !text-white shadow-[0_3px_0_#2A1163] transition-colors duration-150 hover:bg-[#553B87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    <svg
                      width="14"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="#FFF238"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M12 2L4 5.4V11.4C4 16.65 7.41 21.56 12 22.8C16.59 21.56 20 16.65 20 11.4V5.4L12 2ZM10.4 15.6L7.2 12.4L8.61 10.99L10.4 12.77L15.39 7.78L16.8 9.2L10.4 15.6Z" />
                    </svg>
                    <span>Allow camera &amp; start</span>
                  </TactileButton>

                  {/* Not now button */}
                  <button
                    type="button"
                    onClick={() => setModalStep(null)}
                    style={{
                      color: "#624794",
                      fontWeight: 700,
                      fontSize: "11px",
                    }}
                    className="mt-3 block w-full rounded-[6px] border-0 bg-transparent py-1 text-center text-[11px] !font-bold !text-[#624794] transition-colors duration-150 hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
                  >
                    Not now
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
