"""V3 keyframes with FLUX 3 Image Klein (mflux, MLX, local): one coherent world, one astronaut, one camera path.

Every frame is generated from (1) the approved master of that moment as a composition guide, (2) the immediately
preceding NEW frame for continuity of light, materials and identity, and (3) a canonical identity sheet of the
astronaut generated first. The world geometry is fixed in WORLD (below): the planet never moves; what is visible
behind the astronaut follows from where the camera stands. Never overwrites sequence/.

Usage: python scripts/v3/frames.py sheet 1 2 3 ... [--seed N] [--force]
"""
import argparse, json, os, subprocess, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = Path('/Users/david/AI-Video-Lab')
SEQ = ROOT / 'sequence'
OUT = ROOT / 'production/v3/frames'
CLI = LAB / 'environments/mflux-flux3/bin/mflux-generate-flux3-edit'
ORDER = ['1', '2', '3', '4', '5', '6A', '6B', '6C', '6D', '6E', '6F', '7', '8']

ASTRONAUT = (
    'ONE astronaut, always the same person and the same suit: a white-grey EVA spacesuit with fine dust specks and '
    'small black scuffs; a rounded white hard-shell helmet with thin panel seams and small rectangular clips along '
    'the crown; a large dark convex black visor framed by a white rim; ONE round metal side mechanism, a flat disc '
    'with concentric rings, on EACH side of the helmet at ear height; a small rear vent grille at the back of the '
    'helmet; a ribbed fabric neck ring; grey chest harness straps with flat metal buckles; a square white life-support '
    'backpack with weathered panels whose only marking is a small thin line emblem, an open ring with a dot beside its '
    'gap. The emblem appears ONLY on the backpack. No other logos, no flags, no name tags, no text anywhere. '
    'The astronaut stands perfectly still and upright on the same spot, feet planted, arms down at the sides, head '
    'and body facing the planet. No face is visible through the visor; the visor is opaque black glass that only '
    'reflects. '
)
WORLD = (
    'WORLD, fixed for every frame: the astronaut stands on the crest of a rugged dark grey rocky ridge on an airless '
    'moon, black sky with sparse stars. Directly in FRONT of the astronaut, filling a huge part of the sky, is ONE '
    'Earth-like planet seen at night: a glowing thin blue atmospheric limb, a dark night side with warm amber city '
    'lights on the planet\'s LEFT half and ONE large white spiral hurricane on its RIGHT half (left and right as seen '
    'from behind the astronaut). A small grey moon hangs above the planet\'s upper right. Cold, low sunlight comes '
    'from the right and slightly behind the astronaut. The planet never moves and never rotates: what part of it is '
    'visible depends only on where the camera stands. Exactly one planet and one small moon; when the camera is in '
    'front of the astronaut the planet is behind the camera and is seen ONLY as a reflection in the visor. '
)
STYLE = (
    'One single photorealistic frame from a large-format 65mm space film, authentic NASA photography realism, '
    'physically credible light, deep blacks, dark navy blues, cold whites, controlled contrast, fine film grain. '
    'Not a collage, not a split image, no borders, no text, no watermark. '
)

