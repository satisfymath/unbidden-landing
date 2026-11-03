#!/bin/zsh
# flf.zsh — first+last-frame transition with LTX-2.5 (ltx-2-mlx 0.18.0, q8 pack). Local only, video only.
# Usage: scripts/ltx/flf.zsh <tag> <first.png> <last.png> <frames 8k+1> <seed> <prompt.txt> <W> <H> <mode>
#   mode: two-stage   dev transformer + CFG, 30+3 steps, both stills as guides (keyframe interpolation)
#         hq          like two-stage but the res_2s HQ refine
#         distilled   8+3 steps, fast
#         dfr         base DFR pass + detailing IC-LoRA (+ optional LTX_SPATIAL=1 for 2x spatial epilogue)
# Env:  LTX_LOWRAM=1 adds --low-ram · LTX_END=0.9 end-anchor strength · LTX_EXTRA="..." raw extra flags
set -u
ROOT=${0:A:h:h:h}; L=~/AI-Video-Lab; RT=$L/environments/ltx-2-mlx-src; M=$L/models/ltx-2.5-mlx-q8
TAG=$1 FIRST=${2:A} LAST=${3:A} FR=$4 SEED=$5 PF=${6:A} W=$7 H=$8 MODE=$9
OUT=$ROOT/production/ltx/$TAG; mkdir -p $OUT
[ -f $OUT/master.mp4 ] && { echo "exists $OUT/master.mp4"; exit 0; }
ffmpeg -loglevel error -y -i $FIRST -vf "scale=$W:$H:force_original_aspect_ratio=increase:flags=lanczos,crop=$W:$H" $OUT/_first.png
ffmpeg -loglevel error -y -i $LAST  -vf "scale=$W:$H:force_original_aspect_ratio=increase:flags=lanczos,crop=$W:$H" $OUT/_last.png
cp $PF $OUT/prompt.txt
case $MODE in
  two-stage) PIPE=(--two-stage) ;;
  hq)        PIPE=(--two-stages-hq) ;;
  distilled) PIPE=(--distilled) ;;
  dfr)       PIPE=(--dfr --detailing-lora $L/models/loras/ltx-2.5/pixel-spatial-upscaler/ltx-2.5-22b-ic-lora-pixel-spatial-upscaler-x2-1.0.safetensors); [ -n "${LTX_SPATIAL:-}" ] && PIPE+=(--spatial-upscalings $LTX_SPATIAL) ;;
  *) echo "bad mode"; exit 2 ;;
esac
LR=(); [ -n "${LTX_LOWRAM:-}" ] && LR=(--low-ram)
CMD=(.venv/bin/ltx-2-mlx generate $PIPE --model $M --prompt "$(cat $PF)" \
  --image $OUT/_first.png 0 1.0 replace 0 --image $OUT/_last.png last ${LTX_END:-1.0} guide 0 \
  --width $W --height $H --frames $FR --frame-rate 24 --seed $SEED --no-audio $LR ${=LTX_EXTRA:-} --output $OUT/master.mp4)
{ echo "#!/bin/zsh"; echo "cd $RT"; print -r -- "/usr/bin/caffeinate -i -s ${(q)CMD[@]}"; } > $OUT/cmd.sh
T0=$(date +%s); echo "start $(date -Iseconds) $TAG ${W}x${H} f$FR $MODE seed $SEED" > $OUT/log.txt
( cd $RT && LTX2_COMPUTE_DTYPE=${LTX_DTYPE:-float16} /usr/bin/caffeinate -i -s "${CMD[@]}" ) >> $OUT/log.txt 2>&1
T1=$(date +%s)
[ -f $OUT/master.mp4 ] || { echo "FAIL $TAG (see $OUT/log.txt)"; tail -5 $OUT/log.txt; exit 1; }
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $OUT/master.mp4)
PEAK=$(grep -oiE "peak[^0-9]*[0-9.]+ ?GB" $OUT/log.txt | grep -oE "[0-9.]+" | sort -n | tail -1)
cat > $OUT/run.json <<J
{"tag":"$TAG","mode":"$MODE","model":"ltx-2.5-mlx-q8","width":$W,"height":$H,"frames_requested":$FR,"frames_decoded":$NF,"seed":$SEED,
 "end_strength":${LTX_END:-1.0},"elapsed_s":$((T1-T0)),"peak_gb":${PEAK:-null},"first":"$FIRST","last":"$LAST"}
J
echo "ok $OUT/master.mp4 ($NF frames, $(( (T1-T0)/60 )) min, peak ${PEAK:-?} GB)"
