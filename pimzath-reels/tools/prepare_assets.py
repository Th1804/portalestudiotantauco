"""Prepara los assets derivados en build/ (reproducible, sin aleatoriedad no fijada).

- build/portrait_photo.png   recorte de la foto principal de la ficha visual (sin la interfaz de la ficha)
- build/portrait_sketch.png  tratamiento lápiz + color original atenuado (conserva rasgos, rizos, lunares, suéter azul)
- build/cover_card.png       arte de la portada recortado de la captura del teléfono (sin hora, controles ni notificaciones)
- build/cover_art_rgba.png   solo el dibujo (papel blanco -> transparente) para componerlo sobre nuestro papel
- build/paper_ivory.png, build/paper_plum.png, build/grain.png  texturas de papel/lápiz (semilla fija)

Uso: python3 tools/prepare_assets.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
A = ROOT / "assets"
B = ROOT / "build"
W, H = 1080, 1920


def save(arr, name):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(B / name)


def portrait():
    im = Image.open(A / "ficha_visual_pimzath.png").convert("RGB").crop((14, 92, 500, 688))
    im.save(B / "portrait_photo.png")
    big = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    rgb = np.asarray(big).astype(np.float32)
    gray = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    inv_blur = ndimage.gaussian_filter(255 - gray, 9)
    dodge = np.clip(gray * 255 / np.maximum(1, 255 - inv_blur), 0, 255)
    sketch = np.clip((dodge - 40) * 1.25, 0, 255)
    # trazo de lápiz: líneas ciruela sobre marfil, luego se mezcla con el color original
    ivory = np.array([242, 233, 220], np.float32)
    plum = np.array([50, 28, 44], np.float32)
    k = (sketch / 255.0)[..., None]
    pencil = plum * (1 - k) + ivory * k
    luma = pencil * 0.5 + gray[..., None] * 0.5
    chroma = rgb - gray[..., None]
    out = luma + chroma * 1.15
    save(out, "portrait_sketch.png")


def cover():
    im = Image.open(A / "portada_captura_telefono.png").convert("RGB")
    card = np.asarray(im.crop((29, 351, 799, 1116))).astype(np.float32)
    h, w = card.shape[:2]
    paper = np.median(card[5:60, 40:200].reshape(-1, 3), axis=0)
    yy, xx = np.mgrid[0:h, 0:w]
    r = 36
    cx = np.clip(xx, r, w - 1 - r)
    cy = np.clip(yy, r, h - 1 - r)
    outside = (xx - cx) ** 2 + (yy - cy) ** 2 > r * r
    card[outside] = paper
    save(card, "cover_card.png")
    diff = np.max(np.abs(card - paper), axis=2)
    lum = card.mean(axis=2)
    a = np.clip((diff - 10) / 60.0, 0, 1)
    a = np.maximum(a, np.clip((paper.mean() - lum - 8) / 70.0, 0, 1))
    a = ndimage.gaussian_filter(a, 0.6)
    col = (card - paper * (1 - a[..., None])) / np.maximum(a[..., None], 0.05)
    rgba = np.dstack([np.clip(col, 0, 255), a * 255])
    edge = ndimage.binary_dilation(outside, iterations=6)
    edge[:6], edge[-6:], edge[:, :6], edge[:, -6:] = True, True, True, True
    rgba[edge] = 0
    save(rgba, "cover_art_rgba.png")


def paper(base, fiber_col, seed, name, grain_amt=10.0):
    rng = np.random.default_rng(seed)
    low = ndimage.gaussian_filter(rng.standard_normal((H // 8, W // 8)), 6)
    low = np.kron(low / (np.abs(low).max() + 1e-6), np.ones((8, 8)))[:H, :W]
    fine = ndimage.gaussian_filter(rng.standard_normal((H, W)), 0.7)
    img = np.ones((H, W, 3), np.float32) * np.array(base, np.float32)
    img += (low * 9 + fine * grain_amt)[..., None]
    # fibras
    fib = np.zeros((H, W), np.float32)
    for _ in range(900):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        ang = rng.uniform(0, np.pi)
        ln = rng.uniform(8, 40)
        for s in np.linspace(0, ln, int(ln)):
            px, py = int(x + np.cos(ang) * s), int(y + np.sin(ang) * s)
            if 0 <= px < W and 0 <= py < H:
                fib[py, px] += 1
    fib = ndimage.gaussian_filter(fib, 0.6)
    img = img * (1 - 0.18 * fib[..., None]) + np.array(fiber_col, np.float32) * 0.18 * fib[..., None]
    save(img, name)


def grain():
    rng = np.random.default_rng(7)
    g = ndimage.gaussian_filter(rng.standard_normal((H, W)), 0.8)
    g = (g / np.abs(g).max())
    # trama diagonal suave tipo lápiz
    yy, xx = np.mgrid[0:H, 0:W]
    hatch = np.sin((xx + yy * 0.35) * 0.9) * 0.25
    v = np.clip(128 + (g + hatch * np.abs(g)) * 120, 0, 255)
    Image.fromarray(v.astype(np.uint8), "L").save(B / "grain.png")


def main():
    B.mkdir(exist_ok=True)
    portrait()
    cover()
    paper((242, 233, 220), (200, 170, 160), 11, "paper_ivory.png")
    paper((50, 28, 44), (110, 50, 80), 12, "paper_plum.png", grain_amt=6.0)
    grain()
    print("ok")


if __name__ == "__main__":
    main()
