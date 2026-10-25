// Tiny Web Audio sounds, no files to load. iOS only allows audio after a tap,
// so unlockAudio() is called from the Spin / Start buttons.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

function tone(freq: number, start: number, length: number, volume: number, type: OscillatorType = 'sine') {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + length + 0.02);
}

export function playTick(): void {
  tone(1400, 0, 0.03, 0.04, 'triangle');
}

export function playLand(): void {
  tone(660, 0, 0.18, 0.12);
  tone(990, 0.08, 0.25, 0.1);
}

export function playChime(): void {
  tone(523.25, 0, 0.6, 0.18);
  tone(659.25, 0.18, 0.6, 0.16);
  tone(783.99, 0.36, 0.9, 0.16);
  if ('vibrate' in navigator) navigator.vibrate?.([120, 80, 120]);
}
