"""Verificación de un MP4 exportado.

- Formato: 1080x1920, 30 fps constantes, H.264 yuv420p, AAC, duración = frames/30.
- Frames negros (blackdetect) y frames congelados largos (freezedetect).
- Audio: correlación contra el tramo de la fuente (desfase en muestras), diferencia RMS
  fuera de los fades, picos (clipping) de fuente vs exportación.
- Hoja de contacto de TODO el video (1 frame cada 0,5 s) y simulación de UI de Instagram.

Uso: python3 tools/verify.py 01
"""
import json
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))
from engine.core import ROOT, SAFE_X0, SAFE_X1, SAFE_Y0, SAFE_Y1  # noqa: E402
from engine.sync import Cut  # noqa: E402

SR = 44100


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True).stdout + subprocess.run(
        cmd, capture_output=True, text=True).stderr


def decode(path, start=None, dur=None):
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-i", str(path), "-af", f"atrim=start={start}:duration={dur},asetpts=PTS-STARTPTS"]
    else:
        cmd += ["-i", str(path)]
    cmd += ["-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def main():
    rid = sys.argv[1]
    cut = Cut(rid)
    mp4 = ROOT / "out" / cut.meta["file"]
    rep = {"file": mp4.name}
    probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-count_frames",
                                       "-of", "json", str(mp4)], capture_output=True, text=True).stdout)
    v = next(s for s in probe["streams"] if s["codec_type"] == "video")
    a = next(s for s in probe["streams"] if s["codec_type"] == "audio")
    rep["video"] = {k: v.get(k) for k in ("codec_name", "profile", "width", "height", "pix_fmt", "r_frame_rate",
                                          "avg_frame_rate", "nb_read_frames", "color_space")}
    rep["audio"] = {k: a.get(k) for k in ("codec_name", "sample_rate", "channels", "bit_rate")}
    rep["duration_s"] = float(probe["format"]["duration"])
    rep["size_mb"] = round(int(probe["format"]["size"]) / 1e6, 2)
    rep["expected_frames"] = cut.frames
    checks = {
        "1080x1920": v["width"] == 1080 and v["height"] == 1920,
        "30fps_cfr": v["r_frame_rate"] == "30/1" and v["avg_frame_rate"] == "30/1",
        "h264": v["codec_name"] == "h264",
        "aac": a["codec_name"] == "aac",
        "frame_count": int(v["nb_read_frames"]) == cut.frames,
    }
    bd = run(["ffmpeg", "-v", "info", "-i", str(mp4), "-vf", "blackdetect=d=0.05:pix_th=0.06", "-an", "-f", "null", "-"])
    rep["blackdetect"] = [ln.split("] ")[-1] for ln in bd.splitlines() if "black_start" in ln]
    checks["no_black_frames"] = not rep["blackdetect"]
    fz = run(["ffmpeg", "-v", "info", "-i", str(mp4), "-vf", "freezedetect=n=0.0005:d=1.5", "-an", "-f", "null", "-"])
    rep["freezedetect"] = [ln.split("] ")[-1] for ln in fz.splitlines() if "freeze_start" in ln]

    out = decode(mp4)
    src = decode(ROOT / "assets/No_Sobre_Ti_original.m4a", cut.src_start - 0.05, cut.duration + 0.1)
    o = out[:, 0]
    s = src[:, 0]
    seg = o[int(1.0 * SR): int(6.0 * SR)]
    best, lag = -1, 0
    for L in range(int(0.05 * SR) - 400, int(0.05 * SR) + 400):
        c = float(np.dot(seg, s[int(1.0 * SR) + L: int(1.0 * SR) + L + len(seg)]))
        if c > best:
            best, lag = c, L
    offset_samples = lag - int(0.05 * SR)
    rep["audio_offset_vs_source_samples"] = offset_samples
    rep["audio_offset_vs_source_ms"] = round(offset_samples / SR * 1000, 3)
    al = s[int(0.05 * SR) + offset_samples:][: len(o)]
    n = min(len(al), len(o))
    body = slice(int(0.1 * SR), n - int(0.4 * SR))
    diff = o[body] - al[body]
    rep["residual_vs_source_db"] = round(float(20 * np.log10(np.sqrt(np.mean(diff ** 2)) /
                                                             np.sqrt(np.mean(al[body] ** 2)))), 1)
    rep["peak_source_dbfs"] = round(float(20 * np.log10(np.abs(src).max())), 2)
    rep["peak_export_dbfs"] = round(float(20 * np.log10(np.abs(out).max())), 2)
    rep["samples_over_0dbfs"] = int((np.abs(out) >= 1.0).sum())
    src_al = src[int(0.05 * SR) + offset_samples:][: len(out)]
    rep["source_samples_over_0dbfs_same_span"] = int((np.abs(src_al) >= 1.0).sum())
    rep["peak_source_same_span_dbfs"] = round(float(20 * np.log10(np.abs(src_al).max())), 2)
    checks["audio_sync_within_1ms"] = abs(rep["audio_offset_vs_source_ms"]) <= 1.0
    checks["audio_unaltered_residual_below_-25dB"] = rep["residual_vs_source_db"] < -25
    # el AAC original ya decodifica con picos > 0 dBFS; no se corrige (sería alterar la ganancia)
    checks["no_clipping_added_vs_source"] = rep["samples_over_0dbfs"] <= rep["source_samples_over_0dbfs_same_span"]
    rep["checks"] = checks

    # hoja de contacto completa y simulación de UI
    qa = ROOT / "out/qa"
    qa.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-vf", "fps=2,scale=216:384,tile=9x4",
                    str(qa / f"{rid}_contact_%02d.jpg")])
    for t in (0.0, 3.0, 7.0, 10.5, 14.5):
        p = qa / f"{rid}_ig_{t:04.1f}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(mp4), "-frames:v", "1", str(p)])
        ig_overlay(p)
    (qa / f"{rid}_report.json").write_text(json.dumps(rep, indent=1, ensure_ascii=False))
    print(json.dumps(rep, indent=1, ensure_ascii=False))


def ig_overlay(path):
    """Superpone una maqueta de la interfaz de Reels y la zona segura, y reduce a tamaño de móvil."""
    im = Image.open(path).convert("RGBA")
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rectangle([0, 0, 1080, 200], fill=(0, 0, 0, 70))
    d.text((60, 110), "Reels", fill=(255, 255, 255, 230))
    for i, y in enumerate((1180, 1330, 1480, 1630)):
        d.ellipse([965, y, 1035, y + 70], outline=(255, 255, 255, 220), width=5)
    d.rectangle([0, 1560, 1080, 1920], fill=(0, 0, 0, 110))
    d.ellipse([50, 1620, 130, 1700], fill=(200, 200, 200, 200))
    d.text((150, 1645), "pimzath  ·  Seguir", fill=(255, 255, 255, 240))
    d.text((50, 1730), "caption del reel…", fill=(255, 255, 255, 200))
    d.rectangle([SAFE_X0, SAFE_Y0, SAFE_X1, SAFE_Y1], outline=(0, 255, 120, 200), width=3)
    im = Image.alpha_composite(im, ov).convert("RGB").resize((390, 693), Image.LANCZOS)
    im.save(path.with_suffix(".jpg"), quality=90)
    path.unlink()


if __name__ == "__main__":
    main()
