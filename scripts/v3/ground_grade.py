"""Neutralize the lunar ground's colour cast (target: neutral grey like 6B/6C), only on ground pixels:
lit, low-saturation-or-warm pixels in the lower part of the frame, minus the astronaut (Apple Vision) and minus the planet.
Usage: python ground_grade.py <frame> [y_from_fraction]
"""
import sys, subprocess
from pathlib import Path
import numpy as np, cv2
F = Path(__file__).resolve().parents[2] / 'production/v3/frames'
k = sys.argv[1]; yf = float(sys.argv[2]) if len(sys.argv) > 2 else 0.55
im = cv2.imread(str(F / f'{k}.png')); H, W = im.shape[:2]
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
m = np.zeros((H, W), np.uint8); m[int(H * yf):] = 1
blue = (hsv[..., 0] > 88) & (hsv[..., 0] < 132) & (hsv[..., 1] > 40)
m[blue] = 0
tmp = F / f'_gm-{k}.png'
subprocess.run(['swift', '/Users/david/AI-Video-Lab/scripts/mask_fg.swift', str(F / f'{k}.png'), str(tmp)], capture_output=True)
if tmp.exists():
    a = cv2.resize(cv2.imread(str(tmp), 0), (W, H)) > 100
    m[cv2.dilate(a.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0] = 0; tmp.unlink()
lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
v = lab[m > 0]; da, db = v[:, 1].mean() - 128, v[:, 2].mean() - 128
lab[..., 1] -= da * 0.95; lab[..., 2] -= db * 0.95
lab[..., 1] = 128 + (lab[..., 1] - 128) * 0.6; lab[..., 2] = 128 + (lab[..., 2] - 128) * 0.6
out = cv2.cvtColor(lab.clip(0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
w = cv2.GaussianBlur(m.astype(np.float32), (31, 31), 0)[..., None]
bk = F / 'rejected' / f'{k}-pre-ground.png'
if not bk.exists(): cv2.imwrite(str(bk), im)
cv2.imwrite(str(F / f'{k}.png'), (out * w + im * (1 - w)).clip(0, 255).astype(np.uint8))
print(f'{k}: ground px {int(m.sum())}, cast a {da:+.1f} b {db:+.1f} removed')
