# E — Informe de calidad V2 · BMS-20261009-001-v2 (+ variante sin voz)

Producción: Medalla acrílico personalizado (variante A). Fecha: 2026-10-09, render final terminado a las 15:03 (hora de Chile).
Parte de la revisión audiovisual de la v1 (3,5/10, "se siente como slideshow"). La v1 se conserva más abajo como anexo.

| Archivo | Tamaño | sha256 |
|---|---|---|
| `studio/out/BMS-20261009-001-v2.mp4` (con voz) | 36,9 MB | `dee16aa2426a4b6326e4d34d8e8b7c0f7d546d8702505c403022b82b4353f507` |
| `studio/out/BMS-20261009-001-v2-novoz.mp4` (sin voz) | 36,4 MB | `ebdd57dd9df45d6528acd7b8728a22ae459b744879427ad3e5aa668351f01a4b` |

Además: `<ID>.contact-sheet.png` (un frame cada 0,5 s) y `<ID>.qa.json` de cada variante. Logs: `studio/build/produce-v2.log` y `studio/build/produce-v2-novoz.log`. Los MP4 no están en git.

## 1. QA automático (`scripts/qa.py`, medido sobre cada MP4 final): 14/14 PASS en ambas

| Check | Con voz | Sin voz |
|---|---|---|
| Resolución / fps / duración | 1080x1920 · 30 · 15,000 s | igual |
| Códecs | H.264 High yuv420p (tv, bt709) + AAC 48 kHz 192 kbps, faststart | igual |
| Integridad (decodificación completa) | 0 errores | 0 errores |
| Loudness integrado (objetivo -14 ±1) | -14,2 LUFS, LRA 4,3 LU | -14,2 LUFS, LRA 5,0 LU |
| True peak (límite -1 dBTP), después del AAC | -1,2 dBTP | -1,4 dBTP |
| Frames negros | ninguno | ninguno |
| Safe zones de texto (y 269–1536, x 90–950) | 91 frames, 0 fuera | 91 frames, 0 fuera |
| **Colisiones (cajas a ≥ 8 px)** | 91 frames, 0 colisiones | 91 frames, 0 colisiones |
| Contraste WCAG (mínimo) | 5,54:1 | 5,55:1 |
| Logo intacto en el cierre | aspecto 2,5489 vs 2,5477, correlación de luma 0,992 | igual |
| Dorado < 3 % (sin el logo) | máx. 1,11 %, media 0,12 % | máx. 1,12 % |

**QA de layout nuevo en v2.** `produce.mjs` renderiza la capa de texto cada 5 frames (`qa_layout_step`), no solo en los 31 keyframes. En cada uno, `QaProbe` mide en el DOM la caja de tinta real de cada `[data-qa]`, considerando transformaciones, máscaras y opacidad. También agrega como obstáculos el **disco** y la **cinta** de la medalla, calculados con la misma geometría de `lib/medal.ts`. `qa.py` falla si dos cajas visibles quedan a menos de 8 px y además revisa las safe zones sobre esos 91 stills.
Este QA encontró tres problemas que se corrigieron: el eyebrow salía del margen derecho en f105 (x 960 > 950) y, en la variante sin voz, "Logotipos" tocaba la cinta en f240–285 y la rozaba al entrar en f205.

## 2. Qué cambió frente a la crítica de la v1

