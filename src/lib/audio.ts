// Sistem vokal suara manusia hibrida Eyva untuk status kamera & peringatan kantuk:
// 1. Rekaman vokal manusia opsional di `/audio/voice/{cue}.mp3` (HTMLAudioElement) bila tersedia.
// 2. Utama: Web Speech API (`window.speechSynthesis`) dengan pemilihan voice bahasa Inggris paling natural.
// 3. Fallback terakhir: chime WebAudio lembut hanya bila browser tidak mendukung SpeechSynthesis sama sekali.

export type CameraSoundCue =
  | "face_detected"
  | "face_not_detected"
  | "possible_drowsiness"
  | "drowsy";

export type VoiceCueId = CameraSoundCue | "alert1" | "alert2";

export const VOICE_PHRASES: Record<VoiceCueId, string> = {
  face_detected: "Face detected. You look focused.",
  face_not_detected: "Face not detected. Please stay in frame.",
  possible_drowsiness: "Heads up, you might be getting a little sleepy.",
  drowsy: "Feeling a little sleepy? Take a breath and refocus.",
  alert1: "Feeling a little sleepy? Take a breath and refocus.",
  alert2: "You still seem sleepy. Let's take a short break.",
};

const CUE_PRIORITY: Record<VoiceCueId, number> = {
  face_detected: 1,
  face_not_detected: 1,
  possible_drowsiness: 1,
  drowsy: 2,
  alert1: 2,
  alert2: 3,
};

const PREFERRED_VOICE_PATTERNS: RegExp[] = [
  /microsoft\s+(aria|jenny|ava|emma|sonia|ana|libby|michelle).*natural/i,
  /natural.*english/i,
  /google\s+us\s+english/i,
  /google\s+uk\s+english\s+female/i,
  /\b(samantha|ava|allison|serena|karen|moira|tessa)\b/i,
  /microsoft\s+(aria|jenny|zira|hazel)/i,
];

let ctx: AudioContext | null = null;
let duckHandler: ((ms: number) => void) | null = null;
let unduckHandler: (() => void) | null = null;

// Simpan referensi modul agar tidak terkena garbage-collection di tengah kalimat (bug klasik Chromium)
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudioEl: HTMLAudioElement | null = null;
let activePriority = 0;
let playSeq = 0;
let safetyUnduckTimer: ReturnType<typeof setTimeout> | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesListenerBound = false;

// Cache ketersediaan berkas opsional `/audio/voice/{cue}.mp3` agar tidak memicu request berulang
const voiceFileStatus = new Map<VoiceCueId, boolean>();

function hasSpeechSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

function refreshVoices(): SpeechSynthesisVoice[] {
  if (!hasSpeechSupport()) return [];
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
    if (!voicesListenerBound) {
      voicesListenerBound = true;
      window.speechSynthesis.addEventListener?.("voiceschanged", () => {
        try {
          const updated = window.speechSynthesis.getVoices();
          if (updated && updated.length > 0) {
            cachedVoices = updated;
          }
        } catch {
          // abaikan
        }
      });
    }
  } catch {
    // abaikan
  }
  return cachedVoices;
}

function pickNaturalEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = refreshVoices();
  if (voices.length === 0) return null;

  const englishVoices = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  for (const pattern of PREFERRED_VOICE_PATTERNS) {
    const match = pool.find((v) => pattern.test(`${v.name} ${v.voiceURI}`));
    if (match) return match;
  }

  const usLocal = pool.find((v) => /^en[-_]US/i.test(v.lang) && v.localService);
  if (usLocal) return usLocal;

  const anyUs = pool.find((v) => /^en[-_]US/i.test(v.lang));
  if (anyUs) return anyUs;

  return pool[0] ?? null;
}

function beginDuck(maxMs = 7500): void {
  if (safetyUnduckTimer) {
    clearTimeout(safetyUnduckTimer);
  }
  duckHandler?.(maxMs);
  safetyUnduckTimer = setTimeout(() => {
    safetyUnduckTimer = null;
    unduckHandler?.();
  }, maxMs);
}

function endDuck(): void {
  if (safetyUnduckTimer) {
    clearTimeout(safetyUnduckTimer);
    safetyUnduckTimer = null;
  }
  unduckHandler?.();
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    return ctx;
  } catch {
    return null;
  }
}

async function ensureRunning(): Promise<AudioContext | null> {
  const c = getCtx();
  if (!c) return null;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    return null;
  }
  return c.state === "running" ? c : null;
}

/** Daftarkan callback untuk mengecilkan & mengembalikan volume musik latar saat vokal berbicara. */
export function setAudioDuckHandler(
  fn: ((ms: number) => void) | null,
  onEnd?: (() => void) | null
): void {
  duckHandler = fn;
  unduckHandler = onEnd ?? null;
}

/** Hentikan seluruh vokal/rekaman yang sedang berbicara dan pulihkan volume musik latar. */
export function stopVoice(): void {
  playSeq += 1;
  activePriority = 0;

  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    } catch {
      // abaikan
    }
    activeAudioEl = null;
  }

  activeUtterance = null;
  if (hasSpeechSupport()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // abaikan
    }
  }

  endDuck();
}

/** Panggil dari handler interaksi pengguna (klik/keydown) untuk membuka izin audio & memuat daftar voice. */
export async function unlockAudio(): Promise<boolean> {
  refreshVoices();
  if (hasSpeechSupport()) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // abaikan
    }
  }
  const audioOk = (await ensureRunning()) !== null;
  return audioOk || hasSpeechSupport();
}

