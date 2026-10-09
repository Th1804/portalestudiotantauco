# BRINE MOTION STUDIO (v3)

Sistema que genera anuncios verticales de motion graphics (Reels, TikTok y Meta Ads) **por código**:
- **Video**: Remotion 4 + React 19 + TypeScript.
- **Música y SFX**: síntesis en Python (numpy/scipy).
- **Voz** (opcional, descartada en v3 por sonar robótica): TTS local Piper (`es_MX-claude-high`). La variante principal es **sin voz**.
- **Mezcla, master (-14 LUFS / ≤ -1 dBTP) y QA**: automáticos.

**No publica nada.** Cada MP4 es un borrador para revisión humana.

## Requisitos
| Componente | Versión | Windows | macOS |
|---|---|---|---|
| Node.js | **22.x** | instalador LTS 22 desde nodejs.org, o `winget install OpenJS.NodeJS.LTS` (verifica `node -v` = v22) | `brew install node@22` (o nvm: `nvm install 22`) |
| Python | 3.11–3.13 | python.org (marca "Add to PATH"), o `winget install Python.Python.3.12` | `brew install python@3.12` |
| ffmpeg + ffprobe | 6 o superior | `winget install Gyan.FFmpeg` (deben quedar en el PATH) | `brew install ffmpeg` |
| Chrome | opcional | Remotion descarga gratis su propio Chrome Headless Shell la primera vez. Para usar uno instalado, define `BMS_CHROME` con su ruta. | igual |
| Voz Piper | es_MX-claude-high | **no viene en el repo** (`studio/voices/` está en `.gitignore`); descárgala como se indica abajo | igual |

Espacio: unos 1,5 GB (node_modules, venv y build). RAM: 8 GB o más. Todo es gratuito y de código abierto. No hay claves, cuentas ni secretos.

## Instalación
**macOS / Linux**
```bash
cd BRINE-MOTION-STUDIO-v2
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd studio
npm ci            # o npm install
```
**Windows (PowerShell)**
```powershell
cd BRINE-MOTION-STUDIO-v2
py -3.12 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
cd studio
npm ci
```
`scripts/env.mjs` detecta solo el Python del venv (`.venv/bin/python` o `.venv\Scripts\python.exe`). Para usar otro, define `BMS_PYTHON`.

Descarga la voz (gratis, Apache-2.0) a `studio/voices/`:
```bash
mkdir -p studio/voices && cd studio/voices
B=https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high
for f in es_MX-claude-high.onnx es_MX-claude-high.onnx.json MODEL_CARD; do curl -L -o $f "$B/$f"; done
```

## Producir (comando único)
```bash
cd studio
npm run produce -- productions/BMS-20261009-001-v3.json                       # v3, sin voz (principal)
npm run produce -- productions/BMS-20261009-001-v3-voz.json --layout-only     # opcional con voz: solo QA de layout/conectores
npm run produce -- productions/BMS-20261009-001-v2.json                       # v2 (histórico)
```
El pipeline: assets → audio (música, SFX, 3 tomas de voz) → render 1080x1920 30 fps → mux H.264/AAC → stills de QA → QA.

Salidas en `studio/out/`:
- `<ID>.mp4`
- `<ID>.qa.json`
- `<ID>.contact-sheet.png` (un frame cada 0,5 s)

Intermedios en `studio/build/<ID>/`: stems, tomas de voz (`voice-takes/`), `mix.wav` y stills de QA.

Opciones:
- `--skip-audio`: reutiliza `mix.wav`.
- `--skip-video`: re-mezcla, re-mux y re-QA sin volver a renderizar.
- `BMS_CONCURRENCY=4`: más rápido en un equipo con GPU (por defecto 1: con GL por software, `swangle`, el render en paralelo se quedó colgado en el 5 % en el box de 4 vCPU; con 1 tarda unos 3,5 min).
- `BMS_GL=angle`: backend GL (en el box Linux sin GPU se usa `swangle`).

Otros comandos:
- QA de un MP4 ya renderizado: `npm run qa -- productions/X.json`
- Frames sueltos: `npm run preview -- productions/X.json 0 45 120` (con `QA=text` mide además las cajas de texto).
- Studio interactivo: `npm run studio`

## Nueva producción
Copia un JSON de `studio/productions/` con un nuevo `id` y cambia:
- `product` (raw aprobado y claims verificados)
- `script.on_screen`
- `voice_direction.lines` (y `takes` / `pick` / `max_pause_s`)
- `beats.events`
- `music_direction`
- `qa_keyframes`

Las rutas relativas se resuelven desde `studio/`.

## QA automático (`scripts/qa.py`)
Mide:
- resolución, fps, duración y códecs (yuv420p)
- decodificación completa
- LUFS y true peak (ebur128)
- frames negros
- safe zones (14 % arriba, 20 % abajo, 90/130 px a los lados) sobre máscaras reales de texto
- contraste WCAG
- **colisiones entre textos**: cajas de tinta medidas en el DOM, deben quedar a 8 px o más
- logo intacto en el cierre
- dorado bajo 3 %
- contact sheet

## Documentos
- `docs/A-CREATIVE-REFERENCE-ANALYSIS-V1.md`
- `docs/B-TECHNICAL-ARCHITECTURE-V1.md`
- `docs/E-QUALITY-REPORT-V1.md`
- `docs/F-AUTOMATION-PLAN-V1.md`

## Licencias y créditos
- Playfair Display y Manrope: SIL OFL 1.1 (`studio/public/assets/*-OFL.txt`). Son **sustitutas** de Sonttak y STRONG, que no están disponibles.
- Piper: GPL-3.0, usado como proceso externo. Voz es_MX-claude-high: apache-2.0 según su MODEL_CARD.
- Medalla: raw de Brine Creative para CNT-20261009-01, generado por IA con logo y texto de muestra ficticios. Aprobado por Enzo el 2026-10-09. **No es una foto real.**
- Logo oficial: `studio/brand-assets/logo-brine-crop.png`, copiado sin modificar (sha256 742b87df…).
- Música y SFX: originales, generados por `scripts/audio.py`.