| # | Crítica v1 | Cambio v2 |
|---|---|---|
| 1 | Gancho = caída en Y con bounce genérico | Tipografía cinética: cada letra se revela por máscara con un muelle (overshoot de ~4 %), "TU" entra con un golpe de escala 1,9 → 1 y motion blur direccional proporcional a la velocidad (SVG), tracking animado en todas las líneas y anticipación del bloque antes de salir. **El frame 0 ya muestra "TU" nítido** con un destello anamórfico, así que sirve de portada. La medalla ya no cae: irrumpe **desde la cámara** en f57 (escala 5,2 → 1,42 con muelle y profundidad de campo), justo cuando el titular terminó de salir, sin doble exposición. |
| 2 | Animaciones lineales o fades, sin movimiento secundario | Muelles y bézier exponenciales con anticipación y follow-through (`lib/motion.ts`). Péndulo amortiguado y respiración continua en la medalla, giro en Y durante el revelado, flotación de etiquetas, conectores con anticipación del punto y partículas/bokeh. Cámara virtual con **dolly** (push-in de 1,0 a 1,2 en el revelado, pull-back a la pose de beneficios) y **parallax en 3 capas** (0,35 / 1 / 1,8). |
| 3 | A los 0:08 "Superficie brillante…" tapaba "Logotipos" | El descriptor pasó al revelado (3–6,5 s), debajo de la medalla y con su propio espacio. Los beneficios solo llevan las tres etiquetas. Ahora lo valida el QA de colisiones (sección 1). |
| 4 | Cinta = rectángulo blanco plano | Cinta satinada **vectorial** (`scenes/Ribbon.tsx`) sobre la del raw: gradiente cilíndrico, **pliegue** diagonal con el tramo superior girado y más oscuro, orillos, brillo satinado que sigue el balanceo, remache redibujado con relieve y **sombras** (proyectada sobre el fondo y de contacto sobre la pestaña). |
| 5 | Wipe diagonal a blanco en 0:09 | **Match-cut por escala bajo un barrido de luz**, sobre el mismo azul premium: la medalla se recoge (anticipación del 3 %) y atraviesa la cámara (f290–304, escala → 4,2 con desenfoque). El barrido de luz (f288–318, fusión screen) cruza el cuadro y el statement nace del frente de luz, continuando el avance (escala 0,92 → 1). No hay blanco a pantalla completa ni fantasma de la medalla sobre el texto. |
| 6 | Voz robótica; pausa rara en "Tu logo… en una medalla" | Frases sin comas internas donde no hacen falta. **3 tomas Piper por línea** (length/noise/noise_w distintos), elegidas por métricas: pausa interna, variación de F0 y duración. Los silencios internos de Piper se recortan con fundido cruzado (`tighten_pauses`): en vo1 se quitaron 0,215 s entre "logo" y "en", y la pausa interna máxima quedó en 0,04 s. vo3 tiene más aire (2,8 s) para no forzar `length_scale`. Cadena de voz más suave: HPF, calidez, recorte de 340 Hz, control de la aspereza del vocoder en 4,3 y 7,6 kHz, de-esser y compresión en 2 etapas **sin saturación**. Además se entrega una **variante sin voz** (tipografía al 112 %). |
| 7 | SFX duros | Paleta nueva: **ruido rosa con pasabajos barrido** (sin resonancias de pasabanda), ataques ≥ 4 ms (12 ms en campanas), shelf de -4 dB en 5,5 kHz y pico normalizado por tipo. El pico de cada whoosh cae en el frame del evento. Centroide espectral de los whooshes: **0,7–1,2 kHz** (v1: 4,5–7,1 kHz). |
| 8 | La música se corta de golpe | Final escrito: dos pulsos suaves llevan a un **acorde de tónica D add9 en 13,0 s** (f390, entrada del logo y sub-boom) con bajo y campana. El acorde decae lento (e^-0,95t) y la cola de reverb llega a **silencio en el frame 450**: el mix medido baja de -13 dB RMS en 13,0 s a -45 dB en 14,75 s y a -98 dB en los últimos 10 ms. No hay corte. |

Otros cambios técnicos:
- **Render**: con GL por software (`swangle`, sin GPU) y concurrency 3, `renderMedia` se colgó en el 5 %. Ahora la concurrency por defecto es 1 (~7,5 min por variante en este box de 4 vCPU, con stills de QA incluidos).
- **Integridad**: `qa.py` ignora los avisos del enlazador dinámico (libncurses de tmux en el `LD_LIBRARY_PATH`), que no son errores de decodificación.
- La variante sin voz se llama `BMS-20261009-001-v2-novoz` (antes `-novoice`).

