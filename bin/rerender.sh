#!/usr/bin/env bash
# Partial re-render: re-render only the frames that changed and splice them into the last full render, then re-mux
# the sound. Use for late fixes (an icon, one shot) instead of a 10-minute full render.
# usage: bin/rerender.sh <project_dir> <output.mp4> <from>-<to> [<from>-<to> ...]   (inclusive composition frames)
#   tip: re-render whole shots (CUTS boundaries) so a changed shot never mixes old and new frames.
# Needs out/video_silent.mp4 from a previous render.sh run (it is updated in place).
set -euo pipefail
P="$(cd "$1" && pwd)"; OUT="$2"; shift 2
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd "$P"
[ -s out/video_silent.mp4 ] || { echo "no out/video_silent.mp4: run bin/render.sh once first"; exit 1; }
cp out/video_silent.mp4 out/base.mp4
N=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 out/base.mp4)
for R in "$@"; do
  A=${R%-*}; B=${R#*-}
  echo "re-rendering frames $A-$B of $N"
  npx remotion render src/index.ts SkalaShort out/seg.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 \
    --gl angle --browser-executable "$CHROME" --concurrency 4 --muted --frames "$A-$B" > out/rerender.log 2>&1 \
    || { grep -iE "error" -A3 out/rerender.log | head -20; exit 1; }
  # splice: base[0, A) + seg + base(B, N)
  ffmpeg -v error -y -i out/base.mp4 -i out/seg.mp4 -filter_complex \
    "[0:v]split=2[x][y];[x]trim=end_frame=$A,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[y]trim=start_frame=$((B + 1)),setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
    -map "[v]" -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -r 30 out/spliced.mp4
  mv out/spliced.mp4 out/base.mp4
done
M=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 out/base.mp4)
[ "$M" = "$N" ] || { echo "frame count changed ($N -> $M): something is off, not replacing"; exit 1; }
mv out/base.mp4 out/video_silent.mp4
ffmpeg -v error -y -i out/video_silent.mp4 -i audio_out/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -shortest "$OUT"
echo "final: $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s, $M frames)"
