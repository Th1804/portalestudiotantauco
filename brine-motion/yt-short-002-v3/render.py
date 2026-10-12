"""YT-SHORT-002 v3 — Copa Plateada (Brine Chile). 1080x1920, 18 s, 30 fps.

Usage:
    python3 prep_assets.py            # once: builds build/trophy.png and build/logo.png
    python3 render.py                 # renders out/YT-SHORT-002_v3_copa-plateada.mp4
    python3 render.py --stills 1.5 8  # writes preview PNGs for the given seconds
    python3 render.py --contact       # writes a contact sheet of the rendered timeline
"""
import argparse
import math
import subprocess
import sys
from functools import lru_cache
from multiprocessing import Pool
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.interpolate import PchipInterpolator

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build"
OUT_DIR = HERE / "out"
FONT = str(HERE / "fonts" / "Montserrat.ttf")

W, H, FPS, DUR = 1080, 1920, 30, 18.0
NFRAMES = int(DUR * FPS)


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32)


NAVY = hex_rgb("#21254B")
CELESTE = hex_rgb("#ADBED4")
WHITE = hex_rgb("#F4F6F9")
GOLD = hex_rgb("#CDA71F")


# ----------------------------------------------------------------------------- easing / tracks

def clamp01(x):
    return min(1.0, max(0.0, x))


