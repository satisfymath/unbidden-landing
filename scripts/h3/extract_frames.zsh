#!/bin/zsh
# extract_frames.zsh — exact first/last frames + 12-frame contact sheet of a generated clip.
# Usage: scripts/h3/extract_frames.zsh <clip-id> <master.mp4>   → production/frames/clip-<id>/{first,last,sheet}.png
set -eu
ROOT=${0:A:h:h:h}; ID=$1; IN=${2:A}; OUT=$ROOT/production/frames/clip-$ID; mkdir -p $OUT
N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $IN)
ffmpeg -loglevel error -y -i $IN -vf "select='eq(n,0)'" -frames:v 1 $OUT/first.png
ffmpeg -loglevel error -y -i $IN -vf "select='eq(n,$((N-1)))'" -frames:v 1 $OUT/last.png
# 12 evenly spaced frames, 4x3 sheet with frame numbers
STEP=$(( (N-1) / 11 ))
ffmpeg -loglevel error -y -i $IN -vf "select='not(mod(n,$STEP))',drawtext=text='%{n}':x=12:y=12:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5,scale=512:-1,tile=4x3" -frames:v 1 $OUT/sheet.png
echo "$OUT ($N frames, step $STEP)"
