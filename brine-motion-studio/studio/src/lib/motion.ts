import {Easing, interpolate, spring} from 'remotion';
export const FPS = 30;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const lerp = (f: number, a: number, b: number, from: number, to: number, ease = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: ease});
// Bézier suave (REF2) y salida dura (REF1)
export const smooth = Easing.bezier(0.45, 0, 0.2, 1);
export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const inExpo = Easing.bezier(0.7, 0, 0.84, 0);
// Muelle elástico con overshoot (gancho)
export const pop = (frame: number, start: number, fps = FPS, stiffness = 180, damping = 11, mass = 0.7) =>
  spring({frame: frame - start, fps, config: {stiffness, damping, mass}});
export const soft = (frame: number, start: number, fps = FPS) =>
  spring({frame: frame - start, fps, config: {stiffness: 60, damping: 18, mass: 1}});
// Pulso de beat: 1 en el beat y decae
export const beatPulse = (frame: number, bpm: number, fps = FPS, decay = 6) => {
  const spb = (60 / bpm) * fps;
  const ph = frame % spb;
  return Math.exp(-ph / decay);
};
// Péndulo amortiguado
export const pendulum = (frame: number, start: number, amp: number, periodF: number, tau: number) => {
  const t = Math.max(0, frame - start);
  return amp * Math.exp(-t / tau) * Math.sin((2 * Math.PI * t) / periodF);
};
// pseudo-aleatorio determinista
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// ---- v2: curvas con carácter (anticipación, overshoot sutil, follow-through)
// expo con overshoot sutil (back muy leve) y anticipación (retroceso antes de salir)
export const outBack = (s = 1.15) => Easing.out(Easing.back(s));
export const inOutBack = (s = 1.1) => Easing.inOut(Easing.back(s));
export const anticipate = Easing.bezier(0.36, -0.28, 0.32, 1); // retrocede ~6 % y luego sale
export const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
export const expoIn = Easing.bezier(0.7, 0, 0.84, 0);
export const expoInOut = Easing.bezier(0.87, 0, 0.13, 1);
// muelle "premium": overshoot ~4 %, asienta rápido (follow-through)
export const settle = (frame: number, start: number, stiffness = 140, damping = 16, mass = 0.8) =>
  spring({frame: frame - start, fps: FPS, config: {stiffness, damping, mass}});
// velocidad de una curva (para motion blur proporcional)
export const vel = (fn: (f: number) => number, f: number) => Math.abs(fn(f) - fn(f - 1));
// micro-movimiento continuo (respiración/flotación), determinista
export const drift = (f: number, seed: number, amp = 3, period = 70) => amp * Math.sin((f + seed * 37) / (period / (2 * Math.PI)) + seed);
