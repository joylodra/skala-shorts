#!/usr/bin/env bash
# One-time setup for the skala-short skill on a Mac: shared Node packages + a Python venv in ~/.skala-short.
# Needs: Node 18+, Python 3.10+, ffmpeg, Google Chrome. Safe to re-run.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
HOME_DIR="$HOME/.skala-short"
mkdir -p "$HOME_DIR/deps"
for t in node npm python3 ffmpeg; do command -v $t >/dev/null || { echo "missing: $t (install it first)"; exit 1; }; done
[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ] || echo "warning: Google Chrome not found in /Applications (renders need it)"
cp "$SKILL/template/package.json" "$HOME_DIR/deps/package.json"
(cd "$HOME_DIR/deps" && npm install --no-audit --no-fund)
[ -d "$HOME_DIR/venv" ] || python3 -m venv "$HOME_DIR/venv"
"$HOME_DIR/venv/bin/pip" install -q -r "$SKILL/audio/requirements.txt"
echo "ok: node deps in $HOME_DIR/deps/node_modules, python in $HOME_DIR/venv"
