"""Dibuja una ventana de tiempo: envolvente vocal (dB), onsets vocales, onset
strength instrumental y palabras del ASR, para verificar la sincronía a ojo.

Uso: python3 tools/plot_window.py <inicio> <fin> <salida.png> [asr.json] [sync.json]
"""
import json
import sys
from pathlib import Path

import cairo
import librosa
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SEP = ROOT / "analysis/sep/htdemucs/full44k"
SR = 22050
HOP = 128


def main():
    t0, t1, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
    asr = json.loads(Path(sys.argv[4]).read_text()) if len(sys.argv) > 4 and sys.argv[4] != "-" else []
    sync = json.loads(Path(sys.argv[5]).read_text()) if len(sys.argv) > 5 else None
    voc, _ = librosa.load(SEP / "vocals.wav", sr=SR, mono=True, offset=t0, duration=t1 - t0)
    inst, _ = librosa.load(SEP / "no_vocals.wav", sr=SR, mono=True, offset=t0, duration=t1 - t0)
    vdb = librosa.amplitude_to_db(librosa.feature.rms(y=voc, frame_length=1024, hop_length=HOP)[0], ref=1.0)
    ienv = librosa.onset.onset_strength(y=inst, sr=SR, hop_length=HOP)
    von = librosa.onset.onset_detect(y=voc, sr=SR, hop_length=HOP, units="time", backtrack=False) + t0
    # spectral flux of vocals helps separate consonant onsets inside sustained notes
    venv = librosa.onset.onset_strength(y=voc, sr=SR, hop_length=HOP)

    W, H = 2400, 760
    s = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    c = cairo.Context(s)
    c.set_source_rgb(1, 1, 1)
    c.paint()
    px = lambda t: 40 + (t - t0) / (t1 - t0) * (W - 80)

    c.set_line_width(1)
    t = np.ceil(t0 * 4) / 4
    c.select_font_face("DejaVu Sans")
    c.set_font_size(13)
    while t <= t1:
        major = abs(t - round(t)) < 1e-6
        c.set_source_rgb(0.75, 0.75, 0.75) if major else c.set_source_rgb(0.92, 0.92, 0.92)
        c.move_to(px(t), 20)
        c.line_to(px(t), H - 20)
        c.stroke()
        if major:
            c.set_source_rgb(0.3, 0.3, 0.3)
            c.move_to(px(t) + 2, H - 6)
            c.show_text(f"{t:.0f}")
        t += 0.25

    def curve(vals, y0, h, lo, hi, rgb):
        c.set_source_rgb(*rgb)
        c.set_line_width(1.6)
        tt = librosa.frames_to_time(np.arange(len(vals)), sr=SR, hop_length=HOP) + t0
        for i, (a, v) in enumerate(zip(tt, vals)):
            y = y0 + h - (np.clip(v, lo, hi) - lo) / (hi - lo) * h
            (c.move_to if i == 0 else c.line_to)(px(a), y)
        c.stroke()

    curve(vdb, 40, 260, -60, -5, (0.67, 0.2, 0.43))
    curve(venv / (venv.max() + 1e-9), 320, 120, 0, 1, (0.2, 0.3, 0.7))
    curve(ienv / (ienv.max() + 1e-9), 460, 120, 0, 1, (0.9, 0.46, 0.26))
    c.set_source_rgb(0.2, 0.3, 0.7)
    for o in von:
        c.move_to(px(o), 300)
        c.line_to(px(o), 320)
        c.stroke()

    c.set_font_size(15)
    for seg in asr:
        for w in seg.get("words", []):
            if w["end"] < t0 or w["start"] > t1:
                continue
            c.set_source_rgba(0.1, 0.6, 0.2, 0.25)
            c.rectangle(px(w["start"]), 600, px(w["end"]) - px(w["start"]), 30)
            c.fill()
            c.set_source_rgb(0.05, 0.35, 0.1)
            c.move_to(px(w["start"]) + 2, 622)
            c.show_text(w["w"])
    if sync:
        for ph in sync["phrases"]:
            for w in ph["words"]:
                if w["end"] < t0 or w["start"] > t1:
                    continue
                c.set_source_rgba(0.67, 0.2, 0.43, 0.25)
                c.rectangle(px(w["start"]), 645, px(w["end"]) - px(w["start"]), 30)
                c.fill()
                c.set_source_rgb(0.4, 0.05, 0.2)
                c.move_to(px(w["start"]) + 2, 667)
                c.show_text(w["w"])
    s.write_to_png(out)


if __name__ == "__main__":
    main()
