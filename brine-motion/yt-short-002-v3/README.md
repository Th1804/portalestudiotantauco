# YT-SHORT-002 v3 — Copa Plateada (Brine Chile)

YouTube Short vertical 1080x1920, 18 s, 30 fps, para @brinechile.

## Render

```bash
pip install pillow numpy opencv-python-headless scipy
python3 prep_assets.py   # recorte de la copa (foto real) + logo -> build/
python3 render.py        # -> out/YT-SHORT-002_v3_copa-plateada.mp4
python3 render.py --stills 1.8 8.2 17.5   # frames de revisión
```

Requiere `ffmpeg` con `libx264`.

## Guion (s)

| Tiempo | Texto | Movimiento |
| --- | --- | --- |
| 0.0–3.0 | EL FINAL QUE / TODOS QUIEREN | Rack focus desenfocado → nítido, push-in lento |
| 3.0–6.4 | COPA PLATEADA · estilo europeo | La copa sube, panel glass en tercio inferior |
| 6.4–10.0 | 3 TAMAÑOS · 20 / 25 / 30 cm | La copa pasa a 30 cm; 25 y 20 cm entran a escala real relativa |
| 10.0–13.6 | TU LIGA. / TU CAMPEÓN. / TU AÑO. | Plano héroe, la copa se desenfoca detrás del panel (profundidad de campo) |
| 13.6–15.7 | PARA · CLUBES · COLEGIOS · CAMPEONATOS | Copa nítida, pills glass escalonadas |
| 15.7–18.0 | Cotiza la tuya · brinechile.cl + logo pequeño | End card |

Paleta: azul marino `#21254B`, celeste `#ADBED4`, blanco `#F4F6F9`, dorado `#CDA71F` (acento).
Tipografía: Montserrat (OFL). El único logo aparece pequeño en el end card; nada detrás del producto.

## Assets

- `assets/copa_plateada_foto.png`: foto real del producto. `prep_assets.py` recorta solo la copa (descarta el texto impreso de la ficha).
- `assets/brine_logo_horizontal.png`: logo oficial horizontal (tienda brinechile.cl).
- El MP4 incluye una pista de audio silenciosa; la música se agrega en YouTube.
