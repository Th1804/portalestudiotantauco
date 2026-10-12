"""Render determinista de un Reel: frames Cairo -> ffmpeg (H.264) + audio original recortado (AAC).

Uso:
  python3 -m engine.render 01                    # MP4 final en out/
  python3 -m engine.render 01 --stills 0,4.2,9   # PNG sueltos en out/stills/
  python3 -m engine.render 01 --cover 12.4       # portada vertical en covers/
  python3 -m engine.render 01 --preview          # MP4 rápido a 540x960 (revisión)
"""
import argparse
import importlib
import subprocess
import sys
import time

import cairo

from .core import FPS, H, ROOT, W
from .sync import Cut

# Solo la pieza 01 está implementada; las otras cinco son candidatos documentados en reels/cuts.json.
# Para añadir una pieza: crear reels/rXX_nombre.py con una clase Reel(cut) y registrarla aquí.
REEL_MODULES = {
    "01": "reels.r01_refugio",
}
AUDIO = ROOT / "assets/No_Sobre_Ti_original.m4a"


def load(reel_id):
    cut = Cut(reel_id)
    mod = importlib.import_module(REEL_MODULES[reel_id])
    return cut, mod.Reel(cut)


def render_frame(reel, f):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    ctx.set_source_rgb(0, 0, 0)
    ctx.paint()
    reel.draw(ctx, f / FPS, f)
    surf.flush()
    return surf


def audio_filter(cut):
    m = cut.meta
    d = cut.duration
    return (f"[1:a]atrim=start={cut.src_start:.6f}:duration={d:.6f},asetpts=PTS-STARTPTS,"
            f"afade=t=in:st=0:d={m['fade_in']},afade=t=out:st={d - m['fade_out']:.6f}:d={m['fade_out']}[a]")


def render_video(reel_id, preview=False, out=None):
    cut, reel = load(reel_id)
    out_dir = ROOT / "out"
    out_dir.mkdir(exist_ok=True)
    out = out or out_dir / (("preview_" if preview else "") + cut.meta["file"])
    vf = "scale=540:960:flags=area," if preview else ""
    cmd = [
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "-",
        "-i", str(AUDIO),
        "-filter_complex", audio_filter(cut) + f";[0:v]{vf}scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast" if preview else "slow", "-crf", "26" if preview else "17",
        "-profile:v", "high", "-g", "60", "-r", str(FPS), "-fps_mode", "cfr",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:a", "aac", "-b:a", "256k", "-ar", "44100",
        "-movflags", "+faststart", "-t", f"{cut.duration:.6f}", str(out),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for f in range(cut.frames):
        surf = render_frame(reel, f)
        proc.stdin.write(bytes(surf.get_data()))
        if f % 60 == 0:
            el = time.time() - t0
            print(f"[{reel_id}] frame {f}/{cut.frames} {el:.0f}s", flush=True)
    proc.stdin.close()
    rc = proc.wait()
    print(f"[{reel_id}] done -> {out} ({time.time() - t0:.0f}s) rc={rc}")
    return rc


def stills(reel_id, times, prefix="", scale=1.0):
    cut, reel = load(reel_id)
    d = ROOT / "out/stills"
    d.mkdir(parents=True, exist_ok=True)
    paths = []
    for t in times:
        f = min(cut.frames - 1, int(round(t * FPS)))
        surf = render_frame(reel, f)
        p = d / f"{prefix}{reel_id}_{f:04d}.png"
        surf.write_to_png(str(p))
        paths.append(p)
    return paths


def cover(reel_id, t):
    cut, reel = load(reel_id)
    f = int(round(t * FPS))
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    ctx.set_source_rgb(0, 0, 0)
    ctx.paint()
    if hasattr(reel, "draw_cover"):
        reel.draw_cover(ctx, t, f)
    else:
        reel.draw(ctx, t, f)
    d = ROOT / "covers"
    d.mkdir(exist_ok=True)
    p = d / cut.meta["file"].replace(".mp4", "_portada.png")
    surf.write_to_png(str(p))
    print(p)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reel")
    ap.add_argument("--stills")
    ap.add_argument("--cover", type=float)
    ap.add_argument("--preview", action="store_true")
    a = ap.parse_args()
    if a.stills:
        for p in stills(a.reel, [float(x) for x in a.stills.split(",")]):
            print(p)
    elif a.cover is not None:
        cover(a.reel, a.cover)
    else:
        sys.exit(render_video(a.reel, a.preview))


if __name__ == "__main__":
    main()
