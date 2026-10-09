// Entorno portable (Linux box / macOS / Windows). Variables opcionales:
//   BMS_PYTHON  ruta al python del venv (por defecto ../.venv o .venv, según exista)
//   BMS_CHROME  ruta a un Chrome/Chromium instalado (si no, Remotion descarga su Chrome Headless Shell gratis)
//   BMS_GL      backend GL de Chrome (box Linux sin GPU: 'swangle'; en Mac/Windows dejar vacío)
import fs from 'node:fs';
import path from 'node:path';
export const pythonBin = (root) => {
  if (process.env.BMS_PYTHON) return process.env.BMS_PYTHON;
  const win = process.platform === 'win32';
  const rel = win ? ['Scripts', 'python.exe'] : ['bin', 'python'];
  for (const base of [path.resolve(root, '..', '.venv'), path.resolve(root, '.venv')]) {
    const p = path.join(base, ...rel);
    if (fs.existsSync(p)) return p;
  }
  return win ? 'python' : 'python3';
};
export const browserOpts = () => {
  const exe = process.env.BMS_CHROME || (process.platform === 'linux' && fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : null);
  const gl = process.env.BMS_GL || (process.platform === 'linux' && !process.env.DISPLAY_GPU ? 'swangle' : undefined);
  return {...(exe ? {browserExecutable: exe} : {}), chromiumOptions: gl ? {gl} : {}};
};
