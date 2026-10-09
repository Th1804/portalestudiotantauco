#!/usr/bin/env python3
"""BRINE MOTION STUDIO — QA automático del MP4 final.
Mide: resolución, duración, fps, códecs, integridad (decode completo), audio, LUFS integrado y true peak (ffmpeg ebur128),
frames negros (blackdetect), safe zones Reels/TikTok sobre máscaras REALES de texto (stills en modo QA), contraste WCAG
texto/fondo sobre frames del MP4, presencia/integridad del logo en el cierre, proporción de dorado, contact sheet."""
import json, os, re, subprocess, sys, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)

def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)
def lum(rgb):
    c = rgb / 255.0; c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]
def wcag(a, b):
    la, lb = sorted([lum(np.array(a, float)), lum(np.array(b, float))], reverse=True)
    return (la + 0.05) / (lb + 0.05)

def main(prod_path, mp4):
    prod = json.load(open(prod_path)); pid = prod['id']; F = prod['format']
    build = os.path.join(ROOT, 'build', pid); qa_dir = os.path.join(build, 'qa'); frames_dir = os.path.join(build, 'frames')
    os.makedirs(frames_dir, exist_ok=True)
    R = {'id': pid, 'file': mp4, 'checks': {}}; C = R['checks']
    def chk(name, ok, **kw): C[name] = {'pass': bool(ok), **kw}

    pr = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4]).stdout)
    v = next(s for s in pr['streams'] if s['codec_type'] == 'video'); a = [s for s in pr['streams'] if s['codec_type'] == 'audio']
    num, den = map(int, v['r_frame_rate'].split('/')); fps = num / den; dur = float(pr['format']['duration'])
    nb = int(v.get('nb_frames', 0))
    chk('resolution', (v['width'], v['height']) == (F['width'], F['height']), value=f"{v['width']}x{v['height']}")
    chk('fps', abs(fps - F['fps']) < 0.01, value=round(fps, 3))
    chk('duration', abs(dur - F['duration_s']) <= 0.1, value=round(dur, 3), frames=nb)
    chk('codecs', v['codec_name'] == 'h264' and v.get('pix_fmt') == 'yuv420p' and a and a[0]['codec_name'] == 'aac', video=v['codec_name'], audio=a[0]['codec_name'] if a else None,
        pix_fmt=v.get('pix_fmt'), audio_sr=a[0].get('sample_rate') if a else None)
    dec = run(['ffmpeg', '-v', 'error', '-i', mp4, '-f', 'null', '-'])
    chk('integrity_full_decode', dec.returncode == 0 and not dec.stderr.strip(), errors=dec.stderr.strip()[:300])
    # loudness
    eb = run(['ffmpeg', '-nostats', '-i', mp4, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', eb)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', eb)[-1])
    LRA = float(re.findall(r'LRA:\s+(-?[\d.]+) LU', eb)[-1])
    chk('audio_present', bool(a) and I > -40, lufs=I)
    chk('loudness_-14_LUFS', abs(I - (-14)) <= 1.0, integrated_lufs=I, lra=LRA, target=-14, tolerance=1.0)
    chk('true_peak_<=-1_dBTP', TP <= -1.0, true_peak_dbtp=TP)
    # negros
    bd = run(['ffmpeg', '-i', mp4, '-vf', 'blackdetect=d=0.05:pix_th=0.06', '-an', '-f', 'null', '-']).stderr
    blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd)
    chk('no_black_frames', len(blacks) == 0, segments=blacks)
    # frames del MP4 en keyframes
    kfs = prod['qa_keyframes']
    for f_ in glob.glob(os.path.join(frames_dir, '*.png')): os.remove(f_)
    sel = '+'.join(f'eq(n\\,{k})' for k in kfs)
    run(['ffmpeg', '-y', '-v', 'error', '-i', mp4, '-vf', f"select='{sel}'", '-vsync', '0', os.path.join(frames_dir, 'kf-%03d.png')])
    got = sorted(glob.glob(os.path.join(frames_dir, 'kf-*.png')))
    fmap = {k: got[i] for i, k in enumerate(kfs) if i < len(got)}
    # safe zones + contraste
    sz = F['safe_zone']; W, H = F['width'], F['height']
    y0, y1, x0, x1 = sz['top'] * H, (1 - sz['bottom']) * H, sz['left_px'], W - sz['right_px']
    sz_rows, ct_rows = [], []
    for k in kfs:
        tp = os.path.join(qa_dir, f'text-{k:03d}.png')
        if not os.path.exists(tp): continue
        m = np.asarray(Image.open(tp).convert('L')) > 60
        if m.sum() < 50: sz_rows.append({'frame': k, 'text': False}); continue
        ys, xs = np.nonzero(m); bb = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
        ok = bb[0] >= x0 and bb[2] <= x1 and bb[1] >= y0 and bb[3] <= y1
        sz_rows.append({'frame': k, 'text': True, 'bbox': bb, 'pass': ok})
        if k in fmap:
            fr = np.asarray(Image.open(fmap[k]).convert('RGB')).astype(float)
            mi = Image.fromarray((m * 255).astype(np.uint8))
            core = np.asarray(mi.filter(ImageFilter.MinFilter(3))) > 128
            ring = (np.asarray(mi.filter(ImageFilter.MaxFilter(21))) > 128) & ~(np.asarray(mi.filter(ImageFilter.MaxFilter(7))) > 128)
            if core.sum() > 20 and ring.sum() > 20:
                fg = np.median(fr[core], 0); bg = np.median(fr[ring], 0); cr = wcag(fg, bg)
                ct_rows.append({'frame': k, 'fg': [int(x) for x in fg], 'bg': [int(x) for x in bg], 'ratio': round(float(cr), 2), 'pass': cr >= 3.0})
    chk('safe_zones_text', all(r.get('pass', True) for r in sz_rows), zone={'y_min': y0, 'y_max': y1, 'x_min': x0, 'x_max': x1}, frames=sz_rows)
    chk('text_contrast_wcag_>=3', all(r['pass'] for r in ct_rows) and len(ct_rows) > 0, frames=ct_rows,
        note='Ratio WCAG entre la mediana del núcleo del texto y la mediana del anillo de fondo, medido en el MP4 (texto >=46 px: umbral 3:1).')
    # colisiones de texto (v2): cajas de tinta medidas en el DOM durante el render de los stills de QA
    bx_path = os.path.join(qa_dir, 'text-boxes.json'); col_rows = []; gap_min = 8
    if os.path.exists(bx_path):
        for fr_ in json.load(open(bx_path)):
            bs = fr_['boxes']
            for i in range(len(bs)):
                for j in range(i + 1, len(bs)):
                    a_, b_ = bs[i], bs[j]
                    dx_ = max(a_['x0'], b_['x0']) - min(a_['x1'], b_['x1']); dy_ = max(a_['y0'], b_['y0']) - min(a_['y1'], b_['y1'])
                    if dx_ < gap_min and dy_ < gap_min:
                        col_rows.append({'frame': fr_['frame'], 'a': a_['id'], 'b': b_['id'], 'gap_x': dx_, 'gap_y': dy_})
        nfr = len(json.load(open(bx_path)))
        chk('text_no_overlap', len(col_rows) == 0 and nfr > 0, frames_checked=nfr, min_gap_px=gap_min, collisions=col_rows[:40],
            note='Cajas de tinta por elemento [data-qa] (DOM + canvas.measureText, con transformaciones y máscaras) en cada keyframe; falla si dos textos visibles quedan a < 8 px.')
    else:
        chk('text_no_overlap', False, note='faltan text-boxes.json')
    # logo en cierre
    last = max(kfs); lp = os.path.join(qa_dir, f'logo-{last:03d}.png')
    lm = np.asarray(Image.open(lp).convert('L')) > 60
    logo_ok = False; info = {}
    if lm.sum() > 1000 and last in fmap:
        ys, xs = np.nonzero(lm); bb = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        src = Image.open(os.path.join(ROOT, 'public', 'assets', 'logo.png')).convert('RGBA')
        sb = src.getchannel('A').point(lambda x: 255 if x > 60 else 0).getbbox()
        ar_src = (sb[2] - sb[0]) / (sb[3] - sb[1]); ar = (bb[2] - bb[0]) / (bb[3] - bb[1])
        ref = Image.new('RGBA', src.size, (33, 37, 75, 255)); ref.alpha_composite(src)
        ref = ref.crop(sb).convert('RGB').resize((bb[2] - bb[0], bb[3] - bb[1]), Image.Resampling.LANCZOS)
        fr = Image.open(fmap[last]).convert('RGB').crop(bb)
        A_ = np.asarray(ref, float).mean(2).ravel(); B_ = np.asarray(fr, float).mean(2).ravel()
        corr = float(np.corrcoef(A_, B_)[0, 1])
        ca = np.asarray(ref, float).reshape(-1, 3).mean(0); cb = np.asarray(fr, float).reshape(-1, 3).mean(0)
        logo_ok = corr > 0.9 and abs(ar - ar_src) / ar_src < 0.02
        info = {'bbox': bb, 'aspect': round(ar, 4), 'aspect_source': round(ar_src, 4), 'luma_correlation_vs_official': round(corr, 4),
                'mean_rgb_frame': [round(x) for x in cb], 'mean_rgb_official_on_navy': [round(x) for x in ca], 'safe_zone_ok': bb[1] >= y0 and bb[3] <= y1}
    chk('logo_in_closing', logo_ok, frame=last, **info)
    # dorado (excluye el bbox del logo en el cierre)
    gold = np.array([205, 167, 31], float); gr = []
    allf = os.path.join(build, 'frames-all'); os.makedirs(allf, exist_ok=True)
    for f_ in glob.glob(os.path.join(allf, '*.png')): os.remove(f_)
    run(['ffmpeg', '-y', '-v', 'error', '-i', mp4, '-vf', 'fps=2,scale=540:960', os.path.join(allf, 's-%03d.png')])
    for i, pth in enumerate(sorted(glob.glob(os.path.join(allf, 's-*.png')))):
        fr = np.asarray(Image.open(pth).convert('RGB'), float)
        msk = np.sqrt(((fr - gold) ** 2).sum(2)) < 45
        t = i / 2
        if t >= 12.6 and info.get('bbox'):
            b = [v // 2 for v in info['bbox']]; msk[b[1]:b[3], b[0]:b[2]] = False
        gr.append(round(float(msk.mean()), 4))
    chk('gold_accent_<3%', max(gr) < prod['brand'].get('gold_max_ratio', 0.03), max_ratio=max(gr), mean_ratio=round(float(np.mean(gr)), 4))
    # contact sheet
    font = None
    try: font = ImageFont.truetype(os.path.join(ROOT, 'public', 'assets', 'Manrope.ttf'), 22)
    except Exception: font = ImageFont.load_default()
    tw, th, cols = 270, 480, 5
    rows = (len(kfs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw + (cols + 1) * 10, rows * (th + 40) + 10), (16, 18, 36)); d = ImageDraw.Draw(sheet)
    for i, k in enumerate(kfs):
        if k not in fmap: continue
        im = Image.open(fmap[k]).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
        x = 10 + (i % cols) * (tw + 10); y = 10 + (i // cols) * (th + 40)
        sheet.paste(im, (x, y)); d.text((x, y + th + 6), f'f{k}  {k / F["fps"]:.2f}s', fill=(244, 246, 249), font=font)
        dd = ImageDraw.Draw(sheet)
        dd.line([(x, y + int(th * sz['top'])), (x + tw, y + int(th * sz['top']))], fill=(255, 80, 80), width=1)
        dd.line([(x, y + int(th * (1 - sz['bottom']))), (x + tw, y + int(th * (1 - sz['bottom'])))], fill=(255, 80, 80), width=1)
    cs = os.path.join(ROOT, 'out', f'{pid}.contact-sheet.png'); sheet.save(cs)
    R['contact_sheet'] = cs
    R['audio_report'] = json.load(open(os.path.join(build, 'audio-report.json'))) if os.path.exists(os.path.join(build, 'audio-report.json')) else None
    R['summary'] = {'passed': sum(c['pass'] for c in C.values()), 'total': len(C), 'failed': [k for k, c in C.items() if not c['pass']]}
    out = os.path.join(ROOT, 'out', f'{pid}.qa.json'); json.dump(R, open(out, 'w'), indent=1, ensure_ascii=False, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
    print(json.dumps(R['summary'], ensure_ascii=False, default=str))
    for k, c in C.items(): print(('PASS ' if c['pass'] else 'FAIL ') + k, {kk: vv for kk, vv in c.items() if kk not in ('frames', 'pass')})

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
