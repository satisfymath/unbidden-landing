"""Make the astronaut's suit, helmet and backpack match the canonical design (frame 4) in another frame, touching
nothing else: FLUX 3 edits the frame with frame 4 as the design reference; only the astronaut pixels (Apple Vision mask
of the original, dilated) are taken from the edit. Usage: python scripts/v3/suit.py <frame> [--seed N] [--box x0,y0,x1,y1]
"""
import argparse, os, subprocess, time
from pathlib import Path
import numpy as np, cv2
ROOT = Path(__file__).resolve().parents[2]
LAB = Path('/Users/david/AI-Video-Lab')
F = ROOT / 'production/v3/frames'
CLI = LAB / 'environments/mflux-flux3/bin/mflux-generate-flux3-edit'
MASK = LAB / 'scripts/mask_fg.swift'
DESIGN = ('the white helmet has a rectangular rear vent block with a dark grille at the upper back, plain white round side '
          'discs with concentric rings and NO lights, no red, no colour; the square white backpack has two small dark '
          'square windows at its two TOP corners, a thin black ring emblem with a small dot in the middle of its back panel, '
          'and a lower panel with one wide dark horizontal slot and two small dark squares at its sides; a thin grey hose '
          'runs down from the right side of the backpack; plain white-grey suit fabric with NO patches, NO flags, NO badges '
          'on the shoulders or arms; black gloves; white boots. ')
FIX = {
    '2': 'Change ONLY the small astronaut so his helmet, backpack and suit match reference 2 exactly: ' + DESIGN,
    '3': 'Change ONLY the astronaut so his helmet, backpack and suit match reference 2 exactly: ' + DESIGN,
    '6F': 'Change ONLY the astronaut so his helmet, backpack and suit match reference 2 exactly: ' + DESIGN,
    '3w': 'Change ONLY one thing: remove the dark square window in the upper middle of the backpack\'s back panel; the '
          'panel there is plain white with the same dust specks and wear as around it. Keep the two small windows at the '
          'top corners, the ring emblem and everything else exactly as it is.',
    '6Fw': 'Change ONLY one thing: remove the dark rectangular window in the upper middle of the backpack\'s back panel; '
           'the panel there is plain white with the same dust and wear. Keep the two small windows at the top corners, the '
           'ring emblem and everything else exactly as it is.',
    '6Dr': 'Change ONLY the reflection inside the dark convex visor glass: the curved reflection of the planet must show '
           'the large white SPIRAL HURRICANE on the RIGHT part of the reflected planet and the warm amber CITY LIGHTS on its '
           'LEFT part, exactly like reference 2, with the thin blue limb arching above, the small bright sun highlight in the '
           'upper left of the glass and dark rocky ground reflected in the lower part. Keep the helmet, rim, side disc and '
           'everything outside the glass exactly as it is.',
    '4v': 'Change ONLY the right edge of the helmet: the helmet is seen almost directly from behind, so its outline is a '
          'smooth round white dome and the dark visor does NOT bulge out past the helmet outline; at most a very thin '
          'curved sliver of the black visor edge shows along the right side of the helmet, inside the round silhouette. '
          'The round side disc stays where it is. Keep the planet behind and everything else exactly as it is.',
    '3h': 'Change ONLY the astronaut\'s helmet so it matches the helmet seen from behind in reference 2: a bright WHITE '
          'rounded dome lit by the same light as the backpack, with the rectangular rear vent block and dark grille at the '
          'upper back, thin panel seams, and the two round side discs SMALL and nearly flush with the shell at ear height, '
          'white with concentric rings, only slightly bulging at the left and right edges of the silhouette, not like '
          'headphones. Same size and position of the helmet. Keep the backpack, suit, planet and everything else exactly.',
    'patch': 'Change ONLY one thing: remove the rectangular patch and its dark insignia from the upper arm; the sleeve '
             'there is plain white-grey suit fabric with the same folds, seams and shading. Everything else stays exactly.',
    'fabric': 'Change ONLY the suit fabric on the shoulder: it is plain white-grey woven fabric with soft folds, stitched '
              'seams and light dust, with NO embossed pattern, NO maze or circuit texture, NO print. Keep the harness strap, '
              'the backpack and everything else exactly.',
    '4': 'Change ONLY two things: (1) remove the rectangular patch on the astronaut\'s right shoulder and upper arm, the '
         'fabric there is plain white-grey with the same folds and dust; (2) remove the grey hose and its connector on the '
         'right side of the backpack, the side of the backpack there is plain white panel. Everything else stays exactly '
         'as it is: the backpack, its emblem, the harness strap, the helmet, the planet and the ground.',
}
ap = argparse.ArgumentParser(); ap.add_argument('frame'); ap.add_argument('--fix'); ap.add_argument('--seed', type=int, default=1); ap.add_argument('--box'); ap.add_argument('--mask')
a = ap.parse_args(); k = a.frame; fixkey = a.fix or k
src = F / f'{k}.png'; bk = F / 'rejected' / f'{k}-pre-{fixkey}.png'
bk.parent.mkdir(exist_ok=True); bk.write_bytes(src.read_bytes())
refs = [str(bk)] + ([str(F / '6C.png')] if fixkey == '6Dr' else [str(F / '4.png')] if fixkey == '3h' else [] if fixkey in ('4', '4v', '3w', '6Fw', 'patch', 'fabric') else [str(F / 'rejected' / '4-pre-suit.png') if (F / 'rejected' / '4-pre-suit.png').exists() else str(F / '4.png')])
prompt = ('Reference 1 is this exact frame. Reproduce it EXACTLY, pixel for pixel: same camera, same framing, same astronaut '
          'pose and size, same planet, moon, sky and rocky ground. ' + (('Reference 2 is ONLY the design reference of this '
          'astronaut seen close from behind: do NOT copy its framing. ') if len(refs) > 1 else '') + FIX[fixkey] +
          (' Reference 2 is ONLY the design reference of the helmet; do NOT copy its framing.' if fixkey == '3h' else '') + (' Reference 2 shows the correct orientation of the reflected planet; do NOT copy its framing.' if fixkey == '6Dr' else '') + ' One single photorealistic frame, large-format 65mm, NASA photography realism, no text.')
