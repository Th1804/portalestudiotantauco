#!/usr/bin/env python3
"""BRINE MOTION STUDIO — audio 100 % por código (numpy/scipy) + voz TTS local (Piper).
Música original (batería, bajo, pads, arpegio, armonía, automatización), SFX sintetizados en los frames del JSON,
voz Piper es_MX-claude-high, mezcla (EQ, compresión, ducking) y master (-14 LUFS objetivo, limitador -1 dBTP).
La voz la sintetiza Piper (modelo neuronal local); este código solo la controla, procesa y mezcla."""
import json, os, subprocess, sys, wave
import numpy as np
from scipy import signal

SR = 48000
RNG = np.random.default_rng(20261009)
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# ---------------------------------------------------------------- utilidades
def t_arr(n): return np.arange(n) / SR
def db(x): return 10 ** (x / 20)
def env_adsr(n, a, d, s, r, sus_len=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sl = max(0, n - a - d - r) if sus_len is None else int(sus_len * SR)
    e = np.concatenate([np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)), np.full(sl, s), np.linspace(s, 0, max(r, 1))])
    return np.pad(e, (0, max(0, n - len(e))))[:n]
def bq(x, kind, f, q=0.707, gain_db=0.0):
    """Biquad RBJ (lowpass/highpass/bandpass/peak/lowshelf/highshelf)."""
    w0 = 2 * np.pi * f / SR; al = np.sin(w0) / (2 * q); c = np.cos(w0); A = 10 ** (gain_db / 40)
    if kind == 'lp': b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'hp': b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'bp': b = [al, 0, -al]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'peak': b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind in ('ls', 'hs'):
        sq = 2 * np.sqrt(A) * al
        if kind == 'ls':
            b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
            a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
        else:
            b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
            a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    b = np.array(b) / a[0]; a = np.array(a) / a[0]
    return signal.lfilter(b, a, x, axis=0)
def svf_sweep(x, f_curve, q=0.8, mode='lp'):
    """Filtro de estado variable con frecuencia automatizada por muestra (Chamberlin)."""
    y = np.zeros_like(x); low = band = 0.0; damp = 1 / q
    fc = np.clip(f_curve, 20, SR / 6)
    F = 2 * np.sin(np.pi * fc / SR)
    for i in range(len(x)):
        high = x[i] - low - damp * band
        band += F[i] * high; low += F[i] * band
        y[i] = low if mode == 'lp' else (band if mode == 'bp' else high)
    return y
def place(bus, x, start_s, gain=1.0):
    i = int(round(start_s * SR))
    if i >= len(bus): return
    if x.ndim == 1: x = np.stack([x, x], 1)
    n = min(len(x), len(bus) - i)
    if i < 0: x = x[-i:]; n = min(len(x), len(bus)); i = 0
    bus[i:i + n] += x[:n] * gain
def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1) * np.sqrt(2)
def reverb_ir(seconds=2.2, damp=3.2, pre=0.012):
    n = int(seconds * SR); tt = t_arr(n)
    ir = np.zeros((n, 2))
    for ch in range(2):
        nz = RNG.standard_normal(n) * np.exp(-damp * tt)
        nz = bq(nz, 'lp', 7000); nz = bq(nz, 'hp', 180)
        ir[:, ch] = nz
    ir = np.pad(ir, ((int(pre * SR), 0), (0, 0)))
    return ir / np.sqrt((ir ** 2).sum() / 2)
def convolve(x, ir, wet):
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet
def compress(x, thr_db=-18, ratio=3, att=0.005, rel=0.12, makeup_db=0, key=None):
    k = np.abs(key if key is not None else x).max(1) if (key if key is not None else x).ndim > 1 else np.abs(key if key is not None else x)
    lev = np.maximum(k, 1e-9)
    # detector de envolvente (attack/release) vectorizado por bloques
    a_a = np.exp(-1 / (att * SR)); a_r = np.exp(-1 / (rel * SR))
    env = signal.lfilter([1 - a_r], [1, -a_r], lev)  # release-dominante
    env = np.maximum(env, signal.lfilter([1 - a_a], [1, -a_a], lev))
    edb = 20 * np.log10(np.maximum(env, 1e-9))
    gr = np.minimum(0, (thr_db - edb) * (1 - 1 / ratio))
    g = db(gr + makeup_db)
    return x * (g[:, None] if x.ndim > 1 else g)
