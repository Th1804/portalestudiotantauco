"""Elementos de dibujo compartidos: papel, grano de lápiz, trazos a mano, nubes rayadas,
bordes de papel rasgado, gotas, viñeta, resplandor y crédito discreto."""
import math

import cairo
import numpy as np

from .core import (H, IVORY, SAFE_Y0, W, blurred, clamp, new_surface, paint_scaled, png, rgba)
from .typo import draw_line


def paper(ctx, which="ivory", alpha=1.0, dx=0.0, dy=0.0, scale=1.0):
    ctx.save()
    ctx.translate(W / 2 + dx, H / 2 + dy)
    ctx.scale(scale, scale)
    ctx.translate(-W / 2, -H / 2)
    ctx.set_source_surface(png(f"paper_{which}.png"), 0, 0)
    ctx.get_source().set_extend(cairo.EXTEND_REFLECT)
    ctx.paint_with_alpha(alpha)
    ctx.restore()


def grain(ctx, amount=0.22, dx=0.0, dy=0.0):
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_SOFT_LIGHT)
    ctx.set_source_surface(png("grain.png"), dx, dy)
    ctx.get_source().set_extend(cairo.EXTEND_REPEAT)
    ctx.paint_with_alpha(amount)
    ctx.restore()


def vignette(ctx, color=(0, 0, 0), strength=0.5, inner=0.35, cx=W / 2, cy=H / 2, outer=1.0):
    g = cairo.RadialGradient(cx, cy, H * inner * 0.5, cx, cy, H * 0.75 * outer)
    g.add_color_stop_rgba(0, *color, 0)
    g.add_color_stop_rgba(1, *color, strength)
    ctx.save()
    ctx.set_source(g)
    ctx.paint()
    ctx.restore()


def hand_line(ctx, pts, seed=0, jitter=1.6, passes=2, width=2.0, color=(0, 0, 0), alpha=0.8, progress=1.0):
    """Polilínea con temblor de lápiz (varias pasadas desplazadas, semilla fija)."""
    rng = np.random.default_rng(seed)
    pts = np.asarray(pts, float)
    if progress < 1.0:
        n = max(2, int(len(pts) * clamp(progress)))
        pts = pts[:n]
    ctx.save()
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    for p in range(passes):
        off = rng.normal(0, jitter, pts.shape)
        q = pts + off
        ctx.set_line_width(width * (1 - 0.25 * p))
        rgba(ctx, color, alpha * (1 - 0.35 * p))
        ctx.move_to(*q[0])
        for x, y in q[1:]:
            ctx.line_to(x, y)
        ctx.stroke()
    ctx.restore()


def hatch_blob(ctx, cx, cy, rx, ry, color, seed=0, spacing=7, angle=-0.9, alpha=0.5, width=1.4, wobble=0.25):
    """Masa rayada a lápiz (nubes, sombras) recortada a una elipse irregular."""
    rng = np.random.default_rng(seed)
    ctx.save()
    ctx.new_path()
    n = 28
    for i in range(n + 1):
        a = i / n * 2 * math.pi
        r = 1 + wobble * math.sin(a * 3 + seed) * 0.5 + wobble * 0.4 * math.sin(a * 5 + seed * 2)
        x, y = cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r
        (ctx.move_to if i == 0 else ctx.line_to)(x, y)
    ctx.close_path()
    ctx.clip()
    ca, sa = math.cos(angle), math.sin(angle)
    R = max(rx, ry) * 1.6
    k = -R
    ctx.set_line_width(width)
    while k < R:
        a = alpha * rng.uniform(0.45, 1.0)
        rgba(ctx, color, a)
        x0, y0 = cx + ca * -R - sa * k, cy + sa * -R + ca * k
        x1, y1 = cx + ca * R - sa * k, cy + sa * R + ca * k
        ctx.move_to(x0 + rng.normal(0, 2), y0 + rng.normal(0, 2))
        ctx.line_to(x1 + rng.normal(0, 2), y1 + rng.normal(0, 2))
        ctx.stroke()
        k += spacing * rng.uniform(0.6, 1.4)
    ctx.restore()


def torn_edge(seed, x0=-40, x1=W + 40, base=0.0, amp=18.0, step=9.0):
    """Puntos de un borde de papel rasgado (lista de (x, y_offset))."""
    rng = np.random.default_rng(seed)
    xs = np.arange(x0, x1 + step, step)
    low = np.cumsum(rng.normal(0, 1, len(xs)))
    low = (low - np.linspace(low[0], low[-1], len(xs))) / (np.abs(low).max() + 1e-6)
    ys = base + low * amp + rng.normal(0, amp * 0.18, len(xs))
    return list(zip(xs, ys))


def torn_sheet_path(ctx, top_edge, bottom_edge):
    """Path cerrado entre dos bordes rasgados (listas de (x, y))."""
    ctx.new_path()
    ctx.move_to(*top_edge[0])
    for p in top_edge[1:]:
        ctx.line_to(*p)
    for p in reversed(bottom_edge):
        ctx.line_to(*p)
    ctx.close_path()


def drop(ctx, x, y, r, color=(1, 1, 1), alpha=0.8, stretch=1.6, tint=None):
    """Gota con forma de lágrima, reflejo y sombra de lápiz."""
    ctx.save()
    ctx.translate(x, y)
    ctx.new_path()
    ctx.move_to(0, -r * stretch * 1.25)
    ctx.curve_to(r * 0.55, -r * 0.6, r, -r * 0.1, r, r * 0.25)
    ctx.arc(0, r * 0.25, r, 0, math.pi)
    ctx.curve_to(-r, -r * 0.1, -r * 0.55, -r * 0.6, 0, -r * stretch * 1.25)
    ctx.close_path()
    g = cairo.LinearGradient(-r, -r, r, r)
    base = tint or color
    g.add_color_stop_rgba(0, *base, alpha * 0.25)
    g.add_color_stop_rgba(0.7, *base, alpha * 0.55)
    g.add_color_stop_rgba(1, *base, alpha * 0.9)
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.set_line_width(max(1, r * 0.08))
    rgba(ctx, color, alpha * 0.7)
    ctx.stroke()
    rgba(ctx, (1, 1, 1), alpha * 0.85)
    ctx.arc(-r * 0.35, r * 0.05, r * 0.18, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()


def glow(ctx, draw_fn, sigma=24, strength=0.8, op=cairo.OPERATOR_ADD, down=4):
    """Dibuja draw_fn en una capa aparte, la desenfoca y la suma (resplandor suave)."""
    s, c = new_surface()
    draw_fn(c)
    b, sc = blurred(s, sigma, down)
    paint_scaled(ctx, b, sc, strength, op)
    return s


def credit(ctx, alpha=0.7, color=IVORY, y=SAFE_Y0 + 46):
    draw_line(ctx, "PIMZATH  ·  NO SOBRE TI", 25, W / 2, y, key="credit", color=color, alpha=alpha,
              tracking=0.16)


def fade_black(ctx, a, color=(0, 0, 0)):
    if a > 0.001:
        ctx.save()
        rgba(ctx, color, a)
        ctx.paint()
        ctx.restore()