gen = F / f'_suit-{k}.png'
if gen.exists(): gen.unlink()
env = dict(os.environ, HF_HOME=str(LAB / 'models/hf'), HF_HUB_OFFLINE='1')
t = time.monotonic()
subprocess.run([str(CLI), '--model', 'flux3-image-klein', '--quantize', '8', '--low-ram', '--steps', '16', '--seed', str(a.seed),
                '--width', '1344', '--height', '768', '--image-paths', *refs, '--prompt', prompt, '--output', str(gen)],
               env=env, stdout=open(F / f'_suit-{k}.log', 'w'), stderr=subprocess.STDOUT, check=True)
o = cv2.imread(str(bk)).astype(np.float32); g = cv2.imread(str(gen)).astype(np.float32)
if a.mask:
    m = (cv2.imread(a.mask, 0) > 127).astype(np.float32)
elif a.box:
    x0, y0, x1, y1 = map(int, a.box.split(','))
    m = np.zeros(o.shape[:2], np.float32); m[y0:y1, x0:x1] = 1
else:
    mp = F / f'_mask-{k}.png'
    subprocess.run(['swift', str(MASK), str(bk), str(mp)], check=True, capture_output=True)
    m = cv2.resize(cv2.imread(str(mp), 0), (o.shape[1], o.shape[0])).astype(np.float32) / 255
    m = cv2.dilate((m > 0.5).astype(np.float32), np.ones((9, 9)), 1)
m = cv2.GaussianBlur(m, (11, 11), 0)[..., None]
cv2.imwrite(str(F / f'_cand-{k}-s{a.seed}.png'), (o * (1 - m) + g * m).clip(0, 255).astype(np.uint8))
print(f'{k} s{a.seed}: {time.monotonic() - t:.0f}s')
