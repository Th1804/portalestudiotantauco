import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {TextLayer, useInk} from '../lib/qa';
import {clamp} from '../lib/motion';
import {EASE} from './geometry';

// Línea con revelado por glifo (opacidad + desenfoque que enfoca + subida corta, ease-out quart en 16 frames) y
// salida más rápida (ease-in en 9 frames). Cada glifo es un <span> hijo directo del [data-qa]: QaProbe mide solo los
// glifos visibles y marca la línea como no asentada mientras alguno está en transición.
export type LineProps = {
  id: string; text: string; top: number; size: number; family: string; weight: number; color: string;
  start: number; exit?: number; tracking?: number; trackFrom?: number; stagger?: number; lineHeight?: number;
  align?: 'center' | 'left' | 'right'; x?: number; rise?: number; upper?: boolean;
};
export const Line: React.FC<LineProps> = ({id, text, top, size, family, weight, color, start, exit = 1e9, tracking = 0,
  trackFrom, stagger = 0.9, lineHeight = 1.12, align = 'center', x = 540, rise = 26, upper = false}) => {
  const f = useCurrentFrame();
  const ink = useInk(color);
  if (f < start - 1 || f > exit + 20) return null;
  const glyphs = [...(upper ? text.toUpperCase() : text)];
  const tr = trackFrom === undefined ? tracking
    : interpolate(f, [start, start + 26], [trackFrom, tracking], {...clamp, easing: EASE.outQuart});
  const wrap: React.CSSProperties = align === 'center'
    ? {position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}
    : align === 'left' ? {position: 'absolute', top, left: x} : {position: 'absolute', top, right: 1080 - x};
  return (
    <TextLayer>
      <div style={{...wrap, padding: `${size * 0.1}px 0`}}>
        <div data-qa={id} style={{whiteSpace: 'pre', fontFamily: family, fontWeight: weight, fontSize: size, lineHeight,
          letterSpacing: `${tr}em`, marginRight: `${-tr}em`, color: ink}}>
          {glyphs.map((c, k) => {
            const s0 = start + k * stagger;
            const inn = interpolate(f, [s0, s0 + 16], [0, 1], {...clamp, easing: EASE.outQuart});
            const op = interpolate(f, [s0, s0 + 8], [0, 1], clamp);
            const o0 = exit + k * 0.35;
            const out = interpolate(f, [o0, o0 + 9], [0, 1], {...clamp, easing: EASE.inQuad});
            const blur = (1 - inn) * 10 + out * 8;
            return <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: op * (1 - out),
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
              transform: `translateY(${((1 - inn) * rise - out * 16).toFixed(2)}px)`}}>{c}</span>;
          })}
        </div>
      </div>
    </TextLayer>
  );
};
