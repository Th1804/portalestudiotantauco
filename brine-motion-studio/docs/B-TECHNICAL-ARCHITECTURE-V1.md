# BRINE MOTION STUDIO — TECHNICAL ARCHITECTURE V1

## 1. Entorno verificado (box compartido, 2026-10-09)
| Componente | Versión / dato |
|---|---|
| Node | 22.23.3 (`/tmp/node-v22.23.3-linux-x64/bin`; el `/usr/bin/node` del sistema es la v20, no se usa) |
| Remotion | 4.0.534 (`remotion`, `@remotion/cli`, `@remotion/bundler`, `@remotion/renderer`) + React 19 + TypeScript |
| Navegador | Google Chrome 154 del sistema (`/usr/bin/google-chrome`, `browserExecutable`, GL `swangle`) |
| Python | 3.13.5 en un venv (`/workspace/brine-motion-studio/.venv`): numpy, scipy, pyloudnorm, pillow, piper-tts, yt-dlp |
| TTS | Piper (`piper-tts`, motor GPL-3.0 usado como proceso externo), voz `es_MX-claude-high` (apache-2.0 según su MODEL_CARD) |
| ffmpeg / ffprobe | 7.1.5 |
| Hardware | 8 vCPU, 15 GiB de RAM, sin GPU, 113 GB libres; **box compartido y muy cargado** → render con concurrency 2 |
| Fuentes | Playfair Display y Manrope (OFL-1.1, archivos locales). **Sustitutas** de las oficiales Sonttak y STRONG, que no están disponibles |

### 1.1 Entorno del render v2 (cloud agent, 2026-10-09)
| Componente | Versión / dato |
|---|---|
| Node | 22.14.0 |
| Remotion | 4.0.534 (`npm ci` desde `package-lock.json`) |
| Navegador | Google Chrome 148 del sistema (`/usr/bin/google-chrome`), GL `swangle` |
| Python | 3.12.3 en `.venv`: numpy 2.5.3, scipy 1.18.1, pyloudnorm 0.2.0, pillow 12.3.0, piper-tts 1.8.0, onnxruntime 1.31.0 |
| Voz | `es_MX-claude-high` descargada de Hugging Face `rhasspy/piper-voices` a `studio/voices/` (ignorada en git) |
| ffmpeg / ffprobe | 6.1.1 |
| Hardware | 4 vCPU, 15 GiB de RAM, sin GPU → **concurrency 1** (con 3, `renderMedia` se colgó en el 5 %); ~7,5 min por variante con los stills de QA |

## 2. Estructura
```
brine-motion-studio/
  references/              ref1.mp4, ref2.mp4, SOURCES.md (solo estudio interno)
  docs/                    A, B, E y F
  studio/
    productions/<ID>.json  producción = datos (fuente de verdad)
    scripts/
      produce.mjs          orquestador: assets → audio → render → mux → stills QA → QA
      prep_assets.py       recorte determinista del producto (llave de color) + copia byte a byte del logo
      audio.py             música, SFX, voz (Piper), mezcla y master
      qa.py                QA automático + contact sheet
      preview.mjs          frames sueltos para revisión rápida
    src/                   Remotion (React + TS)
      Main.tsx             composición; capas en Z; bump de cámara al beat
      lib/medal.ts         estado continuo de la medalla (llegada desde la cámara, péndulo, push-in, pose, salida por escala); tablas ARRIVE/EXIT y geometría de la cinta para el QA
      lib/motion.ts        easings (elástico/bézier), pulso de beat, péndulo, aleatorio determinista
      lib/camera.tsx       cámara virtual: dolly, paneo y parallax en 3 capas
      lib/qa.tsx           modos QA: 'text' (solo texto) y 'logo' (solo logo); QaProbe mide cajas de texto + disco y cinta como obstáculos
      scenes/              Background, Hook (tipografía cinética), Medal + Ribbon (cinta vectorial), Reveal, Benefits, LightSweep, Statement, CTA
    voices/                modelo Piper + MODEL_CARD
    build/<ID>/            intermedios: stems, voces, mix.wav, video-silent.mp4, stills QA, frames
    out/                   <ID>.mp4, <ID>.qa.json, <ID>.contact-sheet.png
```

