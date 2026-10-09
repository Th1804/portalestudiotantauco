import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Deco, TextLayer, useInk} from '../lib/qa';
import {clamp, expoIn, expoOut, settle} from '../lib/motion';
import {DISPLAY, TEXT} from '../lib/fonts';
import type {Production} from '../types';

// v2 — gancho de tipografía cinética real (0-3 s):
// · disruptor en el frame 0 (destello anamórfico + "TU" ya en pleno golpe), nunca arranca vacío
// · revelado por letra a través de máscara, golpe de escala con desenfoque de movimiento direccional (SVG)
// · tracking animado, anticipación antes de salir y salida por máscara escalonada
type WordProps = {
  id: string; text: string; top: number; size: number; family: string; weight: number; color: string;
  start: number; exit: number; stagger?: number; punch?: number; punchAt?: number; trackFrom?: number; trackTo?: number; trackDur?: number;
};
const Word: React.FC<WordProps> = ({id, text, top, size, family, weight, color, start, exit, stagger = 1.6, punch = 1.0, punchAt, trackFrom = 0, trackTo = 0, trackDur = 30}) => {
  const f = useCurrentFrame();
  const letters = [...text];
  // golpe de escala (expo con micro-overshoot) y su velocidad -> motion blur
  const pa = punchAt ?? start;
  const sc = (t: number) => (t <= pa ? punch : 1 + (punch - 1) * Math.exp(-(t - pa) / 3.2));
  const scale = sc(f);
  const vScale = Math.abs(sc(f) - sc(f - 1));
  const track = interpolate(f, [start, start + trackDur], [trackFrom, trackTo], {...clamp, easing: expoOut});
  // posición de cada letra: entra desde abajo de la máscara (muelle con overshoot ~4 %), sale hacia arriba (expo-in)
  const ly = (i: number, t: number) => {
    const inn = settle(t, start + i * stagger, 170, 17, 0.7);
    const out = interpolate(t, [exit + i * 0.6, exit + i * 0.6 + 8], [0, 1], {...clamp, easing: expoIn});
    return (1 - inn) * 118 - out * 125; // % de la altura de la letra
  };
  let vy = 0;
  letters.forEach((_, i) => { vy = Math.max(vy, Math.abs(ly(i, f) - ly(i, f - 1))); });
  const blurY = Math.min(14, vy * size * 0.0018 * 6);
  const blurX = Math.min(22, vScale * size * 9);
  const fid = `mb-${id}`;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={fid} x="-30%" y="-40%" width="160%" height="180%">
          <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} ${blurY.toFixed(2)}`} />
        </filter>
      </svg>
      <div style={{transform: `scale(${scale})`, transformOrigin: '50% 55%', filter: blurX + blurY > 0.3 ? `url(#${fid})` : undefined}}>
        <div style={{overflow: 'hidden', clipPath: 'inset(0)', padding: `${size * 0.14}px ${size * 0.1}px`}}>
          <div data-qa={id} style={{whiteSpace: 'nowrap', fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1,
            letterSpacing: `${track}em`, color, marginRight: `-${track}em`}}>
            {letters.map((c, i) => (
              <span key={i} style={{display: 'inline-block', transform: `translateY(${ly(i, f)}%)`}}>{c === ' ' ? '\u00A0' : c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Hook: React.FC<{p: Production}> = ({p}) => {
  const f = useCurrentFrame();
  const [l1, l2, l3] = p.script.on_screen.hook;
  const [w1, ...rest] = l1.split(' ');
  const w2 = rest.join(' ');
  const bone = useInk(p.brand.palette.bone), cel = useInk(p.brand.palette.celeste);
  if (f > 60) return null;
  // anticipación del bloque antes de la salida + micro-deriva continua
  const antic = interpolate(f, [34, 41, 50], [1, 0.972, 1.03], {...clamp, easing: expoOut});
  const floatY = 6 * Math.sin(f / 13);
  const line = interpolate(f, [33, 44], [0, 1], {...clamp, easing: expoOut});
  const lineOut = interpolate(f, [42, 49], [0, 1], {...clamp, easing: expoIn});
  // disruptor del frame 0: destello anamórfico y flash frío que decaen en ~10 frames
  const flash = Math.exp(-f / 4.5);
  const streak = interpolate(f, [0, 12], [1, 0], {...clamp, easing: expoOut});
  return (
    <AbsoluteFill>
      <Deco>
        <AbsoluteFill style={{background: `radial-gradient(700px 520px at 540px 640px, rgba(201,213,228,${0.6 * flash}), rgba(33,37,75,0) 70%)`}} />
        <div style={{position: 'absolute', top: 636, left: 540 - 760 * (0.55 + 0.45 * streak), width: 1520 * (0.55 + 0.45 * streak), height: 4,
          background: 'linear-gradient(90deg, rgba(244,246,249,0) 0%, rgba(244,246,249,0.95) 50%, rgba(244,246,249,0) 100%)', opacity: streak, filter: 'blur(1px)'}} />
        <div style={{position: 'absolute', top: 618, left: 0, width: 1080, height: 40,
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,213,228,0.35), rgba(201,213,228,0) 70%)', opacity: streak}} />
      </Deco>
      <TextLayer>
        <AbsoluteFill style={{transform: `translateY(${floatY}px) scale(${antic})`, transformOrigin: '540px 760px'}}>
          <Word id="hook-tu" text={w1} top={390} size={150} family={DISPLAY} weight={900} color={bone} start={-9} punchAt={0} exit={41} punch={1.9} trackFrom={0.14} trackTo={0.02} trackDur={40} />
          <Word id="hook-logo" text={w2} top={540} size={250} family={DISPLAY} weight={900} color={bone} start={4} exit={42} stagger={2} punch={1.12} trackFrom={0.08} trackTo={-0.02} trackDur={44} />
          <Word id="hook-enuna" text={l2.toUpperCase()} top={858} size={44} family={TEXT} weight={500} color={cel} start={15} exit={43} stagger={0.8} trackFrom={0.9} trackTo={0.36} trackDur={26} />
          <Word id="hook-medalla" text={l3} top={930} size={146} family={DISPLAY} weight={900} color={bone} start={30} exit={44} stagger={1.4} punch={1.08} trackFrom={0.1} trackTo={0.0} trackDur={20} />
        </AbsoluteFill>
      </TextLayer>
      <Deco>
        <div style={{position: 'absolute', top: 1128 + floatY, left: 540 - 170 * line + 340 * lineOut, width: 340 * line * (1 - lineOut), height: 3, background: p.brand.palette.gold}} />
      </Deco>
    </AbsoluteFill>
  );
};
