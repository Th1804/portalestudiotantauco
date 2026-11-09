import React from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Deco} from '../lib/qa';
import {clamp} from '../lib/motion';
import {EASE, ballAt} from './geometry';

export const BALL_FILE = 'assets/balon-crack-cutout.png';

// La máscara CSS (url del recorte) no la espera Remotion: se precarga una vez con delayRender para que el primer
// frame de cada pestaña ya tenga la silueta lista.
let maskReady = false;
const usePreloadMask = (src: string) => {
  React.useLayoutEffect(() => {
    if (maskReady || typeof window === 'undefined') return;
    const h = delayRender('ball-mask');
    const img = new Image();
    img.src = src;
    img.decode().catch(() => undefined).finally(() => { maskReady = true; continueRender(h); });
  }, [src]);
};

// Barridos de luz cálida sobre el cuero: solo suman luz ('screen') dentro de la silueta exacta del recorte.
const SWEEPS = [
  {a: 52, b: 100, angle: 118, s: 0.34},
  {a: 172, b: 210, angle: 64, s: 0.2},
  {a: 252, b: 312, angle: 72, s: 0.4},
  {a: 332, b: 370, angle: 116, s: 0.2},
  {a: 410, b: 456, angle: 122, s: 0.3},
  {a: 492, b: 530, angle: 66, s: 0.2},
  {a: 560, b: 602, angle: 112, s: 0.28},
];

const Sweep: React.FC<{f: number; a: number; b: number; angle: number; s: number; mask: string}> = ({f, a, b, angle, s, mask}) => {
  if (f < a - 1 || f > b + 1) return null;
  const x = interpolate(f, [a, b], [-30, 130], {...clamp, easing: EASE.inOutCubic});
  const env = Math.sin(Math.PI * Math.min(1, Math.max(0, (f - a) / (b - a))));
  return (
    <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: env, WebkitMaskImage: mask, maskImage: mask,
      WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
      background: `linear-gradient(${angle}deg, rgba(255,246,222,0) ${x - 26}%, rgba(255,240,205,${0.3 * s}) ${x - 10}%, rgba(255,250,236,${s}) ${x}%, rgba(255,240,205,${0.28 * s}) ${x + 7}%, rgba(255,246,222,0) ${x + 20}%)`}} />
  );
};

export const BallLayer: React.FC = () => {
  const f = useCurrentFrame();
  const src = staticFile(BALL_FILE);
  usePreloadMask(src);
  const b = ballAt(f);
  const mask = `url(${src})`;
  const hover = 1 + 0.035 * Math.sin(f / 36 + Math.PI);
  return (
    <Deco>
      <AbsoluteFill style={{opacity: b.op}}>
        {/* halo frío detrás del balón (separa el amarillo del navy) y sombra de contacto: el balón flota */}
        <div style={{position: 'absolute', left: b.cx - b.w * 0.95, top: b.cy - b.w * 0.95, width: b.w * 1.9, height: b.w * 1.9, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,213,228,0.26) 0%, rgba(173,190,212,0.12) 34%, rgba(173,190,212,0) 66%)'}} />
        <div style={{position: 'absolute', left: b.cx - b.w * 0.36 * hover, top: b.cy + b.h * 0.5 + 34, width: b.w * 0.72 * hover, height: b.w * 0.1, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(5,6,22,0.62), rgba(5,6,22,0) 70%)', filter: 'blur(12px)', opacity: 0.9 / hover}} />
        <div style={{position: 'absolute', left: b.cx - b.w / 2, top: b.cy - b.h / 2, width: b.w, height: b.h,
          transform: `rotate(${b.rot.toFixed(3)}deg)`, transformOrigin: '50% 50%'}}>
          <Img src={src} style={{position: 'absolute', inset: 0, width: b.w, height: b.h}} />
          {/* luz principal arriba-izquierda y caída suave en el canto: volumen, sin tocar la impresión */}
          <div style={{position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
            background: 'radial-gradient(circle at 46% 42%, rgba(20,18,44,0) 58%, rgba(20,18,44,0.24) 100%)'}} />
          <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
            background: 'radial-gradient(circle at 30% 22%, rgba(255,248,230,0.16), rgba(255,248,230,0) 42%)'}} />
          {SWEEPS.map((s, i) => <Sweep key={i} f={f} {...s} mask={mask} />)}
        </div>
      </AbsoluteFill>
    </Deco>
  );
};
