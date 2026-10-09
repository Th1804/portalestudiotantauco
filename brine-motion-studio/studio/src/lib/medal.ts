import {Easing, interpolate, spring} from 'remotion';
import {clamp, pendulum, smooth, expoIn, inOutBack} from './motion';
// Estado continuo de la medalla (objeto que atraviesa escenas).
// v2: entra DESDE la cámara (dolly inverso con desenfoque de profundidad) en vez de caer en Y;
// la salida es un push-in a través de la cámara (match por escala) bajo un barrido de luz.
export const IMG_W = 437, IMG_H = 1001;
export type MedalState = {cx: number; cy: number; s: number; rot: number; ry: number; vis: number; light: number; blur: number; op: number};
const DISC_Y = 0.79; // centro del disco (normalizado en la imagen)
export const medalState = (f: number, fps = 30): MedalState => {
  // llegada: escala 5,2 -> 1,42 con muelle (overshoot ~3 %), rotateY que se asienta (follow-through)
  const arr = spring({frame: f - 45, fps, config: {stiffness: 95, damping: 15, mass: 0.9}});
  let s = interpolate(arr, [0, 1], [5.2, 1.42]);
  let cy = interpolate(arr, [0, 1], [1460, 960]);
  let cx = interpolate(arr, [0, 1], [470, 540]);
  // push-in lento en el revelado
  s *= interpolate(f, [75, 195], [1, 1.07], {...clamp, easing: smooth});
  // pose de beneficios con anticipación y overshoot sutil
  const b = interpolate(f, [192, 216], [0, 1], {...clamp, easing: inOutBack(1.2)});
  s = s * (1 - b) + 1.28 * b;
  cy = cy * (1 - b) + 1040 * b;
  cx = cx * (1 - b) + 600 * b;
  // salida: push-in a través de la cámara (escala 1,28 -> 3,6), con desenfoque creciente
  const z = interpolate(f, [296, 318], [0, 1], {...clamp, easing: expoIn});
  s = s * (1 - z) + 3.6 * z;
  cy = cy * (1 - z) + 820 * z;
  cx = cx * (1 - z) + 560 * z;
  // balanceo: péndulo amortiguado tras la llegada + respiración continua (micro-movimiento)
  const swingAmp = interpolate(f, [192, 216], [1, 0.3], clamp);
  const rot = (pendulum(f, 54, 4.5, 44, 38) + 0.9 * Math.sin(f / 23)) * swingAmp * (1 - z);
  const ry = (interpolate(arr, [0, 1], [32, 0]) + 7 * Math.sin((f - 60) / 38) * (1 - b * 0.6)) * (1 - z);
  const blur = Math.max(0, (s / 1.42 - 1.08)) * 9 * (f < 120 ? 1 : 0) + z * 26;
  const op = interpolate(f, [44, 49], [0, 1], clamp) * interpolate(f, [304, 316], [1, 0], clamp);
  const vis = f < 44 || f > 318 ? 0 : 1;
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
// zona de la cinta en la imagen normalizada (medida sobre product.png: x 160-272 px, y 0-0,505)
export const RIBBON = {x0: 160 / IMG_W, x1: 273 / IMG_W, y1: 0.505, snapY: 0.44};
