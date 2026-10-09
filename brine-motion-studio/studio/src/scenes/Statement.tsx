import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Deco, TextLayer, useInk} from '../lib/qa';
import {clamp, expoIn, expoOut, settle} from '../lib/motion';
import {DISPLAY} from '../lib/fonts';
import type {Production} from '../types';
import {sweepFront} from './LightSweep';
import {EXIT} from '../lib/medal';

// v2: el statement aparece "con la luz" sobre el MISMO fondo azul premium (sin wipe a blanco):
// la máscara del texto sigue al frente del barrido; cada palabra sube con muelle y queda flotando.
export const SWEEP_A = EXIT.sweepA, SWEEP_B = EXIT.sweepB;
export const Statement: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const C = p.brand.palette;
  const ink = useInk(C.bone);
  const cel = useInk(C.celeste);
  if (f < EXIT.statement || f > 384) return null;
  const ts = (p as any).visual_direction?.type_scale ?? 1;
  const [s1, s2, s3] = p.script.on_screen.statement;
  const front = sweepFront(f, SWEEP_A, SWEEP_B) * 100;
  const u = interpolate(f, [342, 356], [0, 1], {...clamp, easing: expoOut});
  const uo = interpolate(f, [362, 370], [0, 1], {...clamp, easing: expoIn});
  const push = interpolate(f, [EXIT.statement, 384], [0.92, 1.0], {...clamp, easing: expoOut});
  const lines = [
    {id: 'statement-1', t: s1, top: 676, st: 306, size: Math.min(118, 100 * ts), w: 600, color: cel},
    {id: 'statement-2', t: s2, top: 820, st: 312, size: 150, w: 900, color: ink},
    {id: 'statement-3', t: s3, top: 1000, st: 318, size: 150, w: 900, color: ink},
  ];
  const mask = `linear-gradient(108deg, #000 ${front - 10}%, rgba(0,0,0,0) ${front + 6}%)`;
  return (
    <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 920px'}}>
      <TextLayer>
        <AbsoluteFill style={{WebkitMaskImage: f < SWEEP_B ? mask : undefined, maskImage: f < SWEEP_B ? mask : undefined}}>
          {lines.map((l, i) => {
            const words = l.t.split(' ');
            return (
              <div key={i} style={{position: 'absolute', top: l.top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
                <div style={{overflow: 'hidden', clipPath: 'inset(0)', padding: `${l.size * 0.14}px 16px`}}>
                  <div data-qa={l.id} style={{whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: l.w, fontSize: l.size, lineHeight: 1.05, letterSpacing: '-0.012em', color: l.color}}>
                    {words.map((w, k) => {
                      const inn = settle(f, l.st + k * 3, 150, 16, 0.8);
                      const out = interpolate(f, [362 + i * 2 + k, 372 + i * 2 + k], [0, 1], {...clamp, easing: expoIn});
                      const fl = 2.5 * Math.sin((f + i * 20 + k * 9) / 16);
                      return <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - inn) * 70 - out * 125}%) translateY(${fl}px)`}}>{w}{k < words.length - 1 ? '\u00A0' : ''}</span>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      </TextLayer>
      <Deco>
        <div style={{position: 'absolute', top: 1196, left: 540 - 200 * u + 400 * uo, width: 400 * u * (1 - uo), height: 4, background: C.gold}} />
      </Deco>
    </AbsoluteFill>
  );
};
