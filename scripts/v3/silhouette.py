"""Trim what protrudes from the helmet's round silhouette (side 'ear cups'), replacing it with the background.
A circle (cx, cy, r) is the helmet dome; pixels in a left/right band outside the circle and above the given floor row are
replaced by the background, rebuilt from the same rows just outside the band (horizontal inpaint), then the dome edge is
softened over 1 px. Usage: python silhouette.py <frame> <cx> <cy> <r> <band_px> <y_floor>
"""
import sys
from pathlib import Path
import numpy as np, cv2
F = Path(__file__).resolve().parents[2] / 'production/v3/frames'
k = sys.argv[1]; cx, cy, r, band, yf = map(float, sys.argv[2:7])
im = cv2.imread(str(F / f'{k}.png')); H, W = im.shape[:2]
bk = F / 'rejected' / f'{k}-pre-silhouette.png'
if not bk.exists(): cv2.imwrite(str(bk), im)
yy, xx = np.mgrid[0:H, 0:W]
d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
m = ((d > r + 0.5) & (d < r + band) & (yy < yf) & (yy > cy - r - 2)).astype(np.uint8) * 255
out = cv2.inpaint(im, m, 7, cv2.INPAINT_TELEA).astype(np.float32)
# add back sky grain from just outside the band
f = im.astype(np.float32); hp = f - cv2.GaussianBlur(f, (0, 0), 2)
shift = np.roll(hp, int(band) + 4, axis=1) * (xx < cx)[..., None] + np.roll(hp, -int(band) - 4, axis=1) * (xx >= cx)[..., None]
out = np.where((m > 0)[..., None], out + shift * 0.8, out)
edge = np.clip((r + 1.0) - d, 0, 1)[..., None]                    # 1 inside the dome, 0 outside, 1-px ramp
keep = (m > 0)[..., None]
res = np.where(keep, f * edge + out * (1 - edge), f)
cv2.imwrite(str(F / f'{k}.png'), res.clip(0, 255).astype(np.uint8))
print(f'{k}: trimmed {int((m > 0).sum())} px outside r={r}')
