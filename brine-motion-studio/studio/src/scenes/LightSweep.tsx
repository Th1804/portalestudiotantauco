import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {useQa} from '../lib/qa';
import {clamp, expoInOut} from '../lib/motion';
// v2: transición por luz que barre (reemplaza el wipe diagonal a blanco). Banda suave + bloom, fusión 'screen':
// ilumina lo que cruza sin tapar el fondo azul. sweepFront() la usan las escenas para revelar texto "con la luz".
export const sweepFront = (f: number, a: number, b: number) => interpolate(f, [a, b], [-0.35, 1.35], {...clamp, easing: expoInOut});
export const LightSweep: React.FC<{from: number; to: number; strength?: number; angle?: number}> = ({from, to, strength = 0.5, angle = 108}) => {
  const f = useCurrentFrame();
  if (useQa() !== 'none' || f < from - 1 || f > to + 1) return null;
  const x = sweepFront(f, from, to) * 100;
  const env = Math.sin(Math.PI * Math.min(1, Math.max(0, (f - from) / (to - from))));
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', opacity: env}}>
      <AbsoluteFill style={{background: `linear-gradient(${angle}deg, rgba(173,190,212,0) ${x - 26}%, rgba(201,213,228,${strength * 0.45}) ${x - 8}%, rgba(244,246,249,${strength}) ${x}%, rgba(201,213,228,${strength * 0.4}) ${x + 6}%, rgba(173,190,212,0) ${x + 22}%)`}} />
      <div style={{position: 'absolute', left: (x / 100) * 1080 - 500, top: 560, width: 1000, height: 800, borderRadius: '50%',
        background: `radial-gradient(ellipse, rgba(201,213,228,${0.35 * strength}), rgba(201,213,228,0) 70%)`, filter: 'blur(20px)'}} />
    </AbsoluteFill>
  );
};
