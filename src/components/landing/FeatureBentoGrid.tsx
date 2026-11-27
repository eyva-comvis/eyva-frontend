"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Bell,
  Coffee,
  Music,
  Play,
  ShieldCheck,
  Square,
  Volume2,
} from "lucide-react";
import {
  EYVA_EASE,
  InteractiveCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionPrimitives";
import {
  SOUNDTRACKS,
  getBars,
  setMusicMuted,
  setTrack,
  startMusic,
  stopMusic,
  unlockMusic,
  type SoundtrackName,
} from "@/lib/music";
import {
  VOICE_PHRASES,
  playAlert,
  playStatusSound,
  stopVoice,
  unlockAudio,
} from "@/lib/audio";

const DETECTION_CASES = [
  {
    id: "talk",
    label: "Talking or Reading",
    yolo: "yawn (0.76)",
    mar: 0.24,
    verdict: "Filtered out: MAR below 0.32",
    tone: "safe",
  },
  {
    id: "yawn",
    label: "Genuine Yawn",
    yolo: "yawn (0.78)",
    mar: 0.47,
    verdict: "Counted after 2.0s sustained opening",
    tone: "warn",
  },
  {
    id: "eyes",
    label: "Eyes Closed >= 1.5s",
    yolo: "eye_closed (0.89)",
    mar: 0.08,
    verdict: "Triggers two-stage drowsiness check-in",
    tone: "warn",
  },
] as const;

const ALERT_STAGES = [
  {
    id: "a1",
    label: "1. Gentle Check-In",
    title: "Feeling a little sleepy?",
    desc: "Pauses your timer so you can breathe, fix posture, and acknowledge when ready.",
  },
  {
    id: "a2",
    label: "2. Second Check-In",
    title: "Let's listen to your body",
    desc: "If sleepiness continues during recheck, choose a 5-minute break or wrap up early.",
  },
  {
    id: "brk",
    label: "3. Guided Reset",
    title: "Stretch, hydrate, auto-resume",
    desc: "Three guided desk stretches and water reminders, then your exact remaining time resumes.",
  },
] as const;

const VOICE_SAMPLES = [
  { id: "face_detected" as const, label: "Focused", text: VOICE_PHRASES.face_detected },
  {
    id: "possible_drowsiness" as const,
    label: "Sleepy cue",
    text: VOICE_PHRASES.possible_drowsiness,
  },
  { id: "alert2" as const, label: "Break prompt", text: VOICE_PHRASES.alert2 },
];

export default function FeatureBentoGrid() {
  const [detCaseId, setDetCaseId] = useState<"talk" | "yawn" | "eyes">("talk");
  const [alertStageId, setAlertStageId] = useState<"a1" | "a2" | "brk">("a1");

  // Live built-in WebAudio demo state inside Card 3
  const [demoTrack, setDemoTrack] = useState<SoundtrackName>("Soft Piano");
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoBars, setDemoBars] = useState<number[]>([8, 14, 10, 18, 12, 16, 9, 15]);

  // Voice cue audition inside Card 4
  const [activeVoiceId, setActiveVoiceId] = useState<
    "face_detected" | "possible_drowsiness" | "alert2"
  >("face_detected");

  useEffect(() => {
    return () => {
      stopMusic(true);
      stopVoice();
    };
  }, []);

  useEffect(() => {
    if (!isPlayingDemo) {
      setDemoBars([6, 9, 7, 11, 8, 10, 6, 8]);
      return;
    }
    let rafId = 0;
    let lastTs = 0;
    const tick = (ts: number) => {
      if (ts - lastTs >= 65) {
        lastTs = ts;
        const levels = getBars(8);
        setDemoBars(
          levels.map((lv, i) =>
            Math.min(24, Math.max(6, Math.round(6 + lv * 16 + (i % 2) * 2)))
          )
        );
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlayingDemo]);

  const handleToggleDemoAudio = async () => {
    if (isPlayingDemo) {
      stopMusic(true);
      setIsPlayingDemo(false);
      return;
    }
    stopVoice();
    setMusicMuted(false);
    await unlockMusic();
    const ok = await startMusic(demoTrack);
    if (ok) setIsPlayingDemo(true);
  };

  const handleSelectDemoTrack = (next: SoundtrackName) => {
    setDemoTrack(next);
    if (isPlayingDemo) setTrack(next);
  };

  const handleSpeakSample = async (
    id: "face_detected" | "possible_drowsiness" | "alert2"
  ) => {
    setActiveVoiceId(id);
    await unlockAudio();
    if (id === "alert2") {
      await playAlert(2);
    } else {
      await playStatusSound(id);
    }
  };

  const activeCase =
    DETECTION_CASES.find((c) => c.id === detCaseId) ?? DETECTION_CASES[0];
  const activeAlertStage =
    ALERT_STAGES.find((a) => a.id === alertStageId) ?? ALERT_STAGES[0];
  const activeVoice =
    VOICE_SAMPLES.find((v) => v.id === activeVoiceId) ?? VOICE_SAMPLES[0];

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 sm:py-22"
    >
      <div className="max-w-[640px]">
        <h2
          id="features-heading"
          className="m-0 text-[28px] font-extrabold leading-[1.16] tracking-[-0.02em] text-[#2A1163] sm:text-[36px] text-balance"
        >
          Built for deep, sustainable study sessions
        </h2>
        <p className="m-0 mt-3 text-[15px] leading-[1.6] text-[#5E5278] text-pretty">
          Every part of Eyva works together so you can focus longer without
          pushing past exhaustion. Try the controls inside each card below.
        </p>
      </div>

      <StaggerContainer
        inView
        className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-12"
      >
        {/* CARD 1 (7 cols): Hybrid YOLO11n + MediaPipe MAR Detection */}
        <StaggerItem className="md:col-span-7">
          <InteractiveCard
            spotlightColor="rgba(255, 242, 56, 0.14)"
            className="h-full rounded-[22px] border border-[#3E1B8C] bg-[#2D0A73] p-6 text-white shadow-[0_12px_34px_rgba(45,10,115,0.14)]"
          >
            <div className="flex flex-col justify-between gap-5 h-full">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#FFF238] text-[#2D0A73]">
                    <Activity size={19} strokeWidth={2.3} aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-[#FFF238]">
                    YOLO11n + MediaPipe Face Landmarker
                  </span>
                </div>

                <h3 className="m-0 mt-4 text-[20px] font-bold leading-[1.25] text-white">
                  Drowsiness detection that knows talking from yawning
                </h3>
                <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-white/82 text-pretty">
                  Eyva pairs object detection on eyes and head posture with Mouth
                  Aspect Ratio (MAR) landmarks, filtering out slight mouth movement
                  when you read aloud or chat.
                </p>
              </div>

              {/* Interactive Fusion Comparison Switcher */}
              <div className="rounded-[16px] border border-white/15 bg-white/8 p-4">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Test mouth fusion cases">
                  {DETECTION_CASES.map((item) => {
                    const active = item.id === detCaseId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDetCaseId(item.id)}
                        style={{
                          color: active ? "#2D0A73" : "#FFFFFF",
                          fontWeight: 700,
                        }}
                        className={`min-h-[34px] rounded-[9px] px-3 py-1.5 text-[11px] !font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
                          active
                            ? "bg-[#FFF238] !text-[#2D0A73]"
                            : "bg-white/10 !text-white hover:bg-white/18"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-[12px]">
                  <div className="rounded-[10px] bg-white/10 px-3 py-2.5">
                    <div className="text-[10px] font-semibold text-white/70">
                      YOLO11n Signal
                    </div>
                    <div className="mt-0.5 font-bold text-white tabular-nums">
                      {activeCase.yolo}
                    </div>
                  </div>
                  <div className="rounded-[10px] bg-white/10 px-3 py-2.5">
                    <div className="text-[10px] font-semibold text-white/70">
                      MediaPipe MAR (Threshold 0.32)
                    </div>
                    <div className="mt-0.5 font-bold text-[#FFF238] tabular-nums">
                      MAR {activeCase.mar.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between rounded-[10px] bg-white px-3.5 py-2 text-[11.5px] font-bold text-[#2A1163]">
                  <span>Hybrid outcome:</span>
                  <span
                    className={
                      activeCase.tone === "warn"
                        ? "text-[#9F3D69]"
                        : "text-[#351080]"
                    }
                  >
                    {activeCase.verdict}
                  </span>
                </div>
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* CARD 2 (5 cols): Two-Stage Gentle Alerts & Break Flow */}
        <StaggerItem className="md:col-span-5">
          <InteractiveCard className="h-full rounded-[22px] border border-[#E5DDF5] bg-[#FFFEF9] p-6 shadow-[0_8px_28px_rgba(45,10,115,0.06)]">
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#FFF238] text-[#351080]">
                    <Bell size={18} strokeWidth={2.3} aria-hidden="true" />
                  </span>
                  <Image
                    src="/images/coffre_break.svg"
                    alt=""
                    width={46}
                    height={46}
                    className="h-auto w-[44px]"
                  />
                </div>

                <h3 className="m-0 mt-3.5 text-[19px] font-bold leading-[1.25] text-[#2A1163]">
                  Two-stage check-ins into restorative breaks
                </h3>
                <p className="m-0 mt-1.5 text-[13px] leading-[1.55] text-[#5E5278]">
                  Instead of harsh alarms, Eyva checks in twice and protects your
                  remaining study timer while you rest.
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Alert stages">
                  {ALERT_STAGES.map((stage) => {
                    const active = stage.id === alertStageId;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setAlertStageId(stage.id)}
                        style={{
                          color: active ? "#FFFFFF" : "#351080",
                          fontWeight: 700,
                        }}
                        className={`min-h-[32px] rounded-[9px] px-2.5 py-1 text-[10.5px] !font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
                          active
                            ? "bg-[#351080] !text-white"
                            : "border border-[#DFD6F2] bg-[#F5F1FF] !text-[#351080] hover:bg-[#EAE1FF]"
                        }`}
                      >
                        {stage.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeAlertStage.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.16, ease: EYVA_EASE }}
                    className="mt-3 rounded-[14px] border border-[#E7DFF7] bg-[#F6F2FF] p-3.5"
                  >
                    <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#2A1163]">
                      <Coffee size={14} className="text-[#351080]" aria-hidden="true" />
                      <span>{activeAlertStage.title}</span>
                    </div>
                    <p className="m-0 mt-1 text-[11.5px] leading-[1.5] text-[#5E5278]">
                      {activeAlertStage.desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* CARD 3 (4 cols): Eyva Calm Synth + Spotify Integration */}
        <StaggerItem className="md:col-span-4">
          <InteractiveCard className="h-full rounded-[22px] border border-[#E5DDF5] bg-[#F6F2FF] p-6 shadow-[0_8px_24px_rgba(45,10,115,0.05)]">
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#351080] text-white">
                    <Music size={17} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleToggleDemoAudio()}
                    aria-pressed={isPlayingDemo}
                    style={{
                      color: isPlayingDemo ? "#FFFFFF" : "#351080",
                      fontWeight: 700,
                    }}
                    className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] !font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
                      isPlayingDemo
                        ? "bg-[#351080] !text-white"
                        : "border border-[#D5C8F2] bg-white !text-[#351080] hover:bg-[#EFE9FF]"
                    }`}
                  >
                    {isPlayingDemo ? (
                      <>
                        <Square size={10} fill="currentColor" aria-hidden="true" />
                        <span>Stop audio</span>
                      </>
                    ) : (
                      <>
                        <Play size={10} fill="currentColor" aria-hidden="true" />
                        <span>Hear sample</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="m-0 mt-3.5 text-[18px] font-bold leading-[1.25] text-[#2A1163]">
                  Eyva Calm &amp; Spotify soundtracks
                </h3>
                <p className="m-0 mt-1.5 text-[12.5px] leading-[1.55] text-[#5E5278]">
                  Play zero-distraction WebAudio ambient tracks or paste any public
                  Spotify playlist, album, or track right inside your session.
                </p>
              </div>

              <div className="rounded-[14px] border border-[#E0D6F5] bg-white p-3">
                <div className="flex flex-wrap gap-1">
                  {SOUNDTRACKS.map((t) => {
                    const selected = t.name === demoTrack;
                    return (
                      <button
                        key={t.name}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => handleSelectDemoTrack(t.name)}
                        className={`rounded-[7px] px-2 py-1 text-[10px] font-bold transition-colors duration-150 ${
                          selected
                            ? "bg-[#FFF238] text-[#2A1163]"
                            : "bg-[#F5F1FC] text-[#5E5278] hover:text-[#351080]"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>

                <div
                  aria-hidden="true"
                  className="mt-3 flex h-[28px] items-center justify-center gap-1.5"
                >
                  {demoBars.map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}px` }}
                      className={`w-[4px] rounded-full transition-[height,background-color] duration-150 ${
                        isPlayingDemo ? "bg-[#351080]" : "bg-[#C7B6EC]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* CARD 4 (4 cols): Human Voice Companion & Session Coach */}
        <StaggerItem className="md:col-span-4">
          <InteractiveCard className="h-full rounded-[22px] border border-[#EAE4F3] bg-white p-6 shadow-[0_8px_24px_rgba(45,10,115,0.05)]">
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <span className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#FFF238] text-[#351080]">
                  <Volume2 size={18} strokeWidth={2.2} aria-hidden="true" />
                </span>

                <h3 className="m-0 mt-3.5 text-[18px] font-bold leading-[1.25] text-[#2A1163]">
                  Warm voice cues &amp; study notes
                </h3>
                <p className="m-0 mt-1.5 text-[12.5px] leading-[1.55] text-[#5E5278]">
                  Spoken voice cues automatically duck background music when your
                  focus shifts, followed by tailored recap tips after each session.
                </p>
              </div>

              <div className="rounded-[14px] border border-[#EAE4F3] bg-[#FAF8FF] p-3">
                <div className="flex flex-wrap gap-1.5">
                  {VOICE_SAMPLES.map((sample) => {
                    const active = sample.id === activeVoiceId;
                    return (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => void handleSpeakSample(sample.id)}
                        style={{
                          color: active ? "#FFFFFF" : "#351080",
                          fontWeight: 700,
                        }}
                        className={`min-h-[30px] rounded-[8px] px-2.5 py-1 text-[10px] !font-bold transition-[background-color,transform] duration-150 active:scale-[0.96] ${
                          active
                            ? "bg-[#351080] !text-white"
                            : "border border-[#DFD6F2] bg-white !text-[#351080] hover:bg-[#EFE9FF]"
                        }`}
                      >
                        Speak: {sample.label}
                      </button>
                    );
                  })}
                </div>
                <p className="m-0 mt-2.5 text-[11px] font-medium leading-[1.45] text-[#34245B]">
                  &ldquo;{activeVoice.text}&rdquo;
                </p>
              </div>
            </div>
          </InteractiveCard>
        </StaggerItem>

        {/* CARD 5 (4 cols): Privacy-First In-Memory Architecture */}
        <StaggerItem className="md:col-span-4">
          <InteractiveCard className="h-full rounded-[22px] border border-[#EAE0A8] bg-[#FFFEF4] p-6 shadow-[0_8px_24px_rgba(45,10,115,0.05)]">
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <span className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#351080] text-[#FFF238]">
                  <ShieldCheck size={18} strokeWidth={2.2} aria-hidden="true" />
                </span>

                <h3 className="m-0 mt-3.5 text-[18px] font-bold leading-[1.25] text-[#2A1163]">
                  Private by design, zero video stored
                </h3>
                <p className="m-0 mt-1.5 text-[12.5px] leading-[1.55] text-[#5E5278]">
                  Webcam frames are evaluated transiently in memory and discarded right
                  away. Only session totals (minutes, blink/yawn counts, mood) are saved.
                </p>
              </div>

              <ol className="m-0 flex list-none flex-col gap-1.5 rounded-[14px] border border-[#EAE0A8] bg-white p-3 text-[11px] font-semibold text-[#2A1163]">
                <li className="flex items-center justify-between">
                  <span>1. Webcam frame</span>
                  <span className="text-[#6E6285]">320px JPEG in RAM</span>
                </li>
                <li className="flex items-center justify-between border-t border-[#F3EFE0] pt-1.5">
                  <span>2. Score &amp; MAR check</span>
                  <span className="text-[#351080]">Transient only</span>
                </li>
                <li className="flex items-center justify-between border-t border-[#F3EFE0] pt-1.5">
                  <span>3. Disk / bucket storage</span>
                  <span className="rounded-full bg-[#FFF238] px-2 py-0.5 text-[10px] font-extrabold text-[#2A1163]">
                    0 photos saved
                  </span>
                </li>
              </ol>
            </div>
          </InteractiveCard>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}
