"""Replace a frame's moon with the canonical moon (from frame 2): same phase, lighting and texture everywhere.
The old disc (plus a small margin) is filled with the surrounding sky, then the canonical moon is composited with an
alpha built from its own luminance over the black sky. Usage: python moon.py <frame> <cx> <cy> <r>
"""
import sys
from pathlib import Path
import numpy as np, cv2
F = Path(__file__).resolve().parents[2] / 'production/v3/frames'
SRC, (SX, SY, SR) = '2', (1031, 133, 34)
k = sys.argv[1]; cx, cy, r = int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4])
im = cv2.imread(str(F / f'{k}.png')); H, W = im.shape[:2]
bk = F / 'rejected' / f'{k}-pre-moon.png'
if not bk.exists(): cv2.imwrite(str(bk), im)
im = cv2.imread(str(bk)); H, W = im.shape[:2]
# 1) erase the old moon: fill the disc + margin from the sky ring around it
hole = np.zeros((H, W), np.uint8); cv2.circle(hole, (cx, cy), int(r * 1.35) + 4, 255, -1)
# fill the hole with a REAL sky patch (stars included) from the nearest clean area, matched in level, feathered
R0 = int(r * 1.35) + 4; size = 2 * R0 + 8
f = im.astype(np.float32)
best = None
for dx, dy in [(-3, 0), (3, 0), (0, 3), (-3, 2), (3, 2), (-3, -2), (3, -2), (0, -3)]:
    sx, sy = cx + dx * R0 // 1, cy + dy * R0 // 1
    x0s, y0s = sx - size // 2, sy - size // 2
    if x0s < 0 or y0s < 0 or x0s + size > W or y0s + size > H: continue
    cand = f[y0s:y0s + size, x0s:x0s + size]
    if cand.max() > 120: continue                       # avoid patches with the planet or the moon
    score = abs(cand.mean() - f[max(0, cy - size):cy + size, max(0, cx - size):cx + size].mean())
    if best is None or score < best[0]: best = (score, cand.copy())
patch = best[1] if best else cv2.inpaint(im, hole, 9, cv2.INPAINT_TELEA)[cy - size // 2:cy + size // 2, cx - size // 2:cx + size // 2].astype(np.float32)
ringm = np.zeros((H, W), np.uint8); cv2.circle(ringm, (cx, cy), int(R0 * 1.5), 1, -1); ringm[hole > 0] = 0
target = f[ringm > 0].mean(0); patch = patch - patch.mean((0, 1)) + target
fm = np.zeros((size, size), np.float32); cv2.circle(fm, (size // 2, size // 2), R0, 1, -1); fm = cv2.GaussianBlur(fm, (9, 9), 0)[..., None]
ys, xs = cy - size // 2, cx - size // 2
f[ys:ys + size, xs:xs + size] = patch * fm + f[ys:ys + size, xs:xs + size] * (1 - fm)
# 2) canonical moon patch, scaled to radius r
src = cv2.imread(str(F / f'{SRC}.png')).astype(np.float32)
pad = int(SR * 1.5)
patch = src[SY - pad:SY + pad, SX - pad:SX + pad]
bg = np.median(np.concatenate([patch[:6].reshape(-1, 3), patch[-6:].reshape(-1, 3)]), axis=0)
s = r / SR; patch = cv2.resize(patch, None, fx=s, fy=s, interpolation=cv2.INTER_LANCZOS4)
h, w = patch.shape[:2]
disc = np.zeros((h, w), np.float32); cv2.circle(disc, (w // 2, h // 2), int(r * 1.04), 1, -1)
disc = cv2.GaussianBlur(disc, (5, 5), 0)
lum = np.clip((patch.mean(2) - bg.mean()) / 25.0, 0, 1)
alpha = np.maximum(disc * 0.97, lum)[..., None]               # whole disc (incl. dark side), glow outside
y0, x0 = cy - h // 2, cx - w // 2
roi = f[y0:y0 + h, x0:x0 + w]
f[y0:y0 + h, x0:x0 + w] = patch * alpha + roi * (1 - alpha) + (patch - bg) * 0 
cv2.imwrite(str(F / f'{k}.png'), f.clip(0, 255).astype(np.uint8))
print(f'{k}: moon replaced at ({cx},{cy}) r {r}')
