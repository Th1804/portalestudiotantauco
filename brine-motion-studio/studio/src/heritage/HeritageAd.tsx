import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Deco, LogoLayer, QaCtx, QaProbe, useQa} from '../lib/qa';
import type {QaObject} from '../lib/qa';
import {DISPLAY, TEXT, ensureFonts} from '../lib/fonts';
import {clamp, rand} from '../lib/motion';
import {Grain} from '../scenes/Background';
import type {QaLayer} from '../types';
import {Backdrop, ForeBokeh} from './Backdrop';
import {BallLayer} from './Ball';
import {Glass} from './Glass';
import {Line} from './Type';
import {CHIP, EASE, LOGO, LOGO_H, LOGO_HIT, PANEL_LOW, SUB_PILL, URL_PILL, WIN, ballAt, panelOp} from './geometry';
import type {Rect} from './geometry';
import type {HeritageProduction} from './types';

// Filete dorado (acento): se abre desde el centro al entrar y se cierra hacia la derecha al salir.
const Rule: React.FC<{y: number; w: number; a: number; b?: number; color: string}> = ({y, w, a, b = 1e9, color}) => {
  const f = useCurrentFrame();
  const inn = interpolate(f, [a, a + 18], [0, 1], {...clamp, easing: EASE.outQuart});
  const out = interpolate(f, [b, b + 9], [0, 1], {...clamp, easing: EASE.inQuad});
  if (inn <= 0 || out >= 1) return null;
  return (
    <Deco>
      <div style={{position: 'absolute', top: y, left: 540 - (w / 2) * inn + w * out, width: w * inn * (1 - out), height: 2.5, background: color}} />
    </Deco>
  );
};

// Disruptor del frame 0: destello cálido anamórfico detrás de "1962" que decae en ~12 frames (nunca arranca vacío).
const Flare: React.FC = () => {
  const f = useCurrentFrame();
  if (useQa() !== 'none' || f > 40) return null;
  const k = Math.exp(-f / 7);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen'}}>
      <div style={{position: 'absolute', top: 470, left: 540 - 700 * (0.5 + 0.5 * k), width: 1400 * (0.5 + 0.5 * k), height: 5, borderRadius: 3, opacity: k,
        background: 'linear-gradient(90deg, rgba(255,244,220,0), rgba(255,248,232,0.95), rgba(255,244,220,0))', filter: 'blur(1.5px)'}} />
      <div style={{position: 'absolute', top: 300, left: 40, width: 1000, height: 340, borderRadius: '50%', opacity: 0.55 * k,
        background: 'radial-gradient(ellipse, rgba(255,240,214,0.5), rgba(201,213,228,0.12) 45%, rgba(0,0,0,0) 72%)', filter: 'blur(10px)'}} />
    </AbsoluteFill>
  );
};

