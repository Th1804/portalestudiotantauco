"""ASR auxiliar (faster-whisper) con timestamps de palabra.

Solo es una ayuda: los tiempos finales se contrastan con energía vocal y onsets
(ver tools/vocal_activity.py) y se fijan a mano en sync/lyrics_sync.json.

Uso: python3 tools/asr.py <audio.wav> <salida.json> [modelo]
"""
import json
import sys

import librosa
import soundfile as sf
from faster_whisper import WhisperModel

LYRICS_PROMPT = (
    "Tu pelo en mi cara. La lluvia en el vidrio. Tus ojos no. Si cae el cielo, "
    "déjalo caer. Y la maldita lluvia caerá. Pero seguiré de pie junto a ti. "
    "Que llueva sobre mí. Pero no sobre ti. Abril."
)


def main():
    src, out = sys.argv[1], sys.argv[2]
    model_name = sys.argv[3] if len(sys.argv) > 3 else "small"
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    audio, sr = sf.read(src, dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if sr != 16000:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
    segments, _ = model.transcribe(
        audio,
        language="es",
        word_timestamps=True,
        vad_filter=False,
        initial_prompt=LYRICS_PROMPT,
        condition_on_previous_text=False,
        beam_size=5,
    )
    data = []
    for seg in segments:
        words = [
            {"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "p": round(w.probability, 3)}
            for w in (seg.words or [])
        ]
        data.append({"start": round(seg.start, 3), "end": round(seg.end, 3), "text": seg.text.strip(), "words": words})
        print(f"{seg.start:7.2f}-{seg.end:7.2f} {seg.text.strip()}", flush=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
