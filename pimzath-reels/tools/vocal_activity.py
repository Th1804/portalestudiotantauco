"""Análisis de la voz aislada (Demucs) y de la mezcla.

Genera analysis/vocal_activity.json con:
  - segmentos de voz activos (umbral sobre RMS en dB de la pista vocal),
  - onsets vocales (librosa, sobre la pista vocal),
  - onsets/energía de la instrumental (acentos de batería y cambios),
  - tempo estimado (solo como referencia, no se usa para sincronizar voz).

Uso: python3 tools/vocal_activity.py
"""
import json
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SEP = ROOT / "analysis/sep/htdemucs/full44k"
HOP = 256
SR = 22050


def rms_db(y):
    r = librosa.feature.rms(y=y, frame_length=1024, hop_length=HOP)[0]
    return librosa.amplitude_to_db(r, ref=np.max)


def segments_from_mask(mask, times, min_gap=0.12, min_len=0.08):
    segs = []
    start = None
    for i, on in enumerate(mask):
        if on and start is None:
            start = times[i]
        elif not on and start is not None:
            segs.append([start, times[i]])
            start = None
    if start is not None:
        segs.append([start, times[-1]])
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [[round(a, 3), round(b, 3)] for a, b in merged if b - a >= min_len]


def main():
    voc, _ = librosa.load(SEP / "vocals.wav", sr=SR, mono=True)
    inst, _ = librosa.load(SEP / "no_vocals.wav", sr=SR, mono=True)
    db = rms_db(voc)
    times = librosa.frames_to_time(np.arange(len(db)), sr=SR, hop_length=HOP)
    mask = db > -32
    segs = segments_from_mask(mask, times)

    v_on = librosa.onset.onset_detect(y=voc, sr=SR, hop_length=HOP, units="time", backtrack=True)
    i_env = librosa.onset.onset_strength(y=inst, sr=SR, hop_length=HOP)
    i_on = librosa.onset.onset_detect(onset_envelope=i_env, sr=SR, hop_length=HOP, units="time")
    tempo, beats = librosa.beat.beat_track(onset_envelope=i_env, sr=SR, hop_length=HOP, units="time")
    i_db = rms_db(inst)
    # energía instrumental por segundo, para localizar cambios de sección
    per_sec = []
    for s in range(int(times[-1]) + 1):
        m = (times >= s) & (times < s + 1)
        per_sec.append(round(float(np.mean(i_db[m[: len(i_db)]])), 1) if m.any() else None)

    out = {
        "note": "Tiempos en segundos del audio decodificado por ffmpeg (No_Sobre_Ti_original.m4a).",
        "vocal_segments_db_gt_-32": segs,
        "vocal_onsets": [round(float(t), 3) for t in v_on],
        "instrumental_onsets": [round(float(t), 3) for t in i_on],
        "tempo_estimate_bpm": float(np.atleast_1d(tempo)[0]),
        "beats": [round(float(t), 3) for t in beats],
        "instrumental_db_per_second": per_sec,
    }
    (ROOT / "analysis/vocal_activity.json").write_text(json.dumps(out, indent=1))
    print("tempo", out["tempo_estimate_bpm"], "segments", len(segs))
    for a, b in segs:
        print(f"{a:7.2f}-{b:7.2f} ({b - a:4.2f})")


if __name__ == "__main__":
    main()