## 3. Autorrevisión visual (un frame cada 0,5 s sobre el MP4) e iteraciones
1. **Render 1**: 12/14. Fallaban integridad (el falso positivo del enlazador) y safe zones (eyebrow en f105). En los frames se vio que entre 2 y 6 s la medalla quedaba casi quieta, la salida del titular y la llegada de la medalla se superponían en f45–51 (texto blanco sobre una cara blanca desenfocada) y el frame 0 tenía "TU" desenfocado.
2. **Render 2**: 14/14. Push-in más marcado en el revelado, frame 0 nítido y tracking del eyebrow acotado. La revisión cuadro a cuadro de f36–70 confirmó la doble exposición, así que la medalla pasó a llegar en f57.
3. **Render 3**: 14/14. Con voz, limpio. En el contact sheet sin voz, "Logotipos" (94 px) tocaba la cinta. El QA no lo detectaba porque solo usaba el disco como obstáculo. Se agregó la cinta al QA, la pose de beneficios se movió a cx 650 y la etiqueta se limitó a 88 px (después a 84).
4. **Render 4**: con voz, 14/14. Sin voz, 13/14: la QA de colisiones detectó que en f205 "Logotipos" empezaba a entrar mientras la medalla todavía viajaba a su pose y la cinta lo cruzaba. La pose de beneficios se adelantó a f184–206.
5. **Render 5**: con voz, 14/14 (es el MP4 final con voz). Sin voz, 13/14: en f205 quedaban 2 px entre "Logotipos" y la cinta, porque el tracking de entrada (0,12 em) ensancha la palabra justo al aparecer. La verificación previa muestreó f204 y f206, pero no f205. "Logotipos" se limitó a 84 px en ambas variantes y se verificaron **todos** los frames de f196 a f240: la distancia mínima quedó en 23 px.
6. **Render 6 (final, sin voz)**: 14/14.

## 4. Evaluación creativa honesta
Mejoró de verdad:
- El gancho se lee como tipografía cinética y no como una caída. Hay movimiento desde el frame 0 y el golpe de "TU" y el motion blur se notan.
- Ya no hay planos quietos: la cámara siempre está en dolly o paneo y la medalla siempre se mueve.
- La cinta tiene volumen, el layout está limpio (verificado por código) y la transición mantiene el azul y se siente intencional.
- El sonido es más redondo y la música resuelve.

Debilidades que debe juzgar un humano:
- **El QA de layout muestrea cada 5 frames.** El roce de f205 apareció en un frame muestreado, pero un choque que dure menos de 5 frames entre dos muestras podría pasar inadvertido. Para el tramo de beneficios se verificó cuadro a cuadro.
- **Nadie lo ha escuchado.** La voz, los SFX y la mezcla se validaron con medidores y métricas (LUFS, true peak, centroide, pausas, F0). "Más natural" es una inferencia de esas métricas, no una escucha.
- **La voz sigue siendo TTS** (Piper `es_MX-claude-high`, acento mexicano). Mejora la prosodia, pero no reemplaza una locución humana chilena.
- **La medalla se ve blanda** en los planos grandes: el raw recortado mide 437x1001 px y se escala hasta ~1,7× en el revelado. Además, **es una imagen generada por IA**, no una foto real.
- **La cinta vectorial reemplaza visualmente la del raw.** Sigue siendo blanca y satinada, pero es una ilustración por código sobre la foto del producto y Brine debe aprobarla. No se agregó ningún claim: "cinta incluida" sigue prohibido y no aparece en pantalla.
- **El cierre (13–15 s)** es correcto pero sobrio: logo, píldora y URL con micro-movimiento, sin un último gesto fuerte.
- **La salida escalonada del statement** deja "memorable." sola durante unos 4 frames (12,4–12,5 s). Es legible como animación, pero se puede pulir.
- **Fuentes sustitutas** OFL: Playfair Display en lugar de Sonttak y Manrope en lugar de STRONG.
- **CTA**: "Cotiza la tuya" según el brief del Director; el carrusel CNT-20261009-01 usa "Cotiza el tuyo". Hay que unificarlo.
- La v2 **no la ha vuelto a puntuar el modelo de revisión de video**, así que no hay un puntaje nuevo comparable con el 3,5/10.

