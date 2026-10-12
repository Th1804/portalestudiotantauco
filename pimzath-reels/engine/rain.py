"""Lluvia determinista (semilla fija), evaluada analíticamente por frame.

La posición de cada gota es función pura del tiempo de lluvia `rt` (que el Reel puede
acelerar/frenar integrando una curva de velocidad), así que cualquier frame se puede
renderizar de forma aislada y repetible.
"""
import math

import cairo
import numpy as np

from .core import H, W


class Rain:
    def __init__(self, n=420, seed=1, speed=(1500, 2300), length=(40, 110), wind=0.12,
                 width=(1.0, 2.4), x_range=(-200, W + 200), depth_buckets=3):
        rng = np.random.default_rng(seed)
        self.n = n
        self.depth = rng.uniform(0.25, 1.0, n)
        self.x0 = rng.uniform(*x_range, n)
        self.y0 = rng.uniform(0, H + 400, n)
        self.v = np.interp(self.depth, [0.25, 1.0], speed) * rng.uniform(0.9, 1.1, n)
        self.len = np.interp(self.depth, [0.25, 1.0], length) * rng.uniform(0.8, 1.2, n)
        self.wid = np.interp(self.depth, [0.25, 1.0], width)
        self.rank = rng.permutation(n) / n  # para encender/apagar densidad sin saltos
        self.wind = wind
        self.span = H + 400
        self.buckets = np.minimum(depth_buckets - 1, (self.depth - 0.25) / 0.75 * depth_buckets).astype(int)
        self.nb = depth_buckets

    def heads(self, rt):
        y = (self.y0 + self.v * rt) % self.span - 200
        x = self.x0 + y * self.wind
        return x, y

    def draw(self, ctx, rt, color, alpha=0.6, density=1.0, field=None, len_mult=1.0, width_mult=1.0):
        """field(x, y, depth) -> (x, y, a): deforma cabeza/cola de cada gota y modula su alfa."""
        hx, hy = self.heads(rt)
        L = self.len * len_mult
        tx, ty = hx - L * self.wind, hy - L
        ah = np.ones(self.n)
        at = np.ones(self.n)
        if field is not None:
            hx, hy, ah = field(hx, hy, self.depth)
            tx, ty, at = field(tx, ty, self.depth)
        a_all = np.minimum(ah, at) * (self.rank < density)
        ctx.save()
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        for b in range(self.nb):
            m = (self.buckets == b) & (a_all > 0.02)
            if not m.any():
                continue
            d = (b + 0.5) / self.nb
            ctx.set_line_width(float(np.mean(self.wid[m])) * width_mult)
            # alfa por cubeta de profundidad; las gotas cercanas son más visibles
            ctx.set_source_rgba(color[0], color[1], color[2], alpha * (0.35 + 0.65 * d))
            for i in np.nonzero(m)[0]:
                ctx.move_to(tx[i], ty[i])
                ctx.line_to(hx[i], hy[i])
            ctx.stroke()
        ctx.restore()
        return hx, hy

    def splashes(self, ctx, rt, surface_y, color, alpha=0.5, density=1.0, life=0.32, max_r=26, mask=None):
        """Anillos de salpicadura donde cada gota cruza la superficie y = surface_y(x)."""
        x_at = self.x0  # aproximación: columna de impacto
        sy = surface_y(x_at + 0 * x_at)
        period = self.span / self.v
        # tiempo (en rt) en que la cabeza cruza sy
        phase = ((sy + 200 - self.y0) / self.v) % period
        age = (rt - phase) % period
        live = (age < life) & (self.rank < density)
        if mask is not None:
            live &= mask(x_at + sy * self.wind, sy)
        ctx.save()
        for i in np.nonzero(live)[0]:
            k = age[i] / life
            r = 3 + max_r * self.depth[i] * math.sqrt(k)
            x = x_at[i] + sy[i] * self.wind
            ctx.set_line_width(1.2 * self.depth[i] + 0.4)
            ctx.set_source_rgba(color[0], color[1], color[2], alpha * (1 - k) * self.depth[i])
            ctx.save()
            ctx.translate(x, sy[i])
            ctx.scale(1, 0.28)
            ctx.arc(0, 0, r, 0, 2 * math.pi)
            ctx.restore()
            ctx.stroke()
        ctx.restore()


def integrate_speed(speed_fn, t, dt=1 / 120):
    """Tiempo de lluvia acumulado para una curva de velocidad (determinista)."""
    n = int(t / dt)
    acc = sum(speed_fn(i * dt) for i in range(n)) * dt
    return acc + speed_fn(n * dt) * (t - n * dt)
