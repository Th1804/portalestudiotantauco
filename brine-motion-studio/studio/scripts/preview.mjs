// Previsualización rápida de frames sueltos: node scripts/preview.mjs productions/X.json 0 30 60 ...
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import {browserOpts, pythonBin} from './env.mjs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [pp, ...frames] = process.argv.slice(2);
const production = JSON.parse(fs.readFileSync(path.resolve(ROOT, pp), 'utf8'));
const out = path.join(ROOT, 'build', production.id, process.env.QA ? 'preview-' + process.env.QA : 'preview'); fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
const browser = await openBrowser('chrome', browserOpts());
const inputProps = {production, qaLayer: process.env.QA ?? 'none'};
const comp = await selectComposition({serveUrl, id: 'Production', inputProps, puppeteerInstance: browser});
for (const f of frames) {
  const o = path.join(out, `p-${String(f).padStart(3, '0')}.jpg`);
  await renderStill({composition: comp, serveUrl, frame: Number(f), output: o, inputProps, puppeteerInstance: browser, imageFormat: 'jpeg', jpegQuality: 85,
    onBrowserLog: ({text}) => { if (typeof text === 'string' && text.startsWith('QA_BOXES ')) console.log(text); }});
  console.log(o);
}
await browser.close({silent: true});
