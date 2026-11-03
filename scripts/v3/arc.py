"""Build the 4 → 6A arc backwards from 6A in small camera steps, so the helmet is the SAME object in every frame.
Each new frame is an edit of its neighbour (reference 1 = the frame it starts from, the camera moves ~20° around the
helmet), with the back-of-helmet master as a detail reference for the parts that come into view.
Usage: python scripts/v3/arc.py <out-name> <from-frame.png> <bearing> [--seed N] [--ref extra.png]
"""
import argparse, os, subprocess, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
LAB = Path('/Users/david/AI-Video-Lab')
CLI = LAB / 'environments/mflux-flux3/bin/mflux-generate-flux3-edit'
OUT = ROOT / 'production/v3/arc'
STYLE = ('One single photorealistic frame from a large-format 65mm space film, authentic NASA photography realism, '
         'physically credible light, deep blacks, cold whites, fine film grain. No text, no watermark, no collage.')

LOOK = {
    35: ('WHAT THE CAMERA SEES NOW: the astronaut is seen mostly FROM BEHIND, slightly from his right. The back of the '
         'helmet fills the centre: the rear vent grille block is large and near the centre-left of the helmet; the round '
         'side mechanism has moved to the RIGHT EDGE of the helmet and is seen at a steep angle, as an ellipse; the dark '
         'visor is only a thin curved sliver at the far right edge of the helmet. Below the helmet, the top and back face '
         'of the square backpack are large in the lower left and centre, with its small ring emblem. The planet fills '
         'the background on the right with the hurricane, the small moon upper right in the same place. '),
}

def prompt(bearing, has_ref2):
    p = ('Reference 1 is the previous frame of the SAME continuous camera move. Rephotograph EXACTLY this scene with the '
         f'camera moved about 20 degrees further AROUND the astronaut, toward his BACK (new camera bearing {bearing} degrees, '
         'where 0 is directly behind him and 90 is his right side). The astronaut does not move at all. The camera keeps '
         'EXACTLY the same distance to the helmet, the same height and the same lens: the helmet stays the SAME SIZE in the '
         'frame and fully visible with the same space above it. The helmet is the IDENTICAL object as in reference 1: same '
         'white shell, same panel seams, same small rectangular clips on the crown, same round side mechanism with '
         'concentric rings, same visor rim, same dust specks, same black neck ring; it is only seen from a slightly '
         'different angle, so the visor turns a little away from the camera and more of the back of the helmet and of the '
         'backpack become visible. The real planet stays fixed in space: behind the astronaut on the right, the planet\'s '
         'right side with clouds and the large white spiral hurricane, no city lights; the small moon upper right. Rocky '
         'ground low. Shoulder fabric plain, NO patch, NO flag. ')
    p += LOOK.get(bearing, '')
    if has_ref2:
        p += ('Reference 2 shows ONLY the back of this same helmet and backpack (rear vent grille, backpack top) for the details '
              'that come into view; do NOT copy its framing, distance or crop. ')
    return p + STYLE

ap = argparse.ArgumentParser()
ap.add_argument('name'); ap.add_argument('src'); ap.add_argument('bearing', type=int)
ap.add_argument('--seed', type=int, default=1); ap.add_argument('--ref')
a = ap.parse_args()
OUT.mkdir(parents=True, exist_ok=True)
refs = [a.src] + ([a.ref] if a.ref else [])
img = OUT / f'{a.name}.png'
if img.exists(): img.rename(OUT / f'{a.name}-old-{int(time.time())}.png')
p = prompt(a.bearing, bool(a.ref))
(OUT / f'{a.name}.prompt.txt').write_text(p + '\n\nREFS:\n' + '\n'.join(refs))
env = dict(os.environ, HF_HOME=str(LAB / 'models/hf'), HF_HUB_OFFLINE='1')
t = time.monotonic()
r = subprocess.run([str(CLI), '--model', 'flux3-image-klein', '--quantize', '8', '--low-ram', '--steps', '16',
                    '--seed', str(a.seed), '--width', '1344', '--height', '768', '--image-paths', *refs,
                    '--prompt', p, '--output', str(img)], env=env, stdout=open(OUT / f'{a.name}.log', 'w'), stderr=subprocess.STDOUT)
print(('OK' if r.returncode == 0 and img.exists() else 'FAIL'), a.name, f'{time.monotonic() - t:.0f}s')
