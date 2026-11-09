import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {useQa} from '../lib/qa';
import {clamp, rand} from '../lib/motion';
import {DISPLAY} from '../lib/fonts';
import {ballAt} from './geometry';
import type {HeritageProduction} from './types';

// Fondo navy con profundidad: degradado, haces de luz de estadio antiguo, tipografía como textura desenfocada
// (plano lejano, parallax contrario al balón), bokeh y polvo en suspensión. Todo detrás del balón.
export const Backdrop: React.FC<{p: HeritageProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  if (qa !== 'none') return <AbsoluteFill style={{background: '#000'}} />;
  const b = ballAt(f);
  const par = -(b.cy - 900) * 0.07;
  const lx = 540 + 200 * Math.sin(f / 90), ly = 760 + 140 * Math.cos(f / 110);
  const words = p.script.on_screen.title.map((w) => w.toUpperCase());
  const texOp = interpolate(f, [0, 30], [0.5, 1], clamp);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, #262B57 0%, ${C.navy} 46%, ${C.navy_deep} 100%)`}}>
      <AbsoluteFill style={{background: `radial-gradient(1100px 1200px at ${lx}px ${ly}px, rgba(173,190,212,0.2), rgba(33,37,75,0) 70%)`}} />
      {/* haces de luz desde arriba, lentos */}
      {[{x: 120, r: 24, w: 260}, {x: 520, r: 4, w: 180}, {x: 980, r: -22, w: 280}].map((h, i) => (
        <div key={i} style={{position: 'absolute', left: h.x - h.w / 2, top: -200, width: h.w, height: 1900, transformOrigin: '50% 0%',
          transform: `rotate(${h.r + 3 * Math.sin(f / (70 + 13 * i) + i)}deg)`, filter: 'blur(28px)', opacity: 0.55 + 0.25 * Math.sin(f / (40 + 9 * i) + 2 * i),
          background: 'linear-gradient(180deg, rgba(201,213,228,0.16), rgba(201,213,228,0.05) 55%, rgba(201,213,228,0) 85%)'}} />
      ))}
      {/* tipografía como textura (contorno, desenfocada: profundidad de campo) */}
      <AbsoluteFill style={{opacity: texOp, filter: 'blur(2.4px)', transform: `translateY(${par}px)`}}>
        {Array.from({length: 9}).map((_, i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          const x = -700 + dir * ((f * (0.7 + (i % 3) * 0.25)) % 900);
          const txt = Array.from({length: 6}).map((__, k) => words[(i + k) % words.length]).join('  ·  ');
          return <div key={i} style={{position: 'absolute', top: 10 + i * 215, left: x, whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: 900,
            fontSize: 172, letterSpacing: -2, color: 'transparent', WebkitTextStroke: '1.6px rgba(173,190,212,0.12)'}}>{txt}</div>;
        })}
      </AbsoluteFill>
      {/* bokeh lejano */}
      {Array.from({length: 9}).map((_, i) => {
        const r = 90 + rand(i + 500) * 170;
        const x = rand(i + 300) * 1080 + 40 * Math.sin(f / (80 + 7 * i) + i);
        const y = ((rand(i + 400) * 2200 - f * (0.25 + 0.2 * rand(i + 600))) % 2200 + 2200) % 2200 - 140 + par * 1.4;
        const warm = i % 4 === 0;
        return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', filter: 'blur(6px)',
          background: warm ? 'radial-gradient(circle, rgba(255,236,200,0.07) 0%, rgba(255,236,200,0.035) 55%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(201,213,228,0.09) 0%, rgba(201,213,228,0.04) 55%, rgba(0,0,0,0) 70%)'}} />;
      })}
      {/* polvo en suspensión iluminado por los haces */}
      {Array.from({length: 46}).map((_, i) => {
        const z = 0.3 + rand(i) * 0.9;
        const x = (rand(i + 100) * 1160 - 40 + Math.sin(f / (50 + i) + i) * 14 * z + 1160) % 1160 - 40;
        const y = ((rand(i + 200) * 2050 - f * (0.35 + z * 0.9)) % 2050 + 2050) % 2050 - 60 + par * z;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / (16 + (i % 9)) + i));
        const s = 2 + z * 4;
        return <div key={'d' + i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(244,246,249,${0.7 * tw}) 0%, rgba(244,246,249,0) 70%)`}} />;
      })}
    </AbsoluteFill>
  );
};

// Bokeh de primer plano: solo en los bordes y se apaga cerca del balón (nunca lo cubre).
export const ForeBokeh: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const b = ballAt(f);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: 4}).map((_, i) => {
        const r = 80 + rand(i + 900) * 70;
        const side = i % 2 === 0 ? -1 : 1;
        const x = 540 + side * (500 + 40 * Math.sin(f / 60 + i));
        const y = ((rand(i + 930) * 2000 + f * (0.9 + 0.4 * rand(i + 920))) % 2200) - 140;
        const dx = Math.max(0, Math.abs(x - b.cx) - b.w / 2), dy = Math.max(0, Math.abs(y - b.cy) - b.h / 2);
        const clear = Math.min(1, Math.max(0, (Math.hypot(dx, dy) - r * 1.05) / (r * 0.6)));
        return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: clear,
          background: 'radial-gradient(circle, rgba(244,246,249,0.09) 0%, rgba(244,246,249,0.05) 50%, rgba(244,246,249,0) 70%)', filter: 'blur(4px)'}} />;
      })}
    </AbsoluteFill>
  );
};
