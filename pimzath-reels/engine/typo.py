"""Tipografía como geometría: shaping con HarfBuzz y contornos vectoriales por glifo.

Permite colocar cada glifo con su propia transformación (arcos, caídas, reflejos),
"escribir" contornos con trazo progresivo y rellenar después. Fuentes locales (OFL).
"""
import math
from dataclasses import dataclass, field
from functools import lru_cache

import cairo
import uharfbuzz as hb

from .core import ROOT, clamp

FONT_DIR = ROOT / "fonts"
FONTS = {
    # Letra principal: serif itálica expresiva de alto contraste
    "lyric": ("PlayfairDisplay-Italic-VF.ttf", {"wght": 480}),
    # Créditos discretos
    "credit": ("DMSans-VF.ttf", {"wght": 500, "opsz": 14}),
}


class _Pen:
    def __init__(self):
        self.ops = []
        self.cur = (0.0, 0.0)

    def moveTo(self, p):
        self.ops.append(("M", p))
        self.cur = p

    def lineTo(self, p):
        self.ops.append(("L", p))
        self.cur = p

    def curveTo(self, c1, c2, p):
        self.ops.append(("C", c1, c2, p))
        self.cur = p

    def qCurveTo(self, *pts):
        # cadena cuadrática TrueType -> cúbicas
        *ctrls, end = pts
        p0 = self.cur
        for i, q in enumerate(ctrls):
            if i < len(ctrls) - 1:
                nq = ctrls[i + 1]
                p = ((q[0] + nq[0]) / 2, (q[1] + nq[1]) / 2)
            else:
                p = end
            c1 = (p0[0] + 2 / 3 * (q[0] - p0[0]), p0[1] + 2 / 3 * (q[1] - p0[1]))
            c2 = (p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1]))
            self.ops.append(("C", c1, c2, p))
            p0 = p
        self.cur = end

    def closePath(self):
        self.ops.append(("Z",))

    def endPath(self):
        pass


class Font:
    def __init__(self, key):
        fname, var = FONTS[key]
        self.key = key
        self.face = hb.Face(hb.Blob.from_file_path(str(FONT_DIR / fname)))
        self.font = hb.Font(self.face)
        self.font.set_variations(var)
        self.upem = self.face.upem
        ext = self.font.get_font_extents("ltr")
        self.ascender = ext.ascender / self.upem
        self.descender = ext.descender / self.upem
        self._paths = {}

    def glyph_ops(self, gid):
        if gid not in self._paths:
            pen = _Pen()
            self.font.draw_glyph_with_pen(gid, pen)
            self._paths[gid] = pen.ops
        return self._paths[gid]

    def shape(self, text):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.font, buf, {"kern": True, "liga": True})
        return buf.glyph_infos, buf.glyph_positions


@lru_cache(maxsize=None)
def font(key):
    return Font(key)


@dataclass
class Glyph:
    gid: int
    x: float  # posición en la línea (em)
    y: float
    adv: float
    char_index: int
    word: int
    char: str


@dataclass
class Line:
    text: str
    font: Font
    glyphs: list = field(default_factory=list)
    width: float = 0.0  # em
    word_spans: list = field(default_factory=list)  # (x0, x1) em por palabra

    def glyphs_of_word(self, wi):
        return [g for g in self.glyphs if g.word == wi]


@lru_cache(maxsize=4096)
def layout(text, key="lyric", tracking=0.0):
    f = font(key)
    infos, poss = f.shape(text)
    word_of_char = []
    w = -1
    prev_space = True
    for ch in text:
        if ch == " ":
            word_of_char.append(-1)
            prev_space = True
        else:
            if prev_space:
                w += 1
            prev_space = False
            word_of_char.append(w)
    line = Line(text, f)
    x = 0.0
    for info, pos in zip(infos, poss):
        ci = info.cluster
        ch = text[ci] if ci < len(text) else ""
        wi = word_of_char[ci] if ci < len(word_of_char) else -1
        if ch != " ":
            line.glyphs.append(Glyph(info.codepoint, x + pos.x_offset / f.upem, pos.y_offset / f.upem,
                                     pos.x_advance / f.upem, ci, wi, ch))
        x += pos.x_advance / f.upem + tracking
    line.width = x - tracking
    nwords = max([g.word for g in line.glyphs] + [-1]) + 1
    for wi in range(nwords):
        gs = line.glyphs_of_word(wi)
        line.word_spans.append((gs[0].x, gs[-1].x + gs[-1].adv))
    return line


