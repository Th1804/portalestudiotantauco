import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Deco, TextLayer, useInk} from '../lib/qa';
import {clamp, expoIn, expoOut, settle} from '../lib/motion';

// Tipografía "refractada": cada línea entra como tres copias desplazadas (celeste, azul estuche y la tinta final)
// que convergen en el beat, como luz que se enfoca a través del cristal. Los ecos van en Deco (fuera del QA de texto);
// la tinta se anima por glifo (opacidad, desenfoque y deslizamiento lateral) para que QaProbe mida solo glifos visibles.
export type PrismProps = {
  id: string; text: string; top: number; size: number; family: string; weight: number; color: string;
  start: number; exit?: number; from?: 'left' | 'right'; spread?: number; tracking?: number; stagger?: number;
  ghostA?: string; ghostB?: string; lineHeight?: number; blend?: 'multiply' | 'screen';
};
export const PrismText: React.FC<PrismProps> = ({id, text, top, size, family, weight, color, start, exit = 1e9, from = 'left',
  spread = 46, tracking = -0.01, stagger = 0.8, ghostA = '#ADBED4', ghostB = '#355691', lineHeight = 1.1, blend = 'multiply'}) => {
  const f = useCurrentFrame();
  const ink = useInk(color);
  const glyphs = [...text];
  const dir = from === 'left' ? -1 : 1;
  const conv = interpolate(f, [start, start + 10], [0, 1], {...clamp, easing: expoOut});
  const split = interpolate(f, [exit, exit + 9], [0, 1], {...clamp, easing: expoIn});
  const ghostOp = (f < start ? 0 : 1) * (1 - conv) * 0.85 + split * 0.7 * (1 - interpolate(f, [exit + 6, exit + 12], [0, 1], clamp));
  const off = spread * (1 - conv) + spread * 1.4 * split;
  if (f < start - 1 || f > exit + 14) return null;
  const style: React.CSSProperties = {whiteSpace: 'pre', fontFamily: family, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: `${tracking}em`};
  const wrap: React.CSSProperties = {position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: `${size * 0.12}px 0`};
  return (
    <>
      <Deco>
        {[{c: ghostA, k: 1}, {c: ghostB, k: -1}].map((g, i) => (
          <div key={i} style={{...wrap, transform: `translateX(${dir * g.k * off}px)`, opacity: ghostOp * (i ? 0.75 : 1), mixBlendMode: blend}}>
            <div style={{...style, color: g.c, filter: `blur(${(1.5 + 4 * (1 - conv) + 4 * split).toFixed(2)}px)`}}>{text}</div>
          </div>
        ))}
      </Deco>
      <TextLayer>
      <div style={wrap}>
        <div data-qa={id} style={{...style, color: ink}}>
          {glyphs.map((c, k) => {
            const s0 = start + k * stagger;
            const inn = settle(f, s0, 190, 18, 0.7);
            const op = interpolate(f, [s0, s0 + 5], [0, 1], clamp);
            const o0 = exit + k * 0.5;
            const out = interpolate(f, [o0, o0 + 8], [0, 1], {...clamp, easing: expoIn});
            const blur = Math.max(0, (1 - inn) * 9 + out * 10);
            return <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: op * (1 - out),
              filter: `blur(${blur.toFixed(2)}px)`, transform: `translate(${(dir * (1 - inn) * 28 - dir * out * 36).toFixed(2)}px, ${(-out * 18).toFixed(2)}px)`}}>{c}</span>;
          })}
        </div>
      </div>
      </TextLayer>
    </>
  );
};
