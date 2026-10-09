import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Deco, LogoLayer, TextLayer, useInk, useQa} from '../lib/qa';
import {clamp, expoOut, rand, settle} from '../lib/motion';
import {TEXT} from '../lib/fonts';
import type {Production} from '../types';

export const LOGO_W = 820, LOGO_H = Math.round((820 * 1391) / 3483), LOGO_TOP = 600;
// golpe final de la música (beat 26 = 13,0 s): la luz revela el logo en este frame
export const LOGO_HIT = 390;
const LOGO_CY = LOGO_TOP + LOGO_H / 2;
const BEAM_END = LOGO_HIT + 14;
const PILL_W = 680, PILL_H = 132, PILL_TOP = 1090;

// Cierre v3 (12-15 s): un filamento de luz se carga sobre el eje del logo (anticipación), estalla en el golpe
// y se convierte en un haz que cruza POR DETRÁS del logo; el logo se descubre con una máscara de borde muy suave
// que sigue al haz. El logo oficial no recibe ningún efecto: solo máscara de entrada, opacidad y escala uniforme
// (sin recolor, deformación, rotación, sombra ni glow). CTA con micro-animación a tempo (cada 2 beats).
export const CTA: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  const navyText = useInk(C.navy), bone = useInk(C.bone);
  if (f < 370) return null;
  const hit = f - LOGO_HIT;
  const punch = 1 + (hit >= 0 ? 0.016 * Math.exp(-hit / 5) : 0);
  // filamento: crece hacia el golpe y se disipa
  const fil = interpolate(f, [374, LOGO_HIT], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const filOut = interpolate(f, [LOGO_HIT, LOGO_HIT + 9], [0, 1], {...clamp, easing: expoOut});
  // haz y máscara del logo (0..1 del ancho del logo)
  const beam = interpolate(f, [LOGO_HIT, BEAM_END], [-0.25, 1.3], {...clamp, easing: expoOut});
  const beamEnv = interpolate(f, [LOGO_HIT, LOGO_HIT + 3, BEAM_END - 2, BEAM_END + 6], [0, 1, 0.55, 0], clamp);
  const logoIn = settle(f, LOGO_HIT, 120, 17, 0.9);
  const logoOp = interpolate(f, [LOGO_HIT, LOGO_HIT + 4], [0, 1], clamp);
  const mask = f < BEAM_END + 2 ? `linear-gradient(90deg, #000 ${(beam - 0.26) * 100}%, rgba(0,0,0,0) ${(beam + 0.02) * 100}%)` : undefined;
  // CTA
  const pill = settle(f, 398, 200, 13, 0.7);
  const pillOp = interpolate(f, [398, 403], [0, 1], clamp);
  const cyc = f >= 414 ? (f - 414) % 30 : -1;
  const tap = cyc >= 0 ? Math.sin(Math.PI * Math.min(1, cyc / 10)) : 0;
  const ring = cyc >= 0 ? cyc / 22 : 2;
  const floatY = 2.5 * Math.sin((f - 398) / 15);
  const arrowIn = settle(f, 410, 180, 14, 0.7);
  const url = settle(f, 410, 120, 18, 0.8);
  const urlOp = interpolate(f, [410, 418], [0, 1], clamp);
  const urlTrack = interpolate(f, [410, 436], [0.08, 0.03], {...clamp, easing: expoOut});
  const cta = [...p.script.on_screen.cta];
  return (
    <AbsoluteFill style={{transform: `scale(${punch})`, transformOrigin: `540px ${LOGO_CY}px`}}>
      <Deco>
        <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
          {f < LOGO_HIT + 10 && (
            <>
              <div style={{position: 'absolute', top: LOGO_CY - 1.5 - 3 * filOut, left: 540 - 400 * fil, width: 800 * fil, height: 3 + 6 * filOut, borderRadius: 4,
                background: `linear-gradient(90deg, rgba(244,246,249,0), rgba(244,246,249,${0.95 * fil}) 30%, rgba(255,255,255,${fil}) 50%, rgba(244,246,249,${0.95 * fil}) 70%, rgba(244,246,249,0))`,
                opacity: 1 - filOut}} />
              <div style={{position: 'absolute', top: LOGO_CY - 60, left: 540 - 460 * fil, width: 920 * fil, height: 120, borderRadius: '50%',
                background: `radial-gradient(ellipse, rgba(201,213,228,${0.4 * fil}), rgba(201,213,228,0) 70%)`, filter: 'blur(14px)', opacity: 1 - filOut}} />
            </>
          )}
          {f >= LOGO_HIT && f < BEAM_END + 8 && (
            <div style={{position: 'absolute', left: 540 - LOGO_W / 2 + beam * LOGO_W - 170, top: LOGO_CY - 420, width: 340, height: 840, borderRadius: '50%', opacity: beamEnv,
              background: 'radial-gradient(ellipse at center, rgba(244,246,249,0.75), rgba(201,213,228,0.32) 38%, rgba(173,190,212,0) 70%)', filter: 'blur(10px)'}} />
          )}
          {hit >= 0 && hit < 30 && Array.from({length: 16}, (_, i) => {
            const sx = 540 + (rand(i + 3) - 0.5) * 760, dir = rand(i + 40) < 0.5 ? -1 : 1;
            const t = hit / 30, e = 1 - Math.pow(1 - t, 3);
            const y = LOGO_CY + dir * (40 + 260 * rand(i + 9)) * e, x = sx + (sx - 540) * 0.25 * e;
            return <div key={i} style={{position: 'absolute', left: x - 3, top: y - 3, width: 6, height: 6, borderRadius: 3,
              background: i % 3 ? '#F4F6F9' : '#C9D5E4', opacity: (1 - t) * 0.9}} />;
          })}
        </AbsoluteFill>
      </Deco>
      <LogoLayer>
        {f >= LOGO_HIT && (
          <Img src={staticFile('assets/logo.png')} style={{position: 'absolute', left: 540 - LOGO_W / 2, top: LOGO_TOP, width: LOGO_W, height: LOGO_H,
            opacity: logoOp, transform: `translateY(${(1 - logoIn) * 26}px) scale(${0.97 + 0.03 * logoIn})`, transformOrigin: '50% 50%',
            WebkitMaskImage: mask, maskImage: mask,
            ...(qa === 'logo' ? {filter: 'brightness(0) invert(1)'} : {})}} />
        )}
      </LogoLayer>
      <Deco>
        {ring <= 1 && (
          <div style={{position: 'absolute', top: PILL_TOP + floatY - 22 * ring, left: 540 - PILL_W / 2 - 22 * ring, width: PILL_W + 44 * ring, height: PILL_H + 44 * ring,
            borderRadius: PILL_H, border: `3px solid ${C.bone}`, opacity: (1 - ring) * 0.8 * pillOp}} />
        )}
      </Deco>
      <TextLayer>
        <div style={{position: 'absolute', top: PILL_TOP + floatY, left: 540 - PILL_W / 2, width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2,
          background: qa === 'none' ? C.bone : 'transparent', border: qa === 'none' ? `3px solid ${C.gold}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          transform: `scale(${(0.72 + 0.28 * pill) * (1 + 0.014 * tap)})`, opacity: pillOp}}>
          <span data-qa="cta" style={{fontFamily: TEXT, fontWeight: 800, fontSize: 58, color: navyText, letterSpacing: 0.5, whiteSpace: 'pre'}}>
            {cta.map((c, k) => {
              const s0 = 402 + k * 0.7;
              const inn = settle(f, s0, 170, 16, 0.7);
              return <span key={k} style={{display: 'inline-block', opacity: interpolate(f, [s0, s0 + 5], [0, 1], clamp),
                transform: `translateY(${(1 - inn) * 18}px)`, filter: `blur(${Math.max(0, (1 - inn) * 5).toFixed(2)}px)`}}>{c}</span>;
            })}
          </span>
          <svg width={44} height={36} viewBox="0 0 44 36" style={{visibility: qa === 'none' ? 'visible' : 'hidden', opacity: Math.min(1, Math.max(0, arrowIn)),
            transform: `translateX(${(1 - arrowIn) * -14 + 9 * tap}px)`}}>
            <path d="M3 18 H37 M24 5 L38 18 L24 31" fill="none" stroke={C.navy} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{position: 'absolute', top: 1262, left: 0, right: 0, display: 'flex', justifyContent: 'center', paddingBottom: 6}}>
          <div data-qa="url" style={{fontFamily: TEXT, fontWeight: 700, fontSize: 56, letterSpacing: `${urlTrack}em`, marginRight: `-${urlTrack}em`, color: bone,
            opacity: urlOp, filter: `blur(${Math.max(0, (1 - url) * 6).toFixed(2)}px)`, transform: `translateY(${(1 - url) * 26}px)`}}>{p.script.on_screen.url}</div>
        </div>
      </TextLayer>
    </AbsoluteFill>
  );
};
