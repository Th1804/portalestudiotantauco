import {Easing, interpolate, spring} from 'remotion';
import {clamp, pendulum, smooth, expoIn, inOutBack} from './motion';
// Estado continuo de la medalla (objeto que atraviesa escenas).
// Entra DESDE la cámara (dolly inverso con desenfoque de profundidad) y sale atravesándola (match por escala)
// bajo el barrido de luz. EXIT es la tabla compartida por la transición, Benefits y Statement.
export const IMG_W = 437, IMG_H = 1001;
export const EXIT = {a: 290, b: 304, sweepA: 288, sweepB: 318, statement: 302};
export type MedalState = {cx: number; cy: number; s: number; rot: number; ry: number; vis: number; light: number; blur: number; op: number};
const DISC_Y = 0.79; // centro del disco (normalizado en la imagen)
export const medalState = (f: number, fps = 30): MedalState => {
  // llegada: escala 5,2 -> 1,42 con muelle (overshoot ~3 %), rotateY que se asienta (follow-through)
  const arr = spring({frame: f - 45, fps, config: {stiffness: 95, damping: 15, mass: 0.9}});
  let s = interpolate(arr, [0, 1], [5.2, 1.42]);
  let cy = interpolate(arr, [0, 1], [1460, 960]);
  let cx = interpolate(arr, [0, 1], [470, 540]);
  // push-in lento en el revelado, con una deriva lateral que deja ver el parallax
  s *= interpolate(f, [75, 195], [1, 1.2], {...clamp, easing: smooth});
  cy += interpolate(f, [75, 195], [0, -50], {...clamp, easing: smooth});
  cx += interpolate(f, [70, 132, 195], [0, -16, 10], {...clamp, easing: smooth});
  // pose de beneficios con anticipación y overshoot sutil
  const b = interpolate(f, [192, 216], [0, 1], {...clamp, easing: inOutBack(1.2)});
  s = s * (1 - b) + 1.28 * b;
  cy = cy * (1 - b) + 1040 * b;
  cx = cx * (1 - b) + 600 * b;
  // salida: push-in a través de la cámara (escala 1,28 -> 4,2) con anticipación (se recoge 3 % antes de lanzarse)
  const pre = interpolate(f, [EXIT.a - 8, EXIT.a, EXIT.a + 2], [0, 1, 0], {...clamp, easing: Easing.inOut(Easing.quad)});
  s *= 1 - 0.03 * pre;
  const z = interpolate(f, [EXIT.a, EXIT.b], [0, 1], {...clamp, easing: expoIn});
  s = s * (1 - z) + 4.2 * z;
  cy = cy * (1 - z) + 780 * z;
  cx = cx * (1 - z) + 560 * z;
  // balanceo: péndulo amortiguado tras la llegada + respiración continua (micro-movimiento)
  const swingAmp = interpolate(f, [192, 216], [1, 0.3], clamp);
  const rot = (pendulum(f, 54, 4.5, 44, 38) + 0.9 * Math.sin(f / 23)) * swingAmp * (1 - z);
  // giro lento en Y durante el revelado: la luz cambia sobre el acrílico
  const turn = interpolate(f, [66, 130, 192], [0, 1, 0], {...clamp, easing: smooth});
  const ry = (interpolate(arr, [0, 1], [32, 0]) + 7 * Math.sin((f - 60) / 38) * (1 - b * 0.6) - 9 * turn) * (1 - z);
  const blur = Math.max(0, (s / 1.42 - 1.08)) * 9 * (f < 120 ? 1 : 0) + z * 30;
  const op = interpolate(f, [44, 49], [0, 1], clamp) * interpolate(f, [EXIT.a + 6, EXIT.b], [1, 0], clamp);
  const vis = f < 44 || f > EXIT.b ? 0 : 1;
  const light = interpolate(f, [48, 66, 96], [0.55, 0.78, 1], {...clamp, easing: Easing.out(Easing.quad)});
  return {cx, cy, s, rot, ry, vis, light, blur, op};
};
export const medalPoint = (st: MedalState, nx: number, ny: number) => {
  const top = st.cy - DISC_Y * IMG_H * st.s;
  const px = st.cx, py = top;
  const dx = (nx - 0.5) * IMG_W * st.s, dy = ny * IMG_H * st.s;
  const a = (st.rot * Math.PI) / 180;
  return {x: px + dx * Math.cos(a) - dy * Math.sin(a), y: py + dx * Math.sin(a) + dy * Math.cos(a)};
};
export const medalBox = (st: MedalState) => {
  const w = IMG_W * st.s, h = IMG_H * st.s;
  return {left: st.cx - w / 2, top: st.cy - DISC_Y * h, w, h};
};
