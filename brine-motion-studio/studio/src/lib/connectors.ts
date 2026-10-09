import {interpolate} from 'remotion';
import {clamp, drift, expoOut} from './motion';
import {IMG_W, medalPoint, medalState} from './medal';
import type {Production} from '../types';

// Geometría única de etiquetas de beneficios + conectores: la usan Benefits (render) y QaProbe (QA de puntería).
// El conector nace en el borde de la tinta de su etiqueta más cercano a la medalla y termina en el ancla impresa de la cara.
export const EXIT_LABELS = 280;
const CHAR_W = 0.6; // ancho medio por carácter de DISPLAY 900 (em); solo acota el punto de salida dentro de la palabra
export type Label = {id: string; t: string; start: number; x: number; top: number; align: 'left' | 'right'; anchor: [number, number]; size: number; below: boolean};
export const benefitLabels = (p: Production): Label[] => {
  const A = p.product.assets.face_anchors_norm as Record<string, [number, number]>;
  const ts = (p as any).visual_direction?.type_scale ?? 1;
  const size = 84 * ts;
  const [b1, b2, b3] = p.script.on_screen.benefits;
  return [
    {id: 'benefit-1', t: b1, start: 202, x: 130, top: 388, align: 'left', anchor: A.logo, size: Math.min(size, 84), below: false},
    {id: 'benefit-2', t: b2, start: 217, x: 130, top: 1376, align: 'left', anchor: A.name, size, below: true},
    {id: 'benefit-3', t: b3, start: 232, x: 900, top: 1376, align: 'right', anchor: A.date, size, below: true},
  ];
};
export const labelExit = (i: number) => EXIT_LABELS + i * 2;
export type Connector = {id: string; start: {x: number; y: number}; ctrl: {x: number; y: number}; end: {x: number; y: number}; d: string; prog: number; op: number;
  disc: {x: number; y: number; r: number}};
export const connectors = (f: number, p: Production): Connector[] => {
  const st = medalState(f);
  const disc = {...medalPoint(st, 0.5, 0.79), r: 0.5 * IMG_W * st.s};
  return benefitLabels(p).map((l, i) => {
    const dy = drift(f, i, 3, 60);
    const end = medalPoint(st, l.anchor[0], l.anchor[1]);
    const w = [...l.t].length * l.size * CHAR_W;
    const left = l.align === 'left' ? l.x : l.x - w;
    const sx = Math.min(left + 0.8 * w, Math.max(left + 0.2 * w, end.x));
    // tinta: el bloque tiene padding 0,12 em y line-height 1,05; ascendentes desde ~0,2 em, descendentes hasta ~1,12 em
    const sy = l.below ? l.top + dy - 4 : l.top + dy + 1.12 * l.size - 6;
    const start = {x: sx, y: sy};
    // curva suave que se abre hacia afuera del disco (lejos de su centro) para no cruzar la cara
    const mx = (start.x + end.x) / 2, my = (start.y + end.y) / 2;
    const vx = end.x - start.x, vy = end.y - start.y, L = Math.hypot(vx, vy) || 1;
    let nx = -vy / L, ny = vx / L;
    if ((mx - disc.x) * nx + (my - disc.y) * ny < 0) { nx = -nx; ny = -ny; }
    const ctrl = {x: mx + nx * L * 0.12, y: my + ny * L * 0.12};
    const prog = interpolate(f, [l.start + 12, l.start + 26], [0, 1], {...clamp, easing: expoOut}) * interpolate(f, [labelExit(i), labelExit(i) + 8], [1, 0], clamp);
    const op = interpolate(f, [labelExit(i), labelExit(i) + 8], [1, 0], clamp);
    return {id: l.id, start, ctrl, end, d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`, prog, op, disc};
  });
};
export const sampleConnector = (c: Connector, n = 12) => Array.from({length: n + 1}, (_, k) => {
  const t = k / n, u = 1 - t;
  return [Math.round(u * u * c.start.x + 2 * u * t * c.ctrl.x + t * t * c.end.x), Math.round(u * u * c.start.y + 2 * u * t * c.ctrl.y + t * t * c.end.y)];
});
