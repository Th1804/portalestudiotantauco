# TTS local gratuito en español — licencias (revisado 2026-10-09)
Nada instalado aún. Motor: Piper (`pip install piper-tts`, OHF-Voice/piper1-gpl, GPL-3.0; uso como proceso externo OK; embebe espeak-ng GPL). CPU-only, rápido.
No existe voz Piper es_CL. Fuente: huggingface.co/rhasspy/piper-voices (MODEL_CARD de cada voz).

| Voz | Calidad | Dataset / licencia dataset | Base de fine-tune | Riesgo comercial |
|---|---|---|---|---|
| es_MX-claude-high | high | HirCoir/Piper-TTS-Spanish, apache-2.0 | (ver URL) | Bajo (verificar origen grabaciones) |
| es_MX-ald-medium / x_low | medium | Ald Mexican Spanish, Unlicense | davefx (← lessac) | Medio: cadena lessac |
| es_ES-carlfm-x_low | x_low | carlfm01, dominio público | desde cero | Bajo, pero calidad baja |
| es_ES-davefx-medium | medium | OHF voice-datasets, CC0 | lessac medium | Medio: cadena lessac |
| es_ES-sharvard-medium (M/F) | medium | Sharvard, CC BY 3.0 (atribución) | lessac medium | Medio |
| es_ES-mls_9972-low / mls_10246-low | low | MLS openslr 94, CC BY 4.0 | ryan low (dataset CC BY-NC-SA 4.0) | Alto: base NC |
| es_AR-daniela-high | high | openslr 61, CC BY-SA 4.0 | lessac high | Medio-alto: SA + cadena lessac |

Nota lessac: dataset Blizzard 2013 = licencia SOLO INVESTIGACIÓN, excluye uso comercial. Voces fine-tuned desde lessac heredan ambigüedad legal → revisión humana antes de anuncios pagados.
Coqui TTS: código MPL-2.0 (Coqui cerró 2024; fork idiap/coqui-ai-TTS). XTTS-v2 = licencia CPML NO comercial → descartar. Modelos VITS es (css10/mai) requieren verificar licencia del dataset.
espeak-ng: GPL-3, gratis, voz robótica (solo fallback).
Recomendación inicial: es_MX-claude-high para prototipo interno; uso en Ads pagados requiere OK humano de licencia.
