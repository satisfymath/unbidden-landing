#!/bin/zsh
# qc_compare.zsh — SSIM / PSNR between a real clip frame and a target keyframe (both scaled to 1024x576).
# Usage: scripts/h3/qc_compare.zsh <frame.png> <keyframe.png>   → prints "ssim=… psnr=…"
set -eu
A=${1:A}; B=${2:A}
S=$(ffmpeg -loglevel info -i $A -i $B -filter_complex "[0:v]scale=1024:576:flags=lanczos,format=yuv420p[a];[1:v]scale=1024:576:force_original_aspect_ratio=increase:flags=lanczos,crop=1024:576,format=yuv420p[b];[a][b]ssim" -f null - 2>&1 | grep -oE "All:[0-9.]+" | head -1 | cut -d: -f2)
P=$(ffmpeg -loglevel info -i $A -i $B -filter_complex "[0:v]scale=1024:576:flags=lanczos,format=yuv420p[a];[1:v]scale=1024:576:force_original_aspect_ratio=increase:flags=lanczos,crop=1024:576,format=yuv420p[b];[a][b]psnr" -f null - 2>&1 | grep -oE "average:[0-9.]+" | head -1 | cut -d: -f2)
echo "ssim=$S psnr=$P  ($A:t vs $B:t)"
