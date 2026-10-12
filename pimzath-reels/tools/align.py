"""Alineación forzada de la letra oficial sobre la voz aislada (Demucs).

Modelo: torchaudio MMS_FA (wav2vec2 multilingüe, CTC). Para cada sección se
alinea el texto tal como se canta (con sus repeticiones) dentro de una ventana
de tiempo. Además imprime la decodificación "greedy" del modelo para detectar
repeticiones extra o faltantes. Resultado: analysis/forced_alignment.json.

Uso: python3 tools/align.py [id_seccion ...]
"""
import json
import sys
import unicodedata
from pathlib import Path

import librosa
import numpy as np
import torch
from torchaudio.pipelines import MMS_FA as BUNDLE

ROOT = Path(__file__).resolve().parents[1]
VOCALS = ROOT / "analysis/sep/htdemucs/full44k/vocals.wav"
OUT = ROOT / "analysis/forced_alignment.json"

SECTIONS = json.loads((ROOT / "analysis/sections_hypothesis.json").read_text())


def norm(word):
    w = unicodedata.normalize("NFD", word.lower())
    w = "".join(ch for ch in w if unicodedata.category(ch) != "Mn")
    return "".join(ch for ch in w if ch.isalpha())


def viterbi(logp, tokens, blank=0):
    """CTC forced alignment (camino más probable). Devuelve frame->índice de token o -1."""
    T = logp.shape[0]
    ext = [blank]
    for t in tokens:
        ext += [t, blank]
    S = len(ext)
    neg = -1e30
    dp = np.full((T, S), neg, dtype=np.float64)
    bp = np.zeros((T, S), dtype=np.int32)
    dp[0, 0] = logp[0, ext[0]]
    dp[0, 1] = logp[0, ext[1]]
    for t in range(1, T):
        prev = dp[t - 1]
        stay = prev
        step = np.concatenate([[neg], prev[:-1]])
        skip = np.concatenate([[neg, neg], prev[:-2]])
        allow_skip = np.array([s >= 2 and ext[s] != blank and ext[s] != ext[s - 2] for s in range(S)])
        skip = np.where(allow_skip, skip, neg)
        stacked = np.stack([stay, step, skip])
        arg = np.argmax(stacked, axis=0)
        dp[t] = stacked[arg, np.arange(S)] + logp[t, ext]
        bp[t] = arg
    s = S - 1 if dp[T - 1, S - 1] > dp[T - 1, S - 2] else S - 2
    path = np.zeros(T, dtype=np.int32)
    for t in range(T - 1, -1, -1):
        path[t] = s
        s -= bp[t, s]
    tok_idx = np.where(np.array(ext)[path] != blank, (path - 1) // 2, -1)
    frame_scores = logp[np.arange(T), np.array(ext)[path]]
    return tok_idx, frame_scores


def main():
    want = set(sys.argv[1:])
    model = BUNDLE.get_model(with_star=False)
    model.eval()
    labels = BUNDLE.get_labels(star=None)
    lab2id = {c: i for i, c in enumerate(labels)}
    y, _ = librosa.load(VOCALS, sr=16000, mono=True)
    results = json.loads(OUT.read_text()) if OUT.exists() else {}
    for sec in SECTIONS:
        if want and sec["id"] not in want:
            continue
        a, b = sec["window"]
        seg = torch.from_numpy(y[int(a * 16000): int(b * 16000)]).unsqueeze(0)
        with torch.inference_mode():
            em, _ = model(seg)
        logp = torch.log_softmax(em[0], dim=-1).numpy()
        fps = logp.shape[0] / (b - a)
        greedy = []
        last = -1
        for i in logp.argmax(-1):
            if i != last and i != 0:
                greedy.append(labels[i])
            if i == 0 and last != 0:
                greedy.append(" ")
            last = i
        print(f"\n== {sec['id']} {a}-{b} greedy: {''.join(greedy)}")
        words = sec["text"].split()
        toks, owner = [], []
        for wi, w in enumerate(words):
            for ch in norm(w):
                toks.append(lab2id[ch])
                owner.append(wi)
        tok_idx, fs = viterbi(logp, toks)
        out_words = []
        for wi, w in enumerate(words):
            idxs = [k for k, o in enumerate(owner) if o == wi]
            frames = np.where(np.isin(tok_idx, idxs))[0]
            st, en = frames.min() / fps + a, (frames.max() + 1) / fps + a
            score = float(np.mean(fs[frames]))
            out_words.append({"w": w, "start": round(st, 3), "end": round(en, 3), "score": round(score, 2)})
        total = float(np.mean(fs))
        print(f"   mean frame logp {total:.3f}")
        print("   " + " | ".join(f"{d['w']} {d['start']:.2f}-{d['end']:.2f} ({d['score']})" for d in out_words))
        results[sec["id"]] = {"window": sec["window"], "text": sec["text"], "mean_logp": round(total, 3), "words": out_words}
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
