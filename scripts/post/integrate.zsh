#!/bin/zsh
# integrate.zsh — approved clip → 1080p blend upscale → web encodes → enable the segment in src/content/film.ts.
# Usage: scripts/post/integrate.zsh <clip-id 01..07> [seed]
set -eu
ROOT=${0:A:h:h:h}; ID=$1; SEED=${2:-1}; N=${ID#0}
M=$ROOT/production/clips/clip-$ID/s$SEED/master.mp4; [ -f $M ] || { echo "missing $M"; exit 1; }
zsh $ROOT/scripts/post/upscale.zsh $M $ROOT/production/upscale/clip-$ID
zsh $ROOT/scripts/post/encode_web.zsh $ROOT/production/upscale/clip-$ID-blend.mov $ID
FR=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $M)
sed -i '' "s|src: clip($N), |src: clip($N, { frames: $FR }), |" $ROOT/src/content/film.ts
grep -n "id: 'clip-$ID'" $ROOT/src/content/film.ts