const Scenes: React.FC<{p: HeritageProduction}> = ({p}) => {
  const o = p.script.on_screen;
  const C = p.brand.palette;
  const serif = {family: DISPLAY};
  const sans = {family: TEXT};
  return (
    <>
      {/* 0-80 · gancho: MUNDIAL / 1962 */}
      <Line id="hook-eyebrow" text={o.hook[0]} top={312} size={36} {...sans} weight={600} color={C.celeste} start={-14} exit={64} tracking={0.62} trackFrom={0.95} stagger={0.6} rise={14} />
      <Line id="hook-1962" text={o.hook[1]} top={352} size={270} {...serif} weight={900} color={C.bone} start={-14} exit={66} tracking={-0.01} trackFrom={0.06} stagger={2.2} rise={40} lineHeight={1.0} />
      <Rule y={676} w={150} a={8} b={64} color={C.gold} />

      {/* 80-160 · título */}
      <Line id="title-1" text={o.title[0]} top={292} size={124} {...serif} weight={800} color={C.bone} start={82} exit={140} tracking={-0.005} trackFrom={0.05} stagger={1.1} />
      <Line id="title-2" text={o.title[1]} top={452} size={60} {...serif} weight={500} color={C.celeste} start={92} exit={142} tracking={0.01} stagger={0.8} />
      <Rule y={570} w={110} a={98} b={142} color={C.gold} />

      {/* 160-240 · balón oficial (panel de vidrio abajo) */}
      <Glass r={PANEL_LOW} a={WIN.official.a} b={WIN.official.b} seed={1} />
      <Line id="off-1" text={o.official[0]} top={1130} size={60} {...serif} weight={700} color={C.bone} start={168} exit={216} />
      <Line id="off-2" text={o.official[1]} top={1210} size={60} {...serif} weight={700} color={C.bone} start={173} exit={217} />
      <Line id="off-3" text={o.official[2]} top={1290} size={60} {...serif} weight={700} color={C.celeste} start={178} exit={218} />
      <Rule y={1414} w={90} a={196} b={214} color={C.gold} />

      {/* 240-320 · 18 paneles (balón grande abajo, barrido lento sobre las costuras) */}
      <Line id="pan-num" text={o.panels.num} top={262} size={230} {...serif} weight={900} color={C.bone} start={244} exit={298} align="right" x={424} stagger={3} rise={34} lineHeight={1.0} />
      <Line id="pan-1" text={o.panels.lines[0]} top={318} size={54} {...serif} weight={600} color={C.bone} start={250} exit={299} align="left" x={452} />
      <Line id="pan-2" text={o.panels.lines[1]} top={390} size={54} {...serif} weight={600} color={C.celeste} start={255} exit={300} align="left" x={452} />
      <Glass r={SUB_PILL} a={WIN.panelsSub.a} b={WIN.panelsSub.b} radius={52} seed={2} tint={0.9} />
      <Line id="pan-sub-1" text={o.panels.sub[0]} top={558} size={27} {...sans} weight={600} color={C.celeste_light} start={260} exit={300} tracking={0.14} stagger={0.35} rise={10} upper />
      <Line id="pan-sub-2" text={o.panels.sub[1]} top={598} size={27} {...sans} weight={600} color={C.celeste_light} start={264} exit={301} tracking={0.14} stagger={0.35} rise={10} upper />

      {/* 320-400 · Custodio Zamora (panel de vidrio abajo) */}
      <Glass r={PANEL_LOW} a={WIN.maker.a} b={WIN.maker.b} seed={3} />
      <Line id="maker-eyebrow" text={o.maker.eyebrow} top={1122} size={26} {...sans} weight={700} color={C.celeste} start={328} exit={376} tracking={0.42} trackFrom={0.7} stagger={0.4} rise={10} />
      <Line id="maker-name" text={o.maker.name} top={1160} size={78} {...serif} weight={800} color={C.bone} start={332} exit={377} stagger={1.0} />
      <Line id="maker-place" text={o.maker.place} top={1258} size={44} {...serif} weight={500} color={C.bone} start={338} exit={378} stagger={0.6} />
      <Rule y={1336} w={80} a={352} b={374} color={C.gold} />
      <Line id="maker-note-1" text={o.maker.note[0]} top={1352} size={30} {...sans} weight={500} color={C.celeste_light} start={346} exit={379} stagger={0.4} rise={12} />
      <Line id="maker-note-2" text={o.maker.note[1]} top={1394} size={30} {...sans} weight={500} color={C.celeste_light} start={350} exit={380} stagger={0.4} rise={12} />

      {/* 400-480 · relanzado en 2018 */}
      <Line id="rel-1" text={o.relaunch[0]} top={296} size={88} {...serif} weight={800} color={C.bone} start={404} exit={460} tracking={-0.005} trackFrom={0.04} stagger={1.0} />
      <Line id="rel-2" text={o.relaunch[1]} top={420} size={62} {...serif} weight={500} color={C.celeste} start={412} exit={462} stagger={0.8} />
      <Rule y={540} w={110} a={428} b={456} color={C.gold} />

      {/* 480-560 · oficio: tres chips de vidrio */}
      {o.craft.map((t, i) => {
        const w = WIN.chips[i];
        const r: Rect = {x0: CHIP.x0, x1: CHIP.x1, y0: CHIP.tops[i], y1: CHIP.tops[i] + CHIP.h};
        return (
          <React.Fragment key={i}>
            <Glass r={r} a={w.a} b={w.b} radius={CHIP.h / 2} seed={4 + i} />
            <Line id={`craft-${i + 1}`} text={t} top={CHIP.tops[i] + 22} size={46} {...serif} weight={600} color={C.bone} start={w.a + 5} exit={w.b - 3} stagger={0.5} rise={14} />
          </React.Fragment>
        );
      })}
    </>
  );
};

