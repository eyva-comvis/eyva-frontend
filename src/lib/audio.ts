// WebAudio SFX synthesizer untuk status kamera dan peringatan kantuk (tanpa berkas mp3 eksternal).
// Browser memblokir AudioContext sampai ada interaksi pengguna; panggil unlockAudio() dari handler klik.

export type CameraSoundCue =
  | "face_detected"
  | "face_not_detected"
  | "possible_drowsiness"
  | "drowsy";

let ctx: AudioContext | null = null;
let duckHandler: ((ms: number) => void) | null = null;

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

/** Daftarkan callback untuk mengecilkan musik latar sementara saat SFX/alert berbunyi. */
export function setAudioDuckHandler(fn: ((ms: number) => void) | null): void {
  duckHandler = fn;
}

/** Panggil dari handler interaksi pengguna (klik/keydown) untuk membuka izin WebAudio. */
export async function unlockAudio(): Promise<boolean> {
  return (await ensureRunning()) !== null;
}

function scheduleTone(
  c: AudioContext,
  opts: {
    startAt: number;
    freq: number;
    duration: number;
    gain: number;
    type?: OscillatorType;
    attack?: number;
  }
): void {
  const { startAt, freq, duration, gain, type = "sine", attack = 0.02 } = opts;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.exponentialRampToValueAtTime(gain, startAt + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(env).connect(c.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Bunyi pendek lembut saat status kamera berubah (transisi). */
export async function playStatusSound(cue: CameraSoundCue): Promise<boolean> {
  const c = await ensureRunning();
  if (!c) return false;

  const now = c.currentTime + 0.01;

  if (cue === "face_detected") {
    // Nada naik lembut (C5 -> E5) saat wajah terdeteksi / kembali fokus
    duckHandler?.(950);
    scheduleTone(c, { startAt: now, freq: 523.25, duration: 0.18, gain: 0.11, type: "sine" });
    scheduleTone(c, { startAt: now + 0.11, freq: 659.25, duration: 0.24, gain: 0.12, type: "sine" });
    return true;
  }

  if (cue === "face_not_detected") {
    // Nada turun netral lembut (E4 -> C4) saat wajah tidak terdeteksi
    duckHandler?.(950);
    scheduleTone(c, { startAt: now, freq: 329.63, duration: 0.18, gain: 0.1, type: "sine" });
    scheduleTone(c, { startAt: now + 0.12, freq: 261.63, duration: 0.24, gain: 0.095, type: "sine" });
    return true;
  }

  if (cue === "possible_drowsiness") {
    // 1 beep pengingat ringan
    duckHandler?.(1100);
    scheduleTone(c, { startAt: now, freq: 587.33, duration: 0.28, gain: 0.14, type: "triangle", attack: 0.025 });
    return true;
  }

  // drowsy (DROWSY_NEED_REST): 2 beep peringatan sedang
  return playAlert(1);
}

/** Bunyi peringatan bertingkat: level 1 (2 beep sedang), level 2 (3 beep jelas). */
export async function playAlert(level: 1 | 2 = 1): Promise<boolean> {
  const c = await ensureRunning();
  if (!c) return false;

  const now = c.currentTime + 0.01;
  const beeps = level === 1 ? 2 : 3;
  const spacing = level === 1 ? 0.32 : 0.29;
  const freq = level === 1 ? 660 : 880;
  const gain = level === 1 ? 0.2 : 0.24;

  duckHandler?.(level === 1 ? 2200 : 3000);

  for (let i = 0; i < beeps; i++) {
    scheduleTone(c, {
      startAt: now + i * spacing,
      freq,
      duration: 0.25,
      gain,
      type: "sine",
      attack: 0.025,
    });
  }
  return true;
}
