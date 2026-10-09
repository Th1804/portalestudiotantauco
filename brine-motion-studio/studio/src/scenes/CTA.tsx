import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {LogoLayer, TextLayer, useInk, useQa} from '../lib/qa';
import {clamp, expoOut, settle} from '../lib/motion';
import {TEXT} from '../lib/fonts';
import type {Production} from '../types';

export const LOGO_W = 820, LOGO_H = Math.round((820 * 1391) / 3483), LOGO_TOP = 600;

// Cierre v2: continúa sobre el fondo azul (sin iris). Logo oficial intacto: solo opacidad, subida y escala UNIFORME
// (sin recolor, deformación, rotación, sombra ni glow). El barrido de luz pasa POR DETRÁS del logo (capa anterior).
export const CTA: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  const navyText = useInk(C.navy), cel = useInk(C.celeste);
  if (f < 370) return null;
  const logoIn = settle(f, 378, 110, 18, 0.9);
  const logoOp = interpolate(f, [378, 388], [0, 1], {...clamp, easing: expoOut});
  const pill = settle(f, 390, 170, 14, 0.7);
  const pillOp = interpolate(f, [390, 395], [0, 1], clamp);
  const url = settle(f, 400, 120, 18, 0.8);
  const urlTrack = interpolate(f, [400, 430], [0.3, 0.08], {...clamp, easing: expoOut});
  const shine = interpolate(f, [412, 436], [-0.3, 1.3], clamp);
  const breathe = 1 + 0.004 * Math.sin((f - 380) / 14);
  const floatY = 2.5 * Math.sin((f - 390) / 15);
  return (
    <AbsoluteFill>
      <LogoLayer>
        <Img src={staticFile('assets/logo.png')} style={{position: 'absolute', left: 540 - LOGO_W / 2, top: LOGO_TOP, width: LOGO_W, height: LOGO_H,
          opacity: logoOp, transform: `translateY(${(1 - logoIn) * 34}px) scale(${(0.965 + 0.035 * logoIn) * breathe})`, transformOrigin: '50% 50%',
          ...(qa === 'logo' ? {filter: 'brightness(0) invert(1)'} : {})}} />
      </LogoLayer>
      <TextLayer>
        <div style={{position: 'absolute', top: 1090 + floatY, left: 540 - 300, width: 600, height: 132, borderRadius: 66,
          background: qa === 'none' ? C.bone : 'transparent', border: qa === 'none' ? `3px solid ${C.gold}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          transform: `scale(${0.82 + 0.18 * pill})`, opacity: pillOp}}>
          <span data-qa="cta" style={{fontFamily: TEXT, fontWeight: 800, fontSize: 58, color: navyText, letterSpacing: 0.5}}>{p.script.on_screen.cta}</span>
          {qa === 'none' && <div style={{position: 'absolute', inset: 0, background: `linear-gradient(110deg, rgba(255,255,255,0) ${(shine - 0.12) * 100}%, rgba(205,167,31,0.25) ${shine * 100}%, rgba(255,255,255,0) ${(shine + 0.12) * 100}%)`}} />}
        </div>
        <div style={{position: 'absolute', top: 1262, left: 0, right: 0, display: 'flex', justifyContent: 'center', overflow: 'hidden', clipPath: 'inset(0)', paddingBottom: 6}}>
          <div data-qa="url" style={{fontFamily: TEXT, fontWeight: 600, fontSize: 46, letterSpacing: `${urlTrack}em`, marginRight: `-${urlTrack}em`, color: cel,
            transform: `translateY(${(1 - url) * 110}%)`}}>{p.script.on_screen.url}</div>
        </div>
      </TextLayer>
    </AbsoluteFill>
  );
};
