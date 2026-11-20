// Mesin musik latar generatif berbasis WebAudio (tanpa berkas mp3 eksternal).
// Mendukung 4 soundtrack Eyva: Soft Piano, Ambient Rain, Lo-Fi Study Beats, White Noise.

import { setAudioDuckHandler } from "@/lib/audio";

export type SoundtrackName =
  | "Soft Piano"
  | "Ambient Rain"
  | "Lo-Fi Study Beats"
  | "White Noise";

export const SOUNDTRACKS: { name: SoundtrackName; subtitle: string }[] = [
  { name: "Soft Piano", subtitle: "Soft Instrumental" },
  { name: "Ambient Rain", subtitle: "Gentle Rainfall" },
  { name: "Lo-Fi Study Beats", subtitle: "Chill Study Groove" },
  { name: "White Noise", subtitle: "Steady Focus Masking" },
];

export interface MusicState {
  playing: boolean;
  track: SoundtrackName;
  volume: number;
  muted: boolean;
  energized: boolean;
}

const DEFAULT_TRACK: SoundtrackName = "Soft Piano";

export function normalizeSoundtrack(value?: string | null): SoundtrackName {
  if (!value) return DEFAULT_TRACK;
  const found = SOUNDTRACKS.find(
    (item) => item.name.toLowerCase() === value.trim().toLowerCase()
  );
  return found ? found.name : DEFAULT_TRACK;
}

export function getSoundtrackSubtitle(value?: string | null): string {
  const name = normalizeSoundtrack(value);
  return SOUNDTRACKS.find((item) => item.name === name)?.subtitle ?? "Soft Instrumental";
}

let state: MusicState = {
  playing: false,
  track: DEFAULT_TRACK,
  volume: 0.55,
  muted: false,
  energized: false,
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let active: { stop: () => void } | null = null;
let pendingStopGen: { stop: () => void } | null = null;
let pendingStopTimer: ReturnType<typeof setTimeout> | null = null;
let duckFactor = 1;
let duckTimer: ReturnType<typeof setTimeout> | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;
    master.connect(analyser);
    analyser.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

function targetGain(): number {
  if (!state.playing || state.muted) return 0;
  return state.volume * (state.energized ? 1.15 : 1) * duckFactor * 0.75;
}

function applyGain(timeConstant = 0.14) {
  if (ctx && master) {
    master.gain.setTargetAtTime(targetGain(), ctx.currentTime, timeConstant);
  }
}

function flushPendingStop() {
  if (pendingStopTimer) {
    clearTimeout(pendingStopTimer);
    pendingStopTimer = null;
  }
  if (pendingStopGen) {
    pendingStopGen.stop();
    pendingStopGen = null;
  }
}

function noiseBuffer(
  c: AudioContext,
  kind: "white" | "brown",
  seconds = 4
): AudioBuffer {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "white") {
      data[i] = w;
    } else {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

function loopSource(c: AudioContext, kind: "white" | "brown"): AudioBufferSourceNode {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, kind);
  src.loop = true;
  src.start();
  return src;
}

type Generator = { stop: () => void };

/** Soft Piano: arpeggio/nada pentatonik hangat dengan pantulan delay lembut. */
const PIANO_SCALE = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25,
];

function genSoftPiano(c: AudioContext, out: AudioNode): Generator {
  const delay = c.createDelay(1.5);
  delay.delayTime.value = 0.43;
  const fb = c.createGain();
  fb.gain.value = 0.34;
  const wet = c.createGain();
  wet.gain.value = 0.42;
  const damp = c.createBiquadFilter();
  damp.type = "lowpass";
  damp.frequency.value = 1600;

  delay.connect(damp).connect(fb).connect(delay);
  damp.connect(wet).connect(out);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let alive = true;

  const playNote = (freq: number, velocity: number) => {
    const t = c.currentTime;
    const o1 = c.createOscillator();
    o1.type = "triangle";
    o1.frequency.value = freq;

    const o2 = c.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;
    const g2 = c.createGain();
    g2.gain.value = 0.2;

    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(velocity, t + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.7);

    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = state.energized ? 3000 : 1950;

    o1.connect(env);
    o2.connect(g2).connect(env);
    env.connect(lp);
    lp.connect(out);
    lp.connect(delay);

    o1.start(t);
    o2.start(t);
    o1.stop(t + 2.85);
    o2.stop(t + 2.85);
  };

  const tick = () => {
    if (!alive) return;
    const bright = state.energized;
    const maxIdx = bright ? PIANO_SCALE.length : PIANO_SCALE.length - 2;
    const idx = Math.floor(Math.random() * maxIdx);
    const freq = PIANO_SCALE[idx] * (bright && Math.random() < 0.3 ? 2 : 1);
    playNote(freq, 0.16 + Math.random() * 0.07);
    if (Math.random() < 0.3) {
      playNote(PIANO_SCALE[(idx + 2) % PIANO_SCALE.length] / 2, 0.1);
    }
    timer = setTimeout(
      tick,
      (1300 + Math.random() * 1700) / (bright ? 1.55 : 1)
    );
  };

  tick();
  return {
    stop: () => {
      alive = false;
      if (timer) clearTimeout(timer);
      delay.disconnect();
      fb.disconnect();
      wet.disconnect();
    },
  };
}