def midi_hz(m): return 440 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- instrumentos
def kick(gain=1.0):
    n = int(0.45 * SR); tt = t_arr(n)
    f = 46 + 120 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt * 7.5)
    click = bq(RNG.standard_normal(n) * np.exp(-tt * 300), 'hp', 2500) * 0.25
    return np.tanh((body + click) * 1.6) * gain
def snare(gain=1.0):
    n = int(0.32 * SR); tt = t_arr(n)
    tone = np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 22) * 0.5
    nz = bq(RNG.standard_normal(n), 'bp', 2200, 0.7) * np.exp(-tt * 16)
    clap = sum(bq(RNG.standard_normal(n), 'bp', 1400, 1.2) * np.exp(-np.maximum(tt - d, 0) * 40) * (tt >= d) for d in (0, 0.011, 0.022))
    return (tone + nz * 1.4 + clap * 0.6) * gain
def hat(open_=False, gain=1.0):
    n = int((0.22 if open_ else 0.06) * SR); tt = t_arr(n)
    # metálico: suma de cuadradas inarmónicas (estilo 808) + ruido
    x = sum(signal.square(2 * np.pi * f * tt) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    x = bq(x * 0.2 + RNG.standard_normal(n) * 0.5, 'hp', 7500)
    return x * np.exp(-tt * (12 if open_ else 70)) * gain * 0.5
def bass_note(m, dur, gain=1.0, cutoff=380):
    n = int(dur * SR); tt = t_arr(n); f = midi_hz(m)
    x = 0.6 * signal.sawtooth(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(np.pi * f * tt)
    x = bq(x, 'lp', cutoff, 0.9)
    return np.tanh(x * 1.3) * env_adsr(n, 0.004, 0.08, 0.7, 0.05) * gain
def pad_chord(notes, dur, gain=1.0, bright=1800):
    n = int(dur * SR); tt = t_arr(n); x = np.zeros(n)
    for m in notes:
        for det in (-0.09, 0.0, 0.08):
            f = midi_hz(m) * 2 ** (det / 12)
            x += signal.sawtooth(2 * np.pi * f * tt + RNG.uniform(0, 6.28)) * 0.15
    x = bq(x, 'lp', bright, 0.6)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.25 * tt)
    return x * env_adsr(n, 0.35, 0.3, 0.85, 0.5) * trem * gain
def pluck(m, dur=0.25, gain=1.0, bright=1.0):
    n = int(dur * SR); tt = t_arr(n); f = midi_hz(m)
    x = 0.5 * signal.sawtooth(2 * np.pi * f * tt) + 0.5 * signal.square(2 * np.pi * f * tt * 1.003, 0.3)
    fc = 600 + 5200 * bright * np.exp(-tt * 18)
    x = svf_sweep(x, fc, 1.1)
    return x * np.exp(-tt * 9) * gain
def bell(m, dur=1.6, gain=1.0):
    n = int(dur * SR); tt = t_arr(n); f = midi_hz(m)
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * d) for r, a, d in ((1, 1, 3), (2.76, 0.45, 5), (5.4, 0.25, 8), (8.93, 0.12, 12)))
    return x * gain * 0.4

