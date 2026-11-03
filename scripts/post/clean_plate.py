# clean_plate.py — frame 8 without the baked logo, wordmark and tagline.
# Detects the glyphs (strokes AND their dark drop shadows) as deviations from a median sky background inside the
# branding box, removes only those pixels, keeps the stars, and fills the thin holes with a small-kernel normalized
# convolution so the sky gradient toward the limb stays intact. Never writes to sequence/.
# Usage: ~/AI-Video-Lab/environments/metrics/bin/python scripts/post/clean_plate.py
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = 'sequence/8.png'
OUT = 'production/plates/kf-8-clean-master.png'
PLATE = 'production/plates/kf-8-clean.png'
img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
x0, y0, x1, y1 = 560, 20, 1120, 310                     # branding box on the 1672x941 master, generous
box = img[y0:y1, x0:x1]
lum = box.mean(axis=2)
bg = ndi.median_filter(lum, size=61)                     # sky without thin strokes
dev = np.abs(lum - bg) > 3.5                             # strokes and shadows
lab, n = ndi.label(dev)
sizes = ndi.sum(dev, lab, range(1, n + 1))
big = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 20])   # letters, ring: stars are smaller
tag = np.zeros_like(dev); tag[195 - y0:305 - y0, 600 - x0:1080 - x0] = True  # wordmark + tagline bands: remove every deviation (incl. the i dot)
glyph = big | (dev & tag)
glyph = ndi.binary_dilation(glyph, iterations=10)   # the strokes carry a wide, faint glow halo
# fill: the sky here is a smooth vertical gradient toward the limb glow, so each hole pixel takes the median of the
# valid sky pixels of its own row within a +-140 px window (windowed row median), then a little of the image's noise.
valid = ~ndi.binary_dilation(glyph, iterations=4)
filled = box.copy()
Hh, Ww = glyph.shape
for y in range(Hh):
    xs = np.flatnonzero(glyph[y])
    if xs.size == 0: continue
    for x in xs:
        lo, hi = max(0, x - 140), min(Ww, x + 141)
        v = valid[y, lo:hi]
        if v.sum() < 20:
            lo, hi = 0, Ww; v = valid[y]
        filled[y, x] = np.median(box[y, lo:hi][v], axis=0)
filled = ndi.gaussian_filter(filled, sigma=(2.5, 2.5, 0))
out = img.copy()
noise = np.random.default_rng(8).normal(0, 1.0, size=box.shape).astype(np.float32)
out[y0:y1, x0:x1][glyph] = np.clip(filled[glyph] + noise[glyph], 0, 255)
Image.fromarray(out.astype(np.uint8)).save(OUT)
Image.open(OUT).resize((1024, 576), Image.LANCZOS).save(PLATE)
print(f'removed {int(glyph.sum())} px of glyphs and shadows; wrote {OUT} and {PLATE}')
