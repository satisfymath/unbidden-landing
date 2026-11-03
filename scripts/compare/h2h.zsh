#!/bin/zsh
# h2h.zsh — head-to-head on the same keyframes (1 → 2): MiniMax H3 at 1344x768 vs LTX-2.5 (two-stage, hq, distilled).
# Runs sequentially (one GPU job at a time), extracts first/last frames + contact sheets, and logs SSIM vs the masters.
# Usage: scripts/compare/h2h.zsh [seed]       → production/compare/REPORT.md
set -u
ROOT=${0:A:h:h:h}; SEED=${1:-1}; OUT=$ROOT/production/compare; mkdir -p $OUT; R=$OUT/REPORT.md
P=$ROOT/production/clips/clip-01/prompt-v1.txt
echo "# Head-to-head 1→2 · $(date -Iseconds)" > $R; echo "" >> $R; echo "| Candidato | Tiempo | Pico | SSIM primer | SSIM último | Frames |" >> $R; echo "|---|---|---|---|---|---|" >> $R
row() { # name master.mp4 run.json
  local name=$1; local mp4=$2; local rj=$3; local d=$OUT/$name; mkdir -p $d
  local N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $mp4)
  ffmpeg -loglevel error -y -i $mp4 -vf "select='eq(n,0)'" -frames:v 1 $d/first.png
  ffmpeg -loglevel error -y -i $mp4 -vf "select='eq(n,$((N-1)))'" -frames:v 1 $d/last.png
  ffmpeg -loglevel error -y -i $mp4 -vf "select='not(mod(n,$(( (N-1)/11 ))))',scale=512:-1,tile=4x3:padding=4:color=black" -frames:v 1 $d/sheet.png
  ffmpeg -loglevel error -y -i $mp4 -vf "select='eq(n,$((N/2)))',crop=iw*0.4:ih*0.4:iw*0.35:ih*0.3" -frames:v 1 $d/detail-mid.png
  local s1=$(zsh $ROOT/scripts/h3/qc_compare.zsh $d/first.png $ROOT/production/plates/kf-1.png | grep -oE "ssim=[0-9.]+" | cut -d= -f2)
  local s2=$(zsh $ROOT/scripts/h3/qc_compare.zsh $d/last.png  $ROOT/production/plates/kf-2.png | grep -oE "ssim=[0-9.]+" | cut -d= -f2)
  local t=$(python3 -c "import json;d=json.load(open('$rj'));print(round(d['elapsed_s']/60,1),'min');print(d.get('peak_gib',d.get('peak_gb')))" | tr '\n' ' ')
  echo "| $name | ${t% *} | ${t##* } GB | $s1 | $s2 | $N |" >> $R
}
# B) LTX-2.5 two-stage (dev + CFG) at 1280x704, 121 frames
zsh $ROOT/scripts/ltx/flf.zsh c01-ltx-2stage-1280 $ROOT/sequence/1.png $ROOT/sequence/2.png 121 $SEED $P 1280 704 two-stage 2>&1 | tail -1
[ -f $OUT/../ltx/c01-ltx-2stage-1280/master.mp4 ] && row "ltx25-two-stage-1280x704" $ROOT/production/ltx/c01-ltx-2stage-1280/master.mp4 $ROOT/production/ltx/c01-ltx-2stage-1280/run.json
# C) LTX-2.5 HQ refine at 1920x1088, 121 frames (low-ram as a safety net)
LTX_LOWRAM=1 zsh $ROOT/scripts/ltx/flf.zsh c01-ltx-hq-1920 $ROOT/sequence/1.png $ROOT/sequence/2.png 121 $SEED $P 1920 1088 hq 2>&1 | tail -1
[ -f $ROOT/production/ltx/c01-ltx-hq-1920/master.mp4 ] && row "ltx25-hq-1920x1088" $ROOT/production/ltx/c01-ltx-hq-1920/master.mp4 $ROOT/production/ltx/c01-ltx-hq-1920/run.json
# D) LTX-2.5 distilled at 1920x1088 (fast reference)
zsh $ROOT/scripts/ltx/flf.zsh c01-ltx-dist-1920 $ROOT/sequence/1.png $ROOT/sequence/2.png 121 $SEED $P 1920 1088 distilled 2>&1 | tail -1
[ -f $ROOT/production/ltx/c01-ltx-dist-1920/master.mp4 ] && row "ltx25-distilled-1920x1088" $ROOT/production/ltx/c01-ltx-dist-1920/master.mp4 $ROOT/production/ltx/c01-ltx-dist-1920/run.json
# A) H3 at its native 768p (16:9 → 1344x768), Turbo 8 steps, 124 frames
H3W=1344 H3H=768 zsh $ROOT/scripts/h3/fl2va.zsh c01-h3-1344 $ROOT/production/plates/kf-1.png $ROOT/production/plates/kf-2.png 124 $SEED $P 2>&1 | tail -1
[ -f $ROOT/production/clips/clip-c01-h3-1344/s$SEED/master.mp4 ] && row "h3-1344x768-turbo8" $ROOT/production/clips/clip-c01-h3-1344/s$SEED/master.mp4 $ROOT/production/clips/clip-c01-h3-1344/s$SEED/run.json
echo "" >> $R; echo "Referencia: clip 01 actual (H3 1024x576 Turbo 8) SSIM 0.908 / 0.869, 16 min." >> $R
echo "$(date +%H:%M) h2h done"; cat $R
