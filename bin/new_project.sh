#!/usr/bin/env bash
# Start a new Skala short: copies the template into <dir>, links the shared node packages, makes voice/ and out/.
# usage: bin/new_project.sh <project_dir>
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$1"
[ -e "$DEST/src" ] && { echo "$DEST already has a project"; exit 1; }
mkdir -p "$DEST"
rsync -a --exclude node_modules "$SKILL/template/" "$DEST/"
ln -sfn "$HOME/.skala-short/deps/node_modules" "$DEST/node_modules"
mkdir -p "$DEST/voice" "$DEST/out"
