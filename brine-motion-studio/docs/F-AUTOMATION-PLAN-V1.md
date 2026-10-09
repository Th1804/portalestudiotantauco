# BRINE MOTION STUDIO — AUTOMATION PLAN V1

## Principio
Motion Studio **produce borradores**. Ninguna pieza se publica, se programa ni se pauta sin aprobación humana explícita (René o quien él designe), registrada en un objeto `approval` (ver doc B §5).

## Disparo (Social Intelligence → brief)
1. Social Intelligence detecta una señal **verificada** y emite un `brief_request`: un post orgánico con guardados/compartidos sobre la media de 7D, un producto con consultas, una fecha comercial confirmada o una petición de René. Cada señal lleva su fuente, su ventana y `verified:true`. Si un dato no está verificado, se marca `verified:false` y no se usa como argumento.
2. Marketing valida los claims contra la ficha viva (fecha de lectura) y entrega el `creative_brief`, con la lista de datos prohibidos: precio, plazos, stock, descuentos y mínimos, salvo que Comercial los confirme por escrito.
3. Motion Director (este sistema) escribe `productions/<ID>.json`, eligiendo escenas y variante (gancho, ritmo, música y CTA) **sin repetir** el esquema de la pieza anterior, y ejecuta `npm run produce`.
4. El QA automático debe pasar. Después viene la autorrevisión visual (contact sheet) y, al final, la revisión humana del MP4.
5. Con `approval` firmado, Publisher sube la pieza. Sin aprobación, el MP4 se queda en `out/`.

## Cadencia propuesta (a validar con René)
- 1 video semanal por producto ya aprobado en carrusel (reutiliza assets y claims verificados), más una variante A/B solo si hay presupuesto aprobado para pauta.
- Tiempo estimado por pieza en este box: unos 2 min de audio + preview y entre 10 y 20 min de render con concurrency 2. Depende de la carga del box.

## Medición: tres categorías separadas, nunca mezcladas
| Categoría | Qué es | Métricas | Fuente |
|---|---|---|---|
| **Orgánico** | Post/Reel sin pauta | reach, plays, retención 3 s/50 %, guardados, compartidos, visitas al perfil | Insights de IG/TikTok (export o API oficial) |
| **Pagado** | Pieza con presupuesto en Meta Ads | impresiones, CPM, ThruPlay, CTR, CPC, frecuencia | Meta Ads Manager; solo con gasto aprobado |
| **Conversiones verificadas** | Cotizaciones/ventas atribuibles | solicitudes de cotización con origen identificado (UTM, código o pregunta "¿cómo nos conociste?") | Registros comerciales; **nunca estimadas** |

Reglas: sin datos inventados ni proyecciones presentadas como resultados. Un experimento con n=1 se reporta como direccional. Las métricas de video se comparan con piezas del mismo formato y la misma categoría (orgánico vs. orgánico).

## Variantes A/B
Cada variante es una producción con su propio ID (`BMS-YYYYMMDD-NNN-A/B`) que cambia **una** dimensión a la vez: gancho, ritmo/BPM, música o CTA. El JSON actual define A (renderizada) y B (definida, no renderizada).

## Pendientes humanos antes de activar la automatización
1. Aprobar la voz (Piper es_MX-claude-high: acento mexicano neutro; no hay voz Piper es_CL) o grabar/licenciar una voz chilena.
2. Confirmar el CTA del experimento: «Cotiza la tuya» (este video) o «Cotiza el tuyo» (CTA fijo de EXP-001-v2).
3. Conseguir las fuentes oficiales Sonttak y STRONG con licencia para video, o aprobar las sustitutas.
4. Definir quién firma `approval` y cómo se registra.
