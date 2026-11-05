"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, errorMessage } from "@/services/api/client";
import {
  getActiveSession,
  saveLastSummary,
  sessionsApi,
  setActiveSession,
  type ActiveSession,
  type DrowsinessStatus,
  type EndReason,
  type PredictAlert,
} from "@/services/api/sessions";

/** Jeda antar frame setelah respons diterima. Backend memproses frame satu per satu. */
const FRAME_INTERVAL_MS = 700;
const FRAME_WIDTH = 320;

interface SessionConfig {
  title?: string;
  durationMinutes?: number;
  breakDurationMinutes?: number;
  soundtrack?: string;
  musicEnabled?: boolean;
}

function readConfig(): SessionConfig | null {
  try {
    const raw = localStorage.getItem("eyva_session_config");
    return raw ? (JSON.parse(raw) as SessionConfig) : null;
  } catch {
    return null;
  }
}

function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  if (video.readyState < 2 || !video.videoWidth) return null;
  const scale = FRAME_WIDTH / video.videoWidth;
  canvas.width = FRAME_WIDTH;
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7).split(",")[1] ?? null;
}

let requestCounter = 0;
let inflight: Promise<ActiveSession | "missing-config"> | null = null;

/** Lanjutkan sesi yang tersimpan, atau buat sesi + blok belajar baru dari konfigurasi di Home. */
async function bootstrap(): Promise<ActiveSession | "missing-config"> {
  let current = getActiveSession();
  if (current?.resetBreak) {
    // Kembali dari "quick reset": lanjutkan blok yang dijeda server sejak alert 2
    await sessionsApi.resume(current.sessionId, current.blockId).catch(() => undefined);
    current = { sessionId: current.sessionId, blockId: current.blockId };
    setActiveSession(current);
  }
  if (current) return current;

  const cfg = readConfig();
  if (!cfg?.durationMinutes) return "missing-config";
  const created = await sessionsApi.create({
    title: cfg.title?.trim() || "Study Session",
    studyMinutes: cfg.durationMinutes,
    breakMinutes: cfg.breakDurationMinutes ?? 5,
    soundtrack: cfg.musicEnabled === false ? null : cfg.soundtrack,
  });
  const block = await sessionsApi.startBlock(created.id);
  current = { sessionId: created.id, blockId: block.id };
  setActiveSession(current);
  return current;
}

export interface FocusMonitor {
  ready: boolean;
  status: DrowsinessStatus | null;
  faceDetected: boolean;
  alert: PredictAlert | null;
  error: string;
  acknowledge: () => Promise<void>;
  chooseReset: () => Promise<void>;
  startResetBreak: () => void;
  endFromAlert: () => Promise<void>;
  endSession: (reason: EndReason) => Promise<void>;
  completeSession: () => Promise<void>;
  setPaused: (paused: boolean) => Promise<void>;
}

/**
 * Menghubungkan halaman Focus Session ke backend:
 * membuat sesi + blok belajar, mengirim frame webcam ke /predict, dan menangani alert kantuk.
 * `monitoring` false (dijeda, modal alert terbuka, kamera mati) = berhenti mengirim frame.
 */
