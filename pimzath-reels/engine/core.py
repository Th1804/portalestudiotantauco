"""Base compartida: lienzo, paleta, easing, utilidades de superficie y desenfoque."""
import math
from functools import lru_cache
from pathlib import Path

import cairo
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
W, H, FPS = 1080, 1920, 30

# Zona segura de Instagram Reels (px)
SAFE_X0, SAFE_X1 = 120, W - 120
SAFE_Y0, SAFE_Y1 = 220, H - 360


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


IVORY = hexrgb("#F2E9DC")
MAGENTA = hexrgb("#AC326E")
ORANGE = hexrgb("#E47642")
PLUM = hexrgb("#321C2C")
BLUE = hexrgb("#3E5F8A")  # azul del suéter (muestreado de la ficha visual)
INK = hexrgb("#1E1119")


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(lerp(a, b, t) for a, b in zip(c1, c2))


def prog(t, a, b):
    """Progreso lineal 0..1 de t entre a y b."""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return clamp((t - a) / (b - a))


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out_cubic(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in_out_cubic(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_in_quad(x):
    x = clamp(x)
    return x * x


def ease_out_back(x, s=1.4):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def ease_out_elastic_soft(x):
    x = clamp(x)
    if x in (0.0, 1.0):
        return x
    return 2 ** (-9 * x) * math.sin((x * 10 - 0.75) * (2 * math.pi) / 3.2) + 1


def new_surface(w=W, h=H):
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h)
    return s, cairo.Context(s)


@lru_cache(maxsize=None)
def png(name):
    return cairo.ImageSurface.create_from_png(str(BUILD / name))


def surface_array(surf):
    surf.flush()
    buf = surf.get_data()
    return np.ndarray((surf.get_height(), surf.get_stride() // 4, 4), np.uint8, buf)[:, : surf.get_width()]


def blurred(surf, sigma, down=4):
    """Copia desenfocada (gaussiano) de una superficie ARGB32, calculada a resolución reducida."""
    w, h = surf.get_width(), surf.get_height()
    sw, sh = max(1, w // down), max(1, h // down)
    small, c = new_surface(sw, sh)
    c.scale(sw / w, sh / h)
    c.set_source_surface(surf, 0, 0)
    c.get_source().set_filter(cairo.FILTER_GOOD)
    c.paint()
    arr = surface_array(small).astype(np.float32)
    s = sigma / down
    for k in range(4):
        arr[..., k] = ndimage.gaussian_filter(arr[..., k], s, mode="nearest")
    out = cairo.ImageSurface(cairo.FORMAT_ARGB32, sw, sh)
    surface_array(out)[:] = np.clip(arr, 0, 255).astype(np.uint8)
    out.mark_dirty()
    return out, w / sw


def paint_scaled(ctx, surf, scale, alpha=1.0, op=None):
    ctx.save()
    if op is not None:
        ctx.set_operator(op)
    ctx.scale(scale, scale)
    ctx.set_source_surface(surf, 0, 0)
    ctx.get_source().set_filter(cairo.FILTER_BILINEAR)
    ctx.paint_with_alpha(alpha)
    ctx.restore()


def rgba(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def value_noise(x, seed=0):
    """Ruido 1D suave y determinista (para derivas lentas de cámara/viento)."""
    i = math.floor(x)
    f = x - i

    def h(n):
        return (math.sin((n + seed * 101.3) * 127.1) * 43758.5453) % 1.0

    u = f * f * (3 - 2 * f)
    return lerp(h(i), h(i + 1), u) * 2 - 1
