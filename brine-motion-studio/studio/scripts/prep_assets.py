#!/usr/bin/env python3
"""BRINE MOTION STUDIO — preparación determinista de assets (sin IA, sin red).
Recorta la medalla aprobada (raw de CNT-20261009-01, aprobado por Enzo 2026-10-09 10:47) por llave de color
y copia el logo oficial sin modificarlo. Funciones de llave copiadas (sin cambios) de
/workspace/brine-marketing/carruseles-automatizados/CNT-20261009-01/postpro_cnt0901.py (Brine Creative)."""
import hashlib, json, math, os, shutil, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
def _largest_component_seed(mask_bool, k=4):
    """Devuelve un píxel (x,y) a resolución completa dentro del componente mayor (etiquetado en baja resolución)."""
    h, w = mask_bool.shape
    small = Image.fromarray((mask_bool * 255).astype(np.uint8)).resize((w // k, h // k), Image.Resampling.BOX).point(lambda v: 255 if v > 127 else 0)
    best, best_n = None, 0
    work = small.copy()
    for _ in range(40):
        arr = np.asarray(work)
        nz = np.argwhere(arr == 255)
        if len(nz) == 0: break
        y0, x0 = nz[0]
        tmp = work.copy(); ImageDraw.floodfill(tmp, (int(x0), int(y0)), 128)
        comp = np.asarray(tmp) == 128
        n = int(comp.sum())
        if n > best_n: best, best_n = comp, n
        work = Image.fromarray(np.where(comp, 0, arr).astype(np.uint8))
    ys, xs = np.nonzero(best)
    cy, cx = ys.mean(), xs.mean()
    j = np.argmin((ys - cy) ** 2 + (xs - cx) ** 2)
    sx, sy = int(xs[j] * k + k // 2), int(ys[j] * k + k // 2)
    for r in range(0, 2 * k):
        win = mask_bool[max(0, sy - r):sy + r + 1, max(0, sx - r):sx + r + 1]
        if win.any():
            yy, xx = np.nonzero(win)
            return int(max(0, sx - r) + xx[0]), int(max(0, sy - r) + yy[0])
    raise SystemExit("llave: sin semilla")


def key_medal(raw, kc, straighten="pca"):
    """Separa la medalla blanca del papel azul oscuro por distancia de color (sin IA).
    Pasos: color de papel = mediana del marco; alfa por distancia; apertura; SOLO el componente principal (excluye marca
    de agua/motas); relleno de huecos (impresión azul oscuro, ranura, reflejos); contracción + feather; descontaminación
    del borde (mezcla hacia el color interior extendido, sin halo azul); endereza con rotación rígida."""
    P = 8
    a0 = np.asarray(raw.convert("RGB")).astype(np.float32)
    h, w, _ = a0.shape
    fr = np.concatenate([a0[:int(.04 * h)].reshape(-1, 3), a0[-int(.04 * h):].reshape(-1, 3),
                         a0[:, :int(.04 * w)].reshape(-1, 3), a0[:, -int(.04 * w):].reshape(-1, 3)])
    bg = np.median(fr, 0)
    a = np.pad(a0, ((P, P), (P, P), (0, 0)), mode="edge")        # el borde del cuadro (cinta que sale) no se erosiona
    d = np.sqrt(((a - bg) ** 2).sum(-1))
    m = Image.fromarray(((d > (kc["lo"] + kc["hi"]) / 2) * 255).astype(np.uint8))
    e = int(kc.get("erode", 2))
    if e > 0:
        m = m.filter(ImageFilter.MinFilter(2 * e + 1)).filter(ImageFilter.MaxFilter(2 * e + 1))
    mb = np.asarray(m) > 0
    sx, sy = _largest_component_seed(mb)
    comp = m.copy(); ImageDraw.floodfill(comp, (sx, sy), 128)
    m = Image.fromarray(((np.asarray(comp) == 128) * 255).astype(np.uint8))
    pad = Image.new("L", (m.width + 2, m.height + 2), 0); pad.paste(m, (1, 1))
    ImageDraw.floodfill(pad, (0, 0), 128)
    filled = np.asarray(pad)[1:-1, 1:-1] != 128
    cover = float(filled[P:-P, P:-P].mean())
    if cover < 0.05 or cover > 0.8:
        raise SystemExit(f"Llave falló (cobertura {cover:.1%}); revisa el raw o ajusta key.*")
    fimg = Image.fromarray((filled * 255).astype(np.uint8))
    sk = int(kc.get("shrink", 0))
    if sk > 0:
        fimg = fimg.filter(ImageFilter.MinFilter(2 * sk + 1))
    filled = np.asarray(fimg) > 127
    A = np.asarray(fimg.filter(ImageFilter.GaussianBlur(kc.get("feather", 1.1)))).astype(np.float32) / 255.0
    dc = int(kc.get("decontam", 4))
    inner = Image.fromarray((filled * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * dc + 1))
    im_ = np.asarray(inner).astype(np.float32)[..., None] / 255.0
    num = Image.fromarray(np.clip(a * im_, 0, 255).astype(np.uint8))
    r = dc * 2 + 2
    numb = np.asarray(num.filter(ImageFilter.GaussianBlur(r))).astype(np.float32)
    denb = np.asarray(inner.filter(ImageFilter.GaussianBlur(r))).astype(np.float32)[..., None] / 255.0
    ext = numb / np.maximum(denb, 1e-3)
    v = bg[None, None, :] - ext
    t = np.clip(((a - ext) * v).sum(-1) / np.maximum((v * v).sum(-1), 1.0), 0, 1)[..., None]   # fracción de papel mezclada
    band = (1 - im_)
    wgt = band * np.clip(t * 1.8, 0, 1)
    a2 = a * (1 - wgt) + ext * wgt
    outside = (A < 0.02)[..., None]
    a2 = np.where(outside, ext, a2)                                   # color seguro fuera del alfa (sin azul)
    rgba = np.dstack([np.clip(a2, 0, 255), A * 255]).astype(np.uint8)[P:-P, P:-P]
    filled = filled[P:-P, P:-P]
    img = Image.fromarray(rgba, "RGBA")
    if straighten in (None, "pca"):
        ys, xs = np.nonzero(filled)
        cov = np.cov(np.vstack([xs - xs.mean(), ys - ys.mean()]))
        wv, vv = np.linalg.eigh(cov); vx, vy = vv[:, np.argmax(wv)]
        ang = math.degrees(math.atan2(vx, vy))
        if ang > 90: ang -= 180
        if ang < -90: ang += 180
        if abs(ang) > 45: ang = ang - 90 if ang > 0 else ang + 90
    elif straighten == "none":
        ang = 0.0
    else:
        ang = float(straighten)
    if abs(ang) > 0.15:
        img = img.convert("RGBa").rotate(-ang, resample=Image.Resampling.BICUBIC, expand=True).convert("RGBA")   # rotación RÍGIDA
    img = img.crop(img.getchannel("A").point(lambda x: 255 if x > 24 else 0).getbbox())
    return img, ang, cover, tuple(int(x) for x in bg)


def main(prod_path):
    prod = json.load(open(prod_path))
    here = os.path.dirname(os.path.abspath(__file__))
    pub = os.path.join(here, "..", "public", "assets")
    os.makedirs(pub, exist_ok=True)
    pa = dict(prod["product"]["assets"])
    root = os.path.abspath(os.path.join(here, ".."))
    rp = lambda p: p if os.path.isabs(p) else os.path.join(root, p)  # rutas relativas = relativas a studio/
    pa["raw"] = rp(pa["raw"])
    raw = Image.open(pa["raw"])
    kc = pa.get("key", {"lo": 70, "hi": 115, "erode": 2, "shrink": 2, "feather": 1.1, "decontam": 4})
    cut, ang, cover, bg = key_medal(raw, kc)
    out = os.path.join(pub, "product.png")
    cut.save(out)
    logo_src = rp(prod["brand"]["logo"])
    logo_dst = os.path.join(pub, "logo.png")
    shutil.copyfile(logo_src, logo_dst)  # copia byte a byte: sin recolor, sin deformar
    meta = {"product_png": out, "size": cut.size, "angle": ang, "cover": cover, "paper_rgb": bg,
            "raw_sha256": hashlib.sha256(open(pa["raw"], "rb").read()).hexdigest(),
            "logo_sha256": hashlib.sha256(open(logo_src, "rb").read()).hexdigest(),
            "logo_size": Image.open(logo_src).size}
    json.dump(meta, open(os.path.join(pub, "assets-meta.json"), "w"), indent=1)
    print(json.dumps(meta))


if __name__ == "__main__":
    main(sys.argv[1])