/** Ambient Rain: rintik hujan lembut + gema rendah + tetes air acak. */
function genAmbientRain(c: AudioContext, out: AudioNode): Generator {
  const white = loopSource(c, "white");
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 700;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 6400;
  const wg = c.createGain();
  wg.gain.value = 0.16;
  white.connect(hp).connect(lp).connect(wg).connect(out);

  const rumble = loopSource(c, "brown");
  const rl = c.createBiquadFilter();
  rl.type = "lowpass";
  rl.frequency.value = 280;
  const rg = c.createGain();
  rg.gain.value = 0.32;
  rumble.connect(rl).connect(rg).connect(out);

  const drops = noiseBuffer(c, "white", 1);
  const timer = setInterval(() => {
    const s = c.createBufferSource();
    s.buffer = drops;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2100 + Math.random() * 3100;
    bp.Q.value = 6;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 + Math.random() * 0.045, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
    s.connect(bp).connect(g).connect(out);
    s.start(t, Math.random() * 0.8, 0.08);
  }, 120);

  return {
    stop: () => {
      clearInterval(timer);
      try {
        white.stop();
        rumble.stop();
      } catch {
        // sudah berhenti
      }
      wg.disconnect();
      rg.disconnect();
    },
  };
}

/** Lo-Fi Study Beats: progresi akor hangat (Cmaj7-Am7-Fmaj7-G6) + beat santai ~74 BPM. */
const LOFI_CHORDS: number[][] = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
];

function genLofiBeats(c: AudioContext, out: AudioNode): Generator {
  const bus = c.createGain();
  bus.gain.value = 0.9;
  const masterLp = c.createBiquadFilter();
  masterLp.type = "lowpass";
  masterLp.frequency.value = 2400;
  bus.connect(masterLp).connect(out);

  // Lapisan hangat vinyl lembut di latar
  const vinyl = loopSource(c, "brown");
  const vinylLp = c.createBiquadFilter();
  vinylLp.type = "lowpass";
  vinylLp.frequency.value = 340;
  const vinylGain = c.createGain();
  vinylGain.gain.value = 0.05;
  vinyl.connect(vinylLp).connect(vinylGain).connect(bus);

  const hatNoise = noiseBuffer(c, "white", 1);
  let step = 0; // 8 langkah per bar (not 1/8)
  let bar = 0;
  let alive = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const triggerChord = (freqs: number[], durationSec: number) => {
    const t = c.currentTime;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = state.energized ? 1650 : 1150;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.11, t + 0.04);
    env.gain.exponentialRampToValueAtTime(0.045, t + durationSec * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
    lp.connect(env).connect(bus);

    for (const f of freqs) {
      const osc = c.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 6;
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + durationSec + 0.04);
    }
  };

  const triggerKick = () => {
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(125, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 0.13);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.28, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    osc.connect(env).connect(bus);
    osc.start(t);
    osc.stop(t + 0.26);
  };

  const triggerSnare = () => {
    const t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = hatNoise;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1450;
    bp.Q.value = 1.4;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.085, t + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    s.connect(bp).connect(env).connect(bus);
    s.start(t, Math.random() * 0.6, 0.13);
  };

  const triggerHat = (accent: boolean) => {
    const t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = hatNoise;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5200;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(accent ? 0.032 : 0.018, t + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    s.connect(hp).connect(env).connect(bus);
    s.start(t, Math.random() * 0.7, 0.06);
  };

  const tick = () => {
    if (!alive) return;
    const eighthMs = state.energized ? 360 : 405; // ~74 BPM (sedikit lebih segar saat energized)
    if (step === 0) {
      triggerChord(LOFI_CHORDS[bar % LOFI_CHORDS.length], (eighthMs * 7.6) / 1000);
      triggerKick();
    } else if (step === 3 || step === 5) {
      if (step === 3 || Math.random() < 0.65) triggerKick();
    }
    if (step === 2 || step === 6) {
      triggerSnare();
    }
    triggerHat(step % 2 === 0);

    step = (step + 1) % 8;
    if (step === 0) bar += 1;

    // Sedikit swing alami pada not genap vs ganjil
    const swingOffset = step % 2 === 1 ? 18 : -18;
    timer = setTimeout(tick, eighthMs + swingOffset);
  };

  tick();
  return {
    stop: () => {
      alive = false;
      if (timer) clearTimeout(timer);
      try {
        vinyl.stop();
      } catch {
        // sudah berhenti
      }
      bus.disconnect();
      masterLp.disconnect();
    },
  };
}