# camera bearing: 0 = directly behind the astronaut, angles increase as the camera moves around to his RIGHT side
# and on to the front (180), then to his LEFT side (270) and back behind (360).
FRAMES = {
    '1': ('The universe', 'Camera high above the ridge, far behind the astronaut and looking at the planet. Only space: '
          'the planet fills the lower two thirds of the frame, blue limb arching across, city lights on its left half, '
          'the hurricane right of center, the small moon upper right. No ground and no astronaut are visible yet.'),
    '2': ('The discovery', 'Camera lower, far behind the astronaut (bearing 0), looking toward the planet. The rocky ridge '
          'crosses the lower part of the frame with boulders in the near foreground at the left; a tiny astronaut, '
          'seen from behind, stands on the crest right of center; the planet fills the sky above, moon upper right.'),
    '3': ('The approach', 'Camera behind the astronaut (bearing 0), closer: the astronaut in a medium-wide shot from behind, '
          'right of center, square backpack visible, helmet against the planet; the hurricane and the city lights '
          'visible on either side of him; moon upper right.'),
    '4': ('The identity', 'Camera very close behind the astronaut (bearing 0), slightly above shoulder height: the back of '
          'the helmet with its rear vent grille in the upper center and the square backpack with its small emblem '
          'filling the lower center; the planet out of focus behind, moon upper right.'),
    '5': ('The arc begins', 'Camera close, behind and to the RIGHT of the astronaut (bearing 45): the right rear three-quarter '
          'of the helmet, the right side mechanism near the center, the edge of the visor on the right catching a '
          'reflection; the backpack at the left edge. In the background on the right, out of focus: the planet\'s RIGHT '
          'side with the hurricane, moon upper right.'),
    '6A': ('Three quarters', 'Camera close at the astronaut\'s RIGHT side, slightly toward the front (bearing 100): a right '
           'three-quarter view of the helmet, the visor large on the right half of the helmet reflecting the planet, '
           'the right side mechanism on the left of the helmet, shoulder and backpack edge at the far left. Background '
           'right of the helmet: the planet\'s RIGHT limb with the HURRICANE side, out of focus, rocky ground low.'),
    '6B': ('Almost frontal', 'Camera close, in front and to the right of the astronaut (bearing 140): the helmet almost '
           'frontal, the visor nearly filling it. The real planet is now behind the camera and NOT visible in the '
           'background: black starry sky and soft grey rocky ground behind the helmet. The planet, its hurricane and '
           'city lights appear only as a curved reflection in the convex visor, with a small bright specular highlight.'),
    '6C': ('The gaze', 'Camera directly in front of the astronaut (bearing 180), close: heroic symmetrical frontal close-up, '
           'the visor fills most of the frame, both side mechanisms visible at left and right. The whole planet with '
           'its hurricane, city lights and the small moon is reflected large and curved in the convex visor, with the '
           'rocky ground reflected in its lower part and a bright specular highlight near the top. Background: black sky '
           'and rocky ground only, no planet.'),
    '6D': ('Crossing over', 'Camera close, in front and to the LEFT of the astronaut (bearing 220): the helmet in a left '
           'three-quarter frontal view, the visor on the left of the helmet, the LEFT side mechanism on the right of '
           'the helmet. The planet\'s reflection is compressed toward the right edge of the visor and smaller; the '
           'specular highlight has moved to the upper left of the glass. Background: rocky ground and black sky, '
           'no planet; the backpack edge appears at the far right.'),
    '6E': ('The far profile', 'Camera close at the astronaut\'s LEFT side (bearing 270): the helmet in full left profile '
           'facing left, the visor seen edge-on at the left of the helmet with only a small dim reflection, the left '
           'side mechanism in the middle, the rear vent grille at the right, the backpack at the right edge. In the '
           'background at the LEFT, out of focus: the planet\'s LEFT side with the warm city lights and the blue limb.'),
    '6F': ('Contemplation', 'Camera behind the astronaut and slightly to his LEFT (bearing 320), farther away: the whole '
           'astronaut, full body, standing upright on the crest, right of center, seen from behind and a little from '
           'his left side, backpack with emblem visible; the planet fills the sky ahead, hurricane and city lights, '
           'moon upper right; boulders in the near foreground.'),
    '7': ('The great pullback', 'Camera far behind the astronaut (bearing 360) and higher: a wide shot of the rocky ridge, '
          'the astronaut a small white figure on the crest center right, the planet\'s immense limb spanning the upper '
          'frame, moon upper right.'),
    '8': ('The unknown', 'Camera very far behind, with a long lens: the planet appears as a complete round disc above the '
          'horizon, centered, hurricane right of center, city lights on its left, the small moon clearly separated in the '
          'upper right; dark textured rocky ground across the lower third; the astronaut an almost imperceptible white '
          'speck standing at the bottom center; deep space with sparse stars.'),
}

