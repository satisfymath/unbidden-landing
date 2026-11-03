"""Remove helmet 'ear cups' that stick out of the dome silhouette.
1) FLUX 3 renders the same frame with a smooth dome (prompt), used ONLY as background source near the head;
2) the original image is kept everywhere except a band just outside a hand-fitted dome circle, above a floor row:
   there the FLUX render (where it shows sky/planet, i.e. not white helmet) replaces the original.
Usage: python earfix.py <frame> <cx> <cy> <r> <band> <y_floor> [seed]
"""
import sys, os, subprocess
from pathlib import Path
import numpy as np, cv2
ROOT = Path(__file__).resolve().parents[2]; LAB = Path('/Users/david/AI-Video-Lab'); F = ROOT / 'production/v3/frames'
CLI = LAB / 'environments/mflux-flux3/bin/mflux-generate-flux3-edit'
k = sys.argv[1]; cx, cy, r, band, yf = map(float, sys.argv[2:7]); seed = sys.argv[7] if len(sys.argv) > 7 else '1'
src = F / f'{k}.png'; bk = F / 'rejected' / f'{k}-pre-ears.png'
if not bk.exists(): bk.write_bytes(src.read_bytes())
gen = F / f'_ears-{k}.png'
if gen.exists(): gen.unlink()
prompt = ('Reference 1 is this exact frame. Reproduce it EXACTLY: same camera, same astronaut, same planet, sky, moon and '
          'ground. Remove everything that sticks out on the left and right of the helmet: the background (sky and planet) '
          'continues right up to a smooth round helmet outline, with NOTHING protruding. No text.')
env = dict(os.environ, HF_HOME=str(LAB / 'models/hf'), HF_HUB_OFFLINE='1')
subprocess.run([str(CLI), '--model', 'flux3-image-klein', '--quantize', '8', '--low-ram', '--steps', '16', '--seed', seed,
                '--width', '1344', '--height', '768', '--image-paths', str(bk), '--prompt', prompt, '--output', str(gen)],
               env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
o = cv2.imread(str(bk)).astype(np.float32); g = cv2.imread(str(gen)).astype(np.float32); H, W = o.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]; d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
band_m = (d > r) & (d < r + band) & (yy < yf)
w = np.clip((d - r) / 1.5, 0, 1) * band_m
w = cv2.GaussianBlur(w.astype(np.float32), (3, 3), 0)
# fade the band out toward its outer edge so the join with the untouched background is invisible
w *= np.clip((r + band - d) / 4.0, 0, 1)
out = o * (1 - w[..., None]) + g * w[..., None]
cv2.imwrite(str(F / f'_cand-{k}-ears-s{seed}.png'), out.clip(0, 255).astype(np.uint8))
print(k, 'seed', seed, 'done')
