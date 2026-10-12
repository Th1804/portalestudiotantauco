import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Deco, LogoLayer, QaCtx, QaProbe, TextLayer, useInk, useQa} from '../lib/qa';
import type {QaObject} from '../lib/qa';
import {DISPLAY, TEXT, ensureFonts} from '../lib/fonts';
import {clamp, expoOut, rand, settle} from '../lib/motion';
import type {QaLayer} from '../types';
import {PrismText} from './PrismText';
import {Photo} from './Photo';
import {IRIS, LOGO_HIT, discScreen, dodecagon, irisRadius} from './geometry';
import type {CrystalProduction} from './types';

const Ice: React.FC<{p: CrystalProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  if (qa !== 'none') return <AbsoluteFill style={{background: '#000'}} />;
  const lx = 540 + 260 * Math.sin(f / 70), ly = 760 + 180 * Math.cos(f / 83);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, #F6F8FB 0%, ${C.ice} 45%, ${C.ice_deep} 100%)`}}>
      <AbsoluteFill style={{background: `radial-gradient(900px 760px at ${lx}px ${ly}px, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)`}} />
      {Array.from({length: 5}, (_, i) => {
        const x = 1080 * rand(i + 11) + 120 * Math.sin(f / (50 + 9 * i) + i), y = 300 + 1300 * rand(i + 21) + 80 * Math.cos(f / (61 + 7 * i));
        const r = 160 + 120 * rand(i + 31);
        return <div key={i} style={{position: 'absolute', left: x - r, top: y - r * 0.6, width: 2 * r, height: 1.2 * r, borderRadius: '50%', filter: 'blur(26px)',
          background: `radial-gradient(ellipse, rgba(173,190,212,${0.22 + 0.1 * Math.sin(f / 19 + i)}), rgba(173,190,212,0) 70%)`}} />;
      })}
    </AbsoluteFill>
  );
};