def glyph_path(ctx, f, gid, size):
    """Añade el contorno del glifo al path actual (origen en la línea base, y hacia abajo)."""
    s = size / f.upem
    for op in f.glyph_ops(gid):
        k = op[0]
        if k == "M":
            ctx.move_to(op[1][0] * s, -op[1][1] * s)
        elif k == "L":
            ctx.line_to(op[1][0] * s, -op[1][1] * s)
        elif k == "C":
            (a, b), (c, d), (e, g) = op[1], op[2], op[3]
            ctx.curve_to(a * s, -b * s, c * s, -d * s, e * s, -g * s)
        elif k == "Z":
            ctx.close_path()


def path_length(ctx):
    total = 0.0
    last = None
    start = None
    for kind, pts in ctx.copy_path_flat():
        if kind == cairo.PATH_MOVE_TO:
            last = start = pts
        elif kind == cairo.PATH_LINE_TO:
            total += math.dist(last, pts)
            last = pts
        elif kind == cairo.PATH_CLOSE_PATH and last and start:
            total += math.dist(last, start)
            last = start
    return total


def draw_glyph(ctx, line, g, size, x, y, rot=0.0, sx=1.0, sy=1.0, color=(1, 1, 1), alpha=1.0,
               write=1.0, stroke_w=None, shear=0.0):
    """Dibuja un glifo con transformación propia.

    write < 1: el contorno se "escribe" progresivamente (trazo), y el relleno entra al final.
    """
    if alpha <= 0.002:
        return
    ctx.save()
    ctx.translate(x, y)
    if rot:
        ctx.rotate(rot)
    if shear:
        ctx.transform(cairo.Matrix(1, 0, shear, 1, 0, 0))
    ctx.scale(sx, sy)
    ctx.new_path()
    glyph_path(ctx, line.font, g.gid, size)
    r, gg, b = color
    if write >= 1.0:
        ctx.set_source_rgba(r, gg, b, alpha)
        ctx.fill()
    else:
        fill_a = clamp((write - 0.55) / 0.45)
        if fill_a > 0:
            ctx.set_source_rgba(r, gg, b, alpha * fill_a)
            ctx.fill_preserve()
        ln = path_length(ctx)
        ctx.set_line_width(stroke_w or max(1.2, size * 0.018))
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_dash([max(0.01, ln * clamp(write / 0.7)), ln + 1])
        ctx.set_source_rgba(r, gg, b, alpha)
        ctx.stroke()
    ctx.restore()


def draw_line(ctx, text, size, cx, baseline, key="lyric", color=(1, 1, 1), alpha=1.0, align="center",
              tracking=0.0, per_glyph=None):
    """Dibuja una línea. per_glyph(i, glyph, x, y) -> dict de overrides (x,y,rot,alpha,write,sx,sy,color)."""
    line = layout(text, key, tracking)
    x0 = cx - line.width * size / 2 if align == "center" else cx if align == "left" else cx - line.width * size
    for i, g in enumerate(line.glyphs):
        gx, gy = x0 + g.x * size, baseline - g.y * size
        kw = dict(x=gx, y=gy, color=color, alpha=alpha)
        if per_glyph:
            kw.update(per_glyph(i, g, gx, gy) or {})
        draw_glyph(ctx, line, g, size, **kw)
    return line, x0


def text_width(text, size, key="lyric", tracking=0.0):
    return layout(text, key, tracking).width * size


def fit_size(text, max_w, size, key="lyric"):
    w = text_width(text, size, key)
    return size if w <= max_w else size * max_w / w


def glyphs_on_arc(text, size, cx, cy, radius, key="lyric", center_angle=-math.pi / 2, tracking=0.0):
    """Posiciones de glifos sobre un arco (texto por fuera del círculo, legible de izquierda a derecha)."""
    line = layout(text, key, tracking)
    total = line.width * size
    out = []
    for g in line.glyphs:
        mid = (g.x + g.adv / 2) * size - total / 2
        ang = center_angle + mid / radius
        px = cx + math.cos(ang) * radius
        py = cy + math.sin(ang) * radius
        rot = ang + math.pi / 2
        # desplazar al origen del glifo (su centro horizontal está en el arco)
        ox = -g.adv * size / 2
        px += math.cos(rot) * ox
        py += math.sin(rot) * ox
        out.append((g, px, py, rot))
    return line, out