## 3. Flujo de una producción (`npm run produce -- productions/X.json`)
1. **prep_assets.py**: recorta el producto del raw aprobado con la llave de color de Creative (distancia al color del papel, componente principal, relleno de huecos, descontaminación del borde, enderezado rígido), sin IA. El logo se copia **byte a byte** (verificado por sha256).
2. **audio.py** (48 kHz):
   - **Música** a BPM fijo desde el JSON: kick, snare/clap y hats 808 sintetizados; bajo; pads supersaw; arpegio pluck con filtro de estado variable automatizado; campana FM-like; progresión por compás; secciones con intensidad y filtro low-pass automático en el statement.
   - **SFX** en los frames de `beats.events` (v2, paleta suave): whooshes de ruido rosa con pasabajos barrido y su pico en el frame del evento, impact y sub-boom graves, pop, tick, riser, ping y shimmer. Todos con ataque ≥ 4 ms, shelf de -4 dB en 5,5 kHz, pico normalizado por tipo (`SFX_PEAK`) y reverb por convolución de IR sintética.
   - **Voz**: Piper sintetiza cada línea en 3 tomas (`voice_direction.takes`: length/noise/noise_w). Los silencios internos se recortan a `max_pause_s` con fundido cruzado y, si una toma excede `max_s`, se ajusta `length_scale` (mínimo 0,9). La toma se elige por métricas (pausa interna, F0, duración) o se fuerza con `pick`. Cadena: HPF, EQ cálida, control de aspereza, de-esser y compresión en 2 etapas sin saturación, más una sala corta. Con `enabled: false` se genera la variante sin voz.
   - **Mezcla**: hueco de EQ en la música a 2,8 kHz y ducking sidechain de −7 dB bajo la voz.
   - **Master**: shelving, compresión de glue, normalización a −14 LUFS (pyloudnorm) y limitador lookahead con detección de pico intermuestra 4x a −1,2 dBTP. Lo itera hasta ±0,3 LU.
3. **Render Remotion**: bundle → Chrome del sistema → `renderMedia` H.264 (CRF 16, yuv420p), 1080x1920, 30 fps, concurrency `BMS_CONCURRENCY` (por defecto 1), muted.
4. **Mux ffmpeg**: copia el video, AAC de 192 kbps a 48 kHz, `+faststart`.
5. **Stills QA**: la capa de texto se renderiza cada `qa_layout_step` frames (5 → 91 stills) junto con los `qa_keyframes`, y el modo `logo` en los keyframes del cierre. Durante esos stills, `QaProbe` emite las cajas de tinta y los obstáculos (`text-boxes.json`).
6. **qa.py**: mide sobre el MP4 final y escribe `<ID>.qa.json` y el contact sheet.

Sincronía: video y audio leen **la misma tabla de frames** (`beats.events`, `storyboard`, `voice_direction.lines.start_s`) y el mismo BPM (120 → 1 beat = 15 frames exactos).

## 4. Contrato de producción (resumen del JSON)
`id, version, status, publish:false, source_content_id, objective{type, framework PCD, promise, curiosity, disruption}, product{name, url, assets{raw, key, face_anchors_norm}, verified_claims[], forbidden[]}, brand{logo, palette, fonts}, format{w, h, fps, durationInFrames, safe_zone}, music_direction{bpm, key, progression, sections[]}, voice_direction{engine, model, length_scale, lines[{id, start_s, max_s, text}]}, visual_direction, script.on_screen, storyboard[], beats{bpm, events[{f, type, gain, len_f?}]}, qa_keyframes[], variants[A/B], approvals{creative, human_publish}`.
Las variantes A/B (gancho, ritmo, música y CTA) se declaran en `variants`; cada variante renderizable es otra producción con su propio ID.

## 5. Flujo de agentes (propuesto; hoy solo existe el tramo código → render → QA)
```
Social Intelligence ──brief_request──▶ Marketing ──creative_brief──▶ Motion Director ──production.json──▶ código (Remotion+Python)
      ▲                                                                                                │
      │                                                                                       render → QA automático
      │                                                                                                │
      └──── métricas verificadas ◀── Publisher ◀── publish_order (solo con aprobación humana) ◀── revisión humana (René/Enzo)
```
Contratos JSON mínimos:
- **brief_request** (Social Intelligence → Marketing): `{request_id, reason, signal{source, metric, value, window, verified:bool}, product_url, objective, deadline, budget:0}`
- **creative_brief** (Marketing → Motion Director): `{brief_id, product{name, url, ficha_read_at}, verified_claims[], forbidden[], audience, message, cta, format:"9x16_15s", variants_requested[]}`
- **production.json** (Motion Director → código): el contrato de la sección 4.
- **render_result** (código → QA): `{id, mp4, sha256, audio_report, render_log}`
- **qa_report** (QA → humano): `out/<ID>.qa.json` + contact sheet + autoevaluación creativa.
- **approval** (humano → Publisher): `{id, approved_by, approved_at, channel, organic|paid, caption_id, notes}`. Sin este objeto, Publisher no actúa.
- **publish_result** (Publisher → Social Intelligence): `{id, post_url, published_at, organic|paid}`; las métricas solo se registran si vienen de la plataforma (no se estiman).

## 6. Límites
- No publica, no programa, no gasta y no toca Parrotfy, el Cotizador ni BRINE MASTER.
- "Opus 5.5 como cerebro": este sistema no controla Cursor ni ningún selector de modelo. El código lo escribió el agente ejecutor en el box. La voz la genera **Piper**, no el modelo que programa.
- Sin GPU: el render es por CPU/SwiftShader y el tiempo depende de la carga del box.
