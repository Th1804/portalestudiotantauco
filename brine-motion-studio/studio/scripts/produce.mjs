#!/usr/bin/env node
// BRINE MOTION STUDIO — comando único reproducible:  npm run produce -- productions/X.json
// 1) assets  2) audio (Python)  3) render Remotion (Chrome del sistema, concurrency baja)  4) mux ffmpeg  5) stills QA  6) QA
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {browserOpts, pythonBin} from './env.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PY = pythonBin(ROOT);
const args = process.argv.slice(2);
const prodPath = path.resolve(ROOT, args.find((a) => a.endsWith('.json')) ?? 'productions/BMS-20261009-001.json');
const skipAudio = args.includes('--skip-audio');
const skipVideo = args.includes('--skip-video');
const CONC = Number(process.env.BMS_CONCURRENCY ?? 1); // >1 se cuelga con GL por software (swangle) en el box sin GPU
const production = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
const id = production.id;
const build = path.join(ROOT, 'build', id);
const outDir = path.join(ROOT, 'out');
fs.mkdirSync(path.join(build, 'qa'), {recursive: true});
fs.mkdirSync(outDir, {recursive: true});
const log = (...m) => console.log(`[${new Date().toISOString().slice(11, 19)}Z]`, ...m);
const py = (script, ...a) => execFileSync(PY, [path.join(ROOT, 'scripts', script), ...a], {stdio: 'inherit', cwd: ROOT});

const t0 = Date.now();
log('producción', id);
py('prep_assets.py', prodPath);
if (!skipAudio) { log('audio…'); py('audio.py', prodPath); }

log('bundle…');
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
const browser = await openBrowser('chrome', browserOpts());
const inputProps = {production, qaLayer: 'none'};
const comp = await selectComposition({serveUrl, id: 'Production', inputProps, puppeteerInstance: browser});
const silent = path.join(build, 'video-silent.mp4');
if (!skipVideo) {
  log(`render ${comp.width}x${comp.height} ${comp.fps}fps ${comp.durationInFrames}f, concurrency=${CONC}`);
  let last = -1;
  await renderMedia({composition: comp, serveUrl, codec: 'h264', outputLocation: silent, inputProps, concurrency: CONC,
    puppeteerInstance: browser, crf: 16, pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 92, muted: true,
    timeoutInMilliseconds: 120000,
    onProgress: ({progress}) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; log(`render ${Math.round(progress * 100)}%`); } }});
}
log('mux…');
const final = path.join(outDir, `${id}.mp4`);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', silent, '-i', path.join(build, 'mix.wav'), '-map', '0:v:0', '-map', '1:a:0',
  '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-profile:v', 'high',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart',
  '-metadata', `title=${id}`, '-metadata', 'comment=BRINE MOTION STUDIO — borrador interno, no publicar sin aprobación humana', final], {stdio: 'inherit'});

log('stills QA (texto/logo) + bounding boxes de texto…');
const boxes = [];
const tcomp = await selectComposition({serveUrl, id: 'Production', inputProps: {production, qaLayer: 'text'}, puppeteerInstance: browser});
const lcomp = await selectComposition({serveUrl, id: 'Production', inputProps: {production, qaLayer: 'logo'}, puppeteerInstance: browser});
const onBrowserLog = ({text}) => { if (typeof text === 'string' && text.startsWith('QA_BOXES ')) boxes.push(JSON.parse(text.slice(9))); };
const step = production.qa_layout_step ?? 5;
const N = production.format.durationInFrames;
const layoutFrames = [...new Set([...production.qa_keyframes, ...Array.from({length: Math.ceil(N / step)}, (_, i) => i * step)])].sort((a, b) => a - b);
for (const f of layoutFrames) {
  await renderStill({composition: tcomp, serveUrl, frame: f, output: path.join(build, 'qa', `text-${String(f).padStart(3, '0')}.png`),
    inputProps: {production, qaLayer: 'text'}, puppeteerInstance: browser, imageFormat: 'png', onBrowserLog});
  if (production.qa_keyframes.includes(f) && f >= N - 80) {
    await renderStill({composition: lcomp, serveUrl, frame: f, output: path.join(build, 'qa', `logo-${String(f).padStart(3, '0')}.png`),
      inputProps: {production, qaLayer: 'logo'}, puppeteerInstance: browser, imageFormat: 'png'});
  }
}
fs.writeFileSync(path.join(build, 'qa', 'text-boxes.json'), JSON.stringify(boxes, null, 1));
await browser.close({silent: true});
log('QA…');
py('qa.py', prodPath, final);
log(`listo en ${((Date.now() - t0) / 1000).toFixed(0)} s →`, final);
