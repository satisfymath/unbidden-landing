"""Fix the planet and moon behind the astronaut without touching him.
1) FLUX 3 re-renders the frame with only the background described anew; 2) Apple Vision masks the astronaut in the
original; 3) the original astronaut pixels are composited over the new background (feathered mask), so helmet and suit
stay pixel-identical. Usage: python scripts/v3/sky.py 5 5B 6A 6E [--seed N]
"""
import argparse, os, subprocess, time
from pathlib import Path
import numpy as np, cv2
ROOT = Path(__file__).resolve().parents[2]
LAB = Path('/Users/david/AI-Video-Lab')
F = ROOT / 'production/v3/frames'
CLI = LAB / 'environments/mflux-flux3/bin/mflux-generate-flux3-edit'
MASK = LAB / 'scripts/mask_fg.swift'
KEEP = ('Reference 1 is this exact frame. Reproduce it EXACTLY: the same camera, the same astronaut, the same helmet, '
        'visor, suit, harness and backpack, pixel for pixel, the same rocky ground. Change ONLY the sky and the planet in '
        'the background as described: ')
SKY = {
    '4': 'keep the planet EXACTLY as it is (same position, same limb, same clouds, same city lights on the left, same '
         'hurricane side on the right) and the small moon exactly where it is; the sky around them is deep black with only '
         'sparse small stars, NO nebula, NO milky way band, NO mottled texture, NO dust clouds in the sky.',
    '5': 'the planet has slid further to the RIGHT: only its LEFT part is visible, filling the right third of the frame '
         'behind the helmet: the dark night side of the planet with many warm amber city lights and a few soft clouds, '
         'under the thin glowing blue limb that curves down toward the right edge. NO hurricane, NO white spiral storm, '
         'NO moon anywhere. Black starry sky on the left and above.',
    '5B': 'keep the planet edge on the right EXACTLY as it is (thin curved glowing blue limb, dark night side with a few '
          'warm amber city lights). The rest of the sky is deep black with only sparse small stars: NO nebula, NO mottled '
          'texture, NO dust clouds, NO milky way. NO moon.',
    '6A': 'only the very LEFT edge of the planet is visible at the far right edge of the frame: a thin curved glowing blue '
          'limb with a sliver of dark night side and two or three warm amber city lights. NO hurricane, NO white spiral '
          'storm, NO moon. The rest of the sky is black with sparse stars.',
    '6E': 'the planet enters from the LEFT side of the frame, low, and the part we see is its DAY-LIT cloudy side: bright '
          'blue ocean covered with WHITE swirling clouds and the large WHITE SPIRAL HURRICANE with its eye clearly '
          'visible near the left edge, under a glowing blue limb. This part of the planet is daylight: absolutely NO '
          'amber lights, NO orange, NO city lights, NO dark night side anywhere. The small grey moon hangs in the black sky '
          'ABOVE the hurricane, upper left, one single moon. Black starry sky elsewhere.',
}
STYLE = ' One single photorealistic frame, large-format 65mm, NASA photography realism, deep blacks, no text.'

def run(k, seed):
    src = F / f'{k}.png'
    bk = F / 'rejected' / f'{k}-pre-sky2.png'
    bk.parent.mkdir(exist_ok=True); bk.write_bytes(src.read_bytes())
    gen = F / f'_sky-{k}.png'
    if gen.exists(): gen.unlink()
    env = dict(os.environ, HF_HOME=str(LAB / 'models/hf'), HF_HUB_OFFLINE='1')
    t = time.monotonic()
    subprocess.run([str(CLI), '--model', 'flux3-image-klein', '--quantize', '8', '--low-ram', '--steps', '16', '--seed', str(seed),
                    '--width', '1344', '--height', '768', '--image-paths', str(bk), '--prompt', KEEP + SKY[k] + STYLE,
                    '--output', str(gen)], env=env, stdout=open(F / f'_sky-{k}.log', 'w'), stderr=subprocess.STDOUT, check=True)
    mpath = F / f'_mask-{k}.png'
    subprocess.run(['swift', str(MASK), str(bk), str(mpath)], check=True, capture_output=True)
    o = cv2.imread(str(bk)).astype(np.float32); g = cv2.imread(str(gen)).astype(np.float32)
    m = cv2.imread(str(mpath), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
    m = cv2.resize(m, (o.shape[1], o.shape[0]))
    m = cv2.GaussianBlur(cv2.dilate((m > 0.5).astype(np.float32), np.ones((5, 5)), 1), (9, 9), 0)[..., None]
    out = o * m + g * (1 - m)
    cv2.imwrite(str(src), out.clip(0, 255).astype(np.uint8))
    print(f'{k}: done in {time.monotonic() - t:.0f}s, astronaut mask {float(m.mean()):.2f} of frame')

ap = argparse.ArgumentParser(); ap.add_argument('frames', nargs='+'); ap.add_argument('--seed', type=int, default=1)
a = ap.parse_args()
for k in a.frames: run(k, a.seed)
