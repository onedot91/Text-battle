type SoundName =
  | 'button'
  | 'type'
  | 'select'
  | 'confirm'
  | 'charge'
  | 'start'
  | 'rouletteTick'
  | 'rouletteLock'
  | 'storyTransition'
  | 'winner'
  | 'error';

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const MASTER_VOLUME = 0.42;
const MIN_PLAY_GAP_MS: Record<SoundName, number> = {
  button: 55,
  type: 260,
  select: 45,
  confirm: 120,
  charge: 180,
  start: 220,
  rouletteTick: 70,
  rouletteLock: 180,
  storyTransition: 280,
  winner: 600,
  error: 280,
};

const majorPentatonic = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
const lastPlayedAt = new Map<SoundName, number>();

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getAudioContext() {
  if (audioContext) return audioContext;

  const AudioContextConstructor = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  audioContext = new AudioContextConstructor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = MASTER_VOLUME;
  masterGain.connect(audioContext.destination);
  return audioContext;
}

function canPlay(name: SoundName) {
  if ((name === 'rouletteTick' || name === 'type') && prefersReducedMotion()) return false;

  const now = performance.now();
  const last = lastPlayedAt.get(name) ?? 0;
  if (now - last < MIN_PLAY_GAP_MS[name]) return false;

  lastPlayedAt.set(name, now);
  return true;
}

function playTone(
  context: AudioContext,
  startTime: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  endFrequency = frequency,
) {
  if (!masterGain) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), startTime + duration);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, startTime);
  filter.Q.value = 0.8;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playChord(
  context: AudioContext,
  startTime: number,
  frequencies: number[],
  duration: number,
  volume: number,
  type: OscillatorType = 'triangle',
  spread = 0.018,
) {
  frequencies.forEach((frequency, index) => {
    playTone(context, startTime + index * spread, frequency, duration, volume / frequencies.length, type);
  });
}

function playNoise(
  context: AudioContext,
  startTime: number,
  duration: number,
  volume: number,
  frequency = 950,
  q = 2.4,
) {
  if (!masterGain) return;

  const buffer = context.createBuffer(1, Math.max(1, context.sampleRate * duration), context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = q;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(startTime);
}

function playSound(name: SoundName, makeSound: (context: AudioContext, now: number) => void) {
  if (!canPlay(name)) return;

  const context = getAudioContext();
  if (!context || context.state === 'closed') return;

  void context
    .resume()
    .then(() => {
      makeSound(context, context.currentTime + 0.004);
    })
    .catch(() => undefined);
}

export function playSelectSound() {
  playSound('select', (context, now) => {
    playTone(context, now, 480, 0.055, 0.16, 'triangle', 760);
    playTone(context, now + 0.035, 960, 0.04, 0.075, 'sine', 1180);
  });
}

export function playButtonSound() {
  playSound('button', (context, now) => {
    playNoise(context, now, 0.018, 0.035, 1800, 1.9);
    playTone(context, now, 360, 0.045, 0.105, 'triangle', 520);
    playTone(context, now + 0.028, 720, 0.05, 0.075, 'sine', 640);
  });
}

export function playTypeSound() {
  playSound('type', (context, now) => {
    const frequency = majorPentatonic[Math.floor(Math.random() * majorPentatonic.length)];
    playTone(context, now, frequency * 0.5, 0.018, 0.018, 'sine', frequency * 0.46);
  });
}

export function playConfirmSound() {
  playSound('confirm', (context, now) => {
    playTone(context, now, 392, 0.06, 0.18, 'triangle', 587.33);
    playChord(context, now + 0.052, [587.33, 783.99, 1174.66], 0.12, 0.28, 'sine', 0.012);
  });
}

export function playChargeSound() {
  playSound('charge', (context, now) => {
    playNoise(context, now, 0.18, 0.055, 520, 4.5);
    playTone(context, now, 180, 0.18, 0.16, 'sawtooth', 420);
    playTone(context, now + 0.07, 360, 0.2, 0.13, 'triangle', 900);
    playTone(context, now + 0.17, 720, 0.11, 0.09, 'sine', 1440);
  });
}

export function playStartSound() {
  playSound('start', (context, now) => {
    playNoise(context, now, 0.05, 0.06, 1200, 2);
    playTone(context, now, 196, 0.08, 0.17, 'square', 196);
    playTone(context, now + 0.055, 392, 0.11, 0.15, 'triangle', 659.25);
    playChord(context, now + 0.145, [659.25, 880, 1318.51], 0.2, 0.28, 'sine', 0.018);
  });
}

export function playRouletteTickSound() {
  playSound('rouletteTick', (context, now) => {
    const frequency = majorPentatonic[Math.floor(Math.random() * majorPentatonic.length)] * 1.5;
    playNoise(context, now, 0.018, 0.055, 2100, 3.2);
    playTone(context, now, frequency, 0.03, 0.055, 'triangle', frequency * 0.7);
  });
}

export function playRouletteLockSound() {
  playSound('rouletteLock', (context, now) => {
    playNoise(context, now, 0.055, 0.08, 850, 5.4);
    playTone(context, now, 220, 0.085, 0.17, 'sine', 220);
    playTone(context, now + 0.07, 440, 0.1, 0.14, 'triangle', 330);
    playChord(context, now + 0.13, [523.25, 659.25, 783.99], 0.16, 0.21, 'sine', 0.01);
  });
}

export function playStoryTransitionSound() {
  playSound('storyTransition', (context, now) => {
    playNoise(context, now, 0.24, 0.052, 700, 2.8);
    playTone(context, now, 261.63, 0.18, 0.12, 'sine', 523.25);
    playTone(context, now + 0.105, 392, 0.2, 0.11, 'triangle', 783.99);
    playTone(context, now + 0.22, 1046.5, 0.18, 0.08, 'sine', 1567.98);
  });
}

export function playWinnerSound() {
  playSound('winner', (context, now) => {
    playNoise(context, now, 0.09, 0.075, 1700, 2.2);
    playTone(context, now, 261.63, 0.09, 0.16, 'triangle', 392);
    playTone(context, now + 0.08, 523.25, 0.1, 0.13, 'triangle', 659.25);
    playTone(context, now + 0.17, 783.99, 0.12, 0.12, 'triangle', 1046.5);
    playChord(context, now + 0.31, [523.25, 659.25, 783.99, 1046.5], 0.42, 0.34, 'sine', 0.018);
  });
}

export function playErrorSound() {
  playSound('error', (context, now) => {
    playTone(context, now, 220, 0.12, 0.18, 'sawtooth', 170);
    playTone(context, now + 0.09, 165, 0.16, 0.15, 'triangle', 120);
  });
}
