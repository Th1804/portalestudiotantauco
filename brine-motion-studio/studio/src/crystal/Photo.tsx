import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Deco} from '../lib/qa';
import {clamp, expoInOut, rand, smooth} from '../lib/motion';
import {DISPLAY} from '../lib/fonts';
import {DISC, SATIN, SRC, photoCam} from './geometry';

// Foto real de la ficha (white_to_alpha, sin retoque) con cámara virtual. Todo lo que vive "sobre el producto"
// (luces, destellos, grabado) se dibuja en coordenadas de la foto dentro del mismo contenedor transformado.
// La luz solo ilumina (blend 'screen' enmascarado al disco o al paño): no cambia la forma ni el color del producto.
const BEATS = [90, 108, 126, 144, 162, 180, 234, 252, 284, 306, 324];

const discMask = `radial-gradient(circle at ${DISC.x}px ${DISC.y}px, #000 ${DISC.r - 6}px, rgba(0,0,0,0) ${DISC.r + 2}px)`;
const rimMask = `radial-gradient(circle at ${DISC.x}px ${DISC.y}px, rgba(0,0,0,0) ${DISC.r - 34}px, #000 ${DISC.r - 18}px, #000 ${DISC.r - 2}px, rgba(0,0,0,0) ${DISC.r + 4}px)`;

const Sweep: React.FC<{f: number; a: number; b: number; angle: number; strength: number; mask: string}> = ({f, a, b, angle, strength, mask}) => {
  if (f < a - 1 || f > b + 1) return null;
  const x = interpolate(f, [a, b], [-40, 140], {...clamp, easing: expoInOut});
  const env = Math.sin(Math.PI * Math.min(1, Math.max(0, (f - a) / (b - a))));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: SRC, height: SRC, mixBlendMode: 'screen', opacity: env, WebkitMaskImage: mask, maskImage: mask,
      background: `linear-gradient(${angle}deg, rgba(255,255,255,0) ${x - 24}%, rgba(201,213,228,${0.35 * strength}) ${x - 8}%, rgba(255,255,255,${strength}) ${x}%, rgba(201,213,228,${0.3 * strength}) ${x + 5}%, rgba(255,255,255,0) ${x + 18}%)`}} />
  );
};

