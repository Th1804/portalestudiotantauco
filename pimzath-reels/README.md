# Pimzath — "No Sobre Ti" · Reels de lyrics (código)

Proyecto editable que renderiza Reels de lyrics de 1080x1920 a 30 fps (H.264 + AAC) con el audio original sin
alterar. Alcance actual: **una pieza de prueba, `NoSobreTi_01_Refugio.mp4`** (Coro 2: "Que llueva sobre mí ×2 /
Pero no sobre ti ×2"). Los otros cinco cortes están propuestos en `docs/tabla_cortes.md` y no se renderizaron.

## Estructura
```
assets/            material original del artista (audio, ficha visual, lentes, portada, guías)
fonts/             fuentes OFL locales (Playfair Display Italic, DM Sans) + licencias
engine/            base compartida reutilizable
  core.py          lienzo, paleta (#F2E9DC #AC326E #E47642 #321C2C + azul suéter), easing, blur
  typo.py          shaping HarfBuzz + contornos por glifo (arcos, reflejos, escritura a trazo)
  rain.py          lluvia determinista (semilla fija) + salpicaduras
  draw.py          papel, grano de lápiz, trazos a mano, nubes rayadas, gotas, resplandor, crédito
  sync.py          lectura del JSON de sync y paso a tiempo local del Reel
  render.py        frames -> ffmpeg; recorte del audio original en el mismo paso
reels/cuts.json    los 6 cortes (inicio en la fuente, frames, fades)
reels/r01_refugio.py  composición de la pieza 01 (todo el texto sale del JSON de sync)
sync/lyrics_sync.json   frases y palabras de toda la canción (tiempos de la fuente)
sync/manual_overrides.json  correcciones manuales y discrepancias con la letra
sync/reel_01_sync.json  frases/palabras del Reel 01 con tiempo fuente y tiempo local
tools/             análisis de audio, preparación de assets, verificación
analysis/          resultados del análisis (ASR, alineación, actividad vocal, gráficos de control)
docs/              tabla de cortes, caption y top 3, referencias de Pinterest
covers/            portada vertical
```

## Reproducir
Requisitos: Python 3.12, ffmpeg, `pip install -r requirements.txt` (pycairo necesita `libcairo2-dev`).
```bash
python3 tools/prepare_assets.py          # build/: retrato a lápiz, arte de portada sin UI, texturas
python3 -m engine.render 01              # out/NoSobreTi_01_Refugio.mp4  (~1 min en 4 CPU)
python3 -m engine.render 01 --cover 12.6 # covers/NoSobreTi_01_Refugio_portada.png
python3 -m engine.render 01 --stills 0,5,10   # fotogramas sueltos en out/stills/
python3 tools/verify.py 01               # informe en out/qa/01_report.json + hojas de contacto + UI de IG
```
Análisis de audio, solo si se quiere rehacer la sincronía (descarga los modelos):
```bash
ffmpeg -i assets/No_Sobre_Ti_original.m4a analysis/full44k.wav
python3 -m demucs --two-stems=vocals -n htdemucs -o analysis/sep analysis/full44k.wav
python3 tools/asr.py analysis/sep/htdemucs/full44k/vocals.wav analysis/asr_vocals_medium.json medium
python3 tools/vocal_activity.py && python3 tools/align.py && python3 tools/build_sync.py
python3 tools/export_reel_sync.py 01
python3 tools/plot_window.py 168 188 /tmp/control.png - sync/lyrics_sync.json   # revisión visual
```

## Modificar
- **Ajustar un tiempo:** edita `sync/manual_overrides.json` (clave `SECCIÓN:índice_de_palabra`), corre
  `tools/build_sync.py` y vuelve a renderizar. La animación sigue los tiempos del JSON y no hay tiempos
  escritos a mano en la composición.
- **Mover el corte:** `reels/cuts.json` (`source_start`, `frames`). El tiempo local se recalcula solo.
- **Colores, fuentes y tamaños:** `engine/core.py`, `engine/typo.py` (tabla `FONTS`) y las constantes al inicio de
  `reels/r01_refugio.py` (`CX, CY, R1, R2, S1, S2`).
- **Nueva pieza:** crea `reels/rXX_nombre.py` con `class Reel(cut)` y `draw(ctx, t, f)`, y regístrala en
  `REEL_MODULES` (`engine/render.py`).

El render es determinista: cada frame es una función pura de `t = f/30`, con semillas fijas y sin temporizadores.

## Cómo se sincronizó
1. Demucs htdemucs separa la voz.
2. faster-whisper (medium) sirve solo de ayuda: confunde palabras ("que yo emas", "soledad") e incluso
   alucina el prompt.
3. Alineación forzada CTC (torchaudio MMS_FA, Viterbi propio) de la **letra oficial** sobre la voz aislada,
   por sección, comparando hipótesis de repeticiones (p. ej. 3 frente a 4 "Tus ojos no"; ganó 3).
4. Los finales de palabra salen de la caída de la envolvente vocal (−14 dB).
5. Revisión manual con gráficos de envolvente, flujo espectral vocal y onsets instrumentales
   (`analysis/plots/`). En `manual_overrides.json` quedan 13 correcciones.

En el Reel 01 cada palabra empieza a moverse entre 0,08 y 0,16 s antes de su inicio cantado (anticipación leve)
y queda asentada o escrita dentro de las sílabas de esa palabra.

## Fuentes
- **Playfair Display Italic** (variable, wght 480), letras. SIL Open Font License 1.1 (`fonts/OFL_PlayfairDisplay.txt`).
- **DM Sans** (variable, wght 500), crédito. SIL Open Font License 1.1 (`fonts/OFL_DMSans.txt`).
