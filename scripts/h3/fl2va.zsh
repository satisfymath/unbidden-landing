#!/bin/zsh
# fl2va.zsh — one FL2VA transition with MiniMax H3 (mlx-h3, Turbo LoRA). Local only.
# Usage: scripts/h3/fl2va.zsh <clip-id> <first.png> <last.png> <frames> <seed> <prompt.txt>
# Env:   H3W (1024) H3H (576) H3STEPS (8) H3BUDGET (50) H3TURBO (1; 0 = base model, 20 steps) H3OUT (production/clips)
# Output: production/clips/clip-<id>/s<seed>/{master-audio.mp4,master.mp4,_first.png,_last.png,prompt.txt,cmd.sh,log.txt,run.json}
set -u
ROOT=${0:A:h:h:h}; L=~/AI-Video-Lab; M=$L/models/minimax-h3-8bit-mlx; RT=$L/environments/mlx-h3-src
ID=$1 FIRST=${2:A} LAST=${3:A} FR=$4 SEED=$5 PF=${6:A}
W=${H3W:-1024}; H=${H3H:-576}; ST=${H3STEPS:-8}; B=${H3BUDGET:-50}
OUT=${H3OUT:-$ROOT/production/clips}/clip-$ID/s$SEED; mkdir -p $OUT
[ -f $OUT/master.mp4 ] && { echo "exists $OUT/master.mp4"; exit 0; }
ffmpeg -loglevel error -y -i $FIRST -vf "scale=$W:$H:force_original_aspect_ratio=increase:flags=lanczos,crop=$W:$H" $OUT/_first.png
ffmpeg -loglevel error -y -i $LAST  -vf "scale=$W:$H:force_original_aspect_ratio=increase:flags=lanczos,crop=$W:$H" $OUT/_last.png
cp $PF $OUT/prompt.txt
CMD=(.venv/bin/mlx-h3 --prompt-file $OUT/prompt.txt --first-frame $OUT/_first.png --last-frame $OUT/_last.png
  --width $W --height $H --frames $FR --steps $ST --seed $SEED --budget $B
  --tokenizer $M/tokenizer/tokenizer.json --text-encoder $M/mlx-8bit/te_qwen3vl_a8g32.safetensors
  --dit $M/mlx-8bit/dit_fl2va_a8g32.safetensors
  --video-vae $M/bf16/vae/minimax_h3_video_vae_fp16.safetensors --audio-vae $M/bf16/vae/minimax_h3_audio_vae_fp32.safetensors
  --output $OUT/_tmp.mp4)
[ "${H3TURBO:-1}" = "1" ] && CMD+=(--turbo-lora $M/adapters/minimax-h3-turbo/minimax_h3_turbo_v4_step600_ema.safetensors)
{ echo "#!/bin/zsh"; echo "cd $RT"; print -r -- "/usr/bin/caffeinate -i -s ${(q)CMD[@]}"; } > $OUT/cmd.sh
T0=$(date +%s); echo "start $(date -Iseconds) clip $ID seed $SEED first=$FIRST last=$LAST ${W}x${H} f$FR st$ST" > $OUT/log.txt
ok=0; for try in 1 2; do
  ( cd $RT && /usr/bin/caffeinate -i -s "${CMD[@]}" ) >> $OUT/log.txt 2>&1 && [ -f $OUT/_tmp.mp4 ] && { ok=1; break; }
  echo "retry $try" >> $OUT/log.txt; sleep 20
done
T1=$(date +%s)
(( ok )) || { echo "FAIL clip $ID s$SEED (see $OUT/log.txt)"; tail -5 $OUT/log.txt; exit 1; }
mv $OUT/_tmp.mp4 $OUT/master-audio.mp4
ffmpeg -loglevel error -y -i $OUT/master-audio.mp4 -an -c:v copy $OUT/master.mp4
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $OUT/master.mp4)
PEAK=$(grep -oE "peak +[0-9.]+" $OUT/log.txt | awk '{print $2}' | sort -n | tail -1)
cat > $OUT/run.json <<J
{"clip":"$ID","seed":$SEED,"first":"$FIRST","last":"$LAST","width":$W,"height":$H,"frames_requested":$FR,"frames_decoded":$NF,
 "steps":$ST,"budget":$B,"mode":"FL2VA","turbo_lora":"$([ "${H3TURBO:-1}" = "1" ] && echo minimax_h3_turbo_v4_step600_ema || echo none)","dit":"dit_fl2va_a8g32",
 "elapsed_s":$((T1-T0)),"peak_gib":${PEAK:-null},"started":"$(date -r $T0 -Iseconds)","prompt":"prompt.txt"}
J
echo "ok $OUT/master.mp4 ($NF frames, $(( (T1-T0)/60 )) min, peak ${PEAK:-?} GiB)"
