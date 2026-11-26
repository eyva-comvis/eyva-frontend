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
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import SpotifyEmbedPlayer, {
  type SpotifyEmbedHandle,
} from "@/components/music/SpotifyEmbedPlayer";
import SpotifyPicker from "@/components/music/SpotifyPicker";
import { EyvaErrorView } from "@/components/ui/EyvaStateView";
import { useFocusMonitor } from "@/hooks/useFocusMonitor";
import {
  playAlert,
  playStatusSound,
  stopVoice,
  unlockAudio,
  type CameraSoundCue,
} from "@/lib/audio";
import {
  SOUNDTRACKS,
  getBars,
  getMusicState,
  getSoundtrackSubtitle,
  normalizeSoundtrack,
  setEnergized,
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
  spotifyTypeLabel,
  type MusicSource,
  type SpotifyItem,
} from "@/lib/spotify";
import { sessionsApi, type DrowsinessStatus } from "@/services/api/sessions";

const FACE_LOST_DEBOUNCE_MS = 1600;
const SFX_COOLDOWN_MS: Record<CameraSoundCue, number> = {
  face_detected: 8000,
  face_not_detected: 8000,
  possible_drowsiness: 10000,
  drowsy: 10000,
};

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
  const [soundtrack, setSoundtrack] = useState<SoundtrackName>("Soft Piano");
  const [musicSource, setMusicSource] = useState<MusicSource>("builtin");
  const [spotifyItem, setSpotifyItem] = useState<SpotifyItem>(DEFAULT_SPOTIFY_ITEM);
  const [isSpotifyPlaying, setIsSpotifyPlaying] = useState(false);
  const [showSpotifyPicker, setShowSpotifyPicker] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const spotifyPlayerRef = useRef<SpotifyEmbedHandle | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    WAVEFORM_HEIGHTS.map(() => 6)
  );
  const [cameraConnected, setCameraConnected] = useState(true);
  const [activeAlert, setActiveAlert] = useState<null | "alert1" | "alert2">(
    null
  );
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isTransitioningBreak, setIsTransitioningBreak] = useState(false);
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
    isHydrated &&
      !isPaused &&
      cameraConnected &&
      activeAlert === null &&
      !isEnding &&
      !isTransitioningBreak,
    () => router.replace("/dashboard/home")
  );

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const soundtrackRef = useRef(soundtrack);
  soundtrackRef.current = soundtrack;
  const shouldPlayMusic =
    isHydrated &&
    monitor.ready &&
    musicSource === "builtin" &&
    isMusicPlaying &&
    !isPaused &&
    !isEnding &&
    !isTransitioningBreak;
  const shouldPlayMusicRef = useRef(shouldPlayMusic);
  shouldPlayMusicRef.current = shouldPlayMusic;
  const isMusicAudible = shouldPlayMusic && !isMuted;
  const shouldPauseSpotify =
    !monitor.ready ||
    isPaused ||
    isEnding ||
    isTransitioningBreak ||
    activeAlert === "alert2";
  const isAnyMusicActive =
    musicSource === "spotify" ? isSpotifyPlaying && !isPaused : isMusicAudible;

  const confirmedCueRef = useRef<CameraSoundCue | null>(null);
  const lastPlayedAtRef = useRef<Partial<Record<CameraSoundCue | "alert1" | "alert2", number>>>({});
  const faceLostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playedAlertIdRef = useRef<string | null>(null);

  // Buka izin WebAudio pada interaksi pengguna pertama & hentikan musik saat halaman ditutup
  useEffect(() => {
    const unlock = () => {
      void unlockAudio();
      if (shouldPlayMusicRef.current) {
        void unlockMusic().then((ok) => {
          if (ok && shouldPlayMusicRef.current && !getMusicState().playing) {
            void startMusic(soundtrackRef.current);
          }
        });
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      if (faceLostTimerRef.current) {
        clearTimeout(faceLostTimerRef.current);
        faceLostTimerRef.current = null;
      }
      stopVoice();
      stopMusic(true);
      spotifyPlayerRef.current?.pause();
    };
  }, []);

  // Sinkronisasi mesin musik latar dengan Play/Pause, mode Eyva Calm vs Spotify, Pause sesi, End, dan pindah ke Break
  useEffect(() => {
    if (musicSource === "spotify") {
      stopMusic(true);
      return;
    }
    if (shouldPlayMusic) {
      void startMusic(soundtrack);
    } else {
      stopMusic();
    }
  }, [musicSource, shouldPlayMusic, soundtrack]);

  // Sinkronisasi tombol Mute/Unmute ke volume musik
  useEffect(() => {
    setMusicMuted(isMuted);
  }, [isMuted]);

  // Sedikit cerahkan musik saat indikasi kantuk muncul
  useEffect(() => {
    setEnergized(
      monitor.status === "POSSIBLE_DROWSINESS" ||
        monitor.status === "DROWSY_NEED_REST"
    );
  }, [monitor.status]);

  // Gerakkan batang waveform mengikuti AnalyserNode (hormati prefers-reduced-motion)
  useEffect(() => {
    if (!isMusicAudible) {
      setBarHeights(WAVEFORM_HEIGHTS.map(() => 6));
      return;
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setBarHeights(WAVEFORM_HEIGHTS);
      return;
    }

    let rafId = 0;
    let lastUpdate = 0;
    const loop = (ts: number) => {
      if (ts - lastUpdate >= 55) {
        lastUpdate = ts;
        const levels = getBars(WAVEFORM_HEIGHTS.length);
        setBarHeights(
          WAVEFORM_HEIGHTS.map((base, idx) => {
            const energy = levels[idx] ?? 0;
            const target = 6 + Math.round(energy * 22 + (base / 28) * 7 * (0.35 + energy));
            return Math.min(30, Math.max(6, target));
          })
        );
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isMusicAudible]);

  // Alert dari model kantuk -> tampilkan modal & bunyikan SFX peringatan
  useEffect(() => {
    if (!monitor.alert) return;
    localStorage.setItem("eyva_focus_remaining_seconds", String(secondsLeftRef.current));
    setActiveAlert(monitor.alert.level === 1 ? "alert1" : "alert2");

    if (playedAlertIdRef.current !== monitor.alert.id) {
      playedAlertIdRef.current = monitor.alert.id;
      if (!isMutedRef.current && voiceEnabledRef.current) {
        const now = Date.now();
        if (monitor.alert.level === 2) {
          lastPlayedAtRef.current.alert2 = now;
          void playAlert(2);
        } else {
          const lastAlert1 = lastPlayedAtRef.current.alert1 ?? 0;
          if (now - lastAlert1 >= 4500) {
            lastPlayedAtRef.current.alert1 = now;
            void playAlert(1);
          }
        }
      }
    }
  }, [monitor.alert]);

  // Vokal suara manusia saat status kamera berubah (hanya pada transisi, dengan debounce & cooldown)
  useEffect(() => {
    const clearFaceLostTimer = () => {
      if (faceLostTimerRef.current) {
        clearTimeout(faceLostTimerRef.current);
        faceLostTimerRef.current = null;
      }
    };

    if (!cameraConnected) {
      clearFaceLostTimer();
      confirmedCueRef.current = null;
      stopVoice();
      return;
    }

    if (
      !monitor.ready ||
      isPaused ||
      isEnding ||
      activeAlert !== null ||
      monitor.alert !== null ||
      monitor.status === null
    ) {
      clearFaceLostTimer();
      return;
    }

    const nextCue: CameraSoundCue = !monitor.faceDetected
      ? "face_not_detected"
      : monitor.status === "DROWSY_NEED_REST"
        ? "drowsy"
        : monitor.status === "POSSIBLE_DROWSINESS"
          ? "possible_drowsiness"
          : "face_detected";

    const commitTransition = (cue: CameraSoundCue) => {
      if (confirmedCueRef.current === cue) return;
      confirmedCueRef.current = cue;
      if (isMutedRef.current || !voiceEnabledRef.current) return;
      const now = Date.now();
      const last = lastPlayedAtRef.current[cue] ?? 0;
      if (now - last < SFX_COOLDOWN_MS[cue]) return;
      lastPlayedAtRef.current[cue] = now;
      if (cue === "drowsy") {
        lastPlayedAtRef.current.alert1 = now;
      }
      void playStatusSound(cue);
    };

    if (nextCue === "face_not_detected") {
      if (
        confirmedCueRef.current === "face_not_detected" ||
        faceLostTimerRef.current !== null
      ) {
        return;
      }
      faceLostTimerRef.current = setTimeout(() => {
        faceLostTimerRef.current = null;
        commitTransition("face_not_detected");
      }, FACE_LOST_DEBOUNCE_MS);
      return;
    }

    clearFaceLostTimer();
    commitTransition(nextCue);
  }, [
    cameraConnected,
    monitor.ready,
    monitor.status,
    monitor.faceDetected,
    monitor.alert,
    isPaused,
    isEnding,
    activeAlert,
  ]);

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
        if (parsed.breakDurationMinutes) {
          const bMins = Number(parsed.breakDurationMinutes);
          if (!Number.isNaN(bMins) && bMins > 0) {
            setBreakMinutes(bMins);
          }
        }
        if (parsed.soundtrack) {
          setSoundtrack(normalizeSoundtrack(parsed.soundtrack));
        }
        if (parsed.musicSource === "spotify" || parsed.musicSource === "builtin") {
          setMusicSource(parsed.musicSource);
        }
        const restoredSpotify = sanitizeSpotifyItem(parsed.spotifyItem);
        if (restoredSpotify) {
          setSpotifyItem(restoredSpotify);
        } else {
          const savedList = readSavedSpotifyItems();
          if (savedList[0]) {
            setSpotifyItem(savedList[0]);
          }
        }
        if (typeof parsed.musicEnabled === "boolean") {
          setIsMusicPlaying(parsed.musicEnabled);
        }
        if (typeof parsed.voiceEnabled === "boolean") {
          setVoiceEnabled(parsed.voiceEnabled);
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

  const streamRef = useRef<MediaStream | null>(null);

  // Connect live webcam stream via getUserMedia
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let cancelled = false;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          activeStream = stream;
          streamRef.current = stream;
          setCameraConnected(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch {
        if (!cancelled) setCameraConnected(false);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current = null;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Pastikan stream webcam langsung terpasang begitu elemen <video> muncul setelah loading selesai
  useEffect(() => {
    if (monitor.ready && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [monitor.ready]);

  const secondsLeftRef = useRef(secondsLeft);
  secondsLeftRef.current = secondsLeft;

  // Countdown timer (automatically pauses when manually paused OR when an alert modal is active)
  useEffect(() => {
    if (
      !isHydrated ||
      isPaused ||
      activeAlert !== null ||
      !monitor.ready ||
      isEnding ||
      isTransitioningBreak
    ) {
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        localStorage.setItem("eyva_focus_remaining_seconds", String(next));
        localStorage.setItem("eyva_focus_total_seconds", String(totalSeconds));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    isHydrated,
    isPaused,
    activeAlert,
    totalSeconds,
    monitor.ready,
    isEnding,
    isTransitioningBreak,
  ]);

  const persistMusicConfig = (patch: {
    soundtrack?: SoundtrackName;
    musicEnabled?: boolean;
    musicSource?: MusicSource;
    spotifyItem?: SpotifyItem;
    voiceEnabled?: boolean;
  }) => {
    try {
      const raw = localStorage.getItem("eyva_session_config");
      const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem("eyva_session_config", JSON.stringify({ ...current, ...patch }));
    } catch {
      // abaikan bila localStorage tidak tersedia
    }
  };

  const handleSwitchMusicSource = (nextSource: MusicSource) => {
    if (nextSource === musicSource) return;
    void unlockAudio();
    if (nextSource === "spotify") {
      stopMusic(true);
      setMusicSource("spotify");
      persistMusicConfig({ musicSource: "spotify", spotifyItem });
    } else {
      spotifyPlayerRef.current?.pause();
      setIsSpotifyPlaying(false);
      setShowSpotifyPicker(false);
      void unlockMusic();
      setMusicSource("builtin");
      persistMusicConfig({ musicSource: "builtin" });
    }
  };

  const handleSelectSpotifyItem = (item: SpotifyItem) => {
    void unlockAudio();
    stopMusic(true);
    setSpotifyItem(item);
    setMusicSource("spotify");
    setShowSpotifyPicker(false);
    persistMusicConfig({ musicSource: "spotify", spotifyItem: item });
  };

  const handleToggleMusic = () => {
    void unlockAudio();
    void unlockMusic();
    setIsMusicPlaying((prev) => {
      const next = !prev;
      persistMusicConfig({ musicEnabled: next });
      return next;
    });
  };

  const handleToggleMute = () => {
    void unlockAudio();
    if (musicSource === "builtin") {
      void unlockMusic();
    }
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopVoice();
      }
      return next;
    });
  };

  const handleToggleVoice = () => {
    void unlockAudio();
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopVoice();
      }
      persistMusicConfig({ voiceEnabled: next });
      return next;
    });
  };

  const handleTrackChange = (next: SoundtrackName) => {
    void unlockAudio();
    void unlockMusic();
    setSoundtrack(next);
    persistMusicConfig({ soundtrack: next });
    setTrack(next);
  };

  const goToSummary = () => {
    stopVoice();
    stopMusic(true);
    spotifyPlayerRef.current?.pause();
    localStorage.removeItem("eyva_focus_remaining_seconds");
    localStorage.removeItem("eyva_focus_total_seconds");
    router.push("/dashboard/summary");
  };

  const handleEndSession = async () => {
    if (isEnding || isTransitioningBreak) return;
    setIsEnding(true);
    stopVoice();
    stopMusic(true);
    spotifyPlayerRef.current?.pause();
    if (monitor.alert) await monitor.endFromAlert();
    else await monitor.endSession("MANUAL");
    goToSummary();
  };

  const handleTakeBreakFromAlert2 = async () => {
    if (isTransitioningBreak || isEnding) return;
    setIsTransitioningBreak(true);
    stopVoice();
    stopMusic(true);
    spotifyPlayerRef.current?.pause();
    try {
      await monitor.chooseReset();
      localStorage.setItem(
        "eyva_focus_remaining_seconds",
        String(secondsLeftRef.current)
      );
      localStorage.setItem("eyva_focus_total_seconds", String(totalSeconds));
      monitor.startResetBreak();
      setActiveAlert(null);
      router.push("/dashboard/break-session");
    } catch {
      setIsTransitioningBreak(false);
    }
  };

  // Timer habis: blok belajar selesai, sesi berakhir normal
  useEffect(() => {
    if (!isHydrated || !monitor.ready || secondsLeft > 0 || isEnding) return;
    setIsEnding(true);
    stopVoice();
    stopMusic(true);
    spotifyPlayerRef.current?.pause();
    monitor.completeSession().then(goToSummary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isHydrated, monitor.ready]);

  const togglePause = () => {
    void unlockAudio();
    if (musicSource === "builtin") {
      void unlockMusic();
    }
    const next = !isPaused;
    if (next) {
      stopVoice();
      spotifyPlayerRef.current?.pause();
    }
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

  // Jika inisialisasi sesi gagal (backend mati / timeout / error jaringan), tampilkan halaman error ramah dengan tombol Retry
  if (!monitor.ready && monitor.error) {
    return (
      <EyvaErrorView
        eyebrow="COULDN'T START SESSION"
        title="Connection took a pause"
        description={monitor.error}
        onRetry={monitor.retryInit}
        retryLabel="Retry"
        homeHref="/dashboard/home"
        homeLabel="Back to Home"
        variant="network"
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white text-[#351080]">
      {/* PAGE CONTENT WRAPPER (Blurred when alert modal is open) */}
      <div
        className={`min-h-screen w-full pl-6 pr-8 pt-6 pb-12 sm:pr-12 transition-[filter] duration-200 ${
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
            <span>{monitor.ready ? "FOCUS MODE IS ON" : "PREPARING SESSION"}</span>
          </div>
          <h1 className="m-0 mt-1 text-[30px] font-bold tracking-tight text-[#2A1163]">
            {monitor.ready
              ? "You're doing lovely"
              : "Preparing your study space…"}
          </h1>
        </div>

        {/* SKELETON & SLOW-CONNECTION HANDLER SAAT INISIALISASI SESI */}
        {!monitor.ready ? (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="mx-auto max-w-[980px]"
          >
            {monitor.isSlow && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#EAE0A8] bg-[#FFFCE0] px-5 py-3.5 text-[12px] text-[#351080]">
                <div>
                  <div className="font-bold text-[#2A1163]">
                    Taking longer than usual to connect
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#5A5070]">
                    The Eyva server hasn&apos;t responded after 10 seconds. Check your connection or try again.
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={monitor.retryInit}
                    style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "11.5px" }}
                    className="inline-flex h-[36px] items-center gap-1.5 rounded-[10px] border-0 bg-[#351080] px-4 text-[11.5px] !font-bold !text-white transition-[background-color,transform] duration-150 hover:bg-[#43189E] enabled:active:scale-[0.96]"
                  >
                    <RefreshCw size={13} strokeWidth={2.3} />
                    <span>Retry</span>
                  </button>
                  <Link
                    href="/dashboard/home"
                    style={{ color: "#351080", fontWeight: 700, fontSize: "11.5px" }}
                    className="inline-flex h-[36px] items-center rounded-[10px] border border-[#DDD3F2] bg-white px-3.5 text-[11.5px] !font-bold !text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#F2ECFF] active:scale-[0.96]"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Timer Card Skeleton */}
              <div className="flex min-h-[470px] flex-col items-center justify-between rounded-[20px] bg-[#2D0A73] p-7 text-white shadow-[0_10px_30px_rgba(45,10,115,0.16)]">
                <div className="flex w-full items-center justify-between">
                  <span className="h-[26px] w-[112px] rounded-full bg-[#FFF238]/80 motion-safe:animate-pulse" />
                  <span className="h-3 w-16 rounded-full bg-white/20 motion-safe:animate-pulse" />
                </div>

                <div className="my-8 flex flex-col items-center">
                  <div className="flex h-[220px] w-[220px] flex-col items-center justify-center rounded-full border-[9px] border-white/20 bg-white/10 motion-safe:animate-pulse">
                    <span className="h-3 w-20 rounded-full bg-white/30" />
                    <span className="my-3 h-10 w-32 rounded-xl bg-white/30" />
                    <span className="h-3 w-24 rounded-full bg-white/25" />
                  </div>
                  <div className="mt-8 flex gap-3.5">
                    <span className="h-[38px] w-[96px] rounded-[10px] bg-white/25 motion-safe:animate-pulse" />
                    <span className="h-[38px] w-[104px] rounded-[10px] bg-white/20 motion-safe:animate-pulse" />
                  </div>
                </div>

                <div className="flex w-full items-center justify-between border-t border-white/15 pt-3.5">
                  <span className="h-3 w-24 rounded-full bg-white/20 motion-safe:animate-pulse" />
                  <span className="h-3 w-16 rounded-full bg-white/20 motion-safe:animate-pulse" />
                </div>
              </div>

              {/* Right Column Skeleton */}
              <div className="flex flex-col gap-6">
                <div className="rounded-[20px] border border-[#EAE4F3] bg-white p-6 shadow-[0_6px_24px_rgba(45,10,115,0.06)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-[36px] w-[36px] rounded-[10px] bg-[#FFF238]/75 motion-safe:animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-24 rounded-full bg-[#E5DCF8] motion-safe:animate-pulse" />
                        <div className="h-2.5 w-32 rounded-full bg-[#F2ECFF] motion-safe:animate-pulse" />
                      </div>
                    </div>
                    <span className="h-6 w-28 rounded-[8px] bg-[#F2ECFF] motion-safe:animate-pulse" />
                  </div>
                  <div className="mt-4 h-[217px] w-full rounded-[16px] bg-[#F2ECFF] motion-safe:animate-pulse" />
                </div>

                <div className="rounded-[20px] border border-[#EAE4F3] bg-white p-6 shadow-[0_6px_24px_rgba(45,10,115,0.06)]">
                  <div className="flex items-center gap-3">
                    <span className="h-[36px] w-[36px] rounded-[10px] bg-[#FFF238]/75 motion-safe:animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-36 rounded-full bg-[#E5DCF8] motion-safe:animate-pulse" />
                      <div className="h-2.5 w-20 rounded-full bg-[#F2ECFF] motion-safe:animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-4 h-[52px] w-full rounded-[11px] bg-[#F8F7F2] motion-safe:animate-pulse" />
                  <div className="mt-4 h-[32px] w-full rounded-full bg-[#F2ECFF]/70 motion-safe:animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                  {musicSource === "spotify"
                    ? isAnyMusicActive
                      ? "Spotify on"
                      : "Spotify ready"
                    : isAnyMusicActive
                      ? "Music on"
                      : "Music off"}
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

                {/* Live drowsiness status + Voice cue toggle */}
                <div className="flex items-center gap-1.5">
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

                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    aria-pressed={voiceEnabled && !isMuted}
                    aria-label={
                      voiceEnabled && !isMuted
                        ? "Mute voice status cues"
                        : "Enable voice status cues"
                    }
                    title={
                      voiceEnabled && !isMuted
                        ? "Voice cues on (click to mute voice)"
                        : "Voice cues muted (click to enable)"
                    }
                    className={`inline-flex h-[27px] items-center gap-1 rounded-[8px] border px-2 text-[9px] font-bold transition-[background-color,border-color,color,transform] duration-150 motion-safe:enabled:active:scale-[0.96] ${
                      voiceEnabled && !isMuted
                        ? "border-[#DDD3F2] bg-[#F7F3FF] text-[#351080] hover:bg-[#EDE4FF]"
                        : "border-[#E5DFEE] bg-white text-[#8E83A5] hover:bg-[#FAF8FF]"
                    }`}
                  >
                    {voiceEnabled && !isMuted ? (
                      <Volume2 size={12} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <VolumeX size={12} strokeWidth={2.2} aria-hidden="true" />
                    )}
                    <span>{voiceEnabled && !isMuted ? "Voice on" : "Voice off"}</span>
                  </button>
                </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#FFF238] text-[#351080]">
                    <Sliders size={17} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#2A1163]">
                      A little background calm
                    </div>
                    <div className="text-[10px] text-[#7B728E]">
                      {musicSource === "spotify"
                        ? isPaused
                          ? "Paused with session"
                          : isSpotifyPlaying
                            ? isMuted
                              ? "Spotify playing · SFX muted"
                              : "Spotify playing"
                            : isMuted
                              ? "Spotify ready · SFX muted"
                              : "Spotify ready"
                        : isMuted
                          ? "Audio muted"
                          : isPaused
                            ? "Paused with session"
                            : isMusicPlaying
                              ? "Music is on"
                              : "Music is paused"}
                    </div>
                  </div>
                </div>

                {/* Quick Source Switcher + Volume/SFX Mute Button */}
                <div className="flex items-center gap-2">
                  <div
                    role="tablist"
                    aria-label="Music source"
                    className="inline-flex rounded-[10px] border border-[#E5DFEE] bg-[#F4F0FC] p-[3px]"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={musicSource === "builtin"}
                      onClick={() => handleSwitchMusicSource("builtin")}
                      className={`rounded-[7px] border-0 px-2.5 py-1 text-[10px] font-bold transition-[background-color,color] duration-150 ${
                        musicSource === "builtin"
                          ? "bg-[#351080] !text-white shadow-[0_1px_2px_rgba(53,16,128,0.25)]"
                          : "bg-transparent text-[#6C5B8D] hover:text-[#351080]"
                      }`}
                    >
                      Eyva Calm
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={musicSource === "spotify"}
                      onClick={() => handleSwitchMusicSource("spotify")}
                      className={`inline-flex items-center gap-1.5 rounded-[7px] border-0 px-2.5 py-1 text-[10px] font-bold transition-[background-color,color] duration-150 ${
                        musicSource === "spotify"
                          ? "bg-[#351080] !text-white shadow-[0_1px_2px_rgba(53,16,128,0.25)]"
                          : "bg-transparent text-[#6C5B8D] hover:text-[#351080]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block h-[6px] w-[6px] rounded-full bg-[#1DB954]"
                      />
                      <span>Spotify</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMute}
                    aria-label={
                      musicSource === "spotify"
                        ? isMuted
                          ? "Unmute camera alert sounds"
                          : "Mute camera alert sounds"
                        : isMuted
                          ? "Unmute audio"
                          : "Mute audio"
                    }
                    title={
                      musicSource === "spotify"
                        ? isMuted
                          ? "Aktifkan suara status kamera"
                          : "Bisukan suara status kamera"
                        : isMuted
                          ? "Unmute audio"
                          : "Mute audio"
                    }
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-[#E5DFEE] bg-white text-[#351080] transition-[background-color,transform] duration-150 hover:bg-[#F5F1FC] motion-safe:enabled:active:scale-[0.96]"
                  >
                    {isMuted ? (
                      <VolumeX size={15} strokeWidth={2} />
                    ) : (
                      <Volume2 size={15} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {musicSource === "builtin" ? (
                <>
                  {/* Track Player Box */}
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-[11px] border border-[#E6E2DC] bg-[#F8F7F2] px-4 py-2.5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Music
                        size={16}
                        strokeWidth={2.2}
                        className="shrink-0 text-[#2D0A73]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="relative inline-flex max-w-full items-center">
                          <select
                            aria-label="Choose focus soundtrack"
                            value={soundtrack}
                            onChange={(e) =>
                              handleTrackChange(e.target.value as SoundtrackName)
                            }
                            style={{ fontSize: "10.5px", fontWeight: 700 }}
                            className="max-w-full cursor-pointer appearance-none truncate bg-transparent pr-4 !text-[10.5px] !font-bold text-[#2A1163] outline-none focus-visible:underline"
                          >
                            {SOUNDTRACKS.map((track) => (
                              <option key={track.name} value={track.name}>
                                {track.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={11}
                            strokeWidth={2.4}
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0 text-[#5A5070]"
                          />
                        </div>
                        <div className="text-[8.5px] text-[#7B728E]">
                          {getSoundtrackSubtitle(soundtrack)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleMusic}
                      disabled={isPaused || isEnding}
                      aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                      style={{ color: "#FFFFFF", fontSize: "9px", fontWeight: 700 }}
                      className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-0 bg-[#2D0A73] !text-white transition-[background-color,transform] duration-150 hover:bg-[#43189E] motion-safe:enabled:active:scale-[0.96]"
                    >
                      {isMusicPlaying && !isPaused ? "❚❚" : "▶"}
                    </button>
                  </div>

                  {/* Purple Waveform Bars (Live WebAudio Analyser) */}
                  <div
                    aria-hidden="true"
                    className="mt-4 flex h-[32px] items-center justify-center gap-[4px]"
                  >
                    {barHeights.map((height, idx) => (
                      <span
                        key={idx}
                        style={{
                          height: `${isMusicAudible ? height : 6}px`,
                        }}
                        className="w-[3px] rounded-full bg-[#9D84F6] transition-[height] duration-150 ease-out"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-4 space-y-3">
                  {/* Selected Spotify Strip + Mid-session Change button */}
                  <div className="flex items-center justify-between gap-2.5 rounded-[11px] border border-[#E6E0F2] bg-[#FAF8FF] px-3.5 py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-[#1DB954]"
                      />
                      <span className="truncate text-[11px] font-bold text-[#2A1163]">
                        {spotifyItem.title}
                      </span>
                      <span className="shrink-0 rounded-full bg-[#EFE9FF] px-2 py-0.5 text-[9px] font-semibold text-[#5C3D99]">
                        {spotifyTypeLabel(spotifyItem.type)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSpotifyPicker((prev) => !prev)}
                      aria-expanded={showSpotifyPicker}
                      className="shrink-0 rounded-[7px] border border-[#DDD3F2] bg-white px-2.5 py-1 text-[10px] font-bold text-[#351080] transition-[background-color,border-color,transform] duration-150 hover:border-[#C5B5E8] hover:bg-[#F2ECFF] motion-safe:enabled:active:scale-[0.96]"
                    >
                      {showSpotifyPicker ? "Close" : "Change"}
                    </button>
                  </div>

                  {/* Mid-session Spotify Picker (does not reset timer/session) */}
                  {showSpotifyPicker && (
                    <div className="rounded-[12px] border border-[#EAE4F3] bg-[#FDFCFE] p-3">
                      <SpotifyPicker
                        compact
                        selected={spotifyItem}
                        onSelect={handleSelectSpotifyItem}
                      />
                    </div>
                  )}

                  {/* Spotify Embed Player (IFrame API + fallback iframe) */}
                  <SpotifyEmbedPlayer
                    ref={spotifyPlayerRef}
                    item={spotifyItem}
                    paused={shouldPauseSpotify}
                    onPlaybackChange={setIsSpotifyPlaying}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
          </>
        )}
      </div>

      {/* =========================================================
          MODAL OVERLAY: DEMO ALERT 1 ("Feeling a little sleepy?")
      ========================================================= */}
      {activeAlert === "alert1" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-[#351080]/18 px-4 py-6">
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
                stopVoice();
                void unlockAudio();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-[#351080]/18 px-4 py-6">
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

            {/* Option 1: Take a break -> langsung ke Break Session */}
            <button
              type="button"
              onClick={handleTakeBreakFromAlert2}
              disabled={isTransitioningBreak || isEnding}
              className="mt-5 flex w-full items-center justify-between rounded-[12px] border border-[#E4DCFA] bg-[#F2ECFF] px-4 py-3.5 text-left transition-[background-color,transform] duration-150 hover:bg-[#EAE1FF] enabled:active:scale-[0.96]"
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
                    {isTransitioningBreak
                      ? "Starting break…"
                      : `Take a ${breakMinutes}-min break`}
                  </div>
                  <div
                    style={{ fontSize: "9.5px", fontWeight: 400 }}
                    className="mt-0.5 !text-[9.5px] !font-normal text-[#5A5070]"
                  >
                    Pause your timer and recharge before continuing
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
              disabled={isTransitioningBreak || isEnding}
              className="mt-3 flex w-full items-center justify-between rounded-[12px] border border-[#F5DCE6] bg-[#FDF2F6] px-4 py-3.5 text-left transition-[background-color,transform] duration-150 hover:bg-[#FCE6EE] enabled:active:scale-[0.96]"
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
                    {isEnding ? "Ending session…" : "End my session"}
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
    </div>
  );
}