def ease_out_cubic(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_in_cubic(x):
    x = clamp01(x)
    return x ** 3


def smoother(x):
    x = clamp01(x)
    return x * x * x * (x * (6 * x - 15) + 10)


class Track:
    """Monotone cubic (PCHIP) through keyframes: C1-smooth, no overshoot, exact holds."""

    def __init__(self, keys):
        ts = np.array([k[0] for k in keys], np.float64)
        vs = np.array([k[1:] for k in keys], np.float64)
        self.t0, self.t1 = ts[0], ts[-1]
        self.f = PchipInterpolator(ts, vs, axis=0)

    def __call__(self, t):
        return self.f(min(max(t, self.t0), self.t1))


def window(t, t_in, t_out, d_in=0.7, d_out=0.45):
    """Returns (enter progress, exit progress), both eased in [0, 1]."""
    return ease_out_cubic((t - t_in) / d_in), ease_in_cubic((t - t_out) / d_out)


# ----------------------------------------------------------------------------- compositing primitives

def over(frame, rgb_pm, a, x, y):
    """Premultiplied 'over' of a layer at integer (x, y), clipped to the frame."""
    h, w = a.shape
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    sx, sy = x0 - x, y0 - y
    la = a[sy:sy + (y1 - y0), sx:sx + (x1 - x0), None]
    lc = rgb_pm[sy:sy + (y1 - y0), sx:sx + (x1 - x0)]
    roi = frame[y0:y1, x0:x1]
    roi *= 1.0 - la
    roi += lc


def screen(frame, rgb_pm, x, y):
    h, w = rgb_pm.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    sx, sy = x0 - x, y0 - y
    lc = rgb_pm[sy:sy + (y1 - y0), sx:sx + (x1 - x0)]
    roi = frame[y0:y1, x0:x1]
    roi[:] = 1.0 - (1.0 - roi) * (1.0 - lc)


def multiply_alpha(frame, a, strength, x, y):
    h, w = a.shape
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    sx, sy = x0 - x, y0 - y
    la = a[sy:sy + (y1 - y0), sx:sx + (x1 - x0), None]
    frame[y0:y1, x0:x1] *= 1.0 - strength * la


def subpixel(layer, fx, fy, pad=2):
    """Shift a 4-channel premultiplied layer by the fractional part of (fx, fy).

    Returns (layer, ix, iy) with integer placement, so slow moves stay smooth instead of stepping.
    """
    ix, iy = math.floor(fx), math.floor(fy)
    dx, dy = fx - ix, fy - iy
    h, w = layer.shape[:2]
    M = np.float32([[1, 0, dx + pad], [0, 1, dy + pad]])
    out = cv2.warpAffine(layer, M, (w + 2 * pad, h + 2 * pad), flags=cv2.INTER_LINEAR,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return out, ix - pad, iy - pad


def gblur(img, sigma):
    if sigma < 0.35:
        return img
    return cv2.GaussianBlur(img, (0, 0), sigma, borderType=cv2.BORDER_CONSTANT)


def pad_layer(layer, p):
    return cv2.copyMakeBorder(layer, p, p, p, p, cv2.BORDER_CONSTANT, value=0)


# ----------------------------------------------------------------------------- assets

def load_rgba_pm(path):
    im = np.array(Image.open(path).convert("RGBA")).astype(np.float32) / 255.0
    im[..., :3] *= im[..., 3:4]
    return im


TROPHY = load_rgba_pm(BUILD / "trophy.png")
TH, TW = TROPHY.shape[:2]
TROPHY_ASPECT = TW / TH
BASE_TOP = int((BUILD / "trophy_meta.txt").read_text().split()[0])
_lum = (TROPHY[..., 0] * 0.3 + TROPHY[..., 1] * 0.59 + TROPHY[..., 2] * 0.11) / np.maximum(TROPHY[..., 3], 1e-3)
CHROME = np.zeros((TH, TW), np.float32)
CHROME[:BASE_TOP] = 1.0
CHROME = cv2.GaussianBlur(CHROME, (0, 0), 6) * TROPHY[..., 3] * (0.35 + 0.65 * np.clip(_lum, 0, 1))
CHROME = np.maximum(CHROME, 0.18 * TROPHY[..., 3])  # faint lacquer gloss on the wooden base

LOGO = load_rgba_pm(BUILD / "logo.png")


# ----------------------------------------------------------------------------- text

@lru_cache(maxsize=None)
def font(size, weight):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_name(weight)
    return f


def text_sprite(runs, size, weight="Black", tracking=0.0, max_width=None):
    """runs: [(text, rgb)], rendered on one baseline. Returns dict(pm, a, shadow) as float arrays."""
    while True:
        f = font(size, weight)
        widths = [[f.getlength(ch) for ch in txt] for txt, _ in runs]
        n_chars = sum(len(w) for w in widths)
        total = sum(sum(w) for w in widths) + tracking * size * max(0, n_chars - 1)
        if max_width is None or total <= max_width or size <= 12:
            break
        size = int(size * max_width / total) - 1
    asc, desc = f.getmetrics()
    pad = 40
    tw, th = int(math.ceil(total)) + 2 * pad, asc + desc + 2 * pad
    rgb = np.zeros((th, tw, 3), np.float32)
    a_all = np.zeros((th, tw), np.float32)
    x = float(pad)
    for (txt, col), ws in zip(runs, widths):
        mask = Image.new("L", (tw, th), 0)
        d = ImageDraw.Draw(mask)
        for ch, cw in zip(txt, ws):
            d.text((x, pad), ch, font=f, fill=255)
            x += cw + tracking * size
        a = np.array(mask).astype(np.float32) / 255.0
        rgb += a[..., None] * col
        a_all = np.maximum(a_all, a)
    ys, xs = np.nonzero(a_all > 0.01)
    y0, y1 = max(0, ys.min() - 30), min(th, ys.max() + 31)
    x0, x1 = max(0, xs.min() - 30), min(tw, xs.max() + 31)
    rgb, a_all = rgb[y0:y1, x0:x1], a_all[y0:y1, x0:x1]
    shadow = cv2.GaussianBlur(a_all, (0, 0), size * 0.12)
    return {"pm": np.dstack([rgb, a_all]), "shadow": shadow, "size": size}


def draw_sprite(frame, spr, cx, cy, opacity=1.0, blur=0.0, shadow=0.35):
    if opacity <= 0.003:
        return
    layer = spr["pm"]
    if blur > 0.35:
        layer = gblur(pad_layer(layer, int(blur * 3) + 2), blur)
    h, w = layer.shape[:2]
    if shadow > 0:
        sh = spr["shadow"]
        sx = int(round(cx - sh.shape[1] / 2))
        sy = int(round(cy - sh.shape[0] / 2 + spr["size"] * 0.06))
        multiply_alpha(frame, gblur(sh, blur) if blur > 0.35 else sh, shadow * opacity, sx, sy)
    lay, ix, iy = subpixel(layer * opacity, cx - w / 2, cy - h / 2)
    over(frame, lay[..., :3], lay[..., 3], ix, iy)


def text_anim(frame, spr, cx, cy, t, t_in, t_out, rise=36, d_in=0.75, d_out=0.45, shadow=0.35):
    e_in, e_out = window(t, t_in, t_out, d_in, d_out)
    op = e_in * (1 - e_out)
    if op <= 0.003:
        return
    dy = (1 - e_in) * rise - e_out * rise * 0.6
    blur = (1 - e_in) * 9 + e_out * 7
    draw_sprite(frame, spr, cx, cy + dy, op, blur, shadow)


# ----------------------------------------------------------------------------- liquid glass

def rounded_mask(w, h, r, ss=4):
    im = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(im).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], radius=r * ss, fill=255)
    return np.array(im.resize((w, h), Image.LANCZOS)).astype(np.float32) / 255.0


