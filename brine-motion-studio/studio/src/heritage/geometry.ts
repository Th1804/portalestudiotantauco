import {Easing, interpolate} from 'remotion';
import {clamp} from '../lib/motion';

// Tokens del motion-design skill (cubic-bezier), en frames a 30 fps.
export const EASE = {
  outQuart: Easing.bezier(0.165, 0.84, 0.44, 1),
  outQuint: Easing.bezier(0.23, 1, 0.32, 1),
  outExpo: Easing.bezier(0.19, 1, 0.22, 1),
  inOutCubic: Easing.bezier(0.645, 0.045, 0.355, 1),
  inOutQuad: Easing.bezier(0.455, 0.03, 0.515, 0.955),
  inQuad: Easing.bezier(0.55, 0.085, 0.68, 0.53),
  inCubic: Easing.bezier(0.55, 0.055, 0.675, 0.19),
};

// Recorte real del balón (prep_assets.cutout_on_white): 1337x1376. Se muestra con ancho w y alto w * BALL_AR.
export const BALL_SRC = {w: 1337, h: 1376};
export const BALL_AR = BALL_SRC.h / BALL_SRC.w;

// 90 BPM: beat = 20 frames, compás = 80. El balón alterna entre la posición baja (texto arriba) y la alta
// (paneles abajo). Cada movimiento dura 24 frames (800 ms, ease-in-out cubic) centrado en la barra de compás;
// las retenciones hacen un push lento (ease-in-out quad) para que nunca quede quieto.
type Key = {f: number; cy: number; w: number};
const KEYS: Key[] = [
  {f: 64, cy: 1100, w: 720},
  {f: 148, cy: 1092, w: 748},
  {f: 172, cy: 720, w: 620},
  {f: 228, cy: 716, w: 640},
  {f: 252, cy: 1085, w: 800},
  {f: 308, cy: 1080, w: 830},
  {f: 332, cy: 720, w: 620},
  {f: 388, cy: 716, w: 640},
  {f: 412, cy: 1095, w: 740},
  {f: 468, cy: 1092, w: 760},
  {f: 492, cy: 700, w: 580},
  {f: 546, cy: 696, w: 596},
  {f: 570, cy: 640, w: 500},
  {f: 660, cy: 634, w: 516},
];
export const ARRIVE = {a: 10, b: 64};
const MOVE_STARTS = new Set([148, 228, 308, 388, 468, 546]);

const seg = (f: number, k: 'cy' | 'w') => {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (f <= b.f || i === KEYS.length - 2) {
      const ease = MOVE_STARTS.has(a.f) ? EASE.inOutCubic : EASE.inOutQuad;
      return interpolate(f, [a.f, b.f], [a[k], b[k]], {...clamp, easing: ease});
    }
  }
  return KEYS[KEYS.length - 1][k];
};

// progreso (0..1) del movimiento en curso y su sentido, para inclinar el balón en la dirección del viaje
const travel = (f: number) => {
  for (const a of MOVE_STARTS) {
    if (f >= a && f <= a + 24) {
      const i = KEYS.findIndex((k) => k.f === a);
      return {u: (f - a) / 24, dir: Math.sign(KEYS[i + 1].cy - KEYS[i].cy)};
    }
  }
  return {u: 0, dir: 0};
};

export type Ball = {cx: number; cy: number; w: number; h: number; rot: number; op: number};
export const ballAt = (f: number): Ball => {
  const arr = interpolate(f, [ARRIVE.a, ARRIVE.b], [0, 1], {...clamp, easing: EASE.outQuint});
  let cy = f < ARRIVE.b ? interpolate(arr, [0, 1], [2350, KEYS[0].cy]) : seg(f, 'cy');
  const w = f < ARRIVE.b ? KEYS[0].w : seg(f, 'w');
  const tr = travel(f);
  // flotación lenta (respiración) y una inclinación suave en la dirección del viaje; la llegada gira -34° -> 0°
  cy += 7 * Math.sin(f / 36);
  const rot = 2 * Math.sin(f / 50) + 4 * tr.dir * Math.sin(Math.PI * tr.u) + (f < ARRIVE.b ? -34 * (1 - arr) : 0);
  const cx = 540 + 6 * Math.sin(f / 61);
  const op = f < ARRIVE.a ? 0 : 1;
  return {cx, cy, w, h: w * BALL_AR, rot, op};
};

// Rectángulos de los paneles de vidrio y del logo (pantalla). La QA los usa para exigir que nunca toquen el balón.
export type Rect = {x0: number; y0: number; x1: number; y1: number};
export const PANEL_LOW: Rect = {x0: 110, y0: 1090, x1: 970, y1: 1476};
export const SUB_PILL: Rect = {x0: 150, y0: 544, x1: 930, y1: 648};
export const CHIP = {x0: 160, x1: 920, h: 104, tops: [1076, 1196, 1316]};
export const LOGO = {w: 500, top: 984};
export const LOGO_H = Math.round((LOGO.w * 1391) / 3483);
export const URL_PILL: Rect = {x0: 300, y0: 1296, x1: 780, y1: 1404};
export const LOGO_HIT = 560;

// Ventanas de visibilidad (entrada, salida) de cada panel; la entrada empieza cuando el balón ya dejó esa mitad.
export const WIN = {
  official: {a: 168, b: 224},
  panelsSub: {a: 254, b: 298},
  maker: {a: 330, b: 384},
  chips: [{a: 488, b: 536}, {a: 494, b: 538}, {a: 500, b: 540}],
  url: {a: 572, b: 1e9},
};
// opacidad de un panel: entra en 18 frames (ease-out quart) y sale en 9 (ease-in), como pide el skill
export const panelIn = (f: number, a: number) => interpolate(f, [a, a + 18], [0, 1], {...clamp, easing: EASE.outQuart});
export const panelOut = (f: number, b: number) => interpolate(f, [b, b + 9], [0, 1], {...clamp, easing: EASE.inCubic});
export const panelOp = (f: number, w: {a: number; b: number}) => Math.min(1, interpolate(f, [w.a, w.a + 8], [0, 1], clamp)) * (1 - panelOut(f, w.b));
