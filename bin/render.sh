#!/usr/bin/env bash
# Final 2K render + sound + QA for a Skala short project.
# usage: bin/render.sh <project_dir> <output.mp4>
set -euo pipefail
P="$(cd "$1" && pwd)"; OUT="$2"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd "$P"
npx remotion render src/index.ts SkalaShort out/video_silent.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 \
  --gl angle --browser-executable "$CHROME" --concurrency 4 --muted > out/render.log 2>&1 || { grep -iE "error" -A3 out/render.log | head -20; exit 1; }
[ -s out/video_silent.mp4 ] || { echo "render produced no file; see out/render.log"; exit 1; }
ffmpeg -v error -y -i out/video_silent.mp4 -i audio_out/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -shortest "$OUT"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
echo "final: $OUT ($DUR s)"
# QA: frozen / black frames, plus a 9-frame contact sheet
ffmpeg -i "$OUT" -vf "freezedetect=n=0.001:d=0.6,blackdetect=d=0.1" -an -f null - 2>&1 | grep -E "freeze_start|black_start" || echo "qa: no frozen or black spans"
N=9; ARGS=(); for i in $(seq 1 $N); do T=$(python3 -c "print(round($DUR*($i-0.5)/$N,2))"); ffmpeg -v error -y -ss "$T" -i "$OUT" -frames:v 1 -vf scale=240:-1 "out/qa_$i.jpg"; ARGS+=(-i "out/qa_$i.jpg"); done
ffmpeg -v error -y "${ARGS[@]}" -filter_complex "hstack=$N" out/qa_sheet.jpg && echo "qa sheet: $P/out/qa_sheet.jpg"
