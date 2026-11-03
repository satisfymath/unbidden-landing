#!/bin/zsh
# gen.zsh — one V2 transition with MiniMax H3 FL2VA at 768p, with the continuity protocol built in.
#   start frame  = the real last frame of the previous approved clip when it matches its master (SSIM ≥ 0.85),
#                  otherwise the master plate (re-anchor, recorded in the log)
#   end frame    = the master plate of <to>
#   resolution   = 1344x768 (H3's native 768p); if the memory guard kills the run, retries at 1280x704
# Usage: scripts/v2/gen.zsh <from> <to> <frames 17n+5> [seed=1] [steps=8] [turbo=1]
#   → production/v2/clips/<from>-<to>/s<seed>/{master.mp4,…}, production/v2/frames/<from>-<to>/{first,last,sheet,visor}.png,
#     QC lines appended to production/v2/QC.log
set -u
ROOT=${0:A:h:h:h}; FROM=$1 TO=$2 FR=$3 SEED=${4:-1} STEPS=${5:-8} TURBO=${6:-1}
V2=$ROOT/production/v2; mkdir -p $V2/clips $V2/frames $V2/plates
PL=$ROOT/production/plates/v2; LOG=$V2/QC.log; ID=$FROM-$TO
P=$V2/prompts/$ID.txt; [ -f $P ] || { echo "missing prompt $P"; exit 2; }
# previous clip: the segment whose `to` is our `from`
PREV=$(ls -d $V2/frames/*-$FROM 2>/dev/null | head -1)
START=$PL/kf-$FROM.png; ANCHOR=master
if [ -n "$PREV" ] && [ -f $PREV/last.png ]; then
  SS=$(zsh $ROOT/scripts/h3/qc_compare.zsh $PREV/last.png $PL/kf-$FROM.png | grep -oE "ssim=[0-9.]+" | cut -d= -f2)
  if (( $(echo "$SS >= 0.85" | bc -l) )); then START=$PREV/last.png; ANCHOR="real last frame of ${PREV:t} (ssim $SS vs master)"; else ANCHOR="master (previous last frame drifted: ssim $SS)"; fi
fi
echo "$(date +%H:%M) $ID start=$ANCHOR frames=$FR seed=$SEED steps=$STEPS turbo=$TURBO" | tee -a $LOG
run() { H3OUT=$V2/clips H3W=$1 H3H=$2 H3STEPS=$STEPS H3TURBO=$TURBO zsh $ROOT/scripts/h3/fl2va.zsh $ID $START $PL/kf-$TO.png $FR $SEED $P; }
run 1344 768 || { echo "$(date +%H:%M) $ID 1344x768 failed (memory guard?); retrying at 1280x704" | tee -a $LOG; rm -rf $V2/clips/clip-$ID/s$SEED; run 1280 704; } || { echo "$ID FAILED" | tee -a $LOG; exit 1; }
M=$V2/clips/clip-$ID/s$SEED/master.mp4
D=$V2/frames/$ID; mkdir -p $D
N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $M)
ffmpeg -loglevel error -y -i $M -vf "select='eq(n,0)'" -frames:v 1 $D/first.png
ffmpeg -loglevel error -y -i $M -vf "select='eq(n,$((N-1)))'" -frames:v 1 $D/last.png
ffmpeg -loglevel error -y -i $M -vf "select='not(mod(n,$(( (N-1)/11 ))))',scale=512:-1,tile=4x3:padding=4:color=black" -frames:v 1 $D/sheet.png
# centre crop of 6 frames across the clip (visor / helmet detail)
ffmpeg -loglevel error -y -i $M -vf "select='not(mod(n,$(( (N-1)/5 ))))',crop=iw*0.5:ih*0.6:iw*0.25:ih*0.15,scale=640:-1,tile=3x2:padding=4:color=black" -frames:v 1 $D/visor.png
S1=$(zsh $ROOT/scripts/h3/qc_compare.zsh $D/first.png $PL/kf-$FROM.png | grep -oE "ssim=[0-9.]+ psnr=[0-9.]+")
S2=$(zsh $ROOT/scripts/h3/qc_compare.zsh $D/last.png  $PL/kf-$TO.png   | grep -oE "ssim=[0-9.]+ psnr=[0-9.]+")
echo "$(date +%H:%M) $ID done: $N frames · first vs kf-$FROM $S1 · last vs kf-$TO $S2 · $(python3 -c "import json;d=json.load(open('$V2/clips/clip-$ID/s$SEED/run.json'));print(f\"{d['width']}x{d['height']} {d['elapsed_s']//60} min peak {d.get('peak_gib')} GiB\")")" | tee -a $LOG
