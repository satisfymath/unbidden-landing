#!/bin/zsh
# integrate.zsh — approved V2 clip → 1080p (ESRGAN/Lanczos blend) → web encodes → frames set in src/content/film.ts.
# Usage: scripts/v2/integrate.zsh <from> <to> [seed=1] [clips-dir=production/v2/clips]
set -eu
ROOT=${0:A:h:h:h}; FROM=$1 TO=$2 SEED=${3:-1}; CD=${4:-$ROOT/production/v2/clips}; ID=$FROM-$TO
M=$CD/clip-$ID/s$SEED/master.mp4; [ -f $M ] || { echo "missing $M"; exit 1; }
U=$ROOT/production/v2/upscale; mkdir -p $U
zsh $ROOT/scripts/post/upscale.zsh $M $U/clip-$ID
zsh $ROOT/scripts/post/encode_web.zsh $U/clip-$ID-blend.mov $ID
FR=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $M)
python3 - "$ROOT/src/content/film.ts" "$FROM" "$TO" "$FR" <<'PY'
import re, sys
p, frm, to, fr = sys.argv[1:]
s = open(p).read()
pat = re.compile(r"(\{ from: '%s', to: '%s',[^\n]*?)(, frames: \d+)?(, status: '[a-z]+')?( \},)" % (re.escape(frm), re.escape(to)))
m = pat.search(s); assert m, "segment not found"
s = s[:m.start()] + m.group(1) + f", frames: {fr}, status: 'approved'" + m.group(4) + s[m.end():]
open(p, 'w').write(s); print(f"film.ts: {frm}->{to} frames {fr} approved")
PY
