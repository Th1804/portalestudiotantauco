import React, {createContext, useContext} from "react";
import type {QaLayer} from '../types';
// Modo QA: renderiza SOLO el texto de mensaje (blanco sobre negro) o SOLO el logo, para medir safe zones y contraste.
export const QaCtx = createContext<QaLayer>('none');
export const useQa = () => useContext(QaCtx);
export const Deco: React.FC<{children: React.ReactNode}> = ({children}) => {
  const qa = useQa();
  return qa === 'none' ? <>{children}</> : null;
};
export const LogoLayer: React.FC<{children: React.ReactNode}> = ({children}) => {
  const qa = useQa();
  return qa === 'text' ? null : <>{children}</>;
};
export const TextLayer: React.FC<{children: React.ReactNode}> = ({children}) => {
  const qa = useQa();
  return qa === 'logo' ? null : <>{children}</>;
};
// color de texto según modo
export const useInk = (c: string) => (useQa() === 'text' ? '#FFFFFF' : c);

// ---- v2: sonda de bounding boxes de texto (QA de colisiones).
// En modo 'text' mide cada elemento [data-qa] con el DOM real (incluye transformaciones y máscaras overflow:hidden),
// ajusta la caja vertical a la tinta real con métricas de canvas.measureText y la emite por consola: produce.mjs la recoge.
import {continueRender, delayRender, useCurrentFrame} from 'remotion';
import {IMG_W, medalPoint, medalState} from './medal';
export const QaProbe: React.FC = () => {
  const qa = useQa();
  const f = useCurrentFrame();
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (qa !== 'text') return;
    const h = delayRender('qa-probe');
    let tries = 0;
    const measure = () => {
        const ctx = document.createElement('canvas').getContext('2d')!;
        const boxes: any[] = [];
        // medir SOLO dentro de esta instancia de la composición y en coordenadas del lienzo 1080x1920
        const root = ref.current?.closest('[data-bms-root]') as HTMLElement | null;
        const R = root?.getBoundingClientRect();
        if (!root || !R || R.width < 10) {
          if (++tries < 120) { requestAnimationFrame(measure); return; }
          console.log('QA_BOXES_FAIL ' + JSON.stringify({frame: f, rect: R}));
          continueRender(h); return;
        }
        const k = 1080 / R.width;
        root.querySelectorAll<HTMLElement>('[data-qa]').forEach((el) => {
          let op = 1; let clip = {l: -1e9, t: -1e9, r: 1e9, b: 1e9};
          for (let a: HTMLElement | null = el; a; a = a.parentElement) {
            const cs = getComputedStyle(a); op *= Number(cs.opacity);
            if (a !== el && cs.overflow !== 'visible') { const r = a.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; clip = {l: Math.max(clip.l, r.left), t: Math.max(clip.t, r.top), r: Math.min(clip.r, r.right), b: Math.min(clip.b, r.bottom)}; }
          }
          if (op < 0.25) return;
          const rg = document.createRange(); rg.selectNodeContents(el); const rr = rg.getBoundingClientRect();
          if (rr.width < 1) return;
          const cs = getComputedStyle(el);
          ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; (ctx as any).letterSpacing = cs.letterSpacing;
          const txt = el.textContent ?? '';
          const m = ctx.measureText(txt);
          const scale = rr.width / Math.max(1, m.width);
          const content = (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) * scale;
          const base = rr.top + (rr.height - content) / 2 + m.fontBoundingBoxAscent * scale;
          let box = {l: rr.left, r: rr.right, t: base - m.actualBoundingBoxAscent * scale, b: base + m.actualBoundingBoxDescent * scale};
          box = {l: Math.max(box.l, clip.l), t: Math.max(box.t, clip.t), r: Math.min(box.r, clip.r), b: Math.min(box.b, clip.b)};
          if (box.r - box.l < 2 || box.b - box.t < 2) return;
          boxes.push({id: el.dataset.qa, text: txt, opacity: Math.round(op * 100) / 100,
            x0: Math.round((box.l - R.left) * k), y0: Math.round((box.t - R.top) * k), x1: Math.round((box.r - R.left) * k), y1: Math.round((box.b - R.top) * k)});
        });
        // obstáculo: disco de la medalla (geometría analítica de lib/medal), salvo en entradas/salidas con desenfoque
        const st = medalState(f);
        if (st.vis && st.op > 0.5 && st.blur < 3) {
          const c = medalPoint(st, 0.5, 0.79); const r = 0.5 * IMG_W * st.s;
          boxes.push({id: 'medal-disc', kind: 'object', text: '', opacity: st.op, x0: Math.round(c.x - r), y0: Math.round(c.y - r), x1: Math.round(c.x + r), y1: Math.round(c.y + r)});
        }
        console.log('QA_BOXES ' + JSON.stringify({frame: f, boxes}));
        continueRender(h);
    };
    (document as any).fonts.ready.then(() => requestAnimationFrame(measure));
  }, [qa, f]);
  return <div ref={ref} style={{display: 'none'}} />;
};
