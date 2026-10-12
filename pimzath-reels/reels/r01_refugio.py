"""01 — REFUGIO (Coro 2: "Que llueva sobre mí" x2 / "Pero no sobre ti" x2).

Las palabras de "Que llueva sobre mí" caen como gotas y se asientan formando un arco;
la segunda repetición se escribe a lápiz como un segundo techo. La lluvia golpea la cúpula,
resbala por sus bordes y deja dentro un espacio cálido donde se revela "Pero no sobre ti".
Con la repetición final la cámara baja hacia el agua y la frase se escribe en el reflejo.
"""
import math

import cairo
import numpy as np

from engine.core import (H, IVORY, MAGENTA, ORANGE, PLUM, W, clamp, ease_in_out_cubic, ease_out_back,
                         ease_out_cubic, lerp, mix, new_surface, prog, rgba, smooth, value_noise)
from engine.draw import credit, glow, grain, hand_line, hatch_blob, paper, vignette
from engine.rain import Rain
from engine.typo import draw_glyph, draw_line, glyphs_on_arc

CX, CY = W / 2, 1090  # centro de la cúpula = línea del agua
R1, R2 = 300, 400
S1, S2 = 76, 86
BURNT = (0.62, 0.22, 0.12)


class Reel:
    def __init__(self, cut):
        self.cut = cut
        self.p = cut.phrases  # 0,1: Que llueva sobre mí ; 2,3: Pero no sobre ti
        self.rain = Rain(n=520, seed=101, wind=0.10)
        self.rain_far = Rain(n=300, seed=102, speed=(900, 1300), length=(20, 50), wind=0.10, width=(0.6, 1.2))
        self.sky, c = new_surface()
        for i, (x, y, rx, ry) in enumerate([(160, 330, 420, 170), (820, 290, 460, 190), (520, 520, 520, 150),
                                            (90, 700, 300, 120), (980, 650, 320, 130), (540, 140, 700, 160)]):
            hatch_blob(c, x, y, rx, ry, MAGENTA, seed=10 + i, spacing=6, alpha=0.35, width=1.3)
            hatch_blob(c, x + 40, y + 30, rx * 0.7, ry * 0.6, ORANGE, seed=30 + i, spacing=11, angle=-1.1,
                       alpha=0.18, width=1.1)
        self.arc1 = glyphs_on_arc(self.p[0].text, S1, CX, CY, R1)
        self.arc2 = glyphs_on_arc(self.p[1].text, S2, CX, CY, R2)

    # --- tiempos ---------------------------------------------------------------
    def outro(self, t):
        """Retorno al estado inicial tras el último "ti", para que el loop empalme."""
        end_voice = self.p[3].end
        return ease_in_out_cubic(prog(t, end_voice + 0.05, self.cut.duration - 0.05))

    def dome_radius(self, t):
        p0, p1 = self.p[0], self.p[1]
        r = lerp(0, R1 + 48, ease_out_cubic(prog(t, p0.words[0].start, p0.words[-1].start + 0.4)))
        r = lerp(r, R2 + 56, ease_in_out_cubic(prog(t, p1.words[0].start, p1.words[-1].start + 0.5)))
        return r * (1 - self.outro(t))

    def warmth(self, t):
        a = 0.35 * smooth(prog(t, self.p[0].words[-1].start, self.p[1].words[0].start))
        a += 0.65 * smooth(prog(t, self.p[2].start - 0.6, self.p[2].start + 0.8))
        return a * (1 - self.outro(t))

    def camera(self, t):
        d = self.cut.duration
        back = 1 - self.outro(t)
        zoom = lerp(1.0, lerp(1.0, 1.10, ease_in_out_cubic(t / d)), back)
        tilt = 300 * ease_in_out_cubic(prog(t, self.p[3].start - 1.0, self.p[3].start + 1.6)) * back
        sway = value_noise(t * 0.25, 3) * 6
        return zoom, tilt, sway

    # --- capas -----------------------------------------------------------------
    def draw_sky(self, c, t, r_dome):
        paper(c, "plum")
        g = cairo.LinearGradient(0, 0, 0, CY)
        g.add_color_stop_rgba(0, *PLUM, 0.0)
        g.add_color_stop_rgba(1, *MAGENTA, 0.35)
        c.set_source(g)
        c.paint()
        c.save()
        c.translate(value_noise(t * 0.2, 1) * 25 - 20 * t / self.cut.duration, 0)
        c.set_source_surface(self.sky, 0, 0)
        c.paint_with_alpha(0.9)
        c.restore()

        warm = self.warmth(t)
        if r_dome > 5:
            c.save()
            c.arc(CX, CY, r_dome, math.pi, 2 * math.pi)
            c.close_path()
            c.clip()
            gr = cairo.RadialGradient(CX, CY - 60, 20, CX, CY, r_dome)
            gr.add_color_stop_rgba(0, *mix(IVORY, (1, 0.85, 0.7), 0.4), 0.15 + 0.85 * warm)
            gr.add_color_stop_rgba(0.6, *ORANGE, 0.10 + 0.55 * warm)
            gr.add_color_stop_rgba(1, *MAGENTA, 0.15 + 0.3 * warm)
            c.set_source(gr)
            c.paint()
            paper(c, "ivory", alpha=0.25 * warm)
            c.restore()
            pts = [(CX + math.cos(a) * r_dome, CY + math.sin(a) * r_dome) for a in np.linspace(math.pi, 2 * math.pi, 90)]
            hand_line(c, pts, seed=5, jitter=1.4, passes=3, width=2.2, color=mix(IVORY, MAGENTA, 0.2), alpha=0.55)

    def rain_field(self, r_dome):
        def f(x, y, depth):
            a = np.ones_like(x)
            if r_dome > 5:
                inside = ((x - CX) ** 2 + (y - CY) ** 2 < (r_dome - 6) ** 2) & (y < CY)
                a = np.where(inside, 0.0, a)
            below = y > CY + 6
            a = np.where(below, 0.0, a)
            return x, y, a
        return f

    def draw_rain(self, c, t, r_dome):
        rt = t
        dens = lerp(1.0, 0.6, smooth(prog(t, self.p[3].start, self.p[3].end)))
        dens = lerp(dens, 1.0, self.outro(t))
        self.rain_far.draw(c, rt, mix(MAGENTA, IVORY, 0.3), alpha=0.35, density=dens, field=self.rain_field(r_dome))
        self.rain.draw(c, rt, mix(IVORY, MAGENTA, 0.25), alpha=0.55, density=dens, field=self.rain_field(r_dome))
        if r_dome > 40:
            rr = r_dome - 4

            def surf_y(x):
                dx = np.clip(np.abs(x - CX), 0, rr)
                return np.where(np.abs(x - CX) < rr, CY - np.sqrt(rr ** 2 - dx ** 2), CY)
            self.rain.splashes(c, rt, surf_y, IVORY, alpha=0.55, density=dens, max_r=14,
                               mask=lambda x, y: np.abs(x - CX) < rr * 0.97)
            self.rain.splashes(c, rt, lambda x: np.full_like(x, CY + 4.0), IVORY, alpha=0.4, density=dens,
                               max_r=30, mask=lambda x, y: np.abs(x - CX) > rr)
            # agua que resbala por el borde de la cúpula
            for k in range(16):
                side = 1 if k % 2 else -1
                ph = (t * 0.32 + k * 0.137) % 1.0
                ang = -math.pi / 2 + side * (0.15 + ph * 1.35)
                x, y = CX + math.cos(ang) * (rr + 4), CY + math.sin(ang) * (rr + 4)
                c.set_source_rgba(*IVORY, 0.6 * math.sin(ph * math.pi))
                c.arc(x, y, 2.6 + 1.5 * ph, 0, 2 * math.pi)
                c.fill()
        else:
            self.rain.splashes(c, rt, lambda x: np.full_like(x, CY + 4.0), IVORY, alpha=0.4, density=dens, max_r=30)

    def draw_arcs(self, c, t):
        p0, p1 = self.p[0], self.p[1]
        line1, g1 = self.arc1
        dim1 = 1 - 0.3 * smooth(prog(t, p1.start, p1.start + 1.0)) - 0.35 * smooth(prog(t, self.p[2].start - 0.3, self.p[2].start + 0.6))
        dim1 *= 1 - self.outro(t)
        fade_all = 1 - self.outro(t)
        for i, (g, x, y, rot) in enumerate(g1):
            w = p0.words[g.word]
            t0 = w.start - 0.16 + (g.x - line1.word_spans[g.word][0]) * 0.05
            k = prog(t, t0, t0 + 0.55)
            if k <= 0:
                continue
            fall = (1 - ease_out_cubic(k)) * 760
            squash = 1 - 0.14 * math.sin(clamp((k - 0.55) / 0.45) * math.pi)
            col = mix(MAGENTA, (0.86, 0.42, 0.6), 0.35)
            draw_glyph(c, line1, g, S1, x, y - fall, rot=rot + (1 - k) * 0.25, sx=1 / squash ** 0.5, sy=squash,
                       color=col, alpha=smooth(k * 2.5) * dim1)
        line2, g2 = self.arc2
        for i, (g, x, y, rot) in enumerate(g2):
            w = p1.words[g.word]
            t0 = w.start - 0.08 + (g.x - line2.word_spans[g.word][0]) * 0.06
            k = prog(t, t0, t0 + 0.7)
            if k <= 0:
                continue
            draw_glyph(c, line2, g, S2, x, y, rot=rot, color=mix(IVORY, MAGENTA, 0.12), alpha=0.95 * fade_all, write=k,
                       stroke_w=1.6)

    def draw_line3(self, c, t, y, phrase, size, color, alpha=1.0):
        def per(i, g, gx, gy):
            w = phrase.words[g.word]
            k = prog(t, w.start - 0.1, w.start + 0.55)
            lift = (1 - ease_out_back(k)) * 22
            return {"write": k, "y": gy + lift, "alpha": alpha * smooth(k * 3)}
        draw_line(c, phrase.text, size, CX, y, color=color, per_glyph=per)

    def scene_above(self, t):
        s, c = new_surface()
        r = self.dome_radius(t)
        self.draw_sky(c, t, r)
        self.draw_rain(c, t, r)
        self.draw_arcs(c, t)
        p2 = self.p[2]
        if t > p2.start - 0.2:
            a = (1 - 0.3 * smooth(prog(t, self.p[3].start, self.p[3].start + 1.2))) * (1 - self.outro(t))
            y3 = CY - 92
            glow(c, lambda g: self.draw_line3(g, t, y3, p2, 70, ORANGE, 1.0), sigma=26,
                 strength=0.55 * smooth(prog(t, p2.words[-1].start, p2.words[-1].start + 0.6)) * a)
            self.draw_line3(c, t, y3, p2, 70, BURNT, a)
        return s

    def draw(self, ctx, t, f):
        zoom, tilt, sway = self.camera(t)
        above = self.scene_above(t)
        ctx.save()
        ctx.translate(W / 2 + sway, H / 2 - tilt * 0.55)
        ctx.scale(zoom, zoom)
        ctx.translate(-W / 2, -H / 2)
        # mundo superior
        ctx.save()
        ctx.rectangle(-200, -400, W + 400, CY + 400)
        ctx.clip()
        ctx.set_source_surface(above, 0, 0)
        ctx.paint()
        ctx.restore()
        # agua: reflejo con ondas
        ctx.save()
        rgba(ctx, PLUM)
        ctx.rectangle(-200, CY, W + 400, H)
        ctx.fill()
        strip = 6
        for k in range(0, int(H - CY) + 260, strip):
            off = math.sin(k * 0.045 - t * 3.2) * (2 + k * 0.035) + math.sin(k * 0.13 + t * 2.1) * 1.5
            ctx.save()
            ctx.rectangle(-200, CY + k, W + 400, strip + 0.5)
            ctx.clip()
            ctx.translate(off, 2 * CY)
            ctx.scale(1, -1)
            ctx.set_source_surface(above, 0, 0)
            ctx.paint_with_alpha(clamp(0.62 - k / 1500))
            ctx.restore()
        g = cairo.LinearGradient(0, CY, 0, H + 200)
        g.add_color_stop_rgba(0, *PLUM, 0.15)
        g.add_color_stop_rgba(1, *PLUM, 0.85)
        ctx.set_source(g)
        ctx.rectangle(-200, CY, W + 400, H + 400)
        ctx.fill()
        ctx.restore()
        # línea del agua
        ctx.set_source_rgba(*IVORY, 0.25)
        ctx.set_line_width(1.5)
        ctx.move_to(-200, CY + 1)
        ctx.line_to(W + 200, CY + 1)
        ctx.stroke()
        p3 = self.p[3]
        if t > p3.start - 0.2:
            def wave(i, g, gx, gy):
                w = p3.words[g.word]
                k = prog(t, w.start - 0.1, w.start + 0.6)
                return {"write": k, "y": gy + math.sin(gx * 0.02 + t * 2.4) * 4,
                        "alpha": smooth(k * 3) * (1 - self.outro(t))}
            yy = CY + 175
            glow(ctx, lambda g: draw_line(g, p3.text, 84, CX, yy, color=ORANGE, per_glyph=wave), sigma=22,
                 strength=0.5 * smooth(prog(t, p3.words[-1].start, p3.words[-1].start + 0.8)) * (1 - self.outro(t)))
            draw_line(ctx, p3.text, 84, CX, yy, color=mix(IVORY, ORANGE, 0.35), per_glyph=wave)
        ctx.restore()
        vignette(ctx, PLUM, 0.55)
        grain(ctx, 0.28)
        credit(ctx, 0.55 * (1 - smooth(prog(t, 3.0, 4.0))) + 0.25)

    def draw_cover(self, ctx, t, f):
        self.draw(ctx, t, f)
        credit(ctx, 0.9)