# ---------------------------------------------------------------- SFX
def sfx(kind, len_s=0.6):
    if kind in ('whoosh', 'whoosh_soft', 'whoosh_big'):
        L = {'whoosh': 0.55, 'whoosh_soft': 0.9, 'whoosh_big': 0.9}[kind]; n = int(L * SR); tt = t_arr(n)
        nz = RNG.standard_normal(n)
        fc = 250 + 2600 * np.sin(np.pi * np.clip(tt / L, 0, 1)) ** 2  # barrido más bajo y filtrado (v2)
        x = svf_sweep(nz, fc, 0.9, 'bp'); x = bq(bq(x, 'lp', 4500), 'hp', 150)
        e = np.sin(np.pi * np.clip(tt / L, 0, 1)) ** 1.5
        st = np.stack([x * e * (1 - tt / L * 0.8), x * e * (0.2 + tt / L * 0.8)], 1)  # paneo L->R
        if kind == 'whoosh_big': st += np.stack([np.sin(2 * np.pi * (60 + 40 * tt / L) * tt)] * 2, 1) * e[:, None] * 0.4
        return st * (0.6 if kind == 'whoosh_soft' else 1.0) * 0.6
    if kind == 'impact':
        n = int(1.4 * SR); tt = t_arr(n)
        sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-tt * 20)) * tt) * np.exp(-tt * 3.5)
        crack = bq(RNG.standard_normal(n), 'lp', 1800) * np.exp(-tt * 30)
        x = np.tanh((sub * 1.0 + crack * 0.35) * 1.2) * env_adsr(n, 0.004, 0.0, 1, 0.0, 1.4)
        return convolve(stereo(x), reverb_ir(1.6, 4.0), 0.25)
    if kind == 'subboom':
        n = int(2.6 * SR); tt = t_arr(n)
        x = np.sin(2 * np.pi * (34 + 30 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 1.4)
        x += bq(RNG.standard_normal(n), 'lp', 900) * np.exp(-tt * 12) * 0.3
        return convolve(stereo(np.tanh(x * 1.4)), reverb_ir(2.5, 2.4), 0.3)
    if kind == 'riser':
        L = len_s; n = int(L * SR); tt = t_arr(n)
        fc = 400 * (20 ** (tt / L))
        x = svf_sweep(RNG.standard_normal(n), fc, 2.0, 'bp') * 0.8
        x += np.sin(2 * np.pi * np.cumsum(200 * (4 ** (tt / L))) / SR) * 0.15
        e = (tt / L) ** 2.2
        return stereo(x * e)
    if kind == 'pop':
        n = int(0.18 * SR); tt = t_arr(n)
        x = np.sin(2 * np.pi * (420 * np.exp(-tt * 30) + 240) * tt) * np.exp(-tt * 30) * np.minimum(1, tt / 0.004)
        return stereo(bq(x, 'lp', 2500) * 0.5, RNG.uniform(-0.3, 0.3))
    if kind == 'tick':
        n = int(0.08 * SR); tt = t_arr(n)
        return stereo(bq(RNG.standard_normal(n), 'bp', 2800, 3) * np.exp(-tt * 70) * np.minimum(1, tt / 0.003) * 0.8)
    if kind == 'ping':
        # golpe metálico/acrílico: parciales inarmónicos (barra/placa) + reverb
        # v2: ping metálico premium: f0 más baja (D6), ataque blando de 12 ms, parciales altos atenuados, sin ruido de click
        n = int(2.4 * SR); tt = t_arr(n); f0 = 1174.7
        x = sum(a * np.sin(2 * np.pi * f0 * r * tt + RNG.uniform(0, 6)) * np.exp(-tt * d)
                for r, a, d in ((0.5, 0.35, 2.0), (1, 1, 2.2), (2.32, 0.30, 3.8), (4.25, 0.12, 6.5), (6.63, 0.05, 9)))
        x *= 1 - np.exp(-tt / 0.012)
        x = bq(x, 'lp', 6500)
        return convolve(stereo(x * 0.4), reverb_ir(2.2, 2.6), 0.42)
    if kind == 'split':
        n = int(0.5 * SR); tt = t_arr(n)
        tear = bq(RNG.standard_normal(n), 'bp', 1100, 0.8) * np.exp(-tt * 14) * np.minimum(1, tt / 0.01)
        thud = np.sin(2 * np.pi * (90 * np.exp(-tt * 10) + 50) * tt) * np.exp(-tt * 10)
        return np.stack([tear * 0.9 + thud, -tear * 0.9 + thud], 1) * 0.8
    if kind == 'shimmer':
        n = int(1.8 * SR); x = np.zeros(n)
        for i, m in enumerate((86, 90, 93, 97, 98)):
            x[int(i * 0.06 * SR):] += bell(m, 1.8, 0.5)[:n - int(i * 0.06 * SR)]
        return convolve(stereo(x), reverb_ir(2.5, 2.2), 0.45)
    raise ValueError(kind)

# ---------------------------------------------------------------- música
CHORDS = {'Bm': (47, [59, 62, 66, 69]), 'G': (43, [59, 62, 67, 71]), 'D': (50, [57, 62, 66, 69]), 'A': (45, [57, 61, 64, 69])}
END_HIT = 13.0  # acorde final sobre el beat 26 (frame 390): coincide con la entrada del CTA
def music(prod, dur):
    md = prod['music_direction']; bpm = md['bpm']; spb = 60 / bpm; bar = 4 * spb
    n = int(dur * SR)
    drums = np.zeros((n, 2)); bass = np.zeros((n, 2)); pads = np.zeros((n, 2)); arp = np.zeros((n, 2)); lead = np.zeros((n, 2))
    sec = lambda s: next((x for x in md['sections'] if x['from_s'] <= s < x['to_s']), md['sections'][-1])
    prog = md['progression']
    nbeats = int(dur / spb) + 1
    for b in range(nbeats):
        s0 = b * spb; name = sec(s0)['name']; inten = sec(s0)['intensity']
        ch = prog[int(s0 // bar) % len(prog)]; root, notes = CHORDS[ch]
        beat_in_bar = b % 4
        # --- batería
        if name == 'hook':
            if beat_in_bar in (0,) or b in (2, 4): place(drums, stereo(kick(0.9)), s0)
            for k in range(2): place(drums, stereo(hat(False, 0.35), 0.3), s0 + k * spb / 2 + spb / 2 * (k == 1) * 0)
        elif name == 'reveal':
            if beat_in_bar == 0: place(drums, stereo(kick(0.7)), s0)
            if beat_in_bar == 2: place(drums, convolve(stereo(snare(0.35)), IR_ROOM, 0.35), s0)
            place(drums, stereo(hat(False, 0.22), 0.35), s0 + spb / 2)
        elif name == 'benefits':
            place(drums, stereo(kick(1.0)), s0)
            if beat_in_bar in (1, 3): place(drums, convolve(stereo(snare(0.55)), IR_ROOM, 0.25), s0)
            for k in range(4): place(drums, stereo(hat(k == 2, 0.3 if k % 2 else 0.18), 0.3 if k % 2 else -0.3), s0 + k * spb / 4)
        elif name == 'statement':
            pass
        elif name == 'cta':
            # v2: dos pulsos suaves hacia el acorde final (13,0 s); después solo resonancia
            if s0 < END_HIT and beat_in_bar in (0, 2): place(drums, stereo(kick(0.45)), s0)
        # --- bajo (corcheas con acento; silencio en statement)
        if name in ('hook', 'benefits', 'cta', 'reveal'):
            for k in range(2):
                if name == 'reveal' and k == 1: continue
                if name == 'cta' and s0 >= END_HIT: continue
                m = root + (12 if (k == 1 and name == 'benefits' and beat_in_bar == 3) else 0)
                place(bass, stereo(bass_note(m, spb / 2 * 0.92, 0.55 * (0.6 + 0.4 * inten), 300 + 500 * inten)), s0 + k * spb / 2)
        # --- arpegio en semicorcheas (filtro que abre con la intensidad)
        if name in ('reveal', 'benefits', 'cta') and s0 < END_HIT:
            pat = [0, 2, 1, 3, 2, 1, 3, 2]
            for k in range(4):
                idx = pat[(b * 4 + k) % len(pat)]
                m = notes[idx] + 12
                place(arp, stereo(pluck(m, 0.3, 0.16 * (0.5 + 0.5 * inten), 0.4 + 0.6 * inten), (-0.45, 0.45)[k % 2]), s0 + k * spb / 4)
    # --- pads por compás
    for i in range(int(dur / bar) + 1):
        s0 = i * bar; root, notes = CHORDS[prog[i % len(prog)]]
        inten = sec(s0)['intensity']
        if s0 >= END_HIT: break
        L = min(bar + 0.4, END_HIT - s0 + 0.25)
        place(pads, stereo(pad_chord(notes, L, 0.22 + 0.12 * inten, 900 + 1800 * inten)), s0)
    # --- acorde final (tónica D mayor con 9ª) y cola de reverb que se apaga en el frame 450
    fin_n = int((dur - END_HIT) * SR); ft = t_arr(fin_n)
    fin_env = np.exp(-ft * 1.6) * np.minimum(1, ft / 0.02)
    chord = np.zeros(fin_n)
    for m in (50, 57, 62, 66, 69, 76):
        for det in (-0.06, 0.0, 0.06):
            chord += signal.sawtooth(2 * np.pi * midi_hz(m) * 2 ** (det / 12) * ft + RNG.uniform(0, 6.28)) * 0.08
    chord = bq(chord, 'lp', 1600, 0.6) * fin_env
    place(pads, stereo(chord, 0.0), END_HIT)
    place(bass, stereo(bass_note(38, 1.6, 0.5, 260) * np.exp(-t_arr(int(1.6 * SR)) * 1.2)), END_HIT)
    place(drums, stereo(kick(0.5)), END_HIT)
    # --- motivo de campana en el revelado y el cierre (melodía)
    mel = [(3.0, 78, 1.0), (3.5, 81, 0.8), (4.0, 83, 1.2), (5.0, 81, 0.8), (5.5, 78, 1.6), (12.5, 74, 0.5), (END_HIT, 78, 0.6), (END_HIT, 86, 0.6)]
    for s, m, d in mel: place(lead, stereo(bell(m, d + 1.2, 0.55), 0.15), s)
    # automatización: filtro de pads/arp cerrado en statement, "tape stop"-ish
    autom = np.ones(n)
    tt = t_arr(n)
    autom *= np.where((tt > 10.4) & (tt < 12.5), 0.55, 1.0)
    bus = drums * 0.9 + bass * 0.9 + convolve(pads, IR_HALL, 0.35) * 0.8 + convolve(arp, IR_HALL, 0.3) * 0.75 + convolve(lead, IR_HALL, 0.45) * 0.7
    bus = bus * autom[:, None]
    # cola: la reverb ya decae; fundido final en coseno de 0,8 s que llega a silencio exactamente en el frame 450
    tail = np.clip((dur - tt) / 0.8, 0, 1); bus = bus * (np.sin(tail * np.pi / 2) ** 2)[:, None]
    # filtro lowpass automatizado en la transición del statement
    lp = bq(bus, 'lp', 900)
    mixw = np.clip((tt - 10.3) / 0.25, 0, 1) * np.clip((12.5 - tt) / 0.2, 0, 1)
    bus = bus * (1 - mixw[:, None]) + lp * mixw[:, None]
    stems = {'drums': drums, 'bass': bass, 'pads': pads, 'arp': arp, 'lead': lead}
    return bus, stems

# ---------------------------------------------------------------- voz (Piper)
def read_wav(p):
    with wave.open(p) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2: x = x.reshape(-1, 2).mean(1)
    return sr, x
def piper_line(text, out, model, length_scale, noise_scale=0.667, noise_w=0.8):
    cmd = [sys.executable, '-m', 'piper', '-m', model, '-f', out, '--length-scale', f'{length_scale:.3f}',
           '--noise-scale', f'{noise_scale:.3f}', '--noise-w', f'{noise_w:.3f}', '--sentence-silence', '0', '--', text]
    subprocess.run(cmd, check=True, capture_output=True)
    sr, x = read_wav(out)
    x = signal.resample_poly(x, SR, sr) if sr != SR else x
    # recorte de silencios con fundido corto (sin clics)
    th = 0.01 * np.abs(x).max(); idx = np.where(np.abs(x) > th)[0]
    x = x[max(0, idx[0] - 480): idx[-1] + 3600]
    f = np.ones(len(x)); k = 480; f[:k] = np.linspace(0, 1, k); f[-2400:] = np.linspace(1, 0, 2400)
    return x * f
def tighten_pauses(x, max_gap=0.07, floor_db=-40):
    """Edición de pausas: Piper inserta silencios de ~0,25-0,35 s antes de 'en'/'es' (p. ej. 'Tu logo... en una medalla').
    Recorta cada silencio interno más largo que max_gap dejándolo en max_gap, con fundidos cruzados de 10 ms (sin clics)."""
    hop = int(0.005 * SR); win = int(0.02 * SR)
    fr = np.lib.stride_tricks.sliding_window_view(x, win)[::hop]
    e = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9); on = e > e.max() + floor_db
    idx = np.where(on)[0]
    if len(idx) < 2: return x, []
    segs = []; st = None
    for i in range(idx[0], idx[-1] + 1):
        if not on[i] and st is None: st = i
        if on[i] and st is not None:
            if (i - st) * hop / SR > max_gap: segs.append((st * hop + win // 2, i * hop + win // 2))
            st = None
    if not segs: return x, []
    out = []; prev = 0; xf = int(0.01 * SR); keep = int(max_gap * SR); cuts = []
    for a, b in segs:
        a2 = a + keep // 2; b2 = b - keep // 2
        if b2 - a2 <= 2 * xf: continue
        out.append(x[prev:a2]); prev = b2; cuts.append(round((b2 - a2) / SR, 3))
    out.append(x[prev:])
    y = out[0]
    for seg in out[1:]:
        r = np.linspace(1, 0, xf); y = np.concatenate([y[:-xf], y[-xf:] * r + seg[:xf] * (1 - r), seg[xf:]])
    return y, cuts
def take_metrics(x):
    """Métricas objetivas de una toma (no reemplazan la escucha humana):
    pausa interna más larga (huecos de energía dentro de la frase) y variación de F0 (entonación)."""
    hop = int(0.01 * SR); fr = np.lib.stride_tricks.sliding_window_view(x, int(0.03 * SR))[::hop]
    e = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9); on = e > e.max() - 35
    idx = np.where(on)[0]; gap = 0; run_ = 0
    for v in on[idx[0]:idx[-1] + 1]:
        run_ = 0 if v else run_ + 1; gap = max(gap, run_)
    f0 = []
    for w in fr[on][::2]:
        w = w - w.mean(); ac = np.correlate(w, w, 'full')[len(w) - 1:]
        lo, hi = int(SR / 320), int(SR / 75)
        if ac[0] <= 0: continue
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] / ac[0] > 0.45: f0.append(SR / k)
    f0 = np.array(f0)
    semis = float(np.std(12 * np.log2(f0 / np.median(f0)))) if len(f0) > 5 else 0.0
    return {'max_internal_pause_s': round(gap * 0.01, 3), 'f0_std_semitones': round(semis, 2), 'f0_median_hz': round(float(np.median(f0)), 1) if len(f0) else None}
def voice_chain(x):
    # HPF, des-embarre, presencia suave, de-esser dinámico, aire, compresión en 2 etapas, saturación muy leve, sala corta
    x = bq(x, 'hp', 85); x = bq(x, 'ls', 160, 0.7, 1.5); x = bq(x, 'peak', 320, 1.0, -3.0); x = bq(x, 'peak', 2400, 0.8, 1.5)
    x = bq(x, 'peak', 4200, 1.2, -1.5)  # aspereza metálica típica de vocoder
    s_band = bq(x, 'bp', 6500, 1.5); s_env = signal.lfilter([0.01], [1, -0.99], np.abs(s_band))
    ds = np.clip(1 - np.maximum(0, s_env - 0.02) * 6, 0.6, 1); x = x - s_band * (1 - ds)
    x = bq(x, 'hs', 10000, 0.7, 1.5)
    x = compress(x, -24, 2.5, 0.008, 0.12, 2); x = compress(x, -14, 4, 0.002, 0.05, 2)
    x = np.tanh(x * 1.2) / np.tanh(1.2)
    return x / (np.abs(x).max() + 1e-9) * 0.7
TAKES = [{'take': 'A', 'length_scale': 1.0, 'noise_scale': 0.667, 'noise_w': 0.8},
         {'take': 'B', 'length_scale': 1.05, 'noise_scale': 0.75, 'noise_w': 0.95},
         {'take': 'C', 'length_scale': 0.97, 'noise_scale': 0.58, 'noise_w': 0.7}]
def voice(prod, dur, build):
    vd = prod['voice_direction']; n = int(dur * SR); bus = np.zeros((n, 2)); rep = []
    if not vd.get('enabled', True) or not vd.get('lines'):
        return bus, [{'note': 'variante sin voz (voice_direction.enabled=false)'}]
    model = os.path.join(ROOT, 'voices', vd['model'] + '.onnx')
    if not os.path.exists(model):
        return bus, [{'error': 'modelo Piper no encontrado; video sin voz'}]
    tk_dir = os.path.join(build, 'voice-takes'); os.makedirs(tk_dir, exist_ok=True)
    takes = vd.get('takes', TAKES)
    for ln in vd['lines']:
        cands = []
        for tk in takes:
            ls = tk['length_scale']
            for _ in range(4):
                x = piper_line(ln['text'], os.path.join(tk_dir, f"{ln['id']}-{tk['take']}.wav"), model, ls, tk['noise_scale'], tk['noise_w'])
                x, cuts = tighten_pauses(x, ln.get('max_pause_s', 0.07))
                d = len(x) / SR
                if d <= ln['max_s'] or ls <= 0.9: break
                ls = max(0.9, ls * ln['max_s'] / d * 0.98)
            m = take_metrics(x)
            # puntaje: castiga pausas internas > 0,12 s y exceso de duración; premia entonación (hasta 5 st)
            score = min(m['f0_std_semitones'], 5.0) - 8 * max(0, m['max_internal_pause_s'] - 0.12) - 4 * max(0, d - ln['max_s'])
            cands.append({'take': tk['take'], 'x': x, 'pause_cuts_s': cuts, 'length_scale': round(ls, 3), 'noise_scale': tk['noise_scale'], 'noise_w': tk['noise_w'],
                          'dur_s': round(d, 3), 'score': round(score, 3), **m})
            pc = (voice_chain(x) * 32767).astype(np.int16)
            with wave.open(os.path.join(tk_dir, f"{ln['id']}-{tk['take']}-proc.wav"), 'wb') as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pc.tobytes())
        forced = vd.get('pick', {}).get(ln['id'])
        best = next((c for c in cands if c['take'] == forced), None) or max(cands, key=lambda c: c['score'])
        x = voice_chain(best['x'])
        st = convolve(stereo(x), IR_ROOM, 0.10)
        place(bus, st, ln['start_s'])
        rep.append({'id': ln['id'], 'text': ln['text'], 'start_s': ln['start_s'], 'dur_s': round(len(x) / SR, 3),
                    'end_s': round(ln['start_s'] + len(x) / SR, 3), 'max_s': ln['max_s'], 'chosen_take': best['take'],
                    'takes': [{k: v for k, v in c.items() if k != 'x'} for c in cands]})
    return bus, rep

# ---------------------------------------------------------------- master
def true_peak_db(x):
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.abs(up).max() + 1e-12)
def limiter(x, ceiling_db=-1.0, look=0.005, rel=0.08):
    c = db(ceiling_db)
    up = np.abs(signal.resample_poly(x, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:len(x)]  # pico intermuestra
    up = np.pad(up, (0, len(x) - len(up)), mode='edge') if len(up) < len(x) else up
    g = np.minimum(1, c / np.maximum(up, 1e-9))
    L = int(look * SR)
    g = -signal.lfilter([1], [1], -np.minimum.accumulate(np.lib.stride_tricks.sliding_window_view(np.pad(g, (0, L), constant_values=1), L + 1).min(1)[None])[0]) if False else \
        np.lib.stride_tricks.sliding_window_view(np.pad(g, (0, L), constant_values=1), L + 1).min(1)
    a = np.exp(-1 / (rel * SR)); sm = np.empty_like(g); prev = 1.0
    for i in range(len(g)):
        prev = g[i] if g[i] < prev else a * prev + (1 - a) * g[i]; sm[i] = prev
    xd = np.pad(x, ((L, 0), (0, 0)))[:len(x)]
    gd = np.pad(sm, (L, 0), constant_values=1)[:len(x)]
    return xd * sm[:, None]
def lufs(x):
    import pyloudnorm as pyln
    return pyln.Meter(SR).integrated_loudness(x)

IR_ROOM = None; IR_HALL = None
def main(prod_path):
    global IR_ROOM, IR_HALL
    prod = json.load(open(prod_path)); pid = prod['id']
    build = os.path.join(ROOT, 'build', pid); os.makedirs(build, exist_ok=True)
    fps = prod['format']['fps']; dur = prod['format']['durationInFrames'] / fps
    IR_ROOM = reverb_ir(0.6, 9.0, 0.004); IR_HALL = reverb_ir(2.4, 2.6, 0.02)
    n = int(dur * SR)
    mus, stems = music(prod, dur)
    vox, vrep = voice(prod, dur, build)
    fx = np.zeros((n, 2)); frep = []
    for ev in prod['beats']['events']:
        k = ev['type']; s = ev['f'] / fps
        x = sfx(k, ev.get('len_f', 15) / fps) if k != 'riser' else sfx(k, ev['len_f'] / fps)
        start = s - (ev['len_f'] / fps if k == 'riser' else (0.25 if k.startswith('whoosh') else 0.0))  # whoosh centrado en el evento
        if k == 'riser': start = s  # el riser EMPIEZA en f y termina en f+len_f (la acción)
        place(fx, x, start, ev.get('gain', 1.0)); frep.append({'f': ev['f'], 't_s': round(s, 3), 'type': k, 'placed_at_s': round(start, 3)})
    # ---- mezcla: EQ por bus + ducking de la música bajo la voz (sidechain)
    mus = bq(mus, 'hp', 30); mus = bq(mus, 'peak', 2800, 0.8, -2.5)  # hueco para la voz
    vkey = np.abs(vox).max(1); vkey = signal.lfilter([1 - np.exp(-1 / (0.03 * SR))], [1, -np.exp(-1 / (0.03 * SR))], vkey)
    duck = db(-7 * np.clip(vkey / 0.05, 0, 1))
    a = np.exp(-1 / (0.15 * SR)); duck = signal.lfilter([1 - a], [1, -a], duck)
    mus = mus * duck[:, None]
    fx = bq(fx, 'hp', 40); fx = bq(fx, 'lp', 9000); fx = bq(fx, 'peak', 3500, 1.0, -3.0)
    sfx_gain = prod.get('mix', {}).get('sfx_db', -8.0); mus_gain = prod.get('mix', {}).get('music_db', -3.0)
    mix = mus * db(mus_gain) + fx * db(sfx_gain) + vox * db(0)
    # ---- master: EQ suave, compresión de glue, normalización a -14 LUFS, limitador -1 dBTP (iterativo)
    m = bq(mix, 'ls', 90, 0.7, 1.0); m = bq(m, 'hs', 10000, 0.7, 1.0)
    m = compress(m, -16, 2.0, 0.01, 0.2, 0)
    target = -14.0
    for it in range(4):
        L = lufs(m); m = m * db(target - L)
        m = limiter(m, -2.0)  # margen para el overshoot del códec AAC
        if abs(lufs(m) - target) < 0.3: break
    tt_m = t_arr(len(m)); m = m * (np.sin(np.clip((len(m) / SR - tt_m) / 0.25, 0, 1) * np.pi / 2) ** 2)[:, None]
    m = np.clip(m, -1, 1)
    out = os.path.join(build, 'mix.wav')
    pcm = (m * 32767).astype(np.int16)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    for k, st in (('music', mus), ('voice', vox), ('sfx', fx)):
        with wave.open(os.path.join(build, f'stem-{k}.wav'), 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    rep = {'mix': out, 'sr': SR, 'duration_s': round(len(m) / SR, 3), 'lufs_internal': round(lufs(m), 2), 'true_peak_dbtp_internal': round(true_peak_db(m), 2),
           'bpm': prod['music_direction']['bpm'], 'voice': vrep, 'sfx': frep, 'voice_engine': 'Piper (piper-tts) es_MX-claude-high, local CPU'}
    json.dump(rep, open(os.path.join(build, 'audio-report.json'), 'w'), indent=1, ensure_ascii=False)
    print(json.dumps({k: rep[k] for k in ('mix', 'lufs_internal', 'true_peak_dbtp_internal')}))
    print(json.dumps(vrep, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1])
