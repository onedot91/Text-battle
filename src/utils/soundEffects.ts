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

const MASTER_VOLUME = 0.18;
const MIN_PLAY_GAP_MS: Record<SoundName, number> = {
  button: 55,
  type: 42,
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

function playNoise(context: AudioContext, startTime: number, duration: number, volume: number) {
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
  filter.frequency.value = 950;
  filter.Q.value = 2.4;
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
    playTone(context, now, 520, 0.055, 0.22, 'triangle', 760);
  });
}

export function playButtonSound() {
  playSound('button', (context, now) => {
    playTone(context, now, 420, 0.04, 0.11, 'triangle', 520);
    playTone(context, now + 0.025, 620, 0.045, 0.075, 'sine', 560);
  });
}

export function playTypeSound() {
  playSound('type', (context, now) => {
    const frequency = 560 + Math.random() * 180;
    playTone(context, now, frequency, 0.026, 0.055, 'triangle', frequency * 0.92);
  });
}

export function playConfirmSound() {
  playSound('confirm', (context, now) => {
    playTone(context, now, 620, 0.055, 0.2, 'triangle', 880);
    playTone(context, now + 0.045, 880, 0.07, 0.18, 'sine', 1180);
  });
}

export function playChargeSound() {
  playSound('charge', (context, now) => {
    playTone(context, now, 240, 0.16, 0.2, 'sawtooth', 540);
    playTone(context, now + 0.08, 360, 0.18, 0.12, 'triangle', 900);
  });
}

export function playStartSound() {
  playSound('start', (context, now) => {
    playTone(context, now, 220, 0.08, 0.2, 'square', 220);
    playTone(context, now + 0.055, 440, 0.11, 0.18, 'triangle', 660);
    playTone(context, now + 0.145, 880, 0.13, 0.16, 'sine', 1320);
  });
}

export function playRouletteTickSound() {
  playSound('rouletteTick', (context, now) => {
    playNoise(context, now, 0.028, 0.08);
    playTone(context, now, 760, 0.032, 0.065, 'triangle', 620);
  });
}

export function playRouletteLockSound() {
  playSound('rouletteLock', (context, now) => {
    playTone(context, now, 360, 0.075, 0.18, 'triangle', 360);
    playTone(context, now + 0.065, 720, 0.11, 0.15, 'sine', 540);
  });
}

export function playStoryTransitionSound() {
  playSound('storyTransition', (context, now) => {
    playTone(context, now, 330, 0.18, 0.12, 'sine', 660);
    playTone(context, now + 0.12, 495, 0.2, 0.1, 'triangle', 990);
  });
}

export function playWinnerSound() {
  playSound('winner', (context, now) => {
    playTone(context, now, 523.25, 0.12, 0.18, 'triangle');
    playTone(context, now + 0.1, 659.25, 0.12, 0.16, 'triangle');
    playTone(context, now + 0.2, 783.99, 0.2, 0.16, 'sine');
  });
}

export function playErrorSound() {
  playSound('error', (context, now) => {
    playTone(context, now, 220, 0.12, 0.16, 'sawtooth', 170);
    playTone(context, now + 0.09, 165, 0.16, 0.13, 'triangle', 120);
  });
}
