"""Exporta sync/reel_XX_sync.json: frases y palabras del corte con tiempo fuente y tiempo local.

Uso: python3 tools/export_reel_sync.py 01
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine.core import FPS, ROOT  # noqa: E402
from engine.sync import Cut  # noqa: E402


def main():
    rid = sys.argv[1]
    cut = Cut(rid)
    out = {
        "reel": rid,
        "file": cut.meta["file"],
        "source_start": cut.src_start,
        "source_end": round(cut.src_end, 4),
        "frames": cut.frames,
        "fps": FPS,
        "phrases": [{
            "id": p.id, "text": p.text, "backing": p.backing,
            "source": [round(p.start + cut.src_start, 3), round(p.end + cut.src_start, 3)],
            "local": [round(p.start, 3), round(p.end, 3)],
            "local_frames": [round(p.start * FPS), round(p.end * FPS)],
            "words": [{"w": w.text, "source": [w.src_start, w.src_end], "local": [round(w.start, 3), round(w.end, 3)]}
                      for w in p.words],
        } for p in cut.phrases],
    }
    path = ROOT / f"sync/reel_{rid}_sync.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    for p in out["phrases"]:
        print(p["id"], p["source"], p["local"], p["text"])


if __name__ == "__main__":
    main()
