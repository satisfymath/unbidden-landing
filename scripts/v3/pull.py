"""Derive a wider frame from a closer canonical one so the astronaut is the same object: reference 1 = the close frame
(content: suit, helmet, backpack, planet, light), reference 2 = the approved wide frame (framing only).
Usage: python scripts/v3/pull.py <out> <close.png> <framing.png> [--seed N]
"""
import argparse, os, subprocess, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]; LAB = Path('/Users/david/AI-Video-Lab')
CLI = LAB / 'environments/mflux-flux3/bin/mflux-generate-flux3-edit'
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('close'); ap.add_argument('framing'); ap.add_argument('--seed', type=int, default=1)
a = ap.parse_args()
p = ('Reference 1 shows the astronaut up close from behind. Rephotograph the SAME scene with the camera pulled straight back '
     'so the framing, camera height, astronaut size and position, ground and planet layout match reference 2 exactly. The '
     'astronaut is the IDENTICAL object as in reference 1: the same white helmet with the same rectangular rear vent block '
     'and grille, the same round side discs, the same square white backpack with exactly the same layout as reference 1 '
     '(two small dark square windows at its two TOP corners, the thin ring emblem in the middle, the lower panel with one wide '
     'dark slot and two small dark squares, the thin grey hose down its right side), the same plain white-grey suit with NO '
     'patches or badges, black gloves, white boots. He stands still and upright, facing the planet. Do NOT copy the '
     'backpack, helmet or suit details from reference 2; reference 2 is ONLY for framing and composition. One single '
     'photorealistic frame, large-format 65mm, NASA photography realism, deep blacks, no text.')
env = dict(os.environ, HF_HOME=str(LAB / 'models/hf'), HF_HUB_OFFLINE='1'); t = time.monotonic()
subprocess.run([str(CLI), '--model', 'flux3-image-klein', '--quantize', '8', '--low-ram', '--steps', '16', '--seed', str(a.seed),
                '--width', '1344', '--height', '768', '--image-paths', a.close, a.framing, '--prompt', p, '--output', a.out],
               env=env, stdout=open(a.out + '.log', 'w'), stderr=subprocess.STDOUT, check=True)
print('OK', a.out, f'{time.monotonic() - t:.0f}s')