export function useFocusMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  monitoring: boolean,
  onMissingConfig: () => void
): FocusMonitor {
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [status, setStatus] = useState<DrowsinessStatus | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [alert, setAlert] = useState<PredictAlert | null>(null);
  const [error, setError] = useState("");

  const activeRef = useRef<ActiveSession | null>(null);
  const handledAlerts = useRef(new Set<string>());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const missingConfigRef = useRef(onMissingConfig);
  missingConfigRef.current = onMissingConfig;

  // 1) Siapkan sesi: lanjutkan yang tersimpan, atau buat sesi + blok baru dari konfigurasi Home
  useEffect(() => {
    let cancelled = false;
    // React dev (StrictMode) menjalankan effect dua kali: pakai satu proses bersama agar tidak membuat dua sesi
    inflight ??= bootstrap().finally(() => {
      inflight = null;
    });
    inflight
      .then((current) => {
        if (cancelled) return;
        if (current === "missing-config") {
          missingConfigRef.current();
          return;
        }
        activeRef.current = current;
        setActive(current);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Loop frame: kirim satu frame, tunggu respons, jeda sebentar, ulangi
  useEffect(() => {
    if (!active || !monitoring || alert) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");

    const tick = async () => {
      if (stopped) return;
      const video = videoRef.current;
      const frame = video && canvasRef.current ? captureFrame(video, canvasRef.current) : null;
      if (frame) {
        try {
          const r = await sessionsApi.predict(active.sessionId, frame, `${active.blockId}-${++requestCounter}`);
          if (stopped) return;
          setStatus(r.status);
          setFaceDetected(r.face_detected);
          if (r.alert && !handledAlerts.current.has(r.alert.id)) {
            handledAlerts.current.add(r.alert.id);
            setAlert(r.alert);
            return; // loop berhenti sampai alert dijawab
          }
        } catch (err) {
          if (err instanceof ApiError && (err.status === 404 || err.status === 409)) {
            setError("This session is no longer active. Please start a new one from Home.");
            setActiveSession(null);
            return;
          }
          // gangguan jaringan sesaat: coba lagi pada frame berikutnya
        }
      }
      if (!stopped) timer = setTimeout(tick, FRAME_INTERVAL_MS);
    };
    timer = setTimeout(tick, 300);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, monitoring, alert, videoRef]);

  const finish = useCallback(async (getSummary: (s: ActiveSession) => Promise<unknown>) => {
    const current = activeRef.current;
    if (!current) return;
    const summary = await getSummary(current);
    if (summary) saveLastSummary(summary as Parameters<typeof saveLastSummary>[0]);
    setActiveSession(null);
    activeRef.current = null;
  }, []);

  const acknowledge = useCallback(async () => {
    const current = activeRef.current;
    if (current && alert) await sessionsApi.respondAlert(current.sessionId, alert.id, "ACKNOWLEDGE").catch(() => undefined);
    setAlert(null);
  }, [alert]);

  /** Alert 2 -> "I'll do a quick reset": blok tetap dijeda server sampai pengguna kembali. */
  const chooseReset = useCallback(async () => {
    const current = activeRef.current;
    if (current && alert) await sessionsApi.respondAlert(current.sessionId, alert.id, "CONTINUE").catch(() => undefined);
  }, [alert]);

  const startResetBreak = useCallback(() => {
    const current = activeRef.current;
    if (current) setActiveSession({ ...current, resetBreak: true });
  }, []);

  const endFromAlert = useCallback(async () => {
    await finish(async (s) => {
      if (alert?.level === 2) {
        await sessionsApi.respondAlert(s.sessionId, alert.id, "END_SESSION").catch(() => undefined);
        return sessionsApi.summary(s.sessionId).catch(() => null);
      }
      return sessionsApi.end(s.sessionId, "MANUAL").catch(() => null);
    });
  }, [alert, finish]);

  const endSession = useCallback(
    (reason: EndReason) => finish((s) => sessionsApi.end(s.sessionId, reason).catch(() => null)),
    [finish]
  );

  const completeSession = useCallback(
    () =>
      finish(async (s) => {
        await sessionsApi.completeBlock(s.sessionId, s.blockId).catch(() => undefined);
        return sessionsApi.end(s.sessionId, "COMPLETED").catch(() => null);
      }),
    [finish]
  );

  const setPaused = useCallback(async (paused: boolean) => {
    const current = activeRef.current;
    if (!current) return;
    const call = paused ? sessionsApi.pause : sessionsApi.resume;
    await call(current.sessionId, current.blockId).catch(() => undefined);
  }, []);

  return {
    ready: active !== null,
    status,
    faceDetected,
    alert,
    error,
    acknowledge,
    chooseReset,
    startResetBreak,
    endFromAlert,
    endSession,
    completeSession,
    setPaused,
  };
}
