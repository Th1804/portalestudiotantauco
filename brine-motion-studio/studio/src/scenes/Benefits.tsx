import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Deco, TextLayer, useInk} from '../lib/qa';
import {clamp, expoIn, expoOut, settle, drift} from '../lib/motion';
import {DISPLAY} from '../lib/fonts';
import {EXIT, medalPoint, medalState} from '../lib/medal';
import type {Production} from '../types';

// v2: cada etiqueta se revela por letra a través de una máscara (overshoot sutil), flota con micro-movimiento propio
// y su conector nace con anticipación (el punto se contrae antes de crecer). Sin descriptor aquí: no hay colisiones.
export const Benefits: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const C = p.brand.palette;
  const bone = useInk(C.bone);
  if (f < 196 || f > EXIT.a + 10) return null;
  const st = medalState(f);
  const A = p.product.assets.face_anchors_norm;
  const ts = (p as any).visual_direction?.type_scale ?? 1;
  const size = 84 * ts;
  const [b1, b2, b3] = p.script.on_screen.benefits;
  const labels = [
    {id: 'benefit-1', t: b1, start: 202, x: 130, top: 388, align: 'left' as const, anchor: A.logo},
    {id: 'benefit-2', t: b2, start: 217, x: 130, top: 1376, align: 'left' as const, anchor: A.name},
    {id: 'benefit-3', t: b3, start: 232, x: 900, top: 1376, align: 'right' as const, anchor: A.date},
  ];
  const exitAt = (i: number) => EXIT.a - 10 + i * 2;
  return (
    <AbsoluteFill>
      <Deco>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {labels.map((l, i) => {
            const a = medalPoint(st, l.anchor[0], l.anchor[1]);
            const dy = drift(f, i, 3, 60);
            const fx = l.align === 'left' ? l.x + 60 : l.x - 60;
            const fy = i === 0 ? l.top + size * 1.25 + dy : l.top - 8 + dy;
            const mx = (fx + a.x) / 2 + (i === 0 ? 40 : 0), my = i === 0 ? fy + 120 : (fy + a.y) / 2 - 60;
            const d = `M ${fx} ${fy} Q ${mx} ${my} ${a.x} ${a.y}`;
            const prog = interpolate(f, [l.start + 4, l.start + 18], [0, 1], {...clamp, easing: expoOut}) * interpolate(f, [exitAt(i), exitAt(i) + 8], [1, 0], clamp);
            // anticipación del punto: se contrae (0,6) y luego crece con overshoot
            const dot = interpolate(f, [l.start + 12, l.start + 15, l.start + 22], [0, 0.6, 1], {...clamp}) * (1 + 0.25 * Math.exp(-Math.max(0, f - l.start - 22) / 4) * (f > l.start + 22 ? 1 : 0));
            const ring = interpolate(f, [l.start + 16, l.start + 34], [0, 1], clamp);
            return (
              <g key={i} opacity={interpolate(f, [exitAt(i), exitAt(i) + 8], [1, 0], clamp)}>
                <path d={d} fill="none" stroke={C.bone} strokeOpacity={0.8} strokeWidth={2.2} pathLength={1}
                  strokeDasharray={1} strokeDashoffset={1 - prog} strokeLinecap="round" />
                <circle cx={a.x} cy={a.y} r={7 * dot} fill={C.gold} />
                <circle cx={a.x} cy={a.y} r={8 + 26 * ring} fill="none" stroke={C.gold} strokeOpacity={(1 - ring) * 0.85} strokeWidth={2} />
              </g>
            );
          })}
        </svg>
      </Deco>
      <TextLayer>
        {labels.map((l, i) => {
          const chars = [...l.t];
          const dy = drift(f, i, 3, 60);
          const track = interpolate(f, [l.start, l.start + 24], [0.12, -0.01], {...clamp, easing: expoOut});
          return (
            <div key={i} style={{position: 'absolute', top: l.top + dy, [l.align]: l.align === 'left' ? l.x : 1080 - l.x, overflow: 'hidden', clipPath: 'inset(0)', padding: `${size * 0.12}px 0`}}>
              <div data-qa={l.id} style={{whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: 1.05, color: bone,
                letterSpacing: `${track}em`, marginRight: `-${track}em`}}>
                {chars.map((c, k) => {
                  const inn = settle(f, l.start + k * 1.2, 180, 17, 0.7);
                  const out = interpolate(f, [exitAt(i) + k * 0.6, exitAt(i) + k * 0.6 + 9], [0, 1], {...clamp, easing: expoIn});
                  return <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - inn) * 115 - out * 120}%)`}}>{c}</span>;
                })}
              </div>
            </div>
          );
        })}
      </TextLayer>
    </AbsoluteFill>
  );
};
