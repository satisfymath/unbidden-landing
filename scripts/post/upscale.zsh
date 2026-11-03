#!/bin/zsh
# upscale.zsh — 1024x576 master → 1920x1080 ProRes intermediate, two candidates for A/B:
#   <out>-esrgan.mov : venhance Real-ESRGAN general x2 (MPS) → Lanczos 1920x1080
#   <out>-lanczos.mov: plain Lanczos 1920x1080 (reference, no AI)
#   <out>-blend.mov  : 50/50 blend of both = the look used for the web encodes
# Usage: scripts/post/upscale.zsh <master.mp4> <out-basename>
set -eu
IN=${1:A}; OUT=$2; export UV_PYTHON=3.12
T=${OUT}-esrgan-x2.mov
venhance upscale $IN --scale 2 --model realesr-general --codec prores --quality 90 -o $T >/dev/null 2>&1 || { echo "FAIL venhance"; exit 1; }
ffmpeg -loglevel error -y -i $T -vf "scale=1920:1080:flags=lanczos" -c:v prores_videotoolbox -profile:v 3 -pix_fmt yuv422p10le ${OUT}-esrgan.mov && rm -f $T
ffmpeg -loglevel error -y -i $IN -vf "scale=1920:1080:flags=lanczos" -c:v prores_videotoolbox -profile:v 3 -pix_fmt yuv422p10le ${OUT}-lanczos.mov
# chosen look (A/B on clip 01): 50/50 blend — ESRGAN detail without its painted, over-sharpened edges
ffmpeg -loglevel error -y -i ${OUT}-esrgan.mov -i ${OUT}-lanczos.mov -filter_complex "[0:v][1:v]blend=all_expr='A*0.5+B*0.5'" -c:v prores_videotoolbox -profile:v 3 -pix_fmt yuv422p10le ${OUT}-blend.mov
echo "ok ${OUT}-blend.mov (candidates: -esrgan.mov, -lanczos.mov)"