@lru_cache(maxsize=None)
def glass_geom(w, h, r):
    mask = rounded_mask(w, h, r)
    binm = (mask > 0.5).astype(np.uint8)
    dist = cv2.distanceTransform(binm, cv2.DIST_L2, 5).astype(np.float32)
    ds = cv2.GaussianBlur(dist, (0, 0), 3)
    gx = cv2.Sobel(ds, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(ds, cv2.CV_32F, 0, 1, ksize=3)
    norm = np.sqrt(gx * gx + gy * gy) + 1e-6
    nx, ny = gx / norm, gy / norm  # inward normal
    edge = 34.0
    lens = np.clip(1 - dist / edge, 0, 1) ** 2 * 26.0
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    maps = []
    for k in (1.0, 1.08, 1.16):  # R, G, B: slight dispersion at the rim
        maps.append((xx + nx * lens * k, yy + ny * lens * k))
    # Light from the top-left: brighter rim there, faint counter-rim bottom-right.
    lf = np.clip(-nx * -0.55 + -ny * -0.83, 0, 1)
    lb = np.clip(-nx * 0.55 + -ny * 0.83, 0, 1)
    rim = np.clip(1.8 - dist, 0, 1) * mask
    inner = np.clip(1 - dist / 14.0, 0, 1) ** 2 * mask
    bevel = np.clip(1 - dist / 5.0, 0, 1) * mask
    rim_light = rim * (0.30 + 0.70 * lf) * 0.85 + bevel * lf * 0.22 + inner * (0.14 * lf + 0.06 * lb)
    inner_shadow = inner * lb * 0.16
    top = np.clip(1 - yy / (h * 0.5), 0, 1) ** 2 * 0.08 * mask
    u = (xx + 0.6 * yy) / (w + 0.6 * h)
    shadow = cv2.GaussianBlur(pad_layer(mask, 60), (0, 0), 24)
    return {"mask": mask, "maps": maps, "rim": rim_light - inner_shadow, "top": top, "shadow": shadow,
            "u": u}


def glass_panel(frame, x, y, w, h, r=40, opacity=1.0, tint=NAVY, tint_a=0.30, frost=18.0,
                shadow=0.38, brighten=0.045, sheen=None):
    if opacity <= 0.003:
        return
    x, y = int(round(x)), int(round(y))
    g = glass_geom(w, h, r)
    multiply_alpha(frame, g["shadow"], shadow * opacity, x - 60, y - 60 + 18)
    m = 48
    X0, Y0, X1, Y1 = max(0, x - m), max(0, y - m), min(W, x + w + m), min(H, y + h + m)
    crop = frame[Y0:Y1, X0:X1]
    small = cv2.resize(crop, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), max(0.5, frost / 4), borderType=cv2.BORDER_REFLECT)
    blurred = cv2.resize(small, (crop.shape[1], crop.shape[0]), interpolation=cv2.INTER_LINEAR)
    ox, oy = x - X0, y - Y0
    chans = []
    for c, (mx, my) in enumerate(g["maps"]):
        chans.append(cv2.remap(blurred[..., c], mx + ox, my + oy, cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_REFLECT))
    glass = np.dstack(chans)
    lum = glass.mean(-1, keepdims=True)
    glass = lum + (glass - lum) * 1.15  # a touch of saturation, like real frosted acrylic
    glass = glass * (1 - tint_a) + tint * tint_a + brighten
    glass += (g["rim"] + g["top"])[..., None]
    if sheen is not None:
        glass += (np.exp(-((g["u"] - sheen) / 0.10) ** 2) * 0.07 * g["mask"])[..., None]
    mask = g["mask"][..., None] * opacity
    # Clip panel to frame.
    fx0, fy0 = max(0, x), max(0, y)
    fx1, fy1 = min(W, x + w), min(H, y + h)
    if fx1 <= fx0 or fy1 <= fy0:
        return
    sx, sy = fx0 - x, fy0 - y
    sl = (slice(sy, sy + fy1 - fy0), slice(sx, sx + fx1 - fx0))
    roi = frame[fy0:fy1, fx0:fx1]
    roi[:] = roi * (1 - mask[sl]) + np.clip(glass[sl], 0, 1.2) * mask[sl]