def spec(name):
    if name == 'sheet':
        refs = [SEQ / '4.png', SEQ / '6C.png', SEQ / '6E.png', SEQ / '6F.png']
        prompt = ('A clean character turnaround sheet of ONE astronaut, photorealistic, four views side by side on a plain '
                  'dark charcoal studio background with even soft light: back view, right profile, front view, left '
                  'profile, all full body, same scale, same suit and helmet, standing upright, arms down. References 1 '
                  'to 4 show this exact astronaut from the back, front, left side and full body: unify them into ONE '
                  'consistent design, keeping the details they agree on. ' + ASTRONAUT +
                  'No planet, no moon, no ground. No text labels.')
        return {'refs': [str(p) for p in refs], 'prompt': prompt, 'title': 'Identity sheet'}
    title, body = FRAMES[name]
    i = ORDER.index(name)
    refs = [SEQ / f'{name}.png']
    intro = ('Reference 1 is the approved storyboard frame for this moment: follow its composition, framing, lens and '
             'lighting mood, but correct anything that contradicts the WORLD and the ASTRONAUT described below. ')
    if i > 0:
        refs.append(OUT / f'{ORDER[i - 1]}.png')
        intro += ('Reference 2 is the previous frame of the same continuous shot, a moment earlier: keep its exact '
                  'colour grade, exposure, materials, the same astronaut and the same planet; only the camera has moved. ')
    if name not in ('1',):
        refs.append(OUT / 'sheet.png')
        intro += f'Reference {len(refs)} is ONLY the identity sheet of this astronaut, not additional people. '
    prompt = intro + '\n\n' + 'THIS FRAME: ' + body + '\n\n' + WORLD + ('' if name == '1' else ASTRONAUT) + STYLE
    return {'refs': [str(p) for p in refs], 'prompt': prompt, 'title': title}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('frames', nargs='+', choices=['sheet'] + ORDER)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'manifest.json').write_text(json.dumps({'engine': 'mflux 0.24 / FLUX 3 Image Klein / MLX q8', 'size': '1344x768',
        'order': ORDER, 'frames': {n: spec(n) for n in ['sheet'] + ORDER if n == 'sheet' or (OUT / 'sheet.png').exists() or True}}, indent=2))
    env = dict(os.environ, HF_HOME=str(LAB / 'models/hf'), HF_HUB_OFFLINE='1')
    for name in a.frames:
        s = spec(name)
        img = OUT / f'{name}.png'
        if img.exists() and not a.force:
            print(f'SKIP {name}', flush=True); continue
        for p in s['refs']:
            if not Path(p).is_file(): raise FileNotFoundError(p)
        (OUT / f'{name}.prompt.txt').write_text(s['prompt'] + '\n\nREFS:\n' + '\n'.join(s['refs']))
        cmd = ['/usr/bin/caffeinate', '-i', '-s', str(CLI), '--model', 'flux3-image-klein', '--quantize', '8', '--low-ram',
               '--steps', '16', '--seed', str(a.seed), '--width', '1344', '--height', '768',
               '--image-paths', *s['refs'], '--prompt', s['prompt'], '--output', str(img)]
        print(f'START {name}: {s["title"]} ({len(s["refs"])} refs)', flush=True)
        t = time.monotonic()
        with open(OUT / f'{name}.log', 'w') as log:
            r = subprocess.run(cmd, env=env, stdout=log, stderr=subprocess.STDOUT)
        print(f'{"OK" if r.returncode == 0 and img.exists() else "FAIL"} {name} {time.monotonic() - t:.0f}s', flush=True)
        if r.returncode != 0: raise SystemExit(1)

if __name__ == '__main__':
    main()
