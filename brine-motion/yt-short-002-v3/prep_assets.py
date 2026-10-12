"""Extract the trophy cut-out from the product photo and the logo, store as RGBA PNGs."""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SRC_PHOTO = HERE / "assets" / "copa_plateada_foto.png"
SRC_LOGO = HERE / "assets" / "brine_logo_horizontal.png"
OUT = HERE / "build"


# Background pockets trapped between the handles and the cup (crop coordinates), sealed off
# from the outer background by a faint outline in the source photo.
HANDLE_POCKET_SEEDS = [(151, 231), (649, 235), (224, 763), (575, 761)]


def clear_handle_pockets(rgba):
    mn = rgba[..., :3].min(-1)
    a = rgba[..., 3]
    cand = ((mn >= 246) & (a > 128)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(cand, connectivity=8)
    kill = np.zeros(cand.shape, np.uint8)
    for x, y in HANDLE_POCKET_SEEDS:
        ys, xs = np.nonzero(lab[max(0, y - 4): y + 5, max(0, x - 4): x + 5])
        if len(ys):
            kill[lab == lab[max(0, y - 4) + ys[0], max(0, x - 4) + xs[0]]] = 1
    kill = cv2.dilate(kill, np.ones((5, 5), np.uint8))
    keep = 1.0 - cv2.GaussianBlur(kill.astype(np.float32), (0, 0), 1.0)
    keep = np.minimum(keep, 1.0 - kill * (cand | (mn >= 200)))
    rgba[..., 3] = a * np.clip(keep, 0, 1)
    return rgba


def trophy_cutout():
    rgb = np.array(Image.open(SRC_PHOTO).convert("RGB")).astype(np.float32)
    mn = rgb.min(-1)

    # Background is pure white; it includes the regions enclosed by the handles.
    white = (mn >= 255).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, connectivity=4)
    bg = np.zeros_like(white)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 20000:
            bg[lab == i] = 1
    # The product shot has a near-white halo around the silhouette; absorb it into the background.
    near_white = (mn >= 236).astype(np.uint8)
    k = np.ones((3, 3), np.uint8)
    for _ in range(14):
        bg = np.maximum(bg, cv2.dilate(bg, k) & near_white)

    # The trophy is the largest clearly non-white blob; its bbox excludes the printed text/badges.
    solid = (mn < 235).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    main = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    bx, by, bw, bh = st[main, :4]
    m = 4
    roi = np.zeros_like(white)
    roi[max(0, by - m): by + bh + m, max(0, bx - m): bx + bw + m] = 1
    fg = ((1 - bg) & roi).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    main = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    fg = (lab == main).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    # Fill specular specks inside the silhouette while keeping the enclosed handle gaps transparent.
    cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    outer = np.zeros_like(fg)
    cv2.drawContours(outer, cnts, -1, 1, thickness=cv2.FILLED)
    filled = (outer & (1 - bg)).astype(np.uint8)
    trophy_region = filled.astype(np.float32)

    # Soft edge: inside a thin band at the boundary, alpha derives from how far the pixel is from white.
    # The source photo carries white blobs hugging the silhouette (old cut-out residue).
    ell = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    filled = cv2.morphologyEx(filled, cv2.MORPH_OPEN, ell)
    trophy_region = filled.astype(np.float32)
    dist = cv2.distanceTransform(filled, cv2.DIST_L2, 5)
    alpha = trophy_region.copy()
    edge = (filled > 0) & (dist <= 7)
    white_fringe = np.clip((246.0 - mn) / 40.0, 0.0, 1.0)
    alpha[edge] = np.minimum(alpha[edge], white_fringe[edge])
    band = (filled > 0) & (dist <= 2.5)
    lum_alpha = np.clip((250.0 - mn) / 70.0, 0.0, 1.0)
    alpha[band] = np.minimum(alpha[band], lum_alpha[band])
    alpha = np.minimum(alpha, np.clip(dist / 1.5, 0, 1))
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7) * (cv2.dilate(filled, np.ones((3, 3), np.uint8)) > 0)
    alpha = np.clip(alpha, 0, 1)

    # Un-mix the white background from edge pixels.
    a3 = np.maximum(alpha[..., None], 1e-3)
    col = (rgb - (1.0 - a3) * 255.0) / a3
    col = np.clip(col, 0, 255)

    ys, xs = np.where(alpha > 0.02)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pad = 6
    y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
    y1, x1 = min(rgb.shape[0], y1 + pad), min(rgb.shape[1], x1 + pad)
    out = np.dstack([col, alpha[..., None] * 255.0])[y0:y1, x0:x1]
    out = clear_handle_pockets(out)
    Image.fromarray(out.astype(np.uint8), "RGBA").save(OUT / "trophy.png")

    # Row where the wooden base starts (used to keep the chrome sweep on metal only).
    crop_rgb = rgb[y0:y1, x0:x1]
    crop_a = alpha[y0:y1, x0:x1]
    redness = (crop_rgb[..., 0] - crop_rgb[..., 2]) * (crop_a > 0.5)
    row_red = (redness > 40).mean(1)
    base_top = int(np.argmax(row_red > 0.08))
    (OUT / "trophy_meta.txt").write_text(f"{base_top}\n")
    print("trophy", out.shape, "base_top", base_top)


def logo():
    im = np.array(Image.open(SRC_LOGO).convert("RGBA"))
    a = im[..., 3]
    ys, xs = np.where(a > 8)
    pad = 10
    crop = im[ys.min() - pad: ys.max() + pad, xs.min() - pad: xs.max() + pad]
    Image.fromarray(crop, "RGBA").save(OUT / "logo.png")
    print("logo", crop.shape)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    trophy_cutout()
    logo()
    sys.exit(0)