def panel_anim(frame, t, t_in, t_out, cx, cy, w, h, d_in=0.8, d_out=0.5, **kw):
    e_in, e_out = window(t, t_in, t_out, d_in, d_out)
    op = e_in * (1 - e_out)
    if op <= 0.003:
        return
    dy = (1 - e_in) * 28 - e_out * 16
    frost = 6 + 14 * e_in
    sheen = -0.3 + 1.6 * smoother((t - t_in - 0.25) / 1.9)
    glass_panel(frame, cx - w / 2, cy - h / 2 + dy, w, h, opacity=op, frost=frost, sheen=sheen, **kw)


# ----------------------------------------------------------------------------- background

def build_background():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = yy / H
    top = NAVY * 1.05
    mid = NAVY * 1.22
    bot = NAVY * 0.42
    grad = np.where(v[..., None] < 0.45,
                    top + (mid - top) * (v[..., None] / 0.45),
                    mid + (bot - mid) * ((v[..., None] - 0.45) / 0.55))
    r = np.sqrt(((xx - W * 0.5) / (W * 0.9)) ** 2 + ((yy - H * 0.42) / (H * 0.62)) ** 2)
    radial = np.clip(1 - r, 0, 1) ** 1.6
    bg = grad * (0.62 + 0.55 * radial[..., None])
    vign = 1 - 0.42 * np.clip(r * 1.05, 0, 1.4) ** 2.4
    return bg.astype(np.float32), np.clip(vign, 0.35, 1)[..., None].astype(np.float32)


BG, VIGNETTE = build_background()


def radial_sprite(radius, color, strength, power=2.2):
    s = int(radius * 2)
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    d = np.sqrt((xx - radius) ** 2 + (yy - radius) ** 2) / radius
    a = np.clip(1 - d, 0, 1) ** power * strength
    return (a[..., None] * color).astype(np.float32)


GLOW = radial_sprite(640, CELESTE, 0.30, 2.0)
GLOW_GOLD = radial_sprite(520, GOLD, 0.09, 2.4)


def bokeh_sprite(r, color, alpha, blur):
    s = int(r * 2 + blur * 6 + 6)
    c = s / 2
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    d = np.sqrt((xx - c) ** 2 + (yy - c) ** 2)
    disc = np.clip(r - d + 0.5, 0, 1)
    ring = np.clip(1 - np.abs(d - r * 0.93) / (r * 0.09 + 1), 0, 1) * 0.6
    a = (disc * (0.55 + 0.45 * (d / r) ** 2) + ring) * disc
    a = cv2.GaussianBlur(a, (0, 0), blur) * alpha
    return (a[..., None] * color).astype(np.float32)


rng = np.random.default_rng(7)
BOKEH = []
for i in range(46):
    z = rng.uniform(0, 1)  # 0 = far, 1 = near
    col = [CELESTE, WHITE, CELESTE, GOLD * 1.1][rng.integers(0, 4)] if i % 9 else GOLD * 1.15
    r = 14 + 70 * z + rng.uniform(0, 20)
    BOKEH.append({
        "x": rng.uniform(-80, W + 80), "y": rng.uniform(-100, H + 100), "z": z,
        "spr": bokeh_sprite(r, col, rng.uniform(0.10, 0.26) * (1.1 - 0.5 * z), 2 + 9 * z),
        "vy": 10 + 30 * z, "ph": rng.uniform(0, 6.28), "amp": rng.uniform(6, 22),
    })
NEAR_BOKEH = []
for i in range(7):
    r = rng.uniform(120, 220)
    col = [CELESTE, WHITE, GOLD][i % 3]
    NEAR_BOKEH.append({
        "x": rng.uniform(0, W), "y": rng.uniform(0, H), "spr": bokeh_sprite(r, col, rng.uniform(0.05, 0.09), 26),
        "vy": rng.uniform(40, 70), "ph": rng.uniform(0, 6.28),
    })

