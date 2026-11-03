#!/bin/zsh
# encode_web.zsh — web encodes for scroll scrubbing: short GOP, no B-frames, faststart, no audio, 24 fps, light denoise.
# Chosen on clip 01 (sizes in docs/CLIP_STATUS.md):
#   desktop  1920x1080  H.264 CRF 25 GOP 12 (~4.6 MB)  +  HEVC hvc1 q50 GOP 12 (~2.1 MB, Safari / Apple hardware)
#   mobile    960x540   H.264 CRF 27 GOP 8             +  HEVC 1280x720 q50 GOP 8 (iPhone / iPad)
# Usage: scripts/post/encode_web.zsh <source.mov|mp4> <clip-id>
#   → public/media/film/{desktop,mobile}/clip-<id>.mp4 and clip-<id>.hevc.mp4
set -eu
ROOT=${0:A:h:h:h}; IN=${1:A}; ID=$2
DN="hqdn3d=1.5:1.5:4:4"
H264=(-an -r 24 -pix_fmt yuv420p -c:v libx264 -profile:v high -preset slow -sc_threshold 0 -bf 0 -movflags +faststart)
HEVC=(-an -r 24 -pix_fmt yuv420p -c:v hevc_videotoolbox -tag:v hvc1 -bf 0 -movflags +faststart)
D=$ROOT/public/media/film/desktop; M=$ROOT/public/media/film/mobile; mkdir -p $D $M
ffmpeg -loglevel error -y -i $IN -vf "scale=1920:1080:flags=lanczos,$DN" $H264 -crf ${CRF_D:-25} -g 12 -keyint_min 12 $D/clip-$ID.mp4 &
ffmpeg -loglevel error -y -i $IN -vf "scale=1920:1080:flags=lanczos,$DN" $HEVC -q:v ${Q_D:-50} -g 12 $D/clip-$ID.hevc.mp4 &
ffmpeg -loglevel error -y -i $IN -vf "scale=960:540:flags=lanczos,$DN"   $H264 -crf ${CRF_M:-27} -g 8 -keyint_min 8 $M/clip-$ID.mp4 &
ffmpeg -loglevel error -y -i $IN -vf "scale=1280:720:flags=lanczos,$DN"  $HEVC -q:v ${Q_M:-50} -g 8 $M/clip-$ID.hevc.mp4 &
wait
for f in $D/clip-$ID.mp4 $D/clip-$ID.hevc.mp4 $M/clip-$ID.mp4 $M/clip-$ID.hevc.mp4; do
  printf "%-44s %6d KB  %s frames\n" ${f#$ROOT/} $(( $(stat -f %z $f) / 1024 )) $(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $f)
done
