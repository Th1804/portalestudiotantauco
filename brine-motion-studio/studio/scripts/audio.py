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
def pad_chord(notes, dur, gain=1.0, bright=1800, att=0.35, rel=0.5):
    n = int(dur * SR); tt = t_arr(n); x = np.zeros(n)
    for m in notes:
        for det in (-0.09, 0.0, 0.08):
            f = midi_hz(m) * 2 ** (det / 12)
            x += signal.sawtooth(2 * np.pi * f * tt + RNG.uniform(0, 6.28)) * 0.15
    x = bq(x, 'lp', bright, 0.6)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.25 * tt)
    return x * env_adsr(n, att, min(0.3, dur / 4), 0.85, min(rel, dur / 3)) * trem * gain
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
def fm_glass(m, dur=1.4, gain=1.0, ratio=3.5, index=2.2):
    """Mazo de cristal FM: portadora en la nota, moduladora inarmónica con índice que cae rápido (ataque brillante, cola pura)."""
    n = int(dur * SR); tt = t_arr(n); f = midi_hz(m)
    idx = index * np.exp(-tt * 9)
    x = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * f * ratio * tt)) * np.exp(-tt * 3.2)
    x += 0.22 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 6)
    return x * np.minimum(1, tt / 0.002) * gain * 0.5
def felt_keys(notes, dur, gain=1.0, bright=2400):
    """Teclado de fieltro: armónicos 1/n^2 con decaimiento por armónico, ataque blando de 8 ms y leve desafinación."""
    n = int(dur * SR); tt = t_arr(n); x = np.zeros(n)
    for m in notes:
        f = midi_hz(m)
        for h in range(1, 7):
            for det in (-0.04, 0.04):
                x += np.sin(2 * np.pi * f * h * 2 ** (det / 12) * tt + RNG.uniform(0, 6.28)) * np.exp(-tt * (1.1 + 0.9 * h)) / h ** 2
    x = bq(x, 'lp', bright, 0.6) * np.minimum(1, tt / 0.008) * np.minimum(1, np.maximum(0, dur - tt) / 0.08)
    return x * gain * 0.18
def snap(gain=1.0):
    n = int(0.18 * SR); tt = t_arr(n)
    x = bq(RNG.standard_normal(n), 'bp', 1900, 1.6) * np.exp(-tt * 55) + bq(RNG.standard_normal(n), 'hp', 5000) * np.exp(-tt * 120) * 0.4
    return x * gain * 0.6
def shaker(gain=1.0):
    n = int(0.09 * SR); tt = t_arr(n)
    e = np.minimum(1, tt / 0.012) * np.exp(-tt * 45)
    return bq(RNG.standard_normal(n), 'hp', 6200) * e * gain * 0.35

# ---------------------------------------------------------------- SFX
# Paleta "premium suave": sin ruido blanco crudo ni resonancias; ataques redondeados (>= 4 ms), agudos atenuados
# y cada SFX normalizado a un pico fijo, para que la ganancia del JSON sea el nivel real.
SFX_PEAK = {'whoosh': 0.42, 'whoosh_soft': 0.3, 'whoosh_big': 0.5, 'impact': 0.55, 'subboom': 0.6, 'riser': 0.32,
            'pop': 0.32, 'tick': 0.18, 'ping': 0.28, 'shimmer': 0.28, 'split': 0.4,
            'glass_ting': 0.3, 'prism': 0.26, 'sparkle': 0.2, 'laser': 0.16, 'laser_on': 0.2, 'case_thud': 0.45, 'swish': 0.3,
            'leather_thump': 0.5, 'air_sweep': 0.26, 'glass_panel': 0.22}
def pink(n):
    return signal.lfilter([0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400], RNG.standard_normal(n))
def polish(x, attack=0.004):
    if x.ndim == 1: x = stereo(x)
    n = len(x); ramp = np.minimum(1, t_arr(n) / attack)
    x = x * ramp[:, None]
    x = bq(x, 'hs', 5500, 0.7, -4.0); x = bq(x, 'hp', 35)
    return x
def sfx(kind, len_s=0.6):
    x = _sfx(kind, len_s)
    x = polish(x, 0.012 if kind in ('ping', 'shimmer') else 0.004)
    return x / (np.abs(x).max() + 1e-9) * SFX_PEAK.get(kind, 0.3)
