import {interpolate} from 'remotion';
import {clamp, expoInOut, expoOut, pendulum} from '../lib/motion';

// Recorte real de la ficha (studio_white_cutout). El componente y el obstáculo de QA comparten esta geometría.
export const SRC_W = 219;
export const SRC_H = 554;
const AW = SRC_W / SRC_H;

export const BEAT = {
  enterA: 72,
  enterB: 114,
  rightA: 188,
  rightB: 234,
  leftA: 344,
  leftB: 386,
  stateA: 452,
  stateB: 486,
  exitA: 534,
  exitB: 556,
} as const;

type Pose = {cx: number; top: number; h: number; rot: number};

const hero: Pose = {cx: 540, top: 530, h: 960, rot: 0};
const right: Pose = {cx: 808, top: 500, h: 900, rot: -1.2};
const left: Pose = {cx: 292, top: 500, h: 900, rot: 1.2};
const state: Pose = {cx: 540, top: 308, h: 600, rot: 0};

const mix = (a: Pose, b: Pose, t: number): Pose => ({
  cx: a.cx + (b.cx - a.cx) * t,
  top: a.top + (b.top - a.top) * t,
  h: a.h + (b.h - a.h) * t,
  rot: a.rot + (b.rot - a.rot) * t,
});

export type TrophyRect = {
  x: number; y: number; w: number; h: number; cx: number; cy: number; op: number; rot: number;
};

export const trophyRect = (f: number): TrophyRect => {
  const B = BEAT;
  let pose = hero;
  let op = 1;
  if (f < B.enterA) {
    pose = {...hero, top: hero.top + 28, h: hero.h * 0.96};
    op = 0;
  } else if (f < B.enterB) {
    const t = interpolate(f, [B.enterA, B.enterB], [0, 1], {...clamp, easing: expoOut});
    pose = mix({...hero, top: hero.top + 28, h: hero.h * 0.96, rot: 0.6}, hero, t);
    op = interpolate(f, [B.enterA, B.enterA + 12], [0, 1], clamp);
    pose = {...pose, rot: pose.rot + pendulum(f, B.enterA, 0.4, 26, 14)};
  } else if (f < B.rightA) {
    pose = {...hero, rot: pendulum(f, B.enterB, 0.7, 30, 16)};
  } else if (f < B.rightB) {
    const t = interpolate(f, [B.rightA, B.rightB], [0, 1], {...clamp, easing: expoInOut});
    pose = mix(hero, right, t);
  } else if (f < B.leftA) {
    pose = right;
  } else if (f < B.leftB) {
    const t = interpolate(f, [B.leftA, B.leftB], [0, 1], {...clamp, easing: expoInOut});
    pose = mix(right, left, t);
  } else if (f < B.stateA) {
    pose = left;
  } else if (f < B.stateB) {
    const t = interpolate(f, [B.stateA, B.stateB], [0, 1], {...clamp, easing: expoInOut});
    pose = mix(left, state, t);
  } else if (f < B.exitA) {
    pose = state;
  } else if (f < B.exitB) {
    const t = interpolate(f, [B.exitA, B.exitB], [0, 1], {...clamp, easing: expoInOut});
    pose = {...state, top: state.top - 18 * t, h: state.h * (1 - 0.03 * t)};
    op = 1 - t;
  } else {
    pose = state;
    op = 0;
  }
  const cx = pose.cx + 2.2 * Math.sin(f / 36);
  const top = pose.top + 3 * Math.sin(f / 24 + 0.5);
  const w = pose.h * AW;
  return {x: cx - w / 2, y: top, w, h: pose.h, cx, cy: top + pose.h / 2, op, rot: pose.rot};
};

export const trophyAabb = (f: number) => {
  const r = trophyRect(f);
  const rad = (r.rot * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const pts = [
    [-r.w / 2, -r.h / 2],
    [r.w / 2, -r.h / 2],
    [r.w / 2, r.h / 2],
    [-r.w / 2, r.h / 2],
  ].map(([px, py]) => [r.cx + px * c - py * s, r.cy + px * s + py * c]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), op: r.op};
};
