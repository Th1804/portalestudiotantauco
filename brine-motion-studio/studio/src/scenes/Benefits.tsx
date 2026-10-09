import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Deco, TextLayer, useInk} from '../lib/qa';
import {clamp, expoIn, expoOut, settle, drift} from '../lib/motion';
import {DISPLAY} from '../lib/fonts';
import {EXIT} from '../lib/medal';
import {benefitLabels, connectors, labelExit} from '../lib/connectors';
import type {Production} from '../types';

// v3: cada letra entra con subida + desenfoque + opacidad (sin máscaras que la corten) y su conector
// nace en la etiqueta y termina en el ancla impresa de la medalla (geometría compartida con el QA).
export const Benefits: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const C = p.brand.palette;
  const bone = useInk(C.bone);
  if (f < 196 || f > EXIT.a + 10) return null;
  const labels = benefitLabels(p);
  const cons = connectors(f, p);
  return (
    <AbsoluteFill>
      <Deco>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {labels.map((l, i) => {
            const c = cons[i]; const a = c.end;
            // anticipación del punto: se contrae (0,6) y luego crece con overshoot
            const dot = interpolate(f, [l.start + 22, l.start + 25, l.start + 32], [0, 0.6, 1], {...clamp}) * (1 + 0.25 * Math.exp(-Math.max(0, f - l.start - 32) / 4) * (f > l.start + 32 ? 1 : 0));
            const ring = interpolate(f, [l.start + 26, l.start + 44], [0, 1], clamp);
            return (
              <g key={i} opacity={c.op}>
                <path d={c.d} fill="none" stroke={C.bone} strokeOpacity={0.8} strokeWidth={2.2} pathLength={1}
                  strokeDasharray={1} strokeDashoffset={1 - c.prog} strokeLinecap="round" />
                <circle cx={c.start.x} cy={c.start.y} r={3.2 * Math.min(1, c.prog * 4)} fill={C.bone} fillOpacity={0.9} />
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
            <div key={i} style={{position: 'absolute', top: l.top + dy, [l.align]: l.align === 'left' ? l.x : 1080 - l.x, padding: `${l.size * 0.12}px 0`}}>
              <div data-qa={l.id} style={{whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: 900, fontSize: l.size, lineHeight: 1.05, color: bone,
                letterSpacing: `${track}em`, marginRight: `-${track}em`}}>
                {chars.map((c, k) => {
                  const inn = settle(f, l.start + k * 1.2, 180, 17, 0.7);
                  const op = interpolate(f, [l.start + k * 1.2, l.start + k * 1.2 + 7], [0, 1], clamp);
                  const out = interpolate(f, [labelExit(i) + k * 0.6, labelExit(i) + k * 0.6 + 9], [0, 1], {...clamp, easing: expoIn});
                  return <span key={k} style={{display: 'inline-block', opacity: op * (1 - out),
                    filter: `blur(${Math.max(0, (1 - inn) * 9 + out * 8).toFixed(2)}px)`,
                    transform: `translateY(${(1 - inn) * 34 - out * 30}px)`}}>{c}</span>;
                })}
              </div>
            </div>
          );
        })}
      </TextLayer>
    </AbsoluteFill>
  );
};
