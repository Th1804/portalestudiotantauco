#!/usr/bin/env node
// QA sobre un MP4 ya renderizado:  npm run qa -- productions/X.json   (usa out/<id>.mp4)
// Nota: los checks de safe zones/contraste/colisiones requieren los stills de QA que genera `npm run produce`.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pythonBin} from './env.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prod = path.resolve(ROOT, process.argv[2] ?? 'productions/BMS-20261009-001-v2.json');
const id = JSON.parse(fs.readFileSync(prod, 'utf8')).id;
execFileSync(pythonBin(ROOT), [path.join(ROOT, 'scripts', 'qa.py'), prod, path.join(ROOT, 'out', `${id}.mp4`)], {stdio: 'inherit', cwd: ROOT});
