"""Replace the backpack emblem in V3 frames with the official UNBIDDEN mark, traced from its measured geometry.

Official mark (brand/unbidden-logo-official.png, measured): open ring of radius R, stroke 0.055 R, round caps, gap from
39.5° to 50.5° (upper right); filled dot of radius 0.122 R centred at 47°, 1.263 R from the ring centre.
Per frame: the existing printed ring is located (ellipse fit on its ink near a hint point), erased by inpainting, and the
official mark is drawn with the same ellipse (perspective of the panel), in the ink colour, multiplied over the panel so
dirt and lighting show through. Writes <frame>.png in place (originals kept in rejected/<frame>-pre-emblem.png).
Usage: python scripts/v3/emblem.py 4 3 6B 6D 6E 6F
"""
import sys, math, shutil
from pathlib import Path
import numpy as np, cv2

D = Path(__file__).resolve().parents[2] / 'production/v3/frames'
# hint: (cx, cy, search half-size) in 1344x768 pixels, from visual inspection
HINTS = {'5': (305, 755, 45), '5B': (98, 728, 40), '4': (524, 552, 60), '3': (827, 318, 26), '6F': (1035, 342, 26), '6B': (222, 570, 40), '6D': (1121, 571, 40), '6E': (1205, 590, 40)}
OVERRIDE = {'3': ((827, 318), (11.5, 13.0), 0.0)}
GAP0, GAP1, DOT_ANG, DOT_DIST, DOT_R, STROKE = 39.5, 50.5, 47.0, 1.263, 0.122, 0.055

def fit_ring(img, cx, cy, h):
    x0, y0 = max(0, cx - h), max(0, cy - h)
    roi = cv2.cvtColor(img[y0:cy + h, x0:cx + h], cv2.COLOR_BGR2GRAY).astype(np.float32)
    bg = cv2.medianBlur(roi.astype(np.uint8), 15).astype(np.float32)
    ink = ((bg - roi) > 28).astype(np.uint8)
    cnts, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cnts = [c for c in cnts if len(c) >= 12]
    best = max(cnts, key=lambda c: cv2.arcLength(c, True))
    (ex, ey), (w, hh), ang = cv2.fitEllipse(best)
    return (ex + x0, ey + y0), (w / 2, hh / 2), ang, ink, (x0, y0)

def process(name):
    p = D / f'{name}.png'
    img = cv2.imread(str(p))
    cx, cy, h = HINTS[name]
    (ex, ey), (ax, ay), ang, ink, (x0, y0) = fit_ring(img, cx, cy, h)
    if name in OVERRIDE:
        (ex, ey), (ax, ay), ang = OVERRIDE[name]
    # normalise the ellipse so the logo stays upright: angle in (-45, 45], axes swapped if needed
    while ang > 45: ang -= 90; ax, ay = ay, ax
    while ang <= -45: ang += 90; ax, ay = ay, ax
    # erase: all ink in the search box (ring, old dot, stray lines), dilated
    mask = np.zeros(img.shape[:2], np.uint8)
    mask[y0:y0 + ink.shape[0], x0:x0 + ink.shape[1]] = ink
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=2)
    ink_px = img[mask > 0]
    ink_col = np.percentile(ink_px, 12, axis=0) if len(ink_px) else np.array([30, 30, 30])
    clean = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)
    # unit circle → fitted ellipse (OpenCV angle is of the first axis, degrees)
    R = 1.0
    t = math.radians(ang)
    A = np.array([[ax * math.cos(t), -ay * math.sin(t)], [ax * math.sin(t), ay * math.cos(t)]])
    # keep the logo upright: the gap must sit at the upper right in image space; pick the axis order accordingly
    S = 8  # supersampling
    H, W = img.shape[:2]
    layer = np.zeros((H * S, W * S), np.uint8)
    def to_img(u, v):  # u right, v up, in R units
        x, y = A @ np.array([u, -v])
        return int(round((ex + x) * S)), int(round((ey + y) * S))
    rad = max(ax, ay)
    sw = max(1.4, STROKE * rad) * S
    pts = [to_img(math.cos(math.radians(a)), math.sin(math.radians(a))) for a in np.arange(GAP1, GAP0 + 360.01, 1.0)]
    cv2.polylines(layer, [np.array(pts, np.int32)], False, 255, thickness=int(round(sw)), lineType=cv2.LINE_AA)
    for end in (pts[0], pts[-1]):
        cv2.circle(layer, end, int(round(sw / 2)), 255, -1, cv2.LINE_AA)
    du, dv = DOT_DIST * math.cos(math.radians(DOT_ANG)), DOT_DIST * math.sin(math.radians(DOT_ANG))
    dc = to_img(du, dv)
    dot = np.zeros_like(layer)
    cv2.circle(dot, (0, 0), 1, 255)  # no-op placeholder
    # dot as the image of a small circle through the same affine map (an ellipse)
    dpts = [to_img(du + DOT_R * math.cos(a), dv + DOT_R * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 64)]
    cv2.fillPoly(layer, [np.array(dpts, np.int32)], 255, cv2.LINE_AA)
    alpha = cv2.resize(layer, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 * 0.92
    out = clean.astype(np.float32)
    ink_rgb = np.array(ink_col, np.float32)
    out = out * (1 - alpha[..., None]) + np.minimum(out, ink_rgb) * alpha[..., None]
    bk = D / 'rejected' / f'{name}-pre-emblem.png'
    bk.parent.mkdir(exist_ok=True)
    if not bk.exists(): shutil.copy(p, bk)
    cv2.imwrite(str(p), out.clip(0, 255).astype(np.uint8))
    b = int(rad * 2.6)
    crop = out[int(ey) - b:int(ey) + b, int(ex) - b:int(ex) + b]
    cv2.imwrite(str(D / f'_check-{name}.png'), cv2.resize(crop.clip(0, 255).astype(np.uint8), None, fx=4, fy=4, interpolation=cv2.INTER_LANCZOS4))
    print(f'{name}: ellipse centre ({ex:.0f},{ey:.0f}) axes ({ax:.1f},{ay:.1f}) angle {ang:.0f}° ink {ink_col.astype(int)}')

if __name__ == '__main__':
    for n in sys.argv[1:]: process(n)
