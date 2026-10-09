import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Deco, TextLayer, useInk} from '../lib/qa';
import {clamp, expoIn, expoOut, settle} from '../lib/motion';
import {DISPLAY} from '../lib/fonts';
import type {Production} from '../types';
import {sweepFront} from './LightSweep';
import {EXIT} from '../lib/medal';

// v3: el statement aparece "con la luz" letra por letra: cada glifo entra completo (opacidad + subida corta +
// desenfoque que se enfoca) cuando el frente del barrido pasa por su posición x. Sin máscaras ni overflow:hidden,
// así ninguna letra se ve cortada por una franja. Salida: se disuelve hacia arriba con desenfoque, por líneas.
export const SWEEP_A = EXIT.sweepA, SWEEP_B = EXIT.sweepB;
export const STATEMENT_OUT = 362;
const CHAR_W = 0.5;
export const Statement: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const C = p.brand.palette;
  const ink = useInk(C.bone);
  const cel = useInk(C.celeste);
  if (f < EXIT.statement || f > 384) return null;
  const ts = (p as any).visual_direction?.type_scale ?? 1;
  const [s1, s2, s3] = p.script.on_screen.statement;
  const u = interpolate(f, [342, 356], [0, 1], {...clamp, easing: expoOut});
  const uo = interpolate(f, [STATEMENT_OUT, STATEMENT_OUT + 8], [0, 1], {...clamp, easing: expoIn});
  const push = interpolate(f, [EXIT.statement, 384], [0.92, 1.0], {...clamp, easing: expoOut});
  const lines = [
    {id: 'statement-1', t: s1, top: 676, st: 300, size: Math.min(118, 100 * ts), w: 600, color: cel},
    {id: 'statement-2', t: s2, top: 820, st: 306, size: 150, w: 900, color: ink},
    {id: 'statement-3', t: s3, top: 1000, st: 312, size: 150, w: 900, color: ink},
  ];
  // frame en que el frente de luz (0..1 del ancho, con la inclinación del barrido) cruza x
  const crossing = (x: number, st: number) => {
    for (let k = SWEEP_A; k <= SWEEP_B; k += 0.5) if (sweepFront(k, SWEEP_A, SWEEP_B) * 1080 >= x) return Math.max(st, k);
    return Math.max(st, SWEEP_B);
  };
  return (
    <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 920px'}}>
      <TextLayer>
        {lines.map((l, i) => {
          const chars = [...l.t];
          const w = chars.length * l.size * CHAR_W;
          return (
            <div key={i} style={{position: 'absolute', top: l.top, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: `${l.size * 0.14}px 16px`}}>
              <div data-qa={l.id} style={{whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: l.w, fontSize: l.size, lineHeight: 1.05, letterSpacing: '-0.012em', color: l.color}}>
                {chars.map((c, k) => {
                  const x = 540 - w / 2 + (k + 0.5) * (w / chars.length);
                  const s0 = crossing(x, l.st + k * 0.9) + 2;
                  const inn = settle(f, s0, 150, 17, 0.8);
                  const op = interpolate(f, [s0, s0 + 8], [0, 1], clamp);
                  const o0 = STATEMENT_OUT + i * 3 + k * 0.3;
                  const out = interpolate(f, [o0, o0 + 10], [0, 1], {...clamp, easing: expoIn});
                  const fl = 2.5 * Math.sin((f + i * 20) / 16);
                  return <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: op * (1 - out),
                    filter: `blur(${Math.max(0, (1 - inn) * 12 + out * 10).toFixed(2)}px)`,
                    transform: `translateY(${(1 - inn) * 36 - out * 42 + fl}px) scale(${1 + Math.max(0, 1 - inn) * 0.06 + out * 0.04})`}}>{c}</span>;
                })}
              </div>
            </div>
          );
        })}
      </TextLayer>
      <Deco>
        <div style={{position: 'absolute', top: 1196, left: 540 - 200 * u + 400 * uo, width: 400 * u * (1 - uo), height: 4, background: C.gold}} />
      </Deco>
    </AbsoluteFill>
  );
};
