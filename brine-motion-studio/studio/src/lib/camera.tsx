import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, expoInOut} from './motion';
// Cámara virtual v2: dolly (z), paneo suave y parallax en 3 capas (fondo 0,35 · medio 1 · primer plano 1,8).
export const camera = (f: number) => {
  const z = interpolate(f, [0, 44, 60, 195, 214, 288, 318, 366, 450], [1.0, 1.045, 1.0, 1.08, 1.0, 1.03, 1.0, 1.035, 1.0], {...clamp, easing: expoInOut});
  const orbit = interpolate(f, [195, 300], [-14, 14], clamp);
  const x = 12 * Math.sin(f / 71) + interpolate(f, [60, 128, 195], [0, 22, -6], {...clamp, easing: expoInOut}) + (f >= 195 && f < 300 ? orbit : 0) * Math.sin(Math.PI * Math.min(1, Math.max(0, (f - 195) / 105)));
  const y = 8 * Math.sin(f / 53 + 1) + interpolate(f, [60, 195], [0, -14], clamp);
  return {x, y, z};
};
export const Layer: React.FC<{depth: number; children: React.ReactNode}> = ({depth, children}) => {
  const f = useCurrentFrame();
  const c = camera(f);
  const s = 1 + (c.z - 1) * depth;
  return (
    <AbsoluteFill style={{transform: `translate(${c.x * depth}px, ${c.y * depth}px) scale(${s})`, transformOrigin: '540px 960px'}}>
      {children}
    </AbsoluteFill>
  );
};