**Veredicto: TECHNICALLY_READY — CREATIVE_REVIEW_REQUIRED.**
Pasa todo el QA técnico y de marca en ambas variantes, pero la voz, la escucha de la mezcla, la cinta redibujada y el raw generado por IA requieren aprobación humana antes de cualquier uso.

## 5. Origen de cada elemento y estado
- Animación, música y SFX: 100 % por código (Remotion/React/TS y Python numpy/scipy). La **voz la genera Piper TTS** (modelo local `es_MX-claude-high`, Apache-2.0, descargado desde Hugging Face `rhasspy/piper-voices`), no el modelo que programa. Las tomas, sus parámetros y la toma elegida quedan en `build/<ID>/audio-report.json` y en el `qa.json`.
- Claims: solo los de la ficha (logotipos, nombres, fechas, superficie brillante, sublimación). No hay precio, plazo, stock, descuento ni mínimo.
- Marca: celeste #ADBED4, azul oscuro #21254B y dorado #CDA71F solo como acento (máx. 1,11 % del cuadro). El logo oficial se copia byte a byte y solo se anima con opacidad, subida y escala uniforme: sin recolor, deformación, rotación, sombra ni glow (verificado en el QA).
- Nada publicado, nada gastado, ningún servicio pago. Requiere aprobación humana.

---

# Anexo — Informe de calidad V1 (histórico) · BMS-20261009-001

Producción: Medalla de acrílico personalizada (variante A). Fecha: 2026-10-09, run 3 (final) terminado a las 12:57 (hora de Chile).
Archivo: `studio/out/BMS-20261009-001.mp4` (32,3 MB, sha256 `ec5a8802…5ad38db1`).
Contact sheet: `studio/out/BMS-20261009-001.contact-sheet.png` · QA crudo: `studio/out/BMS-20261009-001.qa.json` · log: `studio/build/produce-run3.log`.

### V1.1 QA automático (`scripts/qa.py`, medido sobre el MP4 final): 13/13 PASS

| Check | Resultado | Valor medido |
|---|---|---|
| Resolución | PASS | 1080x1920 |
| FPS | PASS | 30 |
| Duración | PASS | 15,000 s |
| Códecs | PASS | H.264 yuv420p (rango tv, bt709) + AAC 48 kHz 192 kbps, faststart |
| Integridad (decodificación completa) | PASS | 0 errores |
| Audio presente | PASS | sí |
| Loudness | PASS | -14,3 LUFS integrados (objetivo -14 ±1), LRA 4,6 LU |
| True peak | PASS | -1,8 dBTP (límite -1) después del AAC |
| Frames negros (blackdetect) | PASS | ningún segmento |
| Zonas seguras de texto | PASS | 13 keyframes dentro de y 269–1536 y x 90–950 (sup. 14 %, inf. 20 %, márgenes 90/130 px) |
| Contraste WCAG | PASS | mínimo 6,36:1 (eyebrow celeste sobre navy), resto entre 9,9 y 13,5:1 |
| Logo en el cierre | PASS | aspecto 2,552 frente a 2,548 del original, correlación de luma 0,98, dentro de la zona segura |
| Dorado < 3 % | PASS | máximo 1,13 % en un frame, media 0,06 % |

