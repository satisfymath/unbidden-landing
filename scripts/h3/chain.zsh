#!/bin/zsh
# chain.zsh — generate clips <from>..<to> in sequence, each starting from the REAL last frame of the previous clip.
# Waits for the previous clip's master.mp4, extracts its frames, runs the SSIM QC, then launches the next one.
# Usage: scripts/h3/chain.zsh <from> <to> [seed]      e.g. scripts/h3/chain.zsh 3 7
set -u
ROOT=${0:A:h:h:h}; FROM=$1; TO=$2; SEED=${3:-1}; LOG=$ROOT/production/chain.log
for n in $(seq $FROM $TO); do
  ID=$(printf %02d $n); PREV=$(printf %02d $((n-1)))
  until [ -f $ROOT/production/clips/clip-$PREV/s$SEED/master.mp4 ]; do sleep 30; done
  zsh $ROOT/scripts/h3/extract_frames.zsh $PREV $ROOT/production/clips/clip-$PREV/s$SEED/master.mp4 >> $LOG 2>&1
  echo "clip-$PREV first vs kf-$n:   $(zsh $ROOT/scripts/h3/qc_compare.zsh $ROOT/production/frames/clip-$PREV/first.png $ROOT/production/plates/kf-$n.png 2>/dev/null)" | tee -a $LOG
  echo "clip-$PREV last  vs kf-$((n)):  $(zsh $ROOT/scripts/h3/qc_compare.zsh $ROOT/production/frames/clip-$PREV/last.png $ROOT/production/plates/kf-$n.png 2>/dev/null)" | tee -a $LOG
  LAST=$ROOT/production/plates/kf-$((n+1)).png; [ $n -eq 7 ] && LAST=$ROOT/production/plates/kf-8-clean.png
  echo "$(date +%H:%M) launching clip-$ID: first=frames/clip-$PREV/last.png last=${LAST:t} seed $SEED" | tee -a $LOG
  zsh $ROOT/scripts/h3/fl2va.zsh $ID $ROOT/production/frames/clip-$PREV/last.png $LAST 124 $SEED $ROOT/production/clips/clip-$ID/prompt-v1.txt 2>&1 | tee -a $LOG
done
ID=$(printf %02d $TO)
zsh $ROOT/scripts/h3/extract_frames.zsh $ID $ROOT/production/clips/clip-$ID/s$SEED/master.mp4 >> $LOG 2>&1
echo "$(date +%H:%M) chain done" | tee -a $LOG
