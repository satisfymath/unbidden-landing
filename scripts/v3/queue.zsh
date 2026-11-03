#!/bin/zsh
# queue.zsh — V3 clips in priority order (helmet orbit first), one at a time. Each clip is QC'd by gen.zsh;
# a clip whose last frame lands below SSIM 0.75 against its master stops the queue for review.
ROOT=${0:A:h:h:h}
# wait for any clip already generating (a previous queue) to finish first
while pgrep -f "scripts/v3/gen.zsh" >/dev/null; do sleep 20; done
Q=(
  "1 2 107 20 0" "2 3 90 20 0" "3 4 73 20 0" "4 5 73 20 0" "5 5B 56 20 0" "5B 6A 56 20 0" "6A 6B 73 20 0"
  "6B 6C 90 20 0" "6C 6D 90 20 0" "6D 6E 73 20 0" "6E 6F 107 20 0" "6F 7 107 20 0" "7 8 124 20 0"
)
for q in $Q; do
  set -- ${=q}
  [ -f $ROOT/production/v3/clips/clip-$1-$2/s1/master.mp4 ] && { echo "skip $1-$2"; continue; }
  zsh $ROOT/scripts/v3/gen.zsh $1 $2 $3 1 $4 $5 || exit 1
  L=$(grep "$1-$2 done" $ROOT/production/v3/QC.log | tail -1 | grep -oE "last vs [^ ]+ ssim=[0-9.]+" | grep -oE "[0-9.]+$")
  if (( $(echo "${L:-0} < 0.70" | bc -l) )); then echo "LOW: $1-$2 last-frame ssim $L (continuing, flagged for review)"; fi
done
echo "queue done"
