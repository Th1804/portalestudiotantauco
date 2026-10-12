"""Construye sync/lyrics_sync.json a partir de la alineación forzada.

- Inicio de palabra: inicio CTC (MMS_FA) + ajustes manuales (sync/manual_overrides.json).
- Fin de palabra: caída de la envolvente vocal (-14 dB respecto al pico de la palabra),
  limitada por el inicio de la palabra siguiente.
- Fin de frase = fin de su última palabra (incluye la nota sostenida).

Tiempos en segundos del audio fuente (no del Reel). El tiempo local de cada Reel
se calcula en el render restando el inicio del corte (reels/cuts.json).
"""
import json
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FA = json.loads((ROOT / "analysis/forced_alignment.json").read_text())
OVR = json.loads((ROOT / "sync/manual_overrides.json").read_text())
SR, HOP = 22050, 128

LINES = {
    "V1": ["Tu pelo en mi cara", "La lluvia en el vidrio", "Tu boca mojada", "Y yo sigo aquí",
           "Las luces se apagan", "Tus ojos no", "Tus ojos no", "Tus ojos no"],
    "PRE": ["Si cae el cielo", "Déjalo caer", "Si cae el cielo", "Déjalo caer"],
    "CH1": ["Y la maldita lluvia caerá", "Pero seguiré de pie junto a ti", "(Y para ti)", "Para ti",
            "(Y para ti)", "Para ti", "Que llueva sobre mí", "Que llueva sobre mí", "Pero no sobre ti"],
    "V2": ["Dos gotas de sangre", "Una flor sin raíz", "Tu nombre en mi lengua", "No quiere salir",
           "La noche está fría", "Tu piel sabe a abril", "Abril", "Abril", "Abril", "Abril"],
    "CH2": ["Y la maldita lluvia caerá", "Pero seguiré de pie junto a ti", "(Y para ti)", "Para ti",
            "(Y para ti)", "Para ti", "Que llueva sobre mí", "Que llueva sobre mí", "Pero no sobre ti",
            "Pero no sobre ti"],
    "OUT": ["Sobre mí", "Sobre mí", "No sobre ti", "Sobre mí", "Sobre mí", "No sobre ti"],
}
SECTION_NAMES = {"V1": "Verso 1", "PRE": "Pre-coro", "CH1": "Coro 1", "V2": "Verso 2", "CH2": "Coro 2", "OUT": "Outro"}


def main():
    voc, _ = librosa.load(ROOT / "analysis/sep/htdemucs/full44k/vocals.wav", sr=SR, mono=True)
    db = librosa.amplitude_to_db(librosa.feature.rms(y=voc, frame_length=1024, hop_length=HOP)[0], ref=1.0)
    t_of = lambda i: i * HOP / SR
    i_of = lambda t: int(round(t * SR / HOP))

    phrases = []
    for sid, lines in LINES.items():
        words = [dict(w) for w in FA[sid]["words"]]
        for k, w in enumerate(words):
            key = f"{sid}:{k}"
            if key in OVR.get("start", {}):
                w["start"] = OVR["start"][key]
        for k, w in enumerate(words):
            nxt = words[k + 1]["start"] if k + 1 < len(words) else w["start"] + 3.0
            key = f"{sid}:{k}"
            if key in OVR.get("end", {}):
                w["end"] = OVR["end"][key]
                continue
            a, b = i_of(w["start"]), i_of(nxt)
            seg = db[a:b]
            if len(seg) < 2:
                w["end"] = nxt
                continue
            peak = seg[: max(2, i_of(w["end"]) - a + 4)].max()
            below = np.where(seg[np.argmax(seg[: max(2, i_of(w["end"]) - a + 4)]):] < peak - 14)[0]
            off = a + np.argmax(seg[: max(2, i_of(w["end"]) - a + 4)]) + (below[0] if len(below) else len(seg))
            w["end"] = round(min(t_of(off), nxt - 0.02), 3)
        k = 0
        for li, text in enumerate(lines):
            n = len(text.strip("()").split())
            ws = words[k: k + n]
            k += n
            phrases.append({
                "id": f"{sid}-{li + 1:02d}",
                "section": SECTION_NAMES[sid],
                "text": text.strip("()"),
                "backing": text.startswith("("),
                "start": ws[0]["start"],
                "end": ws[-1]["end"],
                "words": [{"w": tw, "start": round(w["start"], 3), "end": round(w["end"], 3)}
                          for tw, w in zip(text.strip("()").split(), ws)],
            })
        assert k == len(words), (sid, k, len(words))
    out = {
        "song": "No Sobre Ti — Pimzath",
        "source_audio": "assets/No_Sobre_Ti_original.m4a",
        "time_base": "segundos del audio fuente decodificado por ffmpeg (stream start 0.046440 s ya compensado por el decodificador)",
        "method": "Demucs htdemucs (voz aislada) + alineación forzada CTC MMS_FA con la letra oficial + fines por envolvente vocal + revisión manual con gráficos (analysis/plots).",
        "discrepancies_vs_official_lyrics": OVR.get("discrepancies", []),
        "phrases": phrases,
    }
    (ROOT / "sync/lyrics_sync.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    for p in phrases:
        print(f"{p['id']:8s} {p['start']:7.2f}-{p['end']:7.2f} {p['text']}")


if __name__ == "__main__":
    main()
