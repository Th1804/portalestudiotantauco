import {Easing, interpolate} from 'remotion';
import {clamp, expoInOut, expoOut, smooth} from '../lib/motion';

// Cámara virtual sobre la foto real (1254x1254, coordenadas de origen). pantalla = C + (src - P) * s.
// La misma función la usan el render (Photo) y el QA de colisiones (disco como obstáculo), así no se desalinean.
export const SRC = 1254;
export const DISC = {x: 642, y: 650, r: 340};
export const SATIN = {x0: 78, y0: 60, x1: 714, y1: 975};
export const ARRIVE = {a: 60, b: 88};
export const IRIS = {a: 336, b: 358};
export const LOGO_HIT = 360;

type Key = {f: number; px: number; py: number; s: number; cy: number};
const KEYS: Key[] = [
  {f: 88, px: 642, py: 650, s: 0.88, cy: 1190},
  {f: 186, px: 642, py: 632, s: 0.98, cy: 1176},
  {f: 212, px: 642, py: 662, s: 1.2, cy: 1176},
  {f: 266, px: 642, py: 668, s: 1.26, cy: 1180},
  {f: 292, px: 420, py: 470, s: 1.08, cy: 1190},
  {f: 346, px: 470, py: 452, s: 1.15, cy: 1190},
  {f: 380, px: 520, py: 500, s: 1.24, cy: 1190},
];
const seg = (f: number, k: keyof Key) => {
  const fs = KEYS.map((q) => q.f), vs = KEYS.map((q) => q[k]);
  // tramos de movimiento rápido (push al láser y paneo al estuche) con expo in-out; derivas lentas con bézier suave
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (f <= fs[i + 1] || i === KEYS.length - 2) {
      const fast = (fs[i] === 186 || fs[i] === 266);
      return interpolate(f, [fs[i], fs[i + 1]], [vs[i], vs[i + 1]], {...clamp, easing: fast ? expoInOut : smooth});
    }
  }
  return vs[vs.length - 1];
};
export type Cam = {px: number; py: number; s: number; cx: number; cy: number; op: number; blur: number};
export const photoCam = (f: number): Cam => {
  const arr = interpolate(f, [ARRIVE.a, ARRIVE.b], [0, 1], {...clamp, easing: expoOut});
  const px = seg(f, 'px'), py = seg(f, 'py');
  let s = seg(f, 's'), cy = seg(f, 'cy');
  s *= interpolate(arr, [0, 1], [1.12, 1]);
  cy += interpolate(arr, [0, 1], [1250, 0]);
  const cx = 540 + 6 * Math.sin(f / 47) ;
  cy += 5 * Math.sin(f / 61 + 1);
  const op = interpolate(f, [ARRIVE.a, ARRIVE.a + 6], [0, 1], clamp);
  const speed = Math.abs(interpolate(f, [ARRIVE.a, ARRIVE.b], [0, 1], {...clamp, easing: expoOut}) - interpolate(f - 1, [ARRIVE.a, ARRIVE.b], [0, 1], {...clamp, easing: expoOut}));
  return {px, py, s, cx, cy, op, blur: Math.min(18, speed * 120)};
};
export const toScreen = (c: Cam, x: number, y: number) => ({x: c.cx + (x - c.px) * c.s, y: c.cy + (y - c.py) * c.s});
export const discScreen = (f: number) => {
  const c = photoCam(f);
  const p = toScreen(c, DISC.x, DISC.y);
  return {...p, r: DISC.r * c.s, cam: c};
};
// polígono de 12 facetas (canto del disco) como clip-path CSS, centrado en (cx, cy)
export const dodecagon = (cx: number, cy: number, r: number, rot = 0) =>
  `polygon(${Array.from({length: 12}, (_, k) => {
    const a = rot + (k * Math.PI) / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)}px ${(cy + r * Math.sin(a)).toFixed(1)}px`;
  }).join(', ')})`;
export const irisRadius = (f: number) => interpolate(f, [IRIS.a, IRIS.b], [0, 1950], {...clamp, easing: Easing.bezier(0.6, 0, 0.3, 1)});