// motivo de facetas: dodecágonos de línea fina que giran detrás del gancho (la forma del canto del disco)
const Facets: React.FC<{p: CrystalProduction}> = ({p}) => {
  const f = useCurrentFrame();
  if (useQa() !== 'none' || f > 84) return null;
  const op = interpolate(f, [0, 4, 60, 80], [0.7, 1, 1, 0], clamp);
  // disruptor del frame 0: halo anamórfico frío detrás de la pregunta, que decae en ~14 frames (nunca arranca vacío)
  const streak = Math.exp(-f / 6);
  const grow = interpolate(f, [0, 16], [0.86, 1], {...clamp, easing: expoOut});
  return (
    <AbsoluteFill style={{opacity: op}}>
      <div style={{position: 'absolute', top: 540, left: 540 - 620 * (0.6 + 0.4 * streak), width: 1240 * (0.6 + 0.4 * streak), height: 230, opacity: streak, filter: 'blur(18px)',
        background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,255,255,1), rgba(173,190,212,0.7) 45%, rgba(173,190,212,0) 75%)'}} />
      <svg width={1080} height={1920} style={{transform: `scale(${grow})`, transformOrigin: '540px 900px'}}>
        {[260, 420, 600, 820].map((r, i) => {
          const rot = (i % 2 ? -1 : 1) * f * 0.25 + i * 7;
          const rr = r * (1 + 0.04 * Math.exp(-((f - 18) % 18) / 5) * (f >= 18 ? 1 : 0));
          const pts = Array.from({length: 12}, (_, k) => {
            const a = (rot * Math.PI) / 180 + (k * Math.PI) / 6;
            return `${540 + rr * Math.cos(a)},${900 + rr * Math.sin(a)}`;
          }).join(' ');
          return <polygon key={i} points={pts} fill="none" stroke={i === 1 ? p.brand.palette.case_blue : p.brand.palette.navy} strokeOpacity={i === 1 ? 0.16 : 0.08} strokeWidth={i === 1 ? 2.5 : 1.5} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Hook: React.FC<{p: CrystalProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const C = p.brand.palette;
  if (f > 84) return null;
  const [l1, l2, l3, l4] = p.script.on_screen.hook;
  const push = interpolate(f, [0, 70], [1.0, 1.035], clamp);
  const lift = interpolate(f, [50, 74], [0, -120], {...clamp, easing: expoOut});
  return (
    <AbsoluteFill style={{transform: `translateY(${lift}px) scale(${push})`, transformOrigin: '540px 900px'}}>
      <PrismText id="hook-1" text={l1} top={600} size={78} family={DISPLAY} weight={500} color={C.navy} start={-18} exit={50} from="left" spread={30} />
      <PrismText id="hook-2" text={l2} top={704} size={164} family={TEXT} weight={800} color={C.navy} start={9} exit={52} from="right" spread={60} tracking={-0.02} />
      <PrismText id="hook-3" text={l3} top={914} size={78} family={DISPLAY} weight={500} color={C.navy} start={21} exit={54} from="left" spread={30} />
      <PrismText id="hook-4" text={l4} top={1010} size={164} family={TEXT} weight={800} color={C.case_blue} start={27} exit={56} from="right" spread={60} tracking={-0.02} />
    </AbsoluteFill>
  );
};

const Sections: React.FC<{p: CrystalProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const C = p.brand.palette;
  const o = p.script.on_screen;
  const qa = useQa();
  const navy = C.navy, blue = C.case_blue;
  const H = {size: 112, family: TEXT, weight: 800, tracking: -0.025};
  const S = {family: DISPLAY, weight: 500};
  // regla de medida bajo "15 mm" (decorativa): se abre desde el centro con topes
  const rule = interpolate(f, [160, 174], [0, 1], {...clamp, easing: expoOut}) * interpolate(f, [180, 188], [1, 0], clamp);
  const chipIn = settle(f, 304, 180, 15, 0.7);
  const chipOp = interpolate(f, [304, 309], [0, 1], clamp) * interpolate(f, [340, 348], [1, 0], clamp);
  const chipInk = useInk(navy);
  return (
    <AbsoluteFill>
      <PrismText id="eyebrow" text={o.eyebrow} top={292} size={46} family={TEXT} weight={700} color={blue} start={88} exit={180} tracking={0.16} spread={24} stagger={0.4} />
      <PrismText id="refr-1" text={o.refraction[0]} top={366} {...H} color={navy} start={98} exit={132} from="left" />
      <PrismText id="refr-2" text={o.refraction[1]} top={498} size={80} {...S} color={navy} start={104} exit={134} from="right" />
      <PrismText id="mm-1" text={o.thickness[0]} top={350} size={150} family={TEXT} weight={800} color={navy} start={148} exit={180} from="right" tracking={-0.03} />
      <PrismText id="mm-2" text={o.thickness[1]} top={520} size={80} {...S} color={navy} start={154} exit={182} from="left" />
      <Deco>
        {rule > 0.01 && (
          <div style={{position: 'absolute', top: 506, left: 540 - 230 * rule, width: 460 * rule, height: 3, background: blue, opacity: 0.8}}>
            <div style={{position: 'absolute', left: 0, top: -9, width: 3, height: 21, background: blue}} />
            <div style={{position: 'absolute', right: 0, top: -9, width: 3, height: 21, background: blue}} />
          </div>
        )}
      </Deco>
      <PrismText id="laser-1" text={o.laser[0]} top={330} {...H} color={navy} start={196} exit={262} from="left" />
      <PrismText id="laser-2" text={o.laser[1]} top={466} size={80} {...S} color={blue} start={204} exit={264} from="right" />
      <PrismText id="case-1" text={o.case[0]} top={318} {...H} color={navy} start={282} exit={338} from="right" />
      <PrismText id="case-2" text={o.case[1]} top={456} size={62} {...S} color={navy} start={290} exit={340} from="left" stagger={0.4} />
      <TextLayer>
        {chipOp > 0 && (
          <div style={{position: 'absolute', top: 586, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: chipOp}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 34px', borderRadius: 60,
              background: qa === 'none' ? 'rgba(244,246,249,0.94)' : 'transparent', border: qa === 'none' ? `2.5px solid ${blue}` : 'none',
              transform: `scale(${0.8 + 0.2 * chipIn})`}}>
              <svg width={52} height={40} viewBox="0 0 52 40" style={{visibility: qa === 'none' ? 'visible' : 'hidden'}}>
                <polygon points={Array.from({length: 12}, (_, k) => `${16 + 13 * Math.cos(k * Math.PI / 6)},${24 + 13 * Math.sin(k * Math.PI / 6)}`).join(' ')} fill="none" stroke={blue} strokeWidth={3} />
                <polygon points={Array.from({length: 12}, (_, k) => `${38 + 10 * Math.cos(k * Math.PI / 6)},${27 + 10 * Math.sin(k * Math.PI / 6)}`).join(' ')} fill="none" stroke={blue} strokeWidth={3} />
              </svg>
              <span data-qa="chip-sizes" style={{fontFamily: TEXT, fontWeight: 700, fontSize: 50, color: chipInk, whiteSpace: 'pre'}}>{o.sizes_chip}</span>
            </div>
          </div>
        )}
      </TextLayer>
    </AbsoluteFill>
  );
};

export const LOGO_W = 820, LOGO_H = Math.round((820 * 1391) / 3483), LOGO_TOP = 610;
const LOGO_CY = LOGO_TOP + LOGO_H / 2;
const PILL_W = 640, PILL_H = 128, PILL_TOP = 1080;

const Iris: React.FC<{p: CrystalProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  if (f < IRIS.a) return null;
  const C = p.brand.palette;
  const d = discScreen(Math.min(f, IRIS.a));
  const r = irisRadius(f);
  const rot = 0.3 + f * 0.004;
  const done = f >= IRIS.b;
  const ringOp = interpolate(f, [IRIS.a, IRIS.a + 4, IRIS.b - 4, IRIS.b + 2], [0, 1, 0.8, 0], clamp);
  if (qa !== 'none') return <AbsoluteFill style={{background: '#000', clipPath: done ? undefined : dodecagon(d.x, d.y, r, rot)}} />;
  const glowY = 1650 + 40 * Math.sin(f / 30);
  return (
    <>
      <AbsoluteFill style={{clipPath: done ? undefined : dodecagon(d.x, d.y, r, rot), background: C.navy}}>
        <AbsoluteFill style={{background: `radial-gradient(1100px 620px at 540px ${glowY}px, rgba(53,86,145,0.55), rgba(33,37,75,0) 70%)`}} />
      </AbsoluteFill>
      {!done && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: ringOp}}>
          <polygon points={Array.from({length: 12}, (_, k) => {
            const a = rot + (k * Math.PI) / 6;
            return `${d.x + r * Math.cos(a)},${d.y + r * Math.sin(a)}`;
          }).join(' ')} fill="none" stroke="#C9D5E4" strokeWidth={5} />
        </svg>
      )}
    </>
  );
};

const EndCard: React.FC<{p: CrystalProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  const o = p.script.on_screen;
  const navyText = useInk(C.navy), bone = useInk(C.bone);
  if (f < LOGO_HIT - 2) return null;
  const hit = f - LOGO_HIT;
  const reveal = interpolate(f, [LOGO_HIT, LOGO_HIT + 12], [0, 520], {...clamp, easing: expoOut});
  const logoIn = settle(f, LOGO_HIT, 120, 17, 0.9);
  const logoOp = interpolate(f, [LOGO_HIT, LOGO_HIT + 3], [0, 1], clamp);
  const clip = f < LOGO_HIT + 12 ? dodecagon(LOGO_W / 2, LOGO_H / 2, reveal, 0.26) : undefined;
  const pill = settle(f, 376, 200, 14, 0.7);
  const pillOp = interpolate(f, [376, 381], [0, 1], clamp);
  const cyc = f >= 396 ? (f - 396) % 36 : -1;
  const tap = cyc >= 0 ? Math.sin(Math.PI * Math.min(1, cyc / 12)) : 0;
  const ring = cyc >= 0 ? cyc / 26 : 2;
  const arrowIn = settle(f, 386, 180, 14, 0.7);
  const url = settle(f, 386, 120, 18, 0.8);
  const urlOp = interpolate(f, [386, 393], [0, 1], clamp);
  const cta = [...o.cta];
  // destellos de facetas que saltan desde el borde del iris en el golpe (decorativos, fuera del logo)
  return (
    <AbsoluteFill>
      <Deco>
        {hit >= 0 && hit < 28 && Array.from({length: 18}, (_, i) => {
          const a = rand(i + 70) * Math.PI * 2, t = hit / 28, e = 1 - Math.pow(1 - t, 3);
          const R = 470 + 260 * rand(i + 80) * e;
          const x = 540 + Math.cos(a) * R, y = LOGO_CY + Math.sin(a) * R * 0.9;
          return <div key={i} style={{position: 'absolute', left: x - 3, top: y - 3, width: 6, height: 6, transform: 'rotate(45deg)',
            background: i % 3 ? '#F4F6F9' : '#ADBED4', opacity: (1 - t) * 0.85}} />;
        })}
      </Deco>
      <PrismText id="aud-1" text={o.audience[0]} top={380} size={52} family={TEXT} weight={600} color={C.celeste_light} start={366} from="left" spread={26} ghostA="#355691" ghostB="#ADBED4" stagger={0.4} blend="screen" />
      <PrismText id="aud-2" text={o.audience[1]} top={448} size={52} family={TEXT} weight={600} color={C.celeste_light} start={370} from="right" spread={26} ghostA="#355691" ghostB="#ADBED4" stagger={0.4} blend="screen" />
      <LogoLayer>
        {f >= LOGO_HIT && (
          <div style={{position: 'absolute', left: 540 - LOGO_W / 2, top: LOGO_TOP, width: LOGO_W, height: LOGO_H, clipPath: clip,
            opacity: logoOp, transform: `translateY(${(1 - logoIn) * 22}px) scale(${0.97 + 0.03 * logoIn})`, transformOrigin: '50% 50%'}}>
            <Img src={staticFile('assets/logo.png')} style={{width: LOGO_W, height: LOGO_H, ...(qa === 'logo' ? {filter: 'brightness(0) invert(1)'} : {})}} />
          </div>
        )}
      </LogoLayer>
      <Deco>
        {ring <= 1 && (
          <div style={{position: 'absolute', top: PILL_TOP - 20 * ring, left: 540 - PILL_W / 2 - 20 * ring, width: PILL_W + 40 * ring, height: PILL_H + 40 * ring,
            borderRadius: PILL_H, border: `3px solid ${C.celeste}`, opacity: (1 - ring) * 0.75 * pillOp}} />
        )}
      </Deco>
      <TextLayer>
        <div style={{position: 'absolute', top: PILL_TOP, left: 540 - PILL_W / 2, width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2,
          background: qa === 'none' ? C.bone : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          transform: `scale(${(0.74 + 0.26 * pill) * (1 + 0.012 * tap)})`, opacity: pillOp}}>
          <span data-qa="cta" style={{fontFamily: TEXT, fontWeight: 800, fontSize: 58, color: navyText, letterSpacing: 0.3, whiteSpace: 'pre'}}>
            {cta.map((c, k) => {
              const s0 = 378 + k * 0.6;
              const inn = settle(f, s0, 170, 16, 0.7);
              return <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: interpolate(f, [s0, s0 + 5], [0, 1], clamp),
                transform: `translateY(${(1 - inn) * 16}px)`, filter: `blur(${Math.max(0, (1 - inn) * 5).toFixed(2)}px)`}}>{c}</span>;
            })}
          </span>
          <svg width={44} height={36} viewBox="0 0 44 36" style={{visibility: qa === 'none' ? 'visible' : 'hidden', opacity: Math.min(1, Math.max(0, arrowIn)),
            transform: `translateX(${(1 - arrowIn) * -14 + 8 * tap}px)`}}>
            <path d="M3 18 H37 M24 5 L38 18 L24 31" fill="none" stroke={C.case_blue} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{position: 'absolute', top: 1266, left: 0, right: 0, display: 'flex', justifyContent: 'center', paddingBottom: 6}}>
          <div data-qa="url" style={{fontFamily: TEXT, fontWeight: 700, fontSize: 62, letterSpacing: '0.02em', marginRight: '-0.02em', color: bone,
            opacity: urlOp, filter: `blur(${Math.max(0, (1 - url) * 6).toFixed(2)}px)`, transform: `translateY(${(1 - url) * 22}px)`}}>{o.url}</div>
        </div>
      </TextLayer>
      <Deco>
        <div style={{position: 'absolute', top: 1360, left: 540 - 120 * Math.min(1, Math.max(0, url)), width: 240 * Math.min(1, Math.max(0, url)), height: 3,
          background: C.celeste, opacity: 0.7 * urlOp}} />
      </Deco>
    </AbsoluteFill>
  );
};

const obstacles = (f: number): QaObject[] => {
  const d = discScreen(f);
  if (f < 90 || f >= IRIS.a || d.cam.blur > 2) return [];
  return [{id: 'crystal-disc', kind: 'object', text: '', opacity: 1, x0: Math.round(d.x - d.r), y0: Math.round(d.y - d.r), x1: Math.round(d.x + d.r), y1: Math.round(d.y + d.r)}];
};

export const CrystalAd: React.FC<{production: CrystalProduction; qaLayer: QaLayer}> = ({production: p, qaLayer}) => {
  ensureFonts();
  return (
    <QaCtx.Provider value={qaLayer}>
      <AbsoluteFill data-bms-root="1" style={{background: qaLayer === 'none' ? p.brand.palette.ice : '#000', overflow: 'hidden'}}>
        <Ice p={p} />
        <Facets p={p} />
        <Photo engraving={p.script.on_screen.engraving_sample} />
        <Hook p={p} />
        <Sections p={p} />
        <Iris p={p} />
        <EndCard p={p} />
        <QaProbe p={p as never} objects={obstacles} connectors={false} />
      </AbsoluteFill>
    </QaCtx.Provider>
  );
};