Cómo se mide: las zonas seguras y el contraste usan stills renderizados solo con la capa de texto (`qaLayer=text`) sobre los mismos keyframes. Así se mide la tipografía real, no una estimación. Además se verificó una pasada densa del gancho (frames 2–62, uno a uno en el split) para confirmar que ninguna animación sale de los márgenes.

### V1.2 Iteraciones de autorrevisión visual (2, el máximo pedido)
1. **Run 1**: 9/13. Fallaban true peak (-0,8 dBTP tras AAC), pix_fmt yuvj420p y tres checks (zonas, contraste, logo) cuyos stills de QA se renderizaban en modo normal. Corregido: limitador a -2 dBTP, re-encode a yuv420p tv-range y `selectComposition` por capa.
   En lo visual, el reveal (3–6,5 s) se veía estático. Se añadieron halo, órbita dorada discontinua, bokeh en primer plano y más presencia de la textura tipográfica.
2. **Run 2**: 12/13. Falló zonas seguras: el gancho entraba a escala 2,3× y el split lanzaba las mitades fuera del cuadro, "Fechas" quedaba en x 984 y el eyebrow en x 952.
   Corregido: entrada tipo punch-in (0,55→1), titulares a 154/138 px, mitades que se disuelven en 5 frames al partirse, benefits a x 112/930 y eyebrow a 28 px.
   **Run 3**: 13/13.

### V1.3 Evaluación creativa honesta
Lo que funciona:
- Gancho en 0–3 s, tipográfico y en el beat.
- La medalla cae y parte el titular.
- La transición por zoom a la cara de la medalla lleva al statement claro.
- El cierre es limpio, con el logo oficial intacto y el CTA visible.
- La paleta respeta la marca y el dorado queda como acento.

Debilidades que debe juzgar un humano:
- **Medalla algo blanda** en los planos grandes. El raw es de 896x1200 y se escala aprox. 1,4×.
- **El raw es la imagen generada por IA aprobada por Enzo**, no una foto real del producto. Para publicidad pagada conviene una foto real.
- **Textos chicos**: el eyebrow (28 px) y el subtítulo de benefits (34 px) son legibles en 1080p, pero chicos en un teléfono.
- **La textura tipográfica del fondo** ("TU LOGO · TU NOMBRE…") puede sentirse cargada detrás de los labels.
- **El gancho** quedó más contenido que en el run 1 para cumplir los márgenes. Es correcto, aunque menos explosivo.
- **Voz**: Piper `es_MX-claude-high`, con acento mexicano. No existe una voz Piper chilena gratuita. Hay que aprobarla o reemplazarla por una locución humana.
- **Fuentes sustitutas** (OFL): Playfair Display en lugar de Sonttak y Manrope en lugar de STRONG.
- **CTA**: se usó "Cotiza la tuya" (pedido del Director), mientras que EXP-001-v2 de Creative dice "Cotiza el tuyo". Hay que unificarlo.
- **Variante B**: está definida en el JSON, pero no se renderizó.
- **Sin escucha humana**: la mezcla se validó con medidores (LUFS, true peak). Nadie la ha escuchado todavía.

**Veredicto: TECHNICALLY_READY — CREATIVE_REVIEW_REQUIRED.**

### V1.4 Origen de cada elemento
- Código, animación, música y SFX: generados 100 % por código en el box (Remotion/React/TS y Python numpy/scipy).
- **La voz la genera Piper TTS (modelo es_MX-claude-high, local), no el modelo que programa.** Las líneas, sus tiempos y su `length_scale` están en `audio-report.json`.
- Claims: solo los de la ficha del producto (logotipos, nombres, fechas, superficie brillante, sublimación). No hay precio, plazo, stock, descuento ni mínimo.

### V1.5 Estado
- Nada publicado, nada gastado.
- No se tocó Parrotfy, el Cotizador ni BRINE MASTER.
- Requiere aprobación humana antes de cualquier uso.