const EndCard: React.FC<{p: HeritageProduction}> = ({p}) => {
  const f = useCurrentFrame();
  const qa = useQa();
  const C = p.brand.palette;
  if (f < LOGO_HIT - 2) return null;
  const hit = f - LOGO_HIT;
  // el logo oficial se descubre con una máscara de borde suave que sigue a un haz de luz; sin efectos sobre el logo
  const beam = interpolate(f, [LOGO_HIT, LOGO_HIT + 20], [-0.3, 1.35], {...clamp, easing: EASE.outQuart});
  const mask = f < LOGO_HIT + 22 ? `linear-gradient(90deg, #000 ${(beam - 0.3) * 100}%, rgba(0,0,0,0) ${(beam + 0.02) * 100}%)` : undefined;
  const logoIn = interpolate(f, [LOGO_HIT, LOGO_HIT + 24], [0, 1], {...clamp, easing: EASE.outQuart});
  const beamEnv = interpolate(f, [LOGO_HIT, LOGO_HIT + 4, LOGO_HIT + 18, LOGO_HIT + 26], [0, 1, 0.5, 0], clamp);
  const lx = 540 - LOGO.w / 2;
  return (
    <AbsoluteFill>
      <Line id="closing-name" text={p.script.on_screen.closing_name} top={280} size={52} family={DISPLAY} weight={600} color={C.bone} start={566} tracking={0.01} stagger={0.5} />
      <Deco>
        {hit >= 0 && hit < 30 && (
          <div style={{position: 'absolute', left: lx + beam * LOGO.w - 130, top: LOGO.top - 160, width: 260, height: LOGO_H + 320, borderRadius: '50%', opacity: beamEnv,
            mixBlendMode: 'screen', filter: 'blur(12px)', background: 'radial-gradient(ellipse, rgba(244,246,249,0.55), rgba(201,213,228,0.18) 40%, rgba(173,190,212,0) 70%)'}} />
        )}
        {hit >= 0 && hit < 34 && Array.from({length: 14}, (_, i) => {
          const t = hit / 34, e = 1 - Math.pow(1 - t, 3);
          const sx = 540 + (rand(i + 3) - 0.5) * 520, dir = rand(i + 40) < 0.5 ? -1 : 1;
          const y = LOGO.top + LOGO_H / 2 + dir * (30 + 150 * rand(i + 9)) * e;
          return <div key={i} style={{position: 'absolute', left: sx - 2.5, top: y - 2.5, width: 5, height: 5, borderRadius: 3,
            background: i % 3 ? '#F4F6F9' : '#C9D5E4', opacity: (1 - t) * 0.8}} />;
        })}
      </Deco>
      <LogoLayer>
        {f >= LOGO_HIT && (
          <Img src={staticFile('assets/logo.png')} style={{position: 'absolute', left: lx, top: LOGO.top, width: LOGO.w, height: LOGO_H,
            opacity: interpolate(f, [LOGO_HIT, LOGO_HIT + 6], [0, 1], clamp), transform: `translateY(${(1 - logoIn) * 18}px)`,
            WebkitMaskImage: mask, maskImage: mask, ...(qa === 'logo' ? {filter: 'brightness(0) invert(1)'} : {})}} />
        )}
      </LogoLayer>
      <Glass r={URL_PILL} a={WIN.url.a} b={WIN.url.b} radius={(URL_PILL.y1 - URL_PILL.y0) / 2} seed={8} tint={1.1} />
      <Line id="url" text={p.script.on_screen.url} top={URL_PILL.y0 + 21} size={50} family={TEXT} weight={700} color={C.bone} start={WIN.url.a + 4} tracking={0.03} stagger={0.6} rise={14} />
    </AbsoluteFill>
  );
};

// Obstáculos para la QA: el balón ('object') y paneles/logo ('panel'). qa.py exige que ningún texto ni panel toque el balón.
const rectObj = (id: string, r: Rect, op: number): QaObject => ({id, kind: 'panel', text: '', opacity: Math.round(op * 100) / 100,
  x0: Math.round(r.x0), y0: Math.round(r.y0), x1: Math.round(r.x1), y1: Math.round(r.y1)});
const obstacles = (f: number): QaObject[] => {
  const b = ballAt(f);
  const out: QaObject[] = [];
  if (b.op > 0 && b.cy - b.h / 2 < 1920) {
    const rad = (Math.abs(b.rot) * Math.PI) / 180;
    const hw = (b.w * Math.cos(rad) + b.h * Math.sin(rad)) / 2, hh = (b.w * Math.sin(rad) + b.h * Math.cos(rad)) / 2;
    out.push({id: 'ball', kind: 'object', text: '', opacity: 1, x0: Math.round(b.cx - hw), y0: Math.round(b.cy - hh), x1: Math.round(b.cx + hw), y1: Math.round(Math.min(1920, b.cy + hh))});
  }
  const panels: [string, Rect, {a: number; b: number}][] = [
    ['panel-official', PANEL_LOW, WIN.official], ['panel-sub', SUB_PILL, WIN.panelsSub], ['panel-maker', PANEL_LOW, WIN.maker],
    ...WIN.chips.map((w, i): [string, Rect, {a: number; b: number}] => [`panel-chip-${i + 1}`, {x0: CHIP.x0, x1: CHIP.x1, y0: CHIP.tops[i], y1: CHIP.tops[i] + CHIP.h}, w]),
    ['panel-url', URL_PILL, WIN.url],
  ];
  for (const [id, r, w] of panels) {
    const op = panelOp(f, w);
    if (op > 0.02) out.push(rectObj(id, r, op));
  }
  if (f >= LOGO_HIT) out.push(rectObj('logo', {x0: 540 - LOGO.w / 2, y0: LOGO.top, x1: 540 + LOGO.w / 2, y1: LOGO.top + LOGO_H + 18}, 1));
  return out;
};

export const HeritageAd: React.FC<{production: HeritageProduction; qaLayer: QaLayer}> = ({production: p, qaLayer}) => {
  ensureFonts();
  return (
    <QaCtx.Provider value={qaLayer}>
      <AbsoluteFill data-bms-root="1" style={{background: qaLayer === 'none' ? p.brand.palette.navy : '#000', overflow: 'hidden'}}>
        <Backdrop p={p} />
        <Flare />
        <BallLayer />
        <Scenes p={p} />
        <EndCard p={p} />
        <ForeBokeh />
        <Grain />
        <QaProbe p={p as never} objects={obstacles} connectors={false} />
      </AbsoluteFill>
    </QaCtx.Provider>
  );
};
