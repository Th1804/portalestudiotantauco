# E — Informe de calidad V1 · BMS-20261009-001

Producción: Medalla de acrílico personalizada (variante A). Fecha: 2026-10-09, run 3 (final) terminado a las 12:57 (hora de Chile).
Archivo: `studio/out/BMS-20261009-001.mp4` (32,3 MB, sha256 `ec5a8802…5ad38db1`).
Contact sheet: `studio/out/BMS-20261009-001.contact-sheet.png` · QA crudo: `studio/out/BMS-20261009-001.qa.json` · log: `studio/build/produce-run3.log`.

## 1. QA automático (`scripts/qa.py`, medido sobre el MP4 final): 13/13 PASS

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

## 2. Iteraciones de autorrevisión visual (2, el máximo pedido)
1. **Run 1**: 9/13. Fallaban true peak (-0,8 dBTP tras AAC), pix_fmt yuvj420p y tres checks (zonas, contraste, logo) cuyos stills de QA se renderizaban en modo normal. Corregido: limitador a -2 dBTP, re-encode a yuv420p tv-range y `selectComposition` por capa.
   En lo visual, el reveal (3–6,5 s) se veía estático. Se añadieron halo, órbita dorada discontinua, bokeh en primer plano y más presencia de la textura tipográfica.
2. **Run 2**: 12/13. Falló zonas seguras: el gancho entraba a escala 2,3× y el split lanzaba las mitades fuera del cuadro, "Fechas" quedaba en x 984 y el eyebrow en x 952.
   Corregido: entrada tipo punch-in (0,55→1), titulares a 154/138 px, mitades que se disuelven en 5 frames al partirse, benefits a x 112/930 y eyebrow a 28 px.
   **Run 3**: 13/13.

## 3. Evaluación creativa honesta
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

## 4. Origen de cada elemento
- Código, animación, música y SFX: generados 100 % por código en el box (Remotion/React/TS y Python numpy/scipy).
- **La voz la genera Piper TTS (modelo es_MX-claude-high, local), no el modelo que programa.** Las líneas, sus tiempos y su `length_scale` están en `audio-report.json`.
- Claims: solo los de la ficha del producto (logotipos, nombres, fechas, superficie brillante, sublimación). No hay precio, plazo, stock, descuento ni mínimo.

## 5. Estado
- Nada publicado, nada gastado.
- No se tocó Parrotfy, el Cotizador ni BRINE MASTER.
- Requiere aprobación humana antes de cualquier uso.
