import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Deco, LogoLayer, QaCtx, QaProbe, TextLayer, useInk, useQa} from '../lib/qa';
import type {QaObject} from '../lib/qa';
import {DISPLAY, TEXT, ensureFonts} from '../lib/fonts';
import {clamp, expoIn, expoOut, rand, settle} from '../lib/motion';
import type {Production} from '../types';
import {trophyAabb, trophyRect} from './geometry';
import type {PaddleProduction, PaddleProps} from './types';

const NAVY = '#21254B';
const LOGO_W = 500;
const LOGO_H = Math.round((LOGO_W * 1391) / 3483);
const LOGO_TOP = 668;
const LOGO_HIT = 562;
const LOGO_CY = LOGO_TOP + LOGO_H / 2;

const obstacles = (f: number): QaObject[] => {
  const b = trophyAabb(f);
  if (!(b.op > 0.5)) return [];
  return [{
    id: 'trophy', kind: 'object', text: '', opacity: b.op,
    x0: Math.round(b.x0), y0: Math.round(b.y0), x1: Math.round(b.x1), y1: Math.round(b.y1),
  }];
};

const Backdrop: React.FC<{p: PaddleProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  if (qa !== 'none') return <AbsoluteFill style={{background: '#000'}} />;
  const lx = 540 + 180 * Math.sin(f / 68);
  const ly = 820 + 140 * Math.cos(f / 80);
  const courtOp = interpolate(f, [0, 20, 520, 548], [0.55, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <AbsoluteFill style={{background: `radial-gradient(980px 1200px at ${lx}px ${ly}px, rgba(173,190,212,0.20), rgba(33,37,75,0) 68%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(820px 520px at 540px 1680px, rgba(8,10,28,0.55), rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{opacity: courtOp * 0.7, filter: 'blur(16px)', transform: `translateY(${8 * Math.sin(f / 50)}px) scale(1.04)`}}>
        <svg width={1080} height={1920}>
          <g fill="none" stroke={C.celeste} strokeOpacity={0.55} strokeWidth={18}>
            <rect x={120} y={300} width={840} height={1320} rx={80} />
            <rect x={230} y={460} width={620} height={1000} rx={48} />
          </g>
        </svg>
      </AbsoluteFill>
      {Array.from({length: 5}, (_, i) => {
        const x = 200 + 760 * rand(i + 3) + 30 * Math.sin(f / (48 + i * 7));
        const y = 280 + 1300 * rand(i + 9) + 24 * Math.cos(f / (55 + i * 5));
        const r = 140 + 90 * rand(i + 15);
        return (
          <div key={i} style={{position: 'absolute', left: x - r, top: y - r * 0.55, width: r * 2, height: r * 1.1, borderRadius: '50%', filter: 'blur(28px)',
            background: `radial-gradient(ellipse, rgba(173,190,212,${0.10 + 0.05 * Math.sin(f / 20 + i)}), rgba(173,190,212,0) 70%)`}} />
        );
      })}
    </AbsoluteFill>
  );
};

const Texture: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const op = interpolate(f, [80, 120, 500, 540], [0, 0.9, 0.9, 0], clamp);
  const words = ['PÁDEL', '60227', 'CAMPEONES'];
  return (
    <AbsoluteFill style={{opacity: op * 0.55}}>
      {Array.from({length: 7}, (_, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        const x = -420 + dir * ((f * (0.55 + (i % 3) * 0.18)) % 720);
        const txt = Array.from({length: 5}, (__, k) => words[(i + k) % 3]).join('   ·   ');
        return (
          <div key={i} style={{position: 'absolute', top: 80 + i * 250, left: x, whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: 700,
            fontSize: 120, letterSpacing: 2, color: 'transparent', WebkitTextStroke: '1.25px rgba(173,190,212,0.16)', filter: 'blur(0.4px)'}}>{txt}</div>
        );
      })}
    </AbsoluteFill>
  );
};

const Dust: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  return (
    <AbsoluteFill style={{opacity: interpolate(f, [520, 550], [1, 0.25], clamp)}}>
      {Array.from({length: 28}, (_, i) => {
        const z = 0.35 + rand(i) * 0.8;
        const x = (rand(i + 40) * 1200 - 60 + Math.sin(f / (36 + (i % 7)) + i) * 10) % 1200 - 40;
        const y = ((rand(i + 80) * 2100 - f * (0.35 + z * 0.7)) % 2100 + 2100) % 2100 - 80;
        const size = 2 + z * 3.2;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (16 + (i % 6)) + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
          background: `rgba(201,213,228,${0.45 * tw})`}} />;
      })}
    </AbsoluteFill>
  );
};

const Word: React.FC<{
  id: string; text: string; top: number; size: number; family: string; weight: number; color: string;
  start: number; exit: number; trackFrom?: number; trackTo?: number; punch?: number;
}> = ({id, text, top, size, family, weight, color, start, exit, trackFrom = 0.04, trackTo = 0, punch = 1.04}) => {
  const f = useCurrentFrame();
  const letters = [...text];
  const sc = f <= start ? punch : 1 + (punch - 1) * Math.exp(-(f - start) / 4);
  const track = interpolate(f, [start, start + 28], [trackFrom, trackTo], {...clamp, easing: expoOut});
  const ly = (i: number, t: number) => {
    const inn = settle(t, start + i * 0.7, 160, 18, 0.8);
    const out = interpolate(t, [exit + i * 0.35, exit + i * 0.35 + 9], [0, 1], {...clamp, easing: expoIn});
    return (1 - inn) * 110 - out * 120;
  };
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${sc})`, transformOrigin: '50% 60%'}}>
        <div style={{overflow: 'hidden', padding: `${size * 0.12}px ${size * 0.08}px`}}>
          <div data-qa={id} style={{whiteSpace: 'nowrap', fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1,
            letterSpacing: `${track}em`, color, marginRight: `-${track}em`}}>
            {letters.map((c, i) => {
              const y = ly(i, f);
              const blur = Math.min(2.2, Math.abs(ly(i, f) - ly(i, f - 1)) * size * 0.008);
              return (
                <span key={i} style={{display: 'inline-block', transform: `translateY(${y}%)`, filter: blur > 0.45 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
                  {c === ' ' ? '\u00A0' : c}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const Hook: React.FC<{p: PaddleProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const C = p.brand.palette;
  const [a, b, c] = p.script.on_screen.hook;
  const bone = useInk(C.bone);
  const cel = useInk(C.celeste);
  if (f > 78) return null;
  const flash = Math.exp(-f / 4.2);
  const streak = interpolate(f, [0, 14], [1, 0], {...clamp, easing: expoOut});
  const line = interpolate(f, [34, 48], [0, 1], {...clamp, easing: expoOut}) * interpolate(f, [58, 70], [1, 0], clamp);
  const drift = 4 * Math.sin(f / 14);
  return (
    <AbsoluteFill>
      <Deco>
        <AbsoluteFill style={{background: `radial-gradient(640px 420px at 540px 700px, rgba(201,213,228,${0.45 * flash}), rgba(33,37,75,0) 70%)`}} />
        <div style={{position: 'absolute', top: 688, left: 540 - 700 * (0.5 + 0.5 * streak), width: 1400 * (0.5 + 0.5 * streak), height: 3,
          background: 'linear-gradient(90deg, rgba(244,246,249,0), rgba(244,246,249,0.95), rgba(244,246,249,0))', opacity: streak}} />
      </Deco>
      <TextLayer>
        <AbsoluteFill style={{transform: `translateY(${drift}px)`}}>
          <Word id="hook-para" text={a} top={468} size={40} family={TEXT} weight={600} color={cel} start={-18} exit={54} trackFrom={0.46} trackTo={0.34} punch={1} />
          <Word id="hook-campeones" text={b} top={548} size={112} family={DISPLAY} weight={800} color={bone} start={6} exit={56} trackFrom={0.06} trackTo={-0.02} punch={1.06} />
          <Word id="hook-padel" text={c} top={724} size={92} family={DISPLAY} weight={800} color={bone} start={24} exit={58} trackFrom={0.08} trackTo={0} punch={1.04} />
        </AbsoluteFill>
      </TextLayer>
      <Deco>
        <div style={{position: 'absolute', top: 868 + drift, left: 540 - 150 * line, width: 300 * line, height: 2, background: C.gold}} />
      </Deco>
    </AbsoluteFill>
  );
};

const Block: React.FC<{
  id: string; text: string; top: number; left: number; size: number; family: string; weight: number; color: string;
  start: number; end: number; track?: number; align?: 'left' | 'center';
}> = ({id, text, top, left, size, family, weight, color, start, end, track = 0, align = 'left'}) => {
  const f = useCurrentFrame();
  const inn = settle(f, start, 140, 17, 0.78);
  const out = interpolate(f, [end, end + 12], [0, 1], {...clamp, easing: expoIn});
  if (inn <= 0.01 && f < start) return null;
  if (out >= 0.99) return null;
  const y = (1 - inn) * 100 - out * 110;
  return (
    <div style={{position: 'absolute', top, left: align === 'center' ? 0 : left, right: align === 'center' ? 0 : undefined, display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start'}}>
      <div style={{overflow: 'hidden', padding: '6px 4px 10px'}}>
        <div data-qa={id} style={{whiteSpace: 'nowrap', fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1.05,
          letterSpacing: `${track}em`, marginRight: track ? `-${track}em` : undefined, color, transform: `translateY(${y}%)`}}>{text}</div>
      </div>
    </div>
  );
};

const Copy: React.FC<{p: PaddleProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const o = p.script.on_screen;
  const C = p.brand.palette;
  const bone = useInk(C.bone);
  const cel = useInk(C.celeste);
  const r = trophyRect(f);
  return (
    <TextLayer>
      <Block id="hero-eye" text={o.hero_eye} top={292} left={0} size={30} family={TEXT} weight={700} color={cel} start={104} end={172} track={0.22} align="center" />
      <Block id="hero-title" text={o.hero_title} top={352} left={0} size={68} family={DISPLAY} weight={700} color={bone} start={110} end={176} align="center" />
      <Block id="hero-model" text={o.hero_model} top={448} left={0} size={34} family={TEXT} weight={600} color={cel} start={118} end={180} track={0.06} align="center" />
      <Block id="measure-cm" text={o.measure[0]} top={r.y + r.h * 0.46} left={r.x + r.w + 46} size={44} family={DISPLAY} weight={700} color={bone} start={128} end={174} />
      <Block id="measure-alt" text={o.measure[1]} top={r.y + r.h * 0.46 + 64} left={r.x + r.w + 46} size={26} family={TEXT} weight={600} color={cel} start={134} end={176} track={0.04} />
      <Block id="plate-1" text={o.plate[0]} top={648} left={120} size={54} family={DISPLAY} weight={700} color={bone} start={242} end={328} />
      <Block id="plate-2" text={o.plate[1]} top={728} left={120} size={54} family={DISPLAY} weight={700} color={bone} start={248} end={332} />
      <Block id="plate-3" text={o.plate[2]} top={836} left={120} size={30} family={TEXT} weight={600} color={cel} start={256} end={336} />
      <Block id="plate-4" text={o.plate[3]} top={882} left={120} size={32} family={TEXT} weight={700} color={bone} start={262} end={340} />
      <Block id="plate-5" text={o.plate[4]} top={930} left={120} size={32} family={TEXT} weight={700} color={bone} start={268} end={344} />
      <Block id="case-eye" text={o.case_eye} top={668} left={588} size={26} family={TEXT} weight={700} color={cel} start={394} end={448} track={0.26} />
      <Block id="case-1" text={o.case[0]} top={748} left={588} size={48} family={DISPLAY} weight={700} color={bone} start={400} end={452} />
      <Block id="case-2" text={o.case[1]} top={840} left={588} size={42} family={DISPLAY} weight={600} color={bone} start={408} end={456} />
      <Block id="case-3" text={o.case[2]} top={908} left={588} size={42} family={DISPLAY} weight={600} color={bone} start={414} end={460} />
      <Block id="state-1" text={o.statement[0]} top={1004} left={0} size={52} family={DISPLAY} weight={600} color={bone} start={494} end={546} align="center" />
      <Block id="state-2" text={o.statement[1]} top={1088} left={0} size={76} family={DISPLAY} weight={800} color={bone} start={502} end={548} align="center" />
      <Block id="state-3" text={o.statement[2]} top={1204} left={0} size={32} family={TEXT} weight={600} color={cel} start={510} end={550} track={0.02} align="center" />
    </TextLayer>
  );
};

const Glass: React.FC<{p: PaddleProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  if (qa !== 'none') return null;
  const C = p.brand.palette;
  const plate = interpolate(f, [236, 254], [0, 1], {...clamp, easing: expoOut}) * interpolate(f, [340, 358], [1, 0], clamp);
  const box = interpolate(f, [388, 406], [0, 1], {...clamp, easing: expoOut}) * interpolate(f, [456, 474], [1, 0], clamp);
  const sheen = 42 + 18 * Math.sin(f / 18);
  const card = (op: number, x: number, shift: number) => op < 0.02 ? null : (
    <div style={{position: 'absolute', left: x, top: 600, width: 430, height: 430, borderRadius: 32, opacity: op,
      transform: `translateX(${(1 - op) * shift}px)`,
      background: 'linear-gradient(180deg, rgba(244,246,249,0.10), rgba(33,37,75,0.28))',
      border: '1px solid rgba(173,190,212,0.42)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 24px 60px rgba(5,8,20,0.35)',
      backdropFilter: 'blur(16px)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: -40, left: sheen, width: 90, height: 520, transform: 'rotate(18deg)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))'}} />
      <div style={{position: 'absolute', left: 36, top: 36, width: 46, height: 2, background: C.gold}} />
    </div>
  );
  return (
    <AbsoluteFill>
      {card(plate, 88, -36)}
      {card(box, 560, 36)}
    </AbsoluteFill>
  );
};

const MeasureRule: React.FC<{p: PaddleProduction}> = ({p}) => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const grow = interpolate(f, [126, 144], [0, 1], {...clamp, easing: expoOut}) * interpolate(f, [174, 188], [1, 0], clamp);
  if (grow < 0.02) return null;
  const r = trophyRect(f);
  const x = r.x + r.w + 22;
  const y0 = r.y + 8;
  const h = r.h - 16;
  return (
    <div style={{position: 'absolute', left: x, top: y0 + (h * (1 - grow)) / 2, width: 2, height: h * grow, background: p.brand.palette.celeste, opacity: 0.85}}>
      <div style={{position: 'absolute', left: -7, top: 0, width: 16, height: 2, background: p.brand.palette.celeste}} />
      <div style={{position: 'absolute', left: -7, bottom: 0, width: 16, height: 2, background: p.brand.palette.celeste}} />
    </div>
  );
};

const Trophy: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const r = trophyRect(f);
  if (r.op <= 0.01) return null;
  const src = staticFile('assets/paddle-60227.png');
  const sweep = (a: number, b: number) => interpolate(f, [a, b], [-0.45, 1.45], clamp);
  const sw = f < 180 ? sweep(118, 156) : f < 340 ? sweep(262, 300) : sweep(400, 438);
  const env = f < 112 || f > 520 ? 0 : 0.85;
  const mask = {WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'} as React.CSSProperties;
  return (
    <AbsoluteFill style={{opacity: r.op}}>
      <div style={{position: 'absolute', left: r.x + r.w * 0.18, top: r.y + r.h * 0.9, width: r.w * 0.64, height: r.h * 0.08, borderRadius: '50%',
        background: 'rgba(5,7,20,0.8)', filter: 'blur(18px)', opacity: 0.55}} />
      <div style={{position: 'absolute', left: r.cx - r.w * 0.7, top: r.y + r.h * 0.08, width: r.w * 1.4, height: r.w * 1.15, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(173,190,212,0.22), rgba(33,37,75,0) 68%)', filter: 'blur(8px)'}} />
      <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, transform: `rotate(${r.rot}deg)`, transformOrigin: '50% 60%'}}>
        <Img src={src} style={{width: '100%', height: '100%'}} />
        <div style={{position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen', opacity: env,
          background: `linear-gradient(108deg, rgba(255,255,255,0) ${(sw - 0.18) * 100}%, rgba(255,255,255,0.28) ${sw * 100}%, rgba(255,255,255,0) ${(sw + 0.14) * 100}%)`}} />
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{p: PaddleProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  const navyText = useInk(C.navy);
  const bone = useInk(C.bone);
  if (f < LOGO_HIT - 8) return null;
  const hit = f - LOGO_HIT;
  const beam = interpolate(f, [LOGO_HIT, LOGO_HIT + 16], [-0.3, 1.35], {...clamp, easing: expoOut});
  const beamEnv = interpolate(f, [LOGO_HIT, LOGO_HIT + 3, LOGO_HIT + 16, LOGO_HIT + 24], [0, 1, 0.4, 0], clamp);
  const logoIn = settle(f, LOGO_HIT, 130, 17, 0.85);
  const logoOp = interpolate(f, [LOGO_HIT, LOGO_HIT + 5], [0, 1], clamp);
  const mask = f < LOGO_HIT + 18 ? `linear-gradient(90deg, #000 ${(beam - 0.22) * 100}%, rgba(0,0,0,0) ${(beam + 0.04) * 100}%)` : undefined;
  const pill = settle(f, 578, 170, 15, 0.75);
  const pillOp = interpolate(f, [578, 586], [0, 1], clamp);
  const urlIn = settle(f, 592, 140, 18, 0.8);
  const urlOp = interpolate(f, [592, 602], [0, 1], clamp);
  const cyc = f >= 604 ? (f - 604) % 30 : -1;
  const tap = cyc >= 0 ? Math.sin(Math.PI * Math.min(1, cyc / 12)) : 0;
  return (
    <AbsoluteFill>
      <Deco>
        {hit >= 0 && hit < 26 && (
          <div style={{position: 'absolute', left: 540 - LOGO_W / 2 + beam * LOGO_W - 120, top: LOGO_CY - 220, width: 240, height: 440, borderRadius: '50%', opacity: beamEnv,
            background: 'radial-gradient(ellipse at center, rgba(244,246,249,0.55), rgba(173,190,212,0) 70%)', filter: 'blur(8px)'}} />
        )}
      </Deco>
      <LogoLayer>
        {f >= LOGO_HIT && (
          <Img src={staticFile('assets/logo.png')} style={{position: 'absolute', left: 540 - LOGO_W / 2, top: LOGO_TOP, width: LOGO_W, height: LOGO_H,
            opacity: logoOp, transform: `translateY(${(1 - logoIn) * 16}px) scale(${0.985 + 0.015 * logoIn})`, transformOrigin: '50% 50%',
            WebkitMaskImage: mask, maskImage: mask,
            ...(qa === 'logo' ? {filter: 'brightness(0) invert(1)'} : {})}} />
        )}
      </LogoLayer>
      <TextLayer>
        <div style={{position: 'absolute', top: 960, left: 540 - 330, width: 660, height: 112, borderRadius: 56,
          background: qa === 'none' ? C.bone : 'transparent', border: qa === 'none' ? `2.5px solid ${C.gold}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pillOp,
          transform: `scale(${0.86 + 0.14 * pill + 0.012 * tap})`}}>
          <span data-qa="cta" style={{fontFamily: TEXT, fontWeight: 800, fontSize: 46, color: navyText, whiteSpace: 'pre'}}>{p.script.on_screen.cta}</span>
        </div>
        <div style={{position: 'absolute', top: 1124, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div data-qa="url" style={{fontFamily: TEXT, fontWeight: 700, fontSize: 48, color: bone, letterSpacing: '0.03em', opacity: urlOp,
            transform: `translateY(${(1 - urlIn) * 16}px)`}}>{p.script.on_screen.url}</div>
        </div>
      </TextLayer>
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none') return null;
  const ox = Math.floor(rand(f) * 400);
  const oy = Math.floor(rand(f + 3) * 400);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{backgroundImage: `url(${staticFile('assets/grain.png')})`, backgroundPosition: `${ox}px ${oy}px`, mixBlendMode: 'overlay', opacity: 0.08}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 72% at 50% 48%, rgba(0,0,0,0) 55%, rgba(5,6,16,0.42) 100%)'}} />
    </AbsoluteFill>
  );
};

export const PaddleAd: React.FC<PaddleProps> = ({production, qaLayer}) => {
  ensureFonts();
  return (
    <QaCtx.Provider value={qaLayer}>
      <AbsoluteFill data-bms-root="1" style={{background: qaLayer === 'none' ? NAVY : '#000', overflow: 'hidden'}}>
        <Backdrop p={production} />
        <Texture />
        <Dust />
        <Trophy />
        <MeasureRule p={production} />
        <Glass p={production} />
        <Hook p={production} />
        <Copy p={production} />
        <EndCard p={production} />
        <Grain />
        <QaProbe p={production as unknown as Production} objects={obstacles} connectors={false} />
      </AbsoluteFill>
    </QaCtx.Provider>
  );
};
