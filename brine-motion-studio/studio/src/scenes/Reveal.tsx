import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {TextLayer, useInk} from '../lib/qa';
import {clamp, expoIn, expoOut, settle} from '../lib/motion';
import {DISPLAY, TEXT} from '../lib/fonts';
import type {Production} from '../types';

// v2: etiqueta (sans, tracking animado) + descriptor en serif bajo la medalla. El descriptor salió de Beneficios
// (en v1 tapaba "Logotipos"): aquí tiene su propio espacio y su propio momento.
const MaskLine: React.FC<{id: string; text: string; top: number; start: number; end: number; style: React.CSSProperties}> = ({id, text, top, start, end, style}) => {
  const f = useCurrentFrame();
  const inn = settle(f, start, 120, 18, 0.8);
  const out = interpolate(f, [end, end + 10], [0, 1], {...clamp, easing: expoIn});
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{overflow: 'hidden', clipPath: 'inset(0)', padding: '8px 12px'}}>
        <div data-qa={id} style={{whiteSpace: 'nowrap', transform: `translateY(${(1 - inn) * 120 - out * 130}%)`, ...style}}>{text}</div>
      </div>
    </div>
  );
};
export const RevealText: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const ink = useInk(p.brand.palette.celeste);
  const bone = useInk(p.brand.palette.bone);
  if (f < 86 || f > 206) return null;
  const track = interpolate(f, [92, 130], [0.6, 0.22], {...clamp, easing: expoOut});
  const [s1, s2] = p.script.on_screen.benefits_sub.split(', ');
  const fl = 3 * Math.sin(f / 17);
  return (
    <TextLayer>
      <AbsoluteFill style={{transform: `translateY(${fl}px)`}}>
        <MaskLine id="reveal-eyebrow" text={p.script.on_screen.reveal_eyebrow} top={1342} start={92} end={186}
          style={{fontFamily: TEXT, fontWeight: 700, fontSize: 26, letterSpacing: `${track}em`, marginRight: `-${track}em`, color: ink}} />
        <MaskLine id="reveal-sub1" text={s1 + ','} top={1388} start={118} end={188}
          style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 44, lineHeight: 1.1, color: bone}} />
        <MaskLine id="reveal-sub2" text={s2} top={1440} start={123} end={189}
          style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 44, lineHeight: 1.1, color: bone}} />
      </AbsoluteFill>
    </TextLayer>
  );
};
