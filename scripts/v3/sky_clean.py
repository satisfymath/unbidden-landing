"""Calm a busy sky (nebula, mottling) to the reference look: near-black with sparse point stars.
Only sky pixels: above the given horizon row, not planet (blue mask, dilated), not astronaut (Vision mask, dilated).
Usage: python sky_clean.py <frame> <horizon_row> [keep_stars=0.6]
"""
import sys, subprocess
from pathlib import Path
import numpy as np, cv2
F = Path(__file__).resolve().parents[2] / 'production/v3/frames'
k, hz = sys.argv[1], int(sys.argv[2]); keep = float(sys.argv[3]) if len(sys.argv) > 3 else 0.6
im = cv2.imread(str(F / f'{k}.png')); H, W = im.shape[:2]
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
planet = ((hsv[..., 0] > 88) & (hsv[..., 0] < 132) & (hsv[..., 1] > 30) & (hsv[..., 2] > 30)).astype(np.uint8)
planet = cv2.morphologyEx(planet, cv2.MORPH_CLOSE, np.ones((41, 41), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(planet); big = np.zeros_like(planet)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 4000: big[lab == i] = 1
# planet = the side of its bright blue limb, traced per column (mode 'below') or per row (mode 'right')
mode = sys.argv[4] if len(sys.argv) > 4 else 'below'
limb = ((hsv[..., 0] > 95) & (hsv[..., 0] < 125) & (hsv[..., 1] > 80) & (hsv[..., 2] > 140)).astype(np.uint8)
big = np.zeros((H, W), np.uint8)
if mode == 'below':
    edge = np.full(W, -1.0)
    for x in range(W):
        ys = np.nonzero(limb[:hz, x])[0]
        if len(ys) > 1: edge[x] = ys.min()
    xs = np.arange(W); good = edge >= 0
    px, py = xs[good].astype(float), edge[good]
    for _ in range(6):                                   # robust quadratic fit, drop stars/nebula outliers
        c = np.polyfit(px, py, 2); r = np.abs(np.polyval(c, px) - py); keep_ = r < max(8, np.percentile(r, 70))
        px, py = px[keep_], py[keep_]
    for x in range(W):
        t = int(np.polyval(c, x))
        if t < hz: big[max(0, t - 8):, x] = 1
    print('limb fit', np.round(c, 5))
else:
    edge = np.full(H, -1.0)
    for y in range(H):
        xs_ = np.nonzero(limb[y])[0]
        if len(xs_) > 1: edge[y] = xs_.min()
    ys_ = np.arange(H); good = edge >= 0
    py, px = ys_[good].astype(float), edge[good]
    for _ in range(6):
        c = np.polyfit(py, px, 2); r = np.abs(np.polyval(c, py) - px); keep_ = r < max(8, np.percentile(r, 70))
        py, px = py[keep_], px[keep_]
    for y in range(H):
        l = int(np.polyval(c, y))
        if l < W: big[y, max(0, l - 8):] = 1
    print('limb fit', np.round(c, 5))
tmp = F / f'_sc-{k}.png'
subprocess.run(['swift', '/Users/david/AI-Video-Lab/scripts/mask_fg.swift', str(F / f'{k}.png'), str(tmp)], capture_output=True)
astro = cv2.dilate((cv2.resize(cv2.imread(str(tmp), 0), (W, H)) > 100).astype(np.uint8), np.ones((3, 3), np.uint8)); tmp.unlink()
# the moon: bright compact blob, protect it
g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
_, br = cv2.threshold(cv2.GaussianBlur(g, (5, 5), 0), 60, 255, cv2.THRESH_BINARY)
n2, l2, s2, _ = cv2.connectedComponentsWithStats(br); moon = np.zeros_like(g)
for i in range(1, n2):
    if 300 < s2[i, cv2.CC_STAT_AREA] < 9000 and 0.4 < s2[i, 2] / max(1, s2[i, 3]) < 1.6:
        ys_m, xs_m = np.nonzero(l2 == i)
        (mx, my), mr = cv2.minEnclosingCircle(np.c_[xs_m, ys_m].astype(np.float32))
        cv2.circle(moon, (int(mx), int(my)), int(mr * 1.05) + 2, 1, -1)   # the whole disc, lit and dark side
MOONS = {'4': (1016, 170, 30)}            # measured with a Hough circle (centre x, y, radius)
if k in MOONS:
    moon = np.zeros((H, W), np.uint8); mx, my, mr = MOONS[k]; cv2.circle(moon, (mx, my), mr + 1, 1, -1)
sky = np.zeros((H, W), np.uint8); sky[:hz] = 1
sky[(big > 0) | (astro > 0) | (moon > 0)] = 0
f = im.astype(np.float32); bg = cv2.GaussianBlur(f, (0, 0), 6)
stars = np.clip(f - bg, 0, 255) * keep
base = np.array([10, 8, 7], np.float32)
new = base + stars
w = cv2.GaussianBlur(sky.astype(np.float32), (7, 7), 0)[..., None]
bk = F / 'rejected' / f'{k}-pre-skyclean.png'
if not bk.exists(): cv2.imwrite(str(bk), im)
cv2.imwrite(str(F / f'{k}.png'), (new * w + f * (1 - w)).clip(0, 255).astype(np.uint8))
print(f'{k}: sky px {int(sky.sum())}, moon protected px {int(moon.sum())}')