const Glint: React.FC<{x: number; y: number; t: number; size: number}> = ({x, y, t, size}) => {
  if (t < 0 || t > 1) return null;
  const e = Math.sin(Math.PI * t);
  const L = size * (0.4 + 0.6 * e);
  return (
    <div style={{position: 'absolute', left: x, top: y, mixBlendMode: 'screen', opacity: e, transform: `rotate(${12 + 30 * t}deg)`}}>
      <div style={{position: 'absolute', left: -L, top: -1.5, width: 2 * L, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0), #fff, rgba(255,255,255,0))'}} />
      <div style={{position: 'absolute', left: -1.5, top: -L, width: 3, height: 2 * L, borderRadius: 2, background: 'linear-gradient(180deg, rgba(255,255,255,0), #fff, rgba(255,255,255,0))'}} />
      <div style={{position: 'absolute', left: -L * 0.35, top: -L * 0.35, width: L * 0.7, height: L * 0.7, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(201,213,228,0) 70%)'}} />
    </div>
  );
};

// Grabado láser de ejemplo (frost blanco) que una cabeza láser escribe sobre el disco, línea por línea.
const ENGRAVE = [
  {i: 0, y: 598, size: 92, a: 214, b: 242, weight: 700, track: 0.06},
  {i: 1, y: 712, size: 92, a: 246, b: 268, weight: 700, track: 0.06},
  {i: 2, y: 812, size: 46, a: 271, b: 280, weight: 600, track: 0.4},
];
const LINE_HALF = 205;
export const laserHead = (f: number) => {
  const l = ENGRAVE.find((e) => f >= e.a && f <= e.b);
  if (!l) return null;
  const u = interpolate(f, [l.a, l.b], [0, 1], clamp);
  const half = l.i === 2 ? 70 : LINE_HALF;
  const x = DISC.x - half + 2 * half * u;
  const y = l.y - l.size * 0.32 + Math.sin(f * 2.3) * l.size * 0.22;
  return {x, y, u, line: l};
};
const Engraving: React.FC<{f: number; words: string[]}> = ({f, words}) => {
  if (f < 212) return null;
  const head = laserHead(f);
  return (
    <>
      {ENGRAVE.map((l) => {
        const half = l.i === 2 ? 70 : LINE_HALF;
        const rev = interpolate(f, [l.a, l.b], [0, 1], clamp);
        const cut = DISC.x - half + 2 * half * rev;
        const clip = `inset(0px ${Math.max(0, SRC - cut - 4)}px 0px 0px)`;
        const glow = f >= l.a && f <= l.b + 6 ? interpolate(f, [l.b, l.b + 6], [1, 0], clamp) : 0;
        if (rev <= 0) return null;
        return (
          <div key={l.i} style={{position: 'absolute', left: 0, width: SRC, top: l.y - l.size * 0.62, height: l.size * 1.3, display: 'flex', justifyContent: 'center',
            alignItems: 'center', clipPath: clip}}>
            <div style={{fontFamily: DISPLAY, fontWeight: l.weight, fontSize: l.size, letterSpacing: `${l.track}em`, marginRight: `-${l.track}em`, lineHeight: 1,
              color: 'rgba(240,245,252,0.82)', textShadow: `0 0 ${2 + 10 * glow}px rgba(220,235,255,${0.55 + 0.4 * glow}), 0 1px 0 rgba(255,255,255,0.35)`, filter: 'blur(0.35px)'}}>
              {words[l.i]}
            </div>
          </div>
        );
      })}
      {head && (
        <>
          <div style={{position: 'absolute', left: head.x - 2.5, top: head.y - 900, width: 5, height: 900, mixBlendMode: 'screen',
            background: 'linear-gradient(180deg, rgba(150,220,255,0), rgba(170,225,255,0.55) 70%, rgba(235,248,255,0.95))'}} />
          <div style={{position: 'absolute', left: head.x - 46, top: head.y - 46, width: 92, height: 92, borderRadius: '50%', mixBlendMode: 'screen',
            background: 'radial-gradient(circle, #fff 0%, #fff 9%, rgba(205,235,255,0.95) 20%, rgba(120,200,255,0.4) 45%, rgba(120,200,255,0) 70%)'}} />
          {Array.from({length: 10}, (_, i) => {
            const t = ((f * 0.9 + i * 0.37) % 1);
            const ang = -Math.PI / 2 + (rand(i + Math.floor(f / 3) * 13) - 0.5) * 2.4;
            const d = 10 + 46 * t;
            return <div key={i} style={{position: 'absolute', left: head.x + Math.cos(ang) * d - 2, top: head.y + Math.sin(ang) * d + 26 * t * t - 2,
              width: 4, height: 4, borderRadius: 2, background: '#F4FAFF', opacity: (1 - t) * 0.9, mixBlendMode: 'screen'}} />;
          })}
        </>
      )}
    </>
  );
};
export const Photo: React.FC<{engraving: string[]}> = ({engraving}) => {
  const f = useCurrentFrame();
  const c = photoCam(f);
  if (f < 54) return null;
  const tx = c.cx - c.px * c.s, ty = c.cy - c.py * c.s;
  // anillo de dispersión: el canto facetado separa la luz en un arco que gira lento
  const rimRot = 40 + f * 0.9;
  const rimOp = interpolate(f, [80, 110, 330, 350], [0, 0.5, 0.5, 0], clamp) * (0.75 + 0.25 * Math.sin(f / 9));
  const caustic = interpolate(f, [84, 120, 330, 350], [0, 1, 1, 0], clamp);
  const sheen = interpolate(f, [292, 340], [-30, 130], {...clamp, easing: smooth});
  const sheenEnv = interpolate(f, [290, 300, 334, 344], [0, 1, 1, 0], clamp);
  // glints: aparecen en las facetas a tempo (beats), cada uno en un ángulo distinto del canto
  const glints = BEATS.map((b, i) => {
    const a = (-0.9 + i * 2.39) % (2 * Math.PI);
    return {x: DISC.x + Math.cos(a) * (DISC.r - 8), y: DISC.y + Math.sin(a) * (DISC.r - 8), t: (f - b + 2) / 16, size: 30 + 16 * rand(i + 5)};
  });
  return (
    <Deco>
      <AbsoluteFill style={{WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 548px, rgba(0,0,0,0.35) 650px, rgba(0,0,0,0.8) 760px, #000 860px)', maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 548px, rgba(0,0,0,0.35) 650px, rgba(0,0,0,0.8) 760px, #000 860px)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: SRC, height: SRC, transformOrigin: '0 0', opacity: c.op,
          transform: `translate(${tx}px, ${ty}px) scale(${c.s})`, filter: c.blur > 0.4 ? `blur(${(c.blur / c.s).toFixed(2)}px)` : undefined}}>
          {/* cáusticas: luz que atraviesa el cristal y cae sobre el piso, bajo la base */}
          <div style={{position: 'absolute', left: DISC.x - 330 + 30 * Math.sin(f / 37), top: 1085, width: 660, height: 150, borderRadius: '50%', opacity: 0.55 * caustic,
            background: 'radial-gradient(ellipse at 40% 50%, rgba(201,213,228,0.9), rgba(173,190,212,0.35) 40%, rgba(238,242,247,0) 72%)', filter: 'blur(10px)'}} />
          <div style={{position: 'absolute', left: DISC.x - 150 + 60 * Math.sin(f / 23 + 1), top: 1120, width: 300, height: 60, borderRadius: '50%', opacity: 0.5 * caustic,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)', filter: 'blur(6px)'}} />
          <Img src={staticFile('assets/galvano-cta15-main.png')} style={{position: 'absolute', left: 0, top: 0, width: SRC, height: SRC}} />
          {/* brillo satinado sobre el paño de seda */}
          <div style={{position: 'absolute', left: SATIN.x0, top: SATIN.y0, width: SATIN.x1 - SATIN.x0, height: SATIN.y1 - SATIN.y0, mixBlendMode: 'screen', opacity: 0.55 * sheenEnv,
            background: `linear-gradient(118deg, rgba(120,150,210,0) ${sheen - 22}%, rgba(150,175,225,0.55) ${sheen - 6}%, rgba(220,230,250,0.75) ${sheen}%, rgba(150,175,225,0.4) ${sheen + 6}%, rgba(120,150,210,0) ${sheen + 20}%)`}} />
          <Sweep f={f} a={98} b={140} angle={112} strength={0.62} mask={discMask} />
          <Sweep f={f} a={150} b={184} angle={64} strength={0.42} mask={discMask} />
          <Sweep f={f} a={284} b={318} angle={100} strength={0.36} mask={discMask} />
          <div style={{position: 'absolute', left: 0, top: 0, width: SRC, height: SRC, mixBlendMode: 'screen', opacity: rimOp, WebkitMaskImage: rimMask, maskImage: rimMask,
            background: `conic-gradient(from ${rimRot}deg at ${DISC.x}px ${DISC.y}px, rgba(255,255,255,0) 0deg, rgba(150,200,255,0.9) 22deg, rgba(255,255,255,1) 36deg, rgba(255,214,235,0.75) 50deg, rgba(255,255,255,0) 72deg, rgba(255,255,255,0) 180deg, rgba(190,230,255,0.8) 200deg, rgba(255,255,255,0.9) 214deg, rgba(255,255,255,0) 236deg)`}} />
          {glints.map((g, i) => <Glint key={i} x={g.x} y={g.y} t={g.t} size={g.size} />)}
          <Engraving f={f} words={engraving} />
        </div>
      </AbsoluteFill>
    </Deco>
  );
};