def _sfx(kind, len_s):
    if kind in ('whoosh', 'whoosh_soft', 'whoosh_big'):
        L = {'whoosh': 0.6, 'whoosh_soft': 0.95, 'whoosh_big': 1.0}[kind]; n = int(L * SR); tt = t_arr(n); u = np.clip(tt / L, 0, 1)
        peak_at = 0.62
        e = np.where(u < peak_at, np.sin(np.pi / 2 * u / peak_at) ** 2, np.clip(np.cos(np.pi / 2 * (u - peak_at) / (1 - peak_at)), 0, 1) ** 1.5)
        top = {'whoosh': 2400, 'whoosh_soft': 1500, 'whoosh_big': 2000}[kind]
        fc = 280 + (top - 280) * e ** 1.4
        chans = []
        for ch in range(2):
            x = svf_sweep(pink(n) * 6, fc * (1.0 + 0.06 * ch), 0.6, 'lp')
            chans.append(bq(x, 'hp', 120) * e)
        pan = np.stack([1 - 0.55 * u, 0.45 + 0.55 * u], 1)
        st = np.stack(chans, 1) * pan
        if kind == 'whoosh_big':
            body = np.sin(2 * np.pi * np.cumsum(52 + 30 * e) / SR) * e ** 2
            st += stereo(body * 0.5)
        return convolve(st, reverb_ir(1.2, 4.5), 0.22)
    if kind == 'impact':
        n = int(1.5 * SR); tt = t_arr(n)
        sub = np.sin(2 * np.pi * np.cumsum(40 + 48 * np.exp(-tt * 18)) / SR) * np.exp(-tt * 3.2)
        body = bq(pink(n) * 4, 'lp', 700) * np.exp(-tt * 22)
        x = np.tanh((sub + body * 0.4) * 1.1)
        return convolve(stereo(x), reverb_ir(1.8, 3.4), 0.28)
    if kind == 'subboom':
        n = int(2.0 * SR); tt = t_arr(n)
        x = np.sin(2 * np.pi * np.cumsum(36 + 22 * np.exp(-tt * 5)) / SR) * np.exp(-tt * 1.6)
        x += bq(pink(n) * 3, 'lp', 500) * np.exp(-tt * 10) * 0.25
        return convolve(stereo(np.tanh(x * 1.2)), reverb_ir(2.2, 2.6), 0.3)
    if kind == 'riser':
        L = len_s; n = int(L * SR); tt = t_arr(n); u = tt / L
        x = svf_sweep(pink(n) * 6, 300 * (8 ** u), 0.7, 'lp')
        x += np.sin(2 * np.pi * np.cumsum(220 * (2 ** u)) / SR) * 0.08
        return convolve(stereo(bq(x, 'hp', 150) * u ** 2.0), reverb_ir(1.0, 5), 0.2)
    if kind == 'pop':
        n = int(0.22 * SR); tt = t_arr(n)
        x = np.sin(2 * np.pi * np.cumsum(330 + 260 * np.exp(-tt * 45)) / SR) * np.exp(-tt * 24)
        x += 0.18 * np.sin(2 * np.pi * np.cumsum(2 * (330 + 260 * np.exp(-tt * 45))) / SR) * np.exp(-tt * 40)
        return convolve(stereo(bq(x, 'lp', 1800), RNG.uniform(-0.25, 0.25)), reverb_ir(0.8, 6), 0.18)
    if kind == 'tick':
        n = int(0.09 * SR); tt = t_arr(n)
        x = np.sin(2 * np.pi * 1650 * tt) * np.exp(-tt * 60) + bq(pink(n), 'bp', 1600, 1.2) * np.exp(-tt * 80) * 0.5
        return stereo(x, 0.15)
    if kind == 'ping':
        n = int(2.4 * SR); tt = t_arr(n); f0 = 1174.7
        x = sum(a * np.sin(2 * np.pi * f0 * r * tt + RNG.uniform(0, 6)) * np.exp(-tt * d)
                for r, a, d in ((0.5, 0.4, 2.0), (1, 1, 2.4), (2.32, 0.18, 4.2), (4.25, 0.05, 7)))
        return convolve(stereo(bq(x, 'lp', 4500)), reverb_ir(2.2, 2.6), 0.45)
    if kind == 'split':
        n = int(0.5 * SR); tt = t_arr(n)
        tear = bq(pink(n) * 4, 'lp', 1100) * np.exp(-tt * 14)
        thud = np.sin(2 * np.pi * (90 * np.exp(-tt * 10) + 50) * tt) * np.exp(-tt * 10)
        return np.stack([tear * 0.9 + thud, -tear * 0.9 + thud], 1)
    if kind == 'shimmer':
        n = int(1.8 * SR); x = np.zeros(n)
        for i, m in enumerate((86, 90, 93, 97, 98)):
            x[int(i * 0.06 * SR):] += bell(m, 1.8, 0.5)[:n - int(i * 0.06 * SR)]
        return convolve(stereo(bq(x, 'lp', 6000)), reverb_ir(2.5, 2.2), 0.5)
    # ---- BMS-20261012-001 (cristal): golpes de cristal, láser y estuche
    if kind == 'glass_ting':
        # copa/cristal tallado: parciales inarmónicos de una placa de vidrio sobre F6, ataque redondo, cola larga
        n = int(2.6 * SR); tt = t_arr(n); f0 = midi_hz(89)
        x = sum(a * np.sin(2 * np.pi * f0 * r * tt + RNG.uniform(0, 6)) * np.exp(-tt * d)
                for r, a, d in ((1, 1, 1.6), (2.405, 0.32, 2.8), (3.9, 0.12, 4.5), (5.33, 0.06, 7)))
        x *= 1 + 0.04 * np.sin(2 * np.pi * 5.5 * tt)
        return convolve(stereo(bq(x, 'lp', 7000)), reverb_ir(2.4, 2.4), 0.4)
    if kind == 'prism':
        # barrido ascendente de 6 notas de cristal (pentatónica de F) en 70 ms: la luz que se separa
        n = int(1.6 * SR); x = np.zeros(n)
        for i, m in enumerate((77, 79, 81, 84, 86, 89)):
            st_ = int(i * 0.07 * SR); x[st_:] += fm_glass(m, 1.6, 0.3 + 0.08 * i)[:n - st_]
        return convolve(stereo(bq(x, 'lp', 6500)), reverb_ir(1.8, 2.8), 0.42)
    if kind == 'sparkle':
        n = int(0.9 * SR); tt = t_arr(n)
        x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in ((3520, 7), (4186, 9), (5274, 12))) / 3
        return convolve(stereo(x, RNG.uniform(-0.5, 0.5)), reverb_ir(1.2, 4), 0.45)
    if kind == 'laser':
        # cabezal láser: zumbido fino modulado (no agresivo) + chisporroteo de grabado, con ataque y cola cortos
        L = len_s; n = int(L * SR); tt = t_arr(n)
        buzz = np.sin(2 * np.pi * np.cumsum(1880 + 40 * np.sin(2 * np.pi * 7 * tt)) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 60 * tt))
        grains = signal.lfilter([1], [1, -0.996], (RNG.random(n) < 0.004).astype(float))
        crackle = bq(pink(n) * 5, 'bp', 3400, 1.1) * np.clip(grains, 0, 1)
        x = bq(buzz * 0.35 + crackle * 0.5, 'lp', 5200)
        env = np.minimum(1, tt / 0.02) * np.minimum(1, (L - tt) / 0.05)
        return stereo(x * env, 0.1)
    if kind == 'laser_on':
        n = int(0.25 * SR); tt = t_arr(n)
        x = np.sin(2 * np.pi * np.cumsum(900 + 1400 * (1 - np.exp(-tt * 40))) / SR) * np.exp(-tt * 18)
        return convolve(stereo(x), reverb_ir(0.6, 8), 0.2)
    if kind == 'case_thud':
        # estuche que asienta: golpe de fieltro grave + roce de tela
        n = int(0.9 * SR); tt = t_arr(n)
        body = np.sin(2 * np.pi * np.cumsum(72 + 50 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 14)
        cloth = svf_sweep(pink(n) * 3, 900 + 1800 * np.exp(-tt * 6), 0.7, 'lp') * np.exp(-tt * 9)
        return convolve(stereo(np.tanh(body * 1.4) + cloth * 0.4), reverb_ir(0.8, 7), 0.15)
    if kind == 'swish':
        n = int(0.4 * SR); tt = t_arr(n); u = tt / 0.4
        e = np.sin(np.pi * u) ** 2
        x = svf_sweep(pink(n) * 5, 600 + 2400 * e, 0.7, 'lp') * e
        return np.stack([x * (1 - 0.5 * u), x * (0.5 + 0.5 * u)], 1)
    # ---- BMS-20261109-001 (balón de cuero): golpe de cuero, aire de luz y vidrio de panel
    if kind == 'leather_thump':
        # balón de cuero que asienta: cuerpo grave con caída de tono, palmada de cuero amortiguada y aire de la cámara de butilo
        n = int(0.9 * SR); tt = t_arr(n)
        body = np.sin(2 * np.pi * np.cumsum(62 + 58 * np.exp(-tt * 34)) / SR) * np.exp(-tt * 11)
        slap = bq(bq(pink(n) * 5, 'bp', 820, 0.9), 'lp', 2200) * np.exp(-tt * 48) * np.minimum(1, tt / 0.003)
        air = bq(pink(n) * 2, 'bp', 300, 0.7) * np.exp(-tt * 20)
        x = np.tanh((body * 1.1 + slap * 0.55 + air * 0.25) * 1.2)
        return convolve(stereo(x), reverb_ir(0.9, 6.5), 0.16)
    if kind == 'air_sweep':
        # la luz que recorre el cuero: aire filtrado que sube y baja con un brillo cálido de tres parciales
        L = 1.3; n = int(L * SR); tt = t_arr(n); u = tt / L
        e = np.sin(np.pi * u) ** 2
        chans = []
        for ch in range(2):
            chans.append(bq(svf_sweep(pink(n) * 4, 1800 + 3400 * e * (1 + 0.08 * ch), 0.9, 'bp'), 'hp', 900) * e)
        st = np.stack(chans, 1) * np.stack([1 - 0.4 * u, 0.6 + 0.4 * u], 1)
        glow = sum(a * np.sin(2 * np.pi * midi_hz(m) * tt) for m, a in ((82, 0.5), (86, 0.35), (89, 0.25))) * e ** 1.5 * 0.12
        return convolve(st + stereo(glow), reverb_ir(1.8, 3.0), 0.4)
    if kind == 'glass_panel':
        # panel de vidrio que aparece: toque de vidrio suave (pocos parciales, ataque redondo) con un roce de aire
        n = int(1.4 * SR); tt = t_arr(n); f0 = midi_hz(93)
        x = sum(a * np.sin(2 * np.pi * f0 * r * tt + RNG.uniform(0, 6)) * np.exp(-tt * d) for r, a, d in ((1, 1, 4.5), (2.41, 0.22, 8), (3.9, 0.07, 12)))
        x = x * np.minimum(1, tt / 0.006) + bq(pink(n), 'bp', 5000, 1.2) * np.exp(-tt * 40) * 0.15
        return convolve(stereo(bq(x, 'lp', 6500), RNG.uniform(-0.3, 0.3)), reverb_ir(1.6, 3.4), 0.42)
    raise ValueError(kind)

# ---------------------------------------------------------------- música
CHORDS = {'Bm': (47, [59, 62, 66, 69]), 'G': (43, [59, 62, 67, 71]), 'D': (50, [57, 62, 66, 69]), 'A': (45, [57, 61, 64, 69])}
END_HIT = 13.0  # golpe final sobre el beat 26 (frame 390): la luz revela el logo (CTA.LOGO_HIT)
BUILD_S, DOM_SUS_TO, STOP_S = 12.0, 12.375, 12.75  # dominante (sus4 -> 7) y stop de un beat antes del golpe
DOM7SUS4 = (45, [57, 62, 64, 67])  # A D E G
DOM7 = (45, [57, 61, 64, 67])      # A C# E G
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
        elif name == 'build':
            place(drums, stereo(kick(0.4 + 0.15 * (s0 > BUILD_S))), s0)
        if name == 'build': root, notes = DOM7
        # --- bajo (corcheas con acento; silencio en statement; en build solo hasta el stop)
        if name in ('hook', 'benefits', 'reveal', 'build'):
            for k in range(2):
                if name == 'reveal' and k == 1: continue
                if name == 'build' and s0 + k * spb / 2 >= STOP_S: continue
                m = root + (12 if (k == 1 and name == 'benefits' and beat_in_bar == 3) else 0)
                place(bass, stereo(bass_note(m, spb / 2 * 0.92, 0.55 * (0.6 + 0.4 * inten) * (0.7 if name == 'build' else 1), 300 + 500 * inten)), s0 + k * spb / 2)
        # --- arpegio en semicorcheas (filtro que abre con la intensidad)
        if name in ('reveal', 'benefits', 'build') and s0 < STOP_S:
            pat = [0, 2, 1, 3, 2, 1, 3, 2]
            for k in range(4):
                if s0 + k * spb / 4 >= STOP_S: continue
                idx = pat[(b * 4 + k) % len(pat)]
                m = notes[idx] + 12
                place(arp, stereo(pluck(m, 0.3, 0.16 * (0.5 + 0.5 * inten), 0.4 + 0.6 * inten), (-0.45, 0.45)[k % 2]), s0 + k * spb / 4)
    # --- pads por compás
    for i in range(int(dur / bar) + 1):
        s0 = i * bar; root, notes = CHORDS[prog[i % len(prog)]]
        inten = sec(s0)['intensity']
        if s0 >= BUILD_S: break
        L = min(bar + 0.4, BUILD_S - s0 + 0.25)
        place(pads, stereo(pad_chord(notes, L, 0.22 + 0.12 * inten, 900 + 1800 * inten)), s0)
    # --- v3: cadencia V7 -> I. Dominante A7sus4 (12,0-12,375) que resuelve a A7 (12,375-12,75) con brillo creciente,
    # redoble de caja en semicorcheas en crescendo, STOP de un beat (12,75-13,0) y golpe tutti en la tónica en 13,0 s
    sus_n = int((DOM_SUS_TO - BUILD_S) * SR)
    place(pads, stereo(pad_chord(DOM7SUS4[1], DOM_SUS_TO - BUILD_S + 0.05, 0.28, 1700, 0.02, 0.05)[:sus_n + 2400] * np.r_[np.ones(sus_n), np.linspace(1, 0, 2400)]), BUILD_S)
    d7 = pad_chord(DOM7[1], STOP_S - DOM_SUS_TO + 0.06, 0.34, 2600, 0.01, 0.05)
    place(pads, stereo(d7 * np.minimum(1, t_arr(len(d7)) / 0.01)), DOM_SUS_TO)
    for j, s in enumerate(np.arange(12.25, STOP_S - 1e-6, spb / 4)):
        g = 0.1 + 0.36 * (j / 7) ** 1.4
        place(drums, convolve(stereo(snare(g), (-0.2, 0.2)[j % 2]), IR_ROOM, 0.3), s)
    # golpe final: tónica D (add9) en todo el registro + kick + caja + platillo, cola natural (sin fundido largo)
    fin_n = int((dur - END_HIT) * SR); ft = t_arr(fin_n)
    fin_env = np.exp(-ft * 0.8) * np.minimum(1, ft / 0.006)
    chord = np.zeros(fin_n)
    for m in (38, 50, 57, 62, 66, 69, 76):
        for det in (-0.06, 0.0, 0.06):
            chord += signal.sawtooth(2 * np.pi * midi_hz(m) * 2 ** (det / 12) * ft + RNG.uniform(0, 6.28)) * 0.08
    chord = svf_sweep(chord, 900 + 3600 * np.exp(-ft * 2.2), 0.7) * fin_env
    place(pads, stereo(chord, 0.0), END_HIT, 1.25)
    for m, g in ((62, 0.5), (66, 0.42), (69, 0.42), (74, 0.38)):
        place(arp, stereo(pluck(m, 1.6, g, 1.0) , (m - 68) / 14), END_HIT)
    place(bass, stereo(bass_note(38, 2.0, 0.75, 320) * np.exp(-t_arr(int(2.0 * SR)) * 0.9)), END_HIT)
    place(drums, stereo(kick(1.1)), END_HIT)
    place(drums, convolve(stereo(snare(0.6)), IR_HALL, 0.35), END_HIT)
    cn = int(2.0 * SR); ct = t_arr(cn)
    crash = bq(bq(RNG.standard_normal(cn), 'hp', 4200), 'peak', 7800, 1.0, 3) * np.exp(-ct * 2.1) * np.minimum(1, ct / 0.002)
    place(drums, convolve(np.stack([crash, np.roll(crash, 240)], 1) * 0.22, IR_HALL, 0.3), END_HIT)
    # --- motivo de campana: en el cierre la sensible C#6 (sobre A7) resuelve a D6/F#6 en el golpe
    mel = [(3.0, 78, 1.0), (3.5, 81, 0.8), (4.0, 83, 1.2), (5.0, 81, 0.8), (5.5, 78, 1.6),
           (12.0, 81, 0.35), (12.5, 85, 0.25), (END_HIT, 86, 1.0), (END_HIT, 90, 1.0)]
    for s, m, d in mel: place(lead, stereo(bell(m, d + 1.2, 0.55 if s < 12 else 0.7), 0.15), s)
    # automatización: nivel reducido en el statement
    autom = np.ones(n)
    tt = t_arr(n)
    autom *= np.where((tt > 10.4) & (tt < BUILD_S), 0.55, 1.0)
    bus = drums * 0.9 + bass * 0.9 + convolve(pads, IR_HALL, 0.35) * 0.8 + convolve(arp, IR_HALL, 0.3) * 0.75 + convolve(lead, IR_HALL, 0.45) * 0.7
    bus = bus * autom[:, None]
    # el acorde final suena hasta el último frame; solo un fundido de seguridad de 0,25 s para que no haya clic
    tail = np.clip((dur - tt) / 0.25, 0, 1); bus = bus * (np.sin(tail * np.pi / 2) ** 2)[:, None]
    # filtro lowpass automatizado en el statement; se abre en la dominante
    lp = bq(bus, 'lp', 900)
    mixw = np.clip((tt - 10.3) / 0.25, 0, 1) * np.clip((BUILD_S - tt) / 0.15, 0, 1)
    bus = bus * (1 - mixw[:, None]) + lp * mixw[:, None]
    stems = {'drums': drums, 'bass': bass, 'pads': pads, 'arp': arp, 'lead': lead}
    return bus, stems

# ---------------------------------------------------------------- música "cristal" (BMS-20261012-001)
# 100 BPM (beat = 18 frames). Gancho como pregunta en D menor (Dm-B♭-C en los beats 0/1/2 = f0/f18/f36), respuesta en F mayor
# en f72 (llega el cristal). F - C/E - Dm - B♭ por compás; Csus4 con redoble de chasquidos y stop; golpe en F(add9) en f360 (logo).
CR_CHORDS = {'F': (41, [57, 60, 65, 67]), 'C/E': (40, [55, 60, 64, 67]), 'Dm': (38, [57, 62, 65, 69]), 'Bb': (34, [58, 62, 65, 69]),
             'C': (36, [55, 60, 64, 67]), 'Csus4': (36, [55, 60, 65, 67]), 'Fadd9': (29, [53, 57, 60, 65, 67, 72])}
def music_crystal(prod, dur):
    md = prod['music_direction']; bpm = md['bpm']; spb = 60 / bpm; bar = 4 * spb
    n = int(dur * SR); tt = t_arr(n)
    drums = np.zeros((n, 2)); bass = np.zeros((n, 2)); keys = np.zeros((n, 2)); glass = np.zeros((n, 2)); air = np.zeros((n, 2))
    sec = lambda s_: next((x for x in md['sections'] if x['from_s'] <= s_ < x['to_s']), md['sections'][-1])
    ANSWER, BUILD, STOP, HIT = 4 * spb, 11.4, 11.85, 12.0
    # --- gancho: tres acordes-pregunta y un sus que queda abierto, con sub y cristal arriba
    for k, ch in enumerate(('Dm', 'Bb', 'C')):
        root, notes = CR_CHORDS[ch]; s0 = k * spb
        place(keys, stereo(felt_keys(notes, spb * 1.05, 1.0, 2600)), s0)
        place(bass, stereo(bass_note(root + 12, spb * 0.95, 0.5, 260)), s0)
        place(glass, stereo(fm_glass(notes[-1] + 12, 1.4, 0.55), 0.25 * (k - 1)), s0)
        place(drums, stereo(kick(0.45)), s0)
    place(air, stereo(pad_chord(CR_CHORDS['Csus4'][1], spb * 1.4, 0.16, 1400, 0.25, 0.3)), 3 * spb)
    # --- progresión desde la respuesta (f72)
    prog = ['F', 'C/E', 'Dm', 'Bb']
    t0 = ANSWER; i = 0
    while t0 < BUILD - 1e-6:
        ch = prog[i % 4]; root, notes = CR_CHORDS[ch]; L = min(bar, BUILD - t0)
        inten = sec(t0)['intensity']
        place(air, stereo(pad_chord(notes, L + 0.3, 0.14 + 0.08 * inten, 1100 + 900 * inten, 0.3, 0.4)), t0)
        place(bass, stereo(bass_note(root + 12, L * 0.98, 0.42 + 0.15 * inten, 240 + 200 * inten) * np.exp(-t_arr(int(L * 0.98 * SR)) * 0.5)), t0)
        for b_ in range(int(round(L / spb))):
            sb = t0 + b_ * spb; name = sec(sb)['name']
            # teclado: acorde en el 1, empuje a contratiempo en case
            if b_ == 0: place(keys, stereo(felt_keys(notes, spb * 1.6, 0.8)), sb)
            if name == 'case' and b_ in (1, 3): place(keys, stereo(felt_keys(notes[1:], spb * 0.45, 0.45, 3000)), sb + spb / 2)
            # arpegio de cristal: corcheas en crystal, semicorcheas filtradas en laser/case
            sub = 2 if name == 'crystal' else 4
            pat = [0, 2, 3, 1, 2, 3, 1, 3]
            for k in range(sub):
                m = notes[pat[(b_ * sub + k) % len(pat)]] + 12 + (12 if (name == 'case' and k == 2) else 0)
                g = (0.32 if k == 0 else 0.22) * (0.7 + 0.3 * inten)
                place(glass, stereo(fm_glass(m, 0.9, g, 3.5, 1.4 + 0.8 * inten), (-0.4, 0.4)[k % 2]), sb + k * spb / sub)
            # percusión
            if name in ('crystal', 'laser', 'case') and b_ in (1, 3): place(drums, convolve(stereo(snap(0.5 if name == 'crystal' else 0.62), 0.15), IR_ROOM, 0.3), sb)
            if name in ('laser', 'case'):
                if b_ in (0, 2) or name == 'case': place(drums, stereo(kick(0.55 if name == 'laser' else 0.75)), sb)
                for k in range(4): place(drums, stereo(shaker(0.5 if k % 2 else 0.3), (-0.3, 0.3)[k % 2]), sb + k * spb / 4)
        t0 += L; i += 1
    # --- build: Csus4 que crece, redoble de chasquidos y stop de 0,15 s antes del golpe
    root, notes = CR_CHORDS['Csus4']
    sus = pad_chord(notes, STOP - BUILD + 0.04, 0.3, 2200, 0.05, 0.04)
    place(air, stereo(sus * np.linspace(0.6, 1.2, len(sus))), BUILD)
    place(bass, stereo(bass_note(root + 12, STOP - BUILD, 0.5, 400)), BUILD)
    for j, s_ in enumerate(np.arange(BUILD, STOP - 1e-6, spb / 4)):
        place(drums, convolve(stereo(snap(0.25 + 0.5 * (j / 3) ** 1.3), (-0.25, 0.25)[j % 2]), IR_ROOM, 0.3), s_)
    for j, m in enumerate((79, 84, 86, 89)):
        place(glass, stereo(fm_glass(m, 0.6, 0.2 + 0.06 * j), 0.3), BUILD + j * spb / 4)
    # --- golpe final en F(add9): teclado, cristal, sub, bombo y un ting de cristal; arpegio descendente que se apaga
    root, notes = CR_CHORDS['Fadd9']
    place(keys, stereo(felt_keys(notes, dur - HIT, 1.3, 3200)), HIT)
    place(air, stereo(pad_chord(notes[1:], dur - HIT, 0.24, 1800, 0.01, 0.4) * np.exp(-t_arr(int((dur - HIT) * SR)) * 0.5)), HIT)
    place(bass, stereo(bass_note(root + 12, dur - HIT, 0.7, 300) * np.exp(-t_arr(int((dur - HIT) * SR)) * 0.8)), HIT)
    place(drums, stereo(kick(1.0)), HIT)
    for m in (77, 81, 84):
        place(glass, stereo(fm_glass(m + 12, 2.6, 0.4), (m - 81) / 8), HIT)
    fall = [96, 93, 89, 84, 81, 77, 72, 69]
    for j, m in enumerate(fall):
        s_ = HIT + spb + j * spb / 2 * (1 + 0.06 * j)
        if s_ < dur - 0.3: place(glass, stereo(fm_glass(m, 1.8, 0.3 * (1 - j / 12)), (-0.35, 0.35)[j % 2]), s_)
    bus = drums * 0.85 + bass * 0.95 + convolve(keys, IR_HALL, 0.3) * 0.9 + convolve(glass, IR_HALL, 0.42) * 0.75 + convolve(air, IR_HALL, 0.45) * 0.7
    # el cierre suena hasta el último frame; fundido de seguridad de 0,25 s para que no haya clic
    tail = np.clip((dur - tt) / 0.25, 0, 1); bus = bus * (np.sin(tail * np.pi / 2) ** 2)[:, None]
    return bus, {'drums': drums, 'bass': bass, 'keys': keys, 'glass': glass, 'air': air}

# ---------------------------------------------------------------- música "heritage" (BMS-20261109-001)
# 90 BPM (beat = 20 frames, compás = 80). Jazz de cámara de los 60 con producción limpia: piano de fieltro arpegiado,
# piano eléctrico FM con wow de cinta, cuerdas cálidas, contrabajo, escobillas con swing y crujido de vinilo muy bajo.
# Un compás por escena; Cm9 -> F13 con redoble de escobillas, respiro y golpe en B♭6/9 en el frame 560 (logo).
HR_CHORDS = {'Ebmaj9': (39, [55, 58, 62, 65]), 'Dm9': (38, [53, 57, 60, 64]), 'Cm9': (36, [51, 55, 58, 62]),
             'Eb/F': (41, [51, 55, 58, 60]), 'Bbmaj9': (34, [57, 60, 62, 65]), 'Gm9': (43, [53, 57, 58, 62]),
             'F13': (41, [51, 57, 60, 62]), 'Bb69': (34, [50, 55, 60, 62, 65, 70])}
HR_BASS = {'Ebmaj9': (39, 46), 'Dm9': (38, 45), 'Cm9': (36, 43), 'Eb/F': (41, 48), 'Bbmaj9': (34, 41), 'Gm9': (43, 38), 'F13': (41, 36)}
HR_MELODY = [(0, 3, 72, .5), (0, 3.5, 74, .5),
             (1, 0, 77, 1.5), (1, 1.5, 76, .5), (1, 2, 74, 1), (1, 3, 72, 1),
             (2, 0, 70, 1.5), (2, 1.5, 72, .5), (2, 2, 74, 2),
             (3, 2, 79, 1), (3, 3, 77, 1),
             (4, 0, 81, 1.5), (4, 1.5, 79, .5), (4, 2, 77, 1), (4, 3, 74, 1),
             (5, 0, 74, 1.5), (5, 1.5, 72, .5), (5, 2, 70, 1), (5, 3, 69, 1),
             (6, 0, 70, 1), (6, 1, 72, 1), (6, 2, 74, 1)]
def ep_note(m, dur, gain=1.0, wow=0.0015):
    """Piano eléctrico FM (1:1 con índice que cae + 'tine' 14:1), con wow de cinta lento."""
    n = int(dur * SR); tt = t_arr(n); f = midi_hz(m)
    fw = f * (1 + wow * np.sin(2 * np.pi * 0.55 * tt + RNG.uniform(0, 6)))
    ph = 2 * np.pi * np.cumsum(fw) / SR
    idx = 1.5 * np.exp(-tt * 5.5) + 0.25
    x = np.sin(ph + idx * np.sin(ph)) * np.exp(-tt * 1.5)
    x += 0.05 * np.sin(14 * ph) * np.exp(-tt * 28)
    env = np.minimum(1, tt / 0.003) * np.minimum(1, np.maximum(0, dur - tt) / 0.12)
    return bq(x * env, 'lp', 3800) * gain * 0.32
def upright(m, dur, gain=1.0):
    """Contrabajo pulsado: fundamental + armónicos que se apagan antes, golpe de dedo y caída natural."""
    n = int(dur * SR); tt = t_arr(n); f = midi_hz(m)
    x = np.sin(2 * np.pi * f * tt) + 0.45 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 4) + 0.15 * np.sin(6 * np.pi * f * tt) * np.exp(-tt * 9)
    x += bq(pink(n), 'lp', 400) * np.exp(-tt * 120) * 0.6
    env = np.minimum(1, tt / 0.006) * np.exp(-tt * 1.9) * np.minimum(1, np.maximum(0, dur - tt) / 0.06)
    return bq(np.tanh(x * env * 1.3), 'lp', 900) * gain * 0.6
