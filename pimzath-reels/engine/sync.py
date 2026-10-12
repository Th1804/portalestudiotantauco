"""Acceso a la sincronización (tiempos de la fuente) y conversión a tiempo local del Reel."""
import json
from dataclasses import dataclass
from functools import lru_cache

from .core import FPS, ROOT


@dataclass
class Word:
    text: str
    start: float  # tiempo local del Reel (s)
    end: float
    src_start: float
    src_end: float


@dataclass
class Phrase:
    id: str
    text: str
    start: float
    end: float
    backing: bool
    words: list

    def word_at(self, t):
        for i, w in enumerate(self.words):
            if w.start <= t < (self.words[i + 1].start if i + 1 < len(self.words) else self.end):
                return i
        return -1


@lru_cache(maxsize=None)
def cuts():
    return json.loads((ROOT / "reels/cuts.json").read_text())


@lru_cache(maxsize=None)
def sync_data():
    return json.loads((ROOT / "sync/lyrics_sync.json").read_text())


class Cut:
    def __init__(self, reel_id):
        c = cuts()["reels"][reel_id]
        self.id = reel_id
        self.meta = c
        self.src_start = c["source_start"]
        self.frames = c["frames"]
        self.duration = self.frames / FPS
        self.src_end = self.src_start + self.duration
        self.phrases = []
        for p in sync_data()["phrases"]:
            if p["end"] <= self.src_start or p["start"] >= self.src_end:
                continue
            words = [Word(w["w"], w["start"] - self.src_start, w["end"] - self.src_start, w["start"], w["end"])
                     for w in p["words"]]
            self.phrases.append(Phrase(p["id"], p["text"], p["start"] - self.src_start,
                                       p["end"] - self.src_start, p["backing"], words))

    def phrase(self, idx):
        return self.phrases[idx]