/** Cek sekali per cue apakah berkas rekaman manusia `/audio/voice/{cue}.mp3` tersedia di `public/`. */
async function hasOptionalRecordedVoice(cue: VoiceCueId): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const cached = voiceFileStatus.get(cue);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`/audio/voice/${cue}.mp3`, {
      method: "HEAD",
      cache: "no-cache",
      signal: controller.signal,
    });
    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    const exists = res.ok && contentType.startsWith("audio/");
    voiceFileStatus.set(cue, exists);
    return exists;
  } catch {
    voiceFileStatus.set(cue, false);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function tryPlayRecordedVoice(
  cue: VoiceCueId,
  seq: number,
  priority: number
): Promise<boolean> {
  const available = await hasOptionalRecordedVoice(cue);
  if (!available || seq !== playSeq) return false;

  return new Promise<boolean>((resolve) => {
    try {
      const audio = new Audio(`/audio/voice/${cue}.mp3`);
      audio.preload = "auto";
      audio.volume = 0.92;
      activeAudioEl = audio;
      activePriority = priority;

      const cleanup = () => {
        if (activeAudioEl === audio) {
          activeAudioEl = null;
          activePriority = 0;
          endDuck();
        }
      };

      audio.onplay = () => {
        if (seq === playSeq) beginDuck(8000);
      };
      audio.onended = cleanup;
      audio.onerror = () => {
        voiceFileStatus.set(cue, false);
        cleanup();
      };

      audio
        .play()
        .then(() => resolve(true))
        .catch(() => {
          cleanup();
          resolve(false);
        });
    } catch {
      resolve(false);
    }
  });
}

function speakWithWebSpeech(
  cue: VoiceCueId,
  seq: number,
  priority: number
): boolean {
  if (!hasSpeechSupport() || seq !== playSeq) return false;

  try {
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
    }

    const utterance = new SpeechSynthesisUtterance(VOICE_PHRASES[cue]);
    const voice = pickNaturalEnglishVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = 0.96;
    utterance.pitch = 1.03;
    utterance.volume = 0.9;

    activeUtterance = utterance;
    activePriority = priority;

    // Perkiraan batas waktu aman ducking berdasarkan panjang kalimat
    const estimatedMs = Math.min(8500, Math.max(3200, VOICE_PHRASES[cue].length * 95));

    utterance.onstart = () => {
      if (seq === playSeq) {
        beginDuck(estimatedMs);
      }
    };

    const handleFinish = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
        activePriority = 0;
        endDuck();
      }
    };

    utterance.onend = handleFinish;
    utterance.onerror = handleFinish;

    // Kecilkan musik sedikit lebih awal agar suku kata pertama langsung terdengar jernih
    beginDuck(estimatedMs);
    synth.speak(utterance);
    return true;
  } catch {
    activeUtterance = null;
    activePriority = 0;
    endDuck();
    return false;
  }
}

function scheduleFallbackTone(
  c: AudioContext,
  startAt: number,
  freq: number,
  duration: number,
  gain: number
): void {
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startAt);
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.exponentialRampToValueAtTime(gain, startAt + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(env).connect(c.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Fallback chime lembut hanya apabila browser sama sekali tidak mendukung SpeechSynthesis. */
async function playFallbackChime(cue: VoiceCueId): Promise<boolean> {
  const c = await ensureRunning();
  if (!c) return false;
  const now = c.currentTime + 0.01;
  beginDuck(1500);

  if (cue === "face_detected") {
    scheduleFallbackTone(c, now, 523.25, 0.18, 0.1);
    scheduleFallbackTone(c, now + 0.12, 659.25, 0.22, 0.11);
  } else if (cue === "face_not_detected") {
    scheduleFallbackTone(c, now, 329.63, 0.18, 0.09);
    scheduleFallbackTone(c, now + 0.12, 261.63, 0.22, 0.09);
  } else if (cue === "alert2") {
    for (let i = 0; i < 3; i++) {
      scheduleFallbackTone(c, now + i * 0.28, 784, 0.22, 0.16);
    }
  } else {
    scheduleFallbackTone(c, now, 587.33, 0.24, 0.13);
  }
  return true;
}

async function speakCue(cue: VoiceCueId): Promise<boolean> {
  const priority = CUE_PRIORITY[cue];
  const isSpeakingNow =
    activeAudioEl !== null ||
    activeUtterance !== null ||
    (hasSpeechSupport() && window.speechSynthesis.speaking);

  // Jangan potong peringatan prioritas tinggi (alert1 / alert2) dengan status rutin
  if (isSpeakingNow && priority < activePriority) {
    return false;
  }

  // Batalkan vokal sebelumnya sebelum memutar cue baru (terutama alert1/alert2 agar tidak menumpuk)
  stopVoice();
  const seq = ++playSeq;

  if (await tryPlayRecordedVoice(cue, seq, priority)) {
    return true;
  }

  if (speakWithWebSpeech(cue, seq, priority)) {
    return true;
  }

  return playFallbackChime(cue);
}

/** Suara vokal manusia hangat saat status kamera berubah (hanya dipanggil saat transisi). */
export async function playStatusSound(cue: CameraSoundCue): Promise<boolean> {
  return speakCue(cue);
}

/** Suara vokal peringatan bertingkat: level 1 (refocus) & level 2 (ajak istirahat pendek). */
export async function playAlert(level: 1 | 2 = 1): Promise<boolean> {
  return speakCue(level === 2 ? "alert2" : "alert1");
}