/** White Noise: suara fokus halus (white noise terfilter + lapisan brown lembut agar nyaman). */
function genWhiteNoise(c: AudioContext, out: AudioNode): Generator {
  const white = loopSource(c, "white");
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 180;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3800;
  const wg = c.createGain();
  wg.gain.value = 0.14;
  white.connect(hp).connect(lp).connect(wg).connect(out);

  const warm = loopSource(c, "brown");
  const wlp = c.createBiquadFilter();
  wlp.type = "lowpass";
  wlp.frequency.value = 520;
  const bg = c.createGain();
  bg.gain.value = 0.35;
  warm.connect(wlp).connect(bg).connect(out);

  return {
    stop: () => {
      try {
        white.stop();
        warm.stop();
      } catch {
        // sudah berhenti
      }
      wg.disconnect();
      bg.disconnect();
    },
  };
}

const GENERATORS: Record<SoundtrackName, (c: AudioContext, out: AudioNode) => Generator> = {
  "Soft Piano": genSoftPiano,
  "Ambient Rain": genAmbientRain,
  "Lo-Fi Study Beats": genLofiBeats,
  "White Noise": genWhiteNoise,
};

function launch(track: SoundtrackName) {
  const c = ensureCtx();
  if (!c || !master) return;
  flushPendingStop();
  active?.stop();
  active = GENERATORS[track](c, master);
}

/** Buka izin AudioContext musik dari handler klik pengguna. */
export async function unlockMusic(): Promise<boolean> {
  const c = ensureCtx();
  if (!c) return false;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    return false;
  }
  return c.state === "running";
}

export async function startMusic(track?: SoundtrackName): Promise<boolean> {
  const c = ensureCtx();
  if (!c) return false;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    return false;
  }
  if (c.state !== "running") return false;

  const targetTrack = track ? normalizeSoundtrack(track) : state.track;
  const trackChanged = targetTrack !== state.track;
  state = { ...state, track: targetTrack, playing: true };

  if (!active || trackChanged) {
    launch(targetTrack);
  }
  applyGain(0.32);
  return true;
}

export function stopMusic(immediate = false): void {
  if (!state.playing && !active) return;
  state = { ...state, playing: false, energized: false };
  applyGain(immediate ? 0.04 : 0.18);

  const current = active;
  active = null;
  if (!current) return;

  if (immediate) {
    flushPendingStop();
    current.stop();
  } else {
    flushPendingStop();
    pendingStopGen = current;
    pendingStopTimer = setTimeout(() => {
      pendingStopGen?.stop();
      pendingStopGen = null;
      pendingStopTimer = null;
    }, 450);
  }
}

export function setTrack(track: SoundtrackName): void {
  const normalized = normalizeSoundtrack(track);
  if (state.track === normalized && active) return;
  state = { ...state, track: normalized };
  if (state.playing) {
    launch(normalized);
    applyGain(0.2);
  }
}

export function setMusicMuted(muted: boolean): void {
  if (state.muted === muted) return;
  state = { ...state, muted };
  applyGain(0.08);
}

export function setVolume(v: number): void {
  state = { ...state, volume: Math.min(Math.max(v, 0), 1) };
  applyGain(0.12);
}

export function setEnergized(on: boolean): void {
  if (state.energized === on) return;
  state = { ...state, energized: on };
  applyGain(0.6);
}

/** Kecilkan volume musik sementara saat SFX status atau alert berbunyi. */
export function duckMusic(ms = 2400): void {
  duckFactor = 0.22;
  applyGain(0.04);
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    duckFactor = 1;
    duckTimer = null;
    applyGain(0.5);
  }, ms);
}

export function getMusicState(): MusicState {
  return state;
}

/** Tinggi batang visual 0..1 untuk `n` batang dari WebAudio AnalyserNode. */
export function getBars(n: number): number[] {
  if (!analyser || !state.playing || state.muted) return Array(n).fill(0);
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const out: number[] = [];
  const usable = Math.max(1, Math.floor(data.length * 0.72));
  for (let i = 0; i < n; i++) {
    const from = Math.floor((i / n) * usable);
    const to = Math.max(from + 1, Math.floor(((i + 1) / n) * usable));
    let sum = 0;
    for (let j = from; j < to; j++) sum += data[j];
    out.push(Math.min(sum / (to - from) / 185, 1));
  }
  return out;
}

// Otomatis hubungkan ducking saat modul musik dimuat
setAudioDuckHandler(duckMusic);
