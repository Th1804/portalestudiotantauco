# Tabla de cortes — "No Sobre Ti" (Pimzath)

Tiempos en segundos del audio fuente `assets/No_Sobre_Ti_original.m4a` (decodificado con ffmpeg; 4:08.92).
"Entrada/fin de voz" sale de `sync/lyrics_sync.json` (alineación forzada sobre la voz aislada + revisión manual).
Fin del corte = inicio + frames/30. Fades de audio: 15 ms de entrada y 300 ms de salida, solo para evitar clics.

**Alcance actual (cambio del artista):** solo se renderizó la pieza **01 Refugio**. Las otras cinco quedan como
candidatos propuestos con timestamps; no se renderizaron.

| # | Nombre | Sección | Corte fuente (inicio – fin) | Duración | Voz (entrada – fin) | Letra | Concepto | Motivo | Estado |
|---|---|---|---|---|---|---|---|---|---|
| 01 | Refugio | Coro 2 | 2:50.220 – 3:07.353 (170.220 – 187.353) | 17.133 s (514 fr) | 170.29 – 186.20 | Que llueva sobre mí / Que llueva sobre mí / Pero no sobre ti / Pero no sobre ti | Las palabras caen como gotas y forman una cúpula; la lluvia se detiene en ella; dentro, espacio cálido; "Pero no sobre ti" se revela dentro y luego se escribe en el reflejo del agua | Es la frase título. El corte empieza justo antes del "Que" (gancho en el frame 0). Se eligió el Coro 2 sobre el Coro 1 porque aquí "Pero no sobre ti" se canta **dos veces**: el remate es más largo y es el clímax de la canción. Termina en la grilla de beats tras la cola de "ti" | **Renderizado** |
| 02 | Cielo | Pre-coro | 0:51.235 – 1:09.268 (51.235 – 69.268) | 18.033 s (541 fr) | 51.68 – 68.20 | Si cae el cielo / Déjalo caer / Si cae el cielo / Déjalo caer | Capas de papel que caen con peso; la cámara las atraviesa | Frases largas y sostenidas con silencio antes y después: es el corte más limpio de la canción y loopea bien | Propuesto |
| 03 | Tus ojos no | Verso 1 | 0:17.600 – 0:36.367 (17.600 – 36.367) | 18.767 s (563 fr) | 17.98 – 35.30 | Tu pelo en mi cara / La lluvia en el vidrio / Tu boca mojada / Y yo sigo aquí / Las luces se apagan / Tus ojos no ×3 | Retrato de Pimzath tras vidrio mojado; se apaga la luz, la mirada no | Primera entrada vocal, voz íntima; la alineación favorece 3 "Tus ojos no" (como en la letra) frente a 4 | Propuesto |
| 04 | Abril | Verso 2 | 1:59.500 – 2:18.267 (119.500 – 138.267) | 18.767 s (563 fr) | 119.86 – 137.15 | Dos gotas de sangre / … / La noche está fría / Tu piel sabe a abril / Abril ×4 | De ciruela a naranja; cada "Abril" cambia espacio, foco o escala | "La noche está fría / Tu piel sabe a abril" sola dura 8,8 s (<10 s), así que se incluye el verso completo. El número de "Abril" (4) tiene confianza media | Propuesto |
| 05 | Junto a ti | Coro 1 | 1:24.126 – 1:42.226 (84.126 – 102.226) | 18.100 s (543 fr) | 84.44 – 102.22 | Y la maldita lluvia caerá / Pero seguiré de pie junto a ti / (Y para ti) / Para ti / (Y para ti) / Para ti | Dos trazos que se acercan y resisten la lluvia; gesto de abrazo de la portada | Usa el Coro 1 para no repetir el pasaje de 01. El "Que" siguiente entra en 102.33, así que el corte cierra con el fade en la cola de "ti" (se pierden ~0,1 s de cola) | Propuesto |
| 06 | Sobre mí | Outro | 3:16.510 – 3:32.043 (196.510 – 212.043) | 15.533 s (466 fr) | 197.06 – 211.00 | Sobre mí / Sobre mí / No sobre ti ×2 | La lluvia sigue a "Sobre mí" y se desvía con "No sobre ti" | Outro despojado, ideal para loop. Comparte palabras con 01 pero es otro pasaje y otra interpretación (más lenta y aireada) | Propuesto |

Ningún candidato repite un pasaje de audio. La cola 221.6–231.0 s es una vocalización sin palabras: no está en la letra oficial y no se subtitula.

## Discrepancias con la letra oficial (no se reescribió la letra)
- Coro 2: "Pero no sobre ti" se canta **dos veces** (178.81 y 183.08 s); la letra oficial lo escribe una vez. El Reel 01 respeta lo cantado.
- Outro: después de 221.6 s hay una vocalización sin palabras que no aparece en la letra.
- Verso 2: los 4 "Abril" son compatibles con la envolvente, pero el ASR cuenta entre 3 y 5 (confianza media).
- Coros: los "(Y para ti)" son voces de fondo superpuestas; sus inicios son aproximados (±0,2 s).