def brush_swish(gain=1.0, L=0.24):
    n = int(L * SR); tt = t_arr(n); u = tt / L
    e = np.sin(np.pi * np.clip(u * 1.3, 0, 1)) ** 1.5 * (1 - 0.4 * u)
    return bq(bq(pink(n) * 3, 'bp', 2600, 0.6), 'hs', 6000, 0.7, -4) * e * gain * 0.5
def brush_tap(gain=1.0):
    n = int(0.08 * SR); tt = t_arr(n)
    return bq(pink(n) * 3, 'hp', 2800) * np.exp(-tt * 70) * np.minimum(1, tt / 0.002) * gain * 0.35
def vinyl(n):
    """Crujido de vinilo sintetizado: chasquidos esporádicos filtrados + soplido muy bajo."""
    clicks = (RNG.random(n) < 0.00035) * RNG.uniform(0.2, 1.0, n) * np.sign(RNG.standard_normal(n))
    c = bq(signal.lfilter([1], [1, -0.6], clicks), 'bp', 2600, 0.6)
    hiss = bq(pink(n), 'lp', 5000) * 0.05
    return stereo(c * 0.5 + hiss)
def music_heritage(prod, dur):
    md = prod['music_direction']; spb = 60 / md['bpm']; bar = 4 * spb
    n = int(dur * SR); tt = t_arr(n)
    keys = np.zeros((n, 2)); ep = np.zeros((n, 2)); strings = np.zeros((n, 2)); bass = np.zeros((n, 2)); drums = np.zeros((n, 2))
    HIT = 7 * bar
    sw = lambda b: np.floor(b) + (2 / 3 if abs(b - np.floor(b) - 0.5) < 1e-6 else b - np.floor(b))  # swing de corcheas
    def roll(buf, notes, s, d, g, spread=0.03, bright=2600):
        for j, m in enumerate(notes):
            place(buf, stereo(felt_keys([m], d, g, bright), (j - len(notes) / 2) * 0.12), s + j * spread)
    prog = ['Ebmaj9', 'Dm9', 'Cm9', 'Eb/F', 'Bbmaj9', 'Gm9', 'Cm9']
    for i, ch in enumerate(prog):
        s0 = i * bar; root, notes = HR_CHORDS[ch]
        if i == 0:
            roll(keys, notes, 0.03, bar + 0.4, 1.0, 0.045)
            place(strings, stereo(pad_chord(notes, bar + 0.6, 0.12, 1300, 1.4, 0.6)), 0)
            place(bass, stereo(upright(HR_BASS[ch][0], 2 * spb, 0.7)), 2 * spb)
            continue
        inten = 0.6 if i == 1 else 0.85
        half = i == 6
        # cuerdas: un acorde por compás (en el último compás, Cm9 media barra y F13 la otra media)
        place(strings, stereo(pad_chord(notes, (2 * spb if half else bar) + 0.5, 0.1 + 0.06 * inten, 1200 + 600 * inten, 0.5, 0.5)), s0)
        # piano: acorde arpegiado en el 1 y anticipación sincopada en el "y" del 2
        roll(keys, notes, s0, 1.6 * spb, 0.8)
        if not half: roll(keys, notes[1:], s0 + sw(1.5) * spb, 0.8 * spb, 0.42, 0.012, 3000)
        # contrabajo: raíz en 1, quinta en 3 y nota de paso a contratiempo hacia el siguiente compás
        r, fifth = HR_BASS[ch]
        place(bass, stereo(upright(r, 1.9 * spb, 0.8)), s0)
        if not half:
            place(bass, stereo(upright(fifth, 1.4 * spb, 0.7)), s0 + 2 * spb)
            place(bass, stereo(upright(r + (2 if i % 2 else -1), 0.45 * spb, 0.5)), s0 + sw(3.5) * spb)
        # escobillas con swing, bombo suave en 1 y 3
        beats = 2 if half else 4
        for b_ in range(beats):
            sb = s0 + b_ * spb
            if b_ in (0, 2): place(drums, stereo(bq(kick(0.42), 'lp', 180)), sb)
            if b_ in (1, 3): place(drums, stereo(brush_swish(0.75 * inten), 0.2), sb)
            place(drums, stereo(brush_tap(0.5 * inten), -0.25), sb + sw(0.5) * spb)
            place(drums, stereo(brush_tap(0.3 * inten), 0.25), sb)
    # build: F13 en el 3 del último compás, redoble de escobillas en crescendo y respiro antes del golpe
    s_f = 6 * bar + 2 * spb; root, notes = HR_CHORDS['F13']
    swell = pad_chord(notes, 2 * spb - 0.1, 0.2, 2000, 0.08, 0.05)
    place(strings, stereo(swell * np.linspace(0.7, 1.2, len(swell))), s_f)
    roll(keys, notes, s_f, 1.6 * spb, 0.85, 0.02)
    place(bass, stereo(upright(HR_BASS['F13'][0], 1.6 * spb, 0.85)), s_f)
    place(bass, stereo(upright(HR_BASS['F13'][1], 0.45 * spb, 0.6)), s_f + sw(1.5) * spb)
    stop = HIT - 0.17
    for j, s_ in enumerate(np.arange(s_f, stop - 1e-6, spb / 4)):
        place(drums, stereo(brush_tap(0.25 + 0.9 * (j / 7) ** 1.4), (-0.3, 0.3)[j % 2]), s_)
    # melodía (piano eléctrico)
    for b_i, beat, m, d in HR_MELODY:
        st = b_i * bar + sw(beat) * spb
        dd = d * spb * (0.67 if abs(beat - np.floor(beat) - 0.5) < 1e-6 else 1.0)
        place(ep, stereo(ep_note(m, dd + 0.6, 0.8), 0.18), st)
    # golpe final en B♭6/9 y arpegio descendente que se apaga hasta el final
    root, notes = HR_CHORDS['Bb69']; tail = dur - HIT
    roll(keys, notes, HIT, tail, 1.1, 0.025, 3200)
    place(strings, stereo(pad_chord(notes[1:], tail, 0.2, 1700, 0.05, 0.8) * np.exp(-t_arr(int(tail * SR)) * 0.45)), HIT)
    place(bass, stereo(upright(root, tail, 1.0)), HIT)
    place(drums, stereo(bq(kick(0.7), 'lp', 200)), HIT)
    cn = int(2.4 * SR); ct = t_arr(cn)
    cym = bq(bq(RNG.standard_normal(cn), 'hp', 5200), 'lp', 11000) * np.exp(-ct * 1.6) * np.minimum(1, ct / 0.004) * 0.12
    place(drums, np.stack([cym, np.roll(cym, 300)], 1), HIT)
    for j, m in enumerate((82, 77, 74, 70, 67, 62)):
        s_ = HIT + spb + j * spb / 2 * (1 + 0.08 * j)
        if s_ < dur - 0.4: place(ep, stereo(ep_note(m, 1.8, 0.7 * (1 - j / 9)), (-0.3, 0.3)[j % 2]), s_)
    bus = keys * 0.95 + convolve(keys, IR_HALL, 0.3) * 0.3 + convolve(ep, IR_HALL, 0.38) * 0.75 + convolve(strings, IR_HALL, 0.5) * 0.85 \
        + convolve(bass, IR_ROOM, 0.12) * 0.95 + convolve(drums, IR_ROOM, 0.22) * 0.8
    # calidez de cinta: saturación suave y agudos redondeados; vinilo muy bajo por encima
    bus = np.tanh(bus * 1.15) / 1.15
    bus = bq(bus, 'hs', 9000, 0.7, -2.5)
    bus = bus + vinyl(n) * 0.018 * (1 - 0.35 * np.clip((tt - 2.4) / 1.0, 0, 1))[:, None]
    fade = np.clip((dur - tt) / 0.25, 0, 1); bus = bus * (np.sin(fade * np.pi / 2) ** 2)[:, None]
    return bus, {'keys': keys, 'ep': ep, 'strings': strings, 'bass': bass, 'drums': drums}

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
    # HPF, calidez, des-embarre, presencia suave, control de la aspereza del vocoder, de-esser dinámico, aire
    # y compresión suave en 2 etapas (sin saturación: la voz TTS ya es densa y se vuelve metálica si se aplasta)
    x = bq(x, 'hp', 80); x = bq(x, 'ls', 180, 0.7, 2.0); x = bq(x, 'peak', 340, 1.0, -2.5); x = bq(x, 'peak', 2600, 0.7, 1.2)
    x = bq(x, 'peak', 4300, 1.4, -2.5); x = bq(x, 'peak', 7600, 2.0, -1.5)
    s_band = bq(x, 'bp', 6500, 1.5); s_env = signal.lfilter([0.01], [1, -0.99], np.abs(s_band))
    ds = np.clip(1 - np.maximum(0, s_env - 0.02) * 6, 0.6, 1); x = x - s_band * (1 - ds)
    x = bq(x, 'hs', 11000, 0.7, 1.0)
    x = compress(x, -26, 2.0, 0.012, 0.16, 2); x = compress(x, -14, 3.0, 0.004, 0.08, 1)
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
WHOOSH_PEAK_S = {'whoosh': 0.6 * 0.62, 'whoosh_soft': 0.95 * 0.62, 'whoosh_big': 1.0 * 0.62}
def main(prod_path):
    global IR_ROOM, IR_HALL
    prod = json.load(open(prod_path)); pid = prod['id']
    build = os.path.join(ROOT, 'build', pid); os.makedirs(build, exist_ok=True)
    fps = prod['format']['fps']; dur = prod['format']['durationInFrames'] / fps
    IR_ROOM = reverb_ir(0.6, 9.0, 0.004); IR_HALL = reverb_ir(2.4, 2.6, 0.02)
    n = int(dur * SR)
    engines = {'crystal': music_crystal, 'heritage': music_heritage}
    mus, stems = engines.get(prod['music_direction'].get('engine'), music)(prod, dur)
    vox, vrep = voice(prod, dur, build)
    fx = np.zeros((n, 2)); frep = []
    for ev in prod['beats']['events']:
        k = ev['type']; s = ev['f'] / fps
        x = sfx(k, ev.get('len_f', 15) / fps) if k != 'riser' else sfx(k, ev['len_f'] / fps)
        start = s - WHOOSH_PEAK_S.get(k, 0.0)  # el pico del whoosh cae en el frame del evento
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
    tt_m = t_arr(len(m)); m = m * (np.sin(np.clip((len(m) / SR - tt_m) / 0.12, 0, 1) * np.pi / 2) ** 2)[:, None]
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