GRAIN = [cv2.resize(np.random.default_rng(100 + i).normal(0, 1, (H // 2, W // 2)).astype(np.float32),
                    (W, H), interpolation=cv2.INTER_LINEAR)[..., None] for i in range(8)]


def beams(t):
    """Two slow stadium light beams from the top, rendered at quarter resolution."""
    h4, w4 = H // 4, W // 4
    yy, xx = np.mgrid[0:h4, 0:w4].astype(np.float32)
    out = np.zeros((h4, w4), np.float32)
    for ox, ang0, sp in ((0.18, 0.45, 0.6), (0.85, -0.5, -0.5)):
        ang = ang0 + 0.08 * math.sin(t * sp * 0.6 + ox * 5)
        px, py = ox * w4, -20.0
        dx, dy = math.sin(ang), math.cos(ang)
        along = (xx - px) * dx + (yy - py) * dy
        across = np.abs((xx - px) * dy - (yy - py) * dx)
        width = 18 + along * 0.22
        out += np.clip(1 - across / np.maximum(width, 1), 0, 1) ** 2 * np.clip(1 - along / (h4 * 0.9), 0, 1)
    out = cv2.GaussianBlur(out, (0, 0), 6)
    return cv2.resize(out, (W, H), interpolation=cv2.INTER_LINEAR)[..., None] * 0.05


# ----------------------------------------------------------------------------- choreography

# Main trophy: (t, centre x, floor y, height px, defocus sigma, dim)
MAIN = Track([
    (0.0, 540, 1585, 940, 22, 0.0),
    (1.6, 540, 1570, 1000, 0, 0.0),
    (3.0, 540, 1555, 1040, 0, 0.0),
    (4.0, 540, 1205, 860, 0, 0.0),
    (6.4, 540, 1190, 885, 0, 0.0),
    (7.4, 816, 1180, 690, 0, 0.0),
    (9.7, 812, 1180, 700, 0, 0.0),
    (10.7, 540, 1600, 1170, 0, 0.0),
    (11.3, 540, 1604, 1185, 5, 0.32),
    (12.9, 540, 1608, 1200, 5, 0.32),
    (13.7, 540, 1560, 1000, 0, 0.0),
    (15.7, 540, 1550, 1030, 0, 0.0),
    (16.7, 540, 1010, 670, 0, 0.0),
    (18.0, 540, 1004, 690, 0, 0.0),
])

SIZE_TROPHIES = [
    # (cm, height, final cx, enter t, exit t, enter from x, exit to x)
    (20, 460, 156, 7.15, 9.3, 96, -40),
    (25, 575, 456, 7.0, 9.4, 396, 230),
]

SWEEPS = [(1.1, 1.3), (4.0, 1.2), (7.6, 1.1), (10.6, 1.1), (13.8, 1.1), (16.6, 1.2)]


def sweep_pos(t):
    for s, d in SWEEPS:
        if s <= t <= s + d:
            return -0.35 + 1.8 * smoother((t - s) / d)
    return None


def draw_trophy(frame, cx, floor_y, h, blur=0.0, opacity=1.0, dim=0.0, t=0.0):
    if opacity <= 0.003 or h < 20:
        return
    s = h / TH
    w = TW * s
    iw, ih = max(2, int(round(w))), max(2, int(round(h)))
    layer = cv2.resize(TROPHY, (iw, ih), interpolation=cv2.INTER_AREA)
    chrome = cv2.resize(CHROME, (iw, ih), interpolation=cv2.INTER_AREA)
    p = sweep_pos(t)
    if p is not None:
        yy, xx = np.mgrid[0:ih, 0:iw].astype(np.float32)
        u = (xx / iw) * 0.72 + (yy / ih) * 0.42
        band = np.exp(-((u - p) / 0.055) ** 2) * 0.55 + np.exp(-((u - p + 0.13) / 0.02) ** 2) * 0.28
        layer[..., :3] += (band * chrome)[..., None] * WHITE
    if dim > 0:
        layer[..., :3] *= 1 - dim
    x0, y0 = cx - iw / 2, floor_y - ih

    # Contact shadow and soft floor pool.
    sw, sh_ = int(iw * 0.95), max(8, int(ih * 0.07))
    shadow = np.zeros((sh_ * 3, sw + 80), np.float32)
    cv2.ellipse(shadow, ((sw + 80) // 2, int(sh_ * 1.5)), (int(sw * 0.38), int(sh_ * 0.42)), 0, 0, 360, 1.0, -1)
    shadow = cv2.GaussianBlur(shadow, (0, 0), max(3, sh_ * 0.35))
    multiply_alpha(frame, shadow, 0.6 * opacity, int(cx - (sw + 80) / 2), int(floor_y - sh_ * 1.5))

    # Floor reflection: flipped, faded, softened.
    refl_h = int(ih * 0.30)
    refl = layer[ih - refl_h:][::-1].copy()
    fade = (np.linspace(1, 0, refl_h, dtype=np.float32) ** 1.8 * 0.26)[:, None, None]
    refl = gblur(pad_layer(refl * fade, 8), 2.5 + blur)
    rl, rx, ry = subpixel(refl * opacity, x0 - 8, floor_y - 8 + 2)
    over(frame, rl[..., :3], rl[..., 3], rx, ry)

    if blur > 0.35:
        p_ = int(blur * 3) + 2
        layer = gblur(pad_layer(layer, p_), blur)
        x0, y0 = x0 - p_, y0 - p_
    lay, ix, iy = subpixel(layer * opacity, x0, y0)
    over(frame, lay[..., :3], lay[..., 3], ix, iy)


def draw_background(frame, t, main_cx, main_cy):
    frame[:] = BG
    frame += beams(t) * CELESTE
    gx, gy = main_cx - GLOW.shape[1] / 2, main_cy - GLOW.shape[0] / 2
    screen(frame, GLOW, int(gx), int(gy))
    screen(frame, GLOW_GOLD, int(-180 + 60 * math.sin(t * 0.35)), int(H * 0.62 + 40 * math.cos(t * 0.3)))
    cam_x = (main_cx - 540) * -0.18
    push = 1 + 0.035 * (t / DUR)
    for b in BOKEH:
        x = b["x"] + cam_x * (0.3 + b["z"]) + b["amp"] * math.sin(t * 0.5 + b["ph"])
        y = (b["y"] - b["vy"] * t) % (H + 300) - 150
        x = W / 2 + (x - W / 2) * push
        y = H / 2 + (y - H / 2) * push
        s = b["spr"]
        screen(frame, s, int(x - s.shape[1] / 2), int(y - s.shape[0] / 2))


def draw_near_bokeh(frame, t, main_cx):
    cam_x = (main_cx - 540) * -0.6
    for b in NEAR_BOKEH:
        x = b["x"] + cam_x + 30 * math.sin(t * 0.4 + b["ph"])
        y = (b["y"] - b["vy"] * t) % (H + 600) - 300
        s = b["spr"]
        screen(frame, s, int(x - s.shape[1] / 2), int(y - s.shape[0] / 2))


# ----------------------------------------------------------------------------- copy

TXT = {
    "kicker1": text_sprite([("EL FINAL QUE", CELESTE)], 50, "SemiBold", tracking=0.18),
    "head1": text_sprite([("TODOS QUIEREN", WHITE)], 112, "Black", tracking=0.01, max_width=860),
    "copa": text_sprite([("COPA PLATEADA", WHITE)], 104, "Black", tracking=0.01, max_width=830),
    "estilo": text_sprite([("estilo europeo", CELESTE)], 50, "Medium", tracking=0.08),
    "tamanos": text_sprite([("3 ", GOLD), ("TAMAÑOS", WHITE)], 112, "Black", tracking=0.02, max_width=720),
    "liga": text_sprite([("TU LIGA.", WHITE)], 124, "Black", tracking=0.01, max_width=820),
    "campeon": text_sprite([("TU CAMPEÓN.", WHITE)], 124, "Black", tracking=0.01, max_width=820),
    "ano": text_sprite([("TU AÑO.", GOLD)], 124, "Black", tracking=0.01, max_width=820),
    "para": text_sprite([("PARA", CELESTE)], 46, "SemiBold", tracking=0.3),
    "cotiza": text_sprite([("Cotiza la tuya", WHITE)], 92, "ExtraBold", tracking=0.0, max_width=800),
    "web": text_sprite([("brinechile.cl", CELESTE)], 54, "SemiBold", tracking=0.03),
}
for cm in (20, 25, 30):
    TXT[f"cm{cm}"] = text_sprite([(f"{cm}", WHITE), (" cm", CELESTE)], 60, "ExtraBold", tracking=0.0)
# Keep the three CTA pills at a common size; CAMPEONATOS sets the width budget.
for key, word in (("clubes", "CLUBES"), ("colegios", "COLEGIOS"), ("campeonatos", "CAMPEONATOS")):
    TXT[key] = text_sprite([(word, WHITE)], 40, "Bold", tracking=0.06)

# Unify the three size-equalised lines in scene 4 to the smallest fitted size.
_s4 = min(TXT[k]["size"] for k in ("liga", "campeon", "ano"))
TXT["liga"] = text_sprite([("TU LIGA.", WHITE)], _s4, "Black", tracking=0.01)
TXT["campeon"] = text_sprite([("TU CAMPEÓN.", WHITE)], _s4, "Black", tracking=0.01)
TXT["ano"] = text_sprite([("TU AÑO.", GOLD)], _s4, "Black", tracking=0.01)


def gold_rule(frame, cx, cy, width, t, t_in, t_out, thickness=4):
    e_in, e_out = window(t, t_in, t_out, 0.8, 0.4)
    op = e_in * (1 - e_out)
    if op <= 0.003:
        return
    wcur = max(2, int(width * e_in))
    bar = np.ones((thickness + 4, wcur + 4), np.float32)
    bar = gblur(pad_layer(bar, 2), 0.8)
    fade = np.minimum(1, np.minimum(np.arange(bar.shape[1]), np.arange(bar.shape[1])[::-1]) / 10.0)
    a = bar * fade[None, :] * op
    over(frame, a[..., None] * GOLD, a, int(cx - bar.shape[1] / 2), int(cy - bar.shape[0] / 2))


def draw_ui(frame, t):
    # 1 — EL FINAL QUE TODOS QUIEREN
    panel_anim(frame, t, 0.45, 2.85, 540, 360, 940, 300)
    text_anim(frame, TXT["kicker1"], 540, 285, t, 0.65, 2.8)
    text_anim(frame, TXT["head1"], 540, 395, t, 0.85, 2.85)
    gold_rule(frame, 540, 330, 120, t, 1.0, 2.8)

    # 2 — COPA PLATEADA · estilo europeo
    panel_anim(frame, t, 3.55, 6.25, 540, 1352, 940, 250)
    text_anim(frame, TXT["copa"], 540, 1315, t, 3.75, 6.2)
    est = TXT["estilo"]
    text_anim(frame, est, 540, 1408, t, 4.05, 6.2)
    half = est["pm"].shape[1] / 2
    gold_rule(frame, 540 - half - 40, 1410, 70, t, 4.25, 6.2, 3)
    gold_rule(frame, 540 + half + 40, 1410, 70, t, 4.25, 6.2, 3)

    # 3 — 3 TAMAÑOS · 20 / 25 / 30 cm
    panel_anim(frame, t, 6.9, 9.3, 540, 300, 760, 190)
    text_anim(frame, TXT["tamanos"], 540, 300, t, 7.05, 9.3)
    for i, (cm, cx) in enumerate(((20, 156), (25, 456), (30, 816))):
        tin = 7.35 + i * 0.16
        panel_anim(frame, t, tin, 9.15 + i * 0.05, cx, 1290, 236, 112, r=34)
        text_anim(frame, TXT[f"cm{cm}"], cx, 1290, t, tin + 0.12, 9.15 + i * 0.05, rise=20, shadow=0.25)

    # 4 — TU LIGA. TU CAMPEÓN. TU AÑO.
    panel_anim(frame, t, 10.75, 13.15, 540, 905, 950, 520, tint_a=0.40)
    text_anim(frame, TXT["liga"], 540, 760, t, 10.95, 13.1)
    text_anim(frame, TXT["campeon"], 540, 905, t, 11.65, 13.1)
    text_anim(frame, TXT["ano"], 540, 1050, t, 12.35, 13.1)

    # 5 — PARA CLUBES, COLEGIOS, CAMPEONATOS
    text_anim(frame, TXT["para"], 540, 255, t, 13.85, 15.6, rise=24)
    pills = [TXT["clubes"], TXT["colegios"], TXT["campeonatos"]]
    pw = [p["pm"].shape[1] - 60 + 64 for p in pills]
    gap = 18
    x = 540 - (sum(pw) + gap * 2) / 2
    for i, (p, w_) in enumerate(zip(pills, pw)):
        cx = x + w_ / 2
        tin = 14.0 + i * 0.15
        panel_anim(frame, t, tin, 15.55 + i * 0.04, cx, 352, int(w_), 96, r=48)
        text_anim(frame, p, cx, 352, t, tin + 0.1, 15.55 + i * 0.04, rise=18, shadow=0.2)
        x += w_ + gap

    # 6 — Cotiza la tuya · brinechile.cl + small logo
    panel_anim(frame, t, 16.05, 99, 540, 1192, 900, 250)
    text_anim(frame, TXT["cotiza"], 540, 1148, t, 16.2, 99)
    gold_rule(frame, 540, 1212, 110, t, 16.45, 99)
    text_anim(frame, TXT["web"], 540, 1262, t, 16.5, 99)
    e_in, _ = window(t, 16.75, 99, 0.8)
    if e_in > 0.003:
        cw, ch = 300, 116
        dy = (1 - e_in) * 20
        glass_panel(frame, 540 - cw / 2, 1400 - ch / 2 + dy, cw, ch, r=30, opacity=e_in,
                    tint=WHITE, tint_a=0.80, frost=16, shadow=0.3, brighten=0.0)
        draw_sprite(frame, LOGO_SPR, 540, 1400 + dy, e_in, (1 - e_in) * 6, shadow=0)


def _logo_sprite(width):
    h = int(round(LOGO.shape[0] * width / LOGO.shape[1]))
    pm = cv2.resize(LOGO, (width, h), interpolation=cv2.INTER_AREA)
    return {"pm": pm, "shadow": np.zeros((1, 1), np.float32), "size": h}


LOGO_SPR = _logo_sprite(250)


# ----------------------------------------------------------------------------- frame

def render_frame(i):
    t = i / FPS
    cx, floor_y, h, blur, dim = MAIN(t)
    frame = np.empty((H, W, 3), np.float32)
    draw_background(frame, t, cx, floor_y - h * 0.55)

    for cm, sh, fx, tin, tout, from_x, to_x in SIZE_TROPHIES:
        e_in, e_out = window(t, tin, tout, 0.9, 0.55)
        op = e_in * (1 - e_out)
        if op > 0.003:
            x = from_x + (fx - from_x) * smoother((t - tin) / 0.9)
            x = x + (to_x - fx) * smoother((t - tout) / 0.55)
            draw_trophy(frame, x, 1180, sh, blur=(1 - e_in) * 12 + e_out * 12, opacity=op, t=t - 0.12 * (30 - cm))

    op_main = ease_out_cubic(t / 0.8)
    draw_trophy(frame, cx, floor_y, h, blur=blur, opacity=op_main, dim=dim, t=t)
    draw_near_bokeh(frame, t, cx)
    draw_ui(frame, t)

    frame *= VIGNETTE
    frame += GRAIN[i % len(GRAIN)] * 0.010
    # Gentle fade from/to black at the very edges keeps the loop clean on Shorts.
    frame *= ease_out_cubic(t / 0.35)
    return (np.clip(frame, 0, 1) * 255 + 0.5).astype(np.uint8)


def render_video(path, workers):
    OUT_DIR.mkdir(exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-f", "lavfi", "-t", str(DUR), "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-x264-params", "keyint=30:min-keyint=30",
        "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", str(path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(workers) as pool:
        for n, fr in enumerate(pool.imap(render_frame, range(NFRAMES), chunksize=4)):
            proc.stdin.write(fr.tobytes())
            if n % 30 == 0:
                print(f"frame {n}/{NFRAMES}", flush=True)
    proc.stdin.close()
    proc.wait()
    if proc.returncode:
        sys.exit(proc.returncode)
    print("wrote", path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", nargs="*", type=float)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--out", default=str(OUT_DIR / "YT-SHORT-002_v3_copa-plateada.mp4"))
    args = ap.parse_args()
    if args.stills is not None:
        OUT_DIR.mkdir(exist_ok=True)
        for s in args.stills:
            Image.fromarray(render_frame(int(round(s * FPS)))).save(OUT_DIR / f"still_{s:05.2f}.png")
        return
    render_video(args.out, args.workers)


if __name__ == "__main__":
    main()
