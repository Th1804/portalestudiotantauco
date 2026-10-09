import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useQa} from '../lib/qa';
import {clamp, rand} from '../lib/motion';
import {DISPLAY} from '../lib/fonts';
import type {Production} from '../types';

// v2: la cámara vive en lib/camera.tsx (capas con parallax); este stub mantiene compatibilidad.
export const Camera = (_f: number) => ({x: 0, y: 0});

export const Background: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  if (qa !== 'none') return <AbsoluteFill style={{background: '#000'}} />;
  const cam = Camera(f);
  const lx = 540 + 220 * Math.sin(f / 60) - cam.x * 0.3;
  const ly = 900 + 160 * Math.cos(f / 75);
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <AbsoluteFill style={{background: `radial-gradient(1100px 1300px at ${lx}px ${ly}px, rgba(173,190,212,0.22), rgba(33,37,75,0) 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(900px 700px at 540px 1900px, rgba(10,12,30,0.55), rgba(0,0,0,0) 70%)`}} />
    </AbsoluteFill>
  );
};

// Tipografía como textura (principio REF2), en parallax
export const TypeTexture: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const op = interpolate(f, [64, 100, 296, 312], [0, 1, 1, 0], clamp);
  const tex = (p as any).visual_direction?.texture_opacity ?? 0.15;
  const cam = Camera(f);
  const words = ['TU LOGO', 'TU NOMBRE', 'TU FECHA'];
  return (
    <AbsoluteFill style={{opacity: op, filter: 'blur(1.2px)'}}>
      {Array.from({length: 9}).map((_, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        const x = -600 + dir * ((f * (1.1 + (i % 3) * 0.35)) % 900);
        const txt = Array.from({length: 6}).map((__, k) => words[(i + k) % 3]).join('  ·  ');
        return (
          <div key={i} style={{position: 'absolute', top: 40 + i * 215, left: x, whiteSpace: 'nowrap', fontFamily: DISPLAY,
            fontWeight: 900, fontSize: 168, letterSpacing: -2, color: 'transparent',
            WebkitTextStroke: `1.6px rgba(173,190,212,${tex})`}}>{txt}</div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Particles: React.FC<{dim?: number}> = ({dim = 1}) => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const cam = Camera(f);
  const items = Array.from({length: 70}).map((_, i) => {
    const z = 0.3 + rand(i) * 0.9;
    const x = (rand(i + 100) * 1180 - 50 + cam.x * z * 1.6 + Math.sin(f / (40 + i) + i) * 12 * z + 1080) % 1180 - 50;
    const y = ((rand(i + 200) * 2100 - f * (0.6 + z * 1.4)) % 2100 + 2100) % 2100 - 90 + cam.y * z;
    const size = 2 + z * 6;
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(f / (14 + (i % 9)) + i));
    const gold = i % 11 === 0;
    const col = gold ? '205,167,31' : i % 3 === 0 ? '244,246,249' : '173,190,212';
    return (<div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, rgba(${col},${0.9 * tw}) 0%, rgba(${col},0) 70%)`, opacity: dim}} />);
  });
  const bokeh = Array.from({length: 6}).map((_, i) => {
    const x = rand(i + 300) * 1080 + cam.x * 3; const y = rand(i + 400) * 1920 - (f * 0.4) % 200;
    const r = 120 + rand(i + 500) * 160;
    return (<div key={'b' + i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(201,213,228,0.08) 0%, rgba(201,213,228,0.03) 55%, rgba(0,0,0,0) 70%)', opacity: dim}} />);
  });
  return <AbsoluteFill>{bokeh}{items}</AbsoluteFill>;
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const ox = Math.floor(rand(f) * 512), oy = Math.floor(rand(f + 7) * 512);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{backgroundImage: `url(${staticFile('assets/grain.png')})`, backgroundPosition: `${ox}px ${oy}px`,
        mixBlendMode: 'overlay', opacity: 0.09}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(5,6,18,0.38) 100%)'}} />
    </AbsoluteFill>
  );
};

// Bokeh de primer plano (capa Z delantera, parallax x1.8)
export const ForegroundBokeh: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const cam = Camera(f);
  const op = interpolate(f, [60, 90, 296, 312], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: op}}>
      {Array.from({length: 5}).map((_, i) => {
        const r = 70 + rand(i + 900) * 90;
        const x = ((rand(i + 910) * 1300 + f * (1.2 + rand(i + 920))) % 1400) - 160 + cam.x * 1.8;
        const y = 300 + rand(i + 930) * 1400 + Math.sin(f / 40 + i) * 30 + cam.y * 1.8;
        return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,246,249,0.10) 0%, rgba(244,246,249,0.06) 50%, rgba(244,246,249,0) 70%)'}} />;
      })}
    </AbsoluteFill>
  );
};
