import React from 'react';
import {IMG_H, IMG_W} from '../lib/medal';

// Cinta satinada vectorial en coordenadas de product.png (437x1001): reemplaza la cinta plana del raw.
// Dos tramos (el superior girado ~20°, más oscuro) unidos por un pliegue diagonal, gradiente cilíndrico,
// orillos, brillo satinado que sigue el balanceo, remache redibujado y sombra de contacto sobre la medalla.
const RIVET = {x: 218, y: 457, r: 21};
const LOWER = '160,268 273,246 271,524 166,524';
const UPPER = '158,-80 274,-80 273,252 160,276';

export const Ribbon: React.FC<{sheen: number; rot: number; light: number; uid: string}> = ({sheen, rot, light, uid}) => {
  const id = (k: string) => `${uid}-${k}`;
  const lean = Math.max(-1, Math.min(1, rot / 6));
  const hx = 34 + lean * 10;
  return (
    <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} preserveAspectRatio="none" width="100%" height="100%"
      style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `brightness(${light})`}}>
      <defs>
        <linearGradient id={id('low')} x1="160" x2="273" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7C88A6" />
          <stop offset="0.07" stopColor="#B9C3D6" />
          <stop offset={(hx - 14) / 100} stopColor="#EEF1F7" />
          <stop offset={hx / 100} stopColor="#FFFFFF" />
          <stop offset={(hx + 22) / 100} stopColor="#E9EDF4" />
          <stop offset="0.86" stopColor="#B7C0D3" />
          <stop offset="1" stopColor="#6F7B99" />
        </linearGradient>
        <linearGradient id={id('up')} x1="158" x2="274" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5E6A8A" />
          <stop offset="0.35" stopColor="#97A3BD" />
          <stop offset={0.72 + lean * 0.06} stopColor="#D5DCE8" />
          <stop offset="1" stopColor="#8390AD" />
        </linearGradient>
        <linearGradient id={id('fold')} x1="0" x2="0" y1="246" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.06" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.12" stopColor="#3B4468" stopOpacity="0.38" />
          <stop offset="0.55" stopColor="#3B4468" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('len')} x1="0" x2="0" y1="246" y2="524" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset={Math.max(0.01, sheen - 0.09)} stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset={Math.max(0.02, sheen)} stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset={Math.min(0.99, sheen + 0.07)} stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.86" stopColor="#2A3157" stopOpacity="0" />
          <stop offset="1" stopColor="#2A3157" stopOpacity="0.32" />
        </linearGradient>
        <radialGradient id={id('rivet')} cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#EAD7AE" />
          <stop offset="0.28" stopColor="#B08C52" />
          <stop offset="0.7" stopColor="#6B4E26" />
          <stop offset="1" stopColor="#3A2913" />
        </radialGradient>
        <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id={id('soft2')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <clipPath id={id('clipLow')}><polygon points={LOWER} /></clipPath>
      </defs>
      <g filter={`url(#${id('soft')})`} opacity={0.42}>
        <polygon points={LOWER} fill="#0B0E26" transform={`translate(${8 - lean * 3} 10)`} />
      </g>
      <polygon points={UPPER} fill={`url(#${id('up')})`} />
      <polygon points={LOWER} fill={`url(#${id('low')})`} />
      <g clipPath={`url(#${id('clipLow')})`}>
        <rect x="150" y="230" width="140" height="310" fill={`url(#${id('fold')})`} />
        <rect x="150" y="230" width="140" height="310" fill={`url(#${id('len')})`} style={{mixBlendMode: 'screen'}} />
        <line x1="168.6" y1="262" x2="169.6" y2="524" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1" />
        <line x1="266.2" y1="246" x2="265.6" y2="524" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1" />
        <circle cx={RIVET.x + 2} cy={RIVET.y + 3} r={RIVET.r + 7} fill="none" stroke="#2C3456" strokeOpacity="0.28" strokeWidth="5" filter={`url(#${id('soft2')})`} />
      </g>
      <line x1="160" y1="268" x2="273" y2="246" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.4" />
      <rect x="170" y="519" width="104" height="14" rx="6" fill="#0B0E26" opacity="0.35" filter={`url(#${id('soft2')})`} />
      <circle cx={RIVET.x + 2.5} cy={RIVET.y + 4} r={RIVET.r} fill="#10132E" opacity="0.45" filter={`url(#${id('soft2')})`} />
      <circle cx={RIVET.x} cy={RIVET.y} r={RIVET.r} fill={`url(#${id('rivet')})`} stroke="#2E200E" strokeWidth="1.2" />
      <ellipse cx={RIVET.x - 6 + lean * 2} cy={RIVET.y - 8} rx="6.5" ry="3.6" fill="#FFFFFF" opacity="0.55" transform={`rotate(-28 ${RIVET.x - 6} ${RIVET.y - 8})`} />
    </svg>
  );
};
