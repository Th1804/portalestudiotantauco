import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useQa} from '../lib/qa';
import {clamp} from '../lib/motion';
import {medalBox, medalState, RIBBON} from '../lib/medal';

// Producto + luz dinámica + cinta con volumen (v2): gradiente cilíndrico, pliegue, brillo satinado móvil y sombra suave.
// Todo el sombreado se enmascara con el alfa del producto y se limita a la zona de la cinta: la cara de la medalla no se toca.
export const Medal: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const st = medalState(f);
  if (!st.vis) return null;
  const bx = medalBox(st);
  const src = staticFile('assets/product.png');
  const sweep = (a: number, b: number) => interpolate(f, [a, b], [-0.6, 1.6], clamp);
  const s1 = sweep(56, 92), s2 = sweep(150, 178), s3 = sweep(244, 270);
  const sw = f < 120 ? s1 : f < 220 ? s2 : s3;
  const shadowOp = interpolate(f, [52, 72], [0, 0.55], clamp) * interpolate(f, [298, 312], [1, 0], clamp);
  const mask = {WebkitMaskImage: `url(${src})`, WebkitMaskSize: '100% 100%', maskImage: `url(${src})`, maskSize: '100% 100%'} as React.CSSProperties;
  // el brillo satinado de la cinta sigue el balanceo (follow-through de la luz)
  const satin = 38 + st.rot * 4 + 6 * Math.sin(f / 31);
  const R = 218 * st.s; const dx = st.cx, dy = st.cy;
  const haloOp = interpolate(f, [56, 90, 290, 306], [0, 1, 1, 0], clamp);
  const ring = interpolate(f, [70, 110], [0, 1], clamp) * interpolate(f, [286, 300], [1, 0], clamp);
  const pulse = 1 + 0.04 * Math.exp(-((f % 15) / 5));
  const tilt = -14 + 3 * Math.sin(f / 50);
  const rib = {left: `${RIBBON.x0 * 100}%`, width: `${(RIBBON.x1 - RIBBON.x0) * 100}%`, top: 0, height: `${RIBBON.y1 * 100}%`};
  return (
    <AbsoluteFill style={{perspective: 1600}}>
      <div style={{position: 'absolute', left: dx - R * 1.9 * pulse, top: dy - R * 1.9 * pulse, width: R * 3.8 * pulse, height: R * 3.8 * pulse, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,213,228,0.30) 0%, rgba(173,190,212,0.10) 40%, rgba(33,37,75,0) 70%)', opacity: haloOp}} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: ring}}>
        <g transform={`rotate(${tilt} ${dx} ${dy})`}>
          <ellipse cx={dx} cy={dy} rx={R * 1.42} ry={R * 0.42} fill="none" stroke="rgba(244,246,249,0.30)" strokeWidth={1.5} />
          <ellipse cx={dx} cy={dy} rx={R * 1.42} ry={R * 0.42} fill="none" stroke="#CDA71F" strokeWidth={2.5} pathLength={100}
            strokeDasharray="7 93" strokeDashoffset={-f * 0.9} strokeLinecap="round" />
        </g>
      </svg>
      <AbsoluteFill style={{opacity: st.op, filter: st.blur > 0.4 ? `blur(${st.blur.toFixed(2)}px)` : undefined}}>
        <div style={{position: 'absolute', left: bx.left + bx.w * 0.06 + 28, top: bx.top + bx.h * 0.6 + 40, width: bx.w * 0.92, height: bx.h * 0.4,
          borderRadius: '50%', background: 'rgba(5,7,22,0.85)', filter: `blur(${(34 * st.s) / 1.3}px)`, opacity: shadowOp,
          transform: `rotate(${st.rot}deg)`, transformOrigin: `${bx.w / 2}px ${-bx.h * 0.6}px`}} />
        <div style={{position: 'absolute', left: bx.left, top: bx.top, width: bx.w, height: bx.h,
          transformOrigin: '50% 0%', transform: `rotate(${st.rot}deg) rotateY(${st.ry}deg)`}}>
          <Img src={src} style={{width: '100%', height: '100%', filter: `brightness(${st.light}) contrast(1.04)`}} />
          {/* cinta: volumen cilíndrico + pliegue + sombra junto al remache (multiply) */}
          <div style={{position: 'absolute', inset: 0, ...mask, mixBlendMode: 'multiply'}}>
            <div style={{position: 'absolute', ...rib,
              background: [
                'linear-gradient(90deg, rgba(120,132,168,0.62) 0%, rgba(205,213,230,0.18) 18%, rgba(255,255,255,0) 34%, rgba(255,255,255,0) 62%, rgba(150,160,190,0.30) 84%, rgba(105,116,152,0.66) 100%)',
                'linear-gradient(173deg, rgba(255,255,255,0) 52%, rgba(98,108,145,0.55) 56.5%, rgba(160,170,198,0.25) 58.5%, rgba(255,255,255,0) 61%)',
                'linear-gradient(180deg, rgba(110,120,155,0.45) 0%, rgba(255,255,255,0) 18%, rgba(255,255,255,0) 76%, rgba(80,90,125,0.55) 100%)',
              ].join(', ')}} />
            {/* sombra suave que la cinta proyecta sobre la argolla */}
            <div style={{position: 'absolute', left: '30%', width: '40%', top: `${(RIBBON.y1 - 0.01) * 100}%`, height: '5%', borderRadius: '50%',
              background: 'radial-gradient(ellipse at 50% 30%, rgba(40,48,85,0.45), rgba(255,255,255,0) 70%)', filter: 'blur(6px)'}} />
          </div>
          {/* brillo satinado móvil (screen), solo en la cinta */}
          <div style={{position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen'}}>
            <div style={{position: 'absolute', ...rib,
              background: `linear-gradient(180deg, rgba(255,255,255,0) ${satin - 14}%, rgba(255,255,255,0.20) ${satin}%, rgba(255,255,255,0) ${satin + 12}%),
                linear-gradient(173deg, rgba(255,255,255,0) 59%, rgba(255,255,255,0.28) 60.5%, rgba(255,255,255,0) 63%)`}} />
          </div>
          {/* barrido especular general */}
          <div style={{position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen',
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${(sw - 0.25) * 100}%, rgba(255,255,255,0.5) ${sw * 100}%, rgba(255,255,255,0) ${(sw + 0.18) * 100}%)`}} />
          {/* tinte frío lateral según rotateY (volumen) */}
          <div style={{position: 'absolute', inset: 0, ...mask, mixBlendMode: 'multiply',
            background: `linear-gradient(90deg, rgba(173,190,212,${0.18 + st.ry / 80}) 0%, rgba(255,255,255,0) 45%, rgba(173,190,212,${Math.max(0, 0.18 - st.ry / 80)}) 100%)`}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
