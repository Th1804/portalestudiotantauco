import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {QaCtx, QaProbe} from './lib/qa';
import {ensureFonts} from './lib/fonts';
import type {Props} from './types';
import {Background, ForegroundBokeh, Grain, Particles, TypeTexture} from './scenes/Background';
import {Hook} from './scenes/Hook';
import {Medal} from './scenes/Medal';
import {RevealText} from './scenes/Reveal';
import {Benefits} from './scenes/Benefits';
import {Statement, SWEEP_A, SWEEP_B} from './scenes/Statement';
import {CTA} from './scenes/CTA';
import {LightSweep} from './scenes/LightSweep';
import {Layer} from './lib/camera';
import {beatPulse} from './lib/motion';

// v2: cámara virtual con dolly + parallax en 3 capas (fondo 0,35 · medio 1 · primer plano 1,8);
// la luz que barre y el cierre van en espacio de pantalla.
export const Main: React.FC<Props> = ({production: p, qaLayer}) => {
  ensureFonts();
  const f = useCurrentFrame();
  const groove = f >= 214 && f < 286 ? 1 : 0;
  const bump = 1 + 0.008 * groove * beatPulse(f, p.beats.bpm, p.format.fps, 5);
  return (
    <QaCtx.Provider value={qaLayer}>
      <AbsoluteFill data-bms-root="1" style={{background: qaLayer === 'none' ? p.brand.palette.navy : '#000', overflow: 'hidden'}}>
        <Layer depth={0.35}>
          <Background p={p} />
          <TypeTexture p={p} />
          <Particles dim={0.8} />
        </Layer>
        <AbsoluteFill style={{transform: `scale(${bump})`}}>
          <Layer depth={1}>
            <Hook p={p} />
            <Medal />
            <Benefits p={p} />
          </Layer>
          <Layer depth={0.3}>
            <RevealText p={p} />
          </Layer>
          <Layer depth={1.8}>
            <ForegroundBokeh />
          </Layer>
        </AbsoluteFill>
        <LightSweep from={SWEEP_A} to={SWEEP_B} strength={0.7} />
        <Layer depth={0.6}>
          <Statement p={p} />
        </Layer>
        <LightSweep from={358} to={386} strength={0.3} angle={112} />
        <CTA p={p} />
        <Grain />
        <QaProbe p={p} />
      </AbsoluteFill>
    </QaCtx.Provider>
  );
};
