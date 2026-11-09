import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Deco} from '../lib/qa';
import {clamp} from '../lib/motion';
import {EASE, Rect, panelIn, panelOut} from './geometry';

// Panel de vidrio líquido (manual Brine): desenfoque del fondo (backdrop-filter <= 20 px, ver skill), tinte frío,
// borde de luz con degradado, sombra profunda, un reflejo especular que deriva lento dentro del panel y una
// línea cáustica que recorre el canto superior al entrar. Solo opacidad y transform (compositor).
export const Glass: React.FC<{r: Rect; a: number; b: number; radius?: number; seed?: number; tint?: number}> = ({r, a, b, radius = 44, seed = 0, tint = 1}) => {
  const f = useCurrentFrame();
  if (f < a - 1 || f > b + 10) return null;
  const inn = panelIn(f, a), out = panelOut(f, b);
  const op = interpolate(f, [a, a + 8], [0, 1], clamp) * (1 - out);
  const w = r.x1 - r.x0, h = r.y1 - r.y0;
  const sx = 0.96 + 0.04 * inn, sy = 0.9 + 0.1 * inn - 0.03 * out;
  const caustic = interpolate(f, [a + 2, a + 30], [-0.3, 1.3], {...clamp, easing: EASE.inOutCubic});
  const spec = 0.5 + 0.5 * Math.sin((f + seed * 40) / 34);
  return (
    <Deco>
      <div style={{position: 'absolute', left: r.x0, top: r.y0, width: w, height: h, opacity: op,
        transform: `translateY(${(1 - inn) * 18}px) scale(${sx}, ${sy})`, transformOrigin: '50% 50%'}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden',
          backdropFilter: 'blur(18px) saturate(1.3)', WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          background: `linear-gradient(150deg, rgba(244,246,249,${0.15 * tint}) 0%, rgba(173,190,212,${0.07 * tint}) 45%, rgba(33,37,75,${0.18 * tint}) 100%)`,
          boxShadow: '0 40px 90px rgba(6,8,26,0.5), 0 10px 26px rgba(6,8,26,0.35), inset 0 1.5px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(255,255,255,0.06)'}}>
          <div style={{position: 'absolute', left: `${-20 + 60 * spec}%`, top: '-60%', width: '80%', height: '140%', borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(244,246,249,0.13), rgba(244,246,249,0) 65%)', transform: 'rotate(-18deg)'}} />
          <div style={{position: 'absolute', left: `${caustic * 100 - 30}%`, top: 0, width: '30%', height: 2,
            background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))', opacity: 0.85 * (1 - out)}} />
        </div>
        <div style={{position: 'absolute', inset: 0, borderRadius: radius, padding: 1.5, pointerEvents: 'none',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.55), rgba(173,190,212,0.12) 40%, rgba(173,190,212,0.08) 70%, rgba(255,255,255,0.3))',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'}} />
      </div>
    </Deco>
  );
};
