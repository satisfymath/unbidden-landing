"""Match the planet's colour in a frame to the reference look (frame 3), touching only planet pixels.
Planet mask = bluish pixels (+ clouds enclosed by them), minus the astronaut (Apple Vision mask), minus anything below
a per-frame ground line. Lab mean/std transfer per channel, feathered. Usage: python planet_grade.py <frame> [ref]
"""
import sys, subprocess
from pathlib import Path
import numpy as np, cv2
F = Path(__file__).resolve().parents[2] / 'production/v3/frames'
MASK = '/Users/david/AI-Video-Lab/scripts/mask_fg.swift'
def planet_mask(k):
    im = cv2.imread(str(F / f'{k}.png')); hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    blue = ((hsv[..., 0] > 88) & (hsv[..., 0] < 132) & (hsv[..., 1] > 30) & (hsv[..., 2] > 30)).astype(np.uint8)
    blob = cv2.morphologyEx(blue, cv2.MORPH_CLOSE, np.ones((41, 41), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(blob)
    keep = np.zeros_like(blob)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 4000: keep[lab == i] = 1
    lit = (hsv[..., 2] > 40).astype(np.uint8)              # exclude black sky inside the closing
    m = keep & lit
    tmp = F / f'_pm-{k}.png'
    subprocess.run(['swift', MASK, str(F / f'{k}.png'), str(tmp)], capture_output=True)
    if tmp.exists():
        a = cv2.resize(cv2.imread(str(tmp), 0), (im.shape[1], im.shape[0])) > 100
        m[cv2.dilate(a.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0] = 0; tmp.unlink()
    return im, m
def stats(im, m):
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32); v = lab[m > 0]
    return v.mean(0), v.std(0) + 1e-3
if __name__ == '__main__':
    k = sys.argv[1]; ref = sys.argv[2] if len(sys.argv) > 2 else '3'
    rim, rm = planet_mask(ref); rmu, rsd = stats(rim, rm)
    im, m = planet_mask(k); mu, sd = stats(im, m)
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    s = np.array([0.6 * rsd[0] / sd[0] + 0.4, rsd[1] / sd[1], rsd[2] / sd[2]], np.float32)   # keep most of the local contrast
    graded = (lab - mu) * s + rmu
    out = cv2.cvtColor(graded.clip(0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
    w = cv2.GaussianBlur(m.astype(np.float32), (21, 21), 0)[..., None]
    bk = F / 'rejected' / f'{k}-pre-grade.png'
    if not bk.exists(): cv2.imwrite(str(bk), im)
    cv2.imwrite(str(F / f'{k}.png'), (out * w + im * (1 - w)).clip(0, 255).astype(np.uint8))
    print(f'{k}: planet px {int(m.sum())}, Lab mean {np.round(mu - [0,128,128],1)} -> {np.round(rmu - [0,128,128],1)}')
