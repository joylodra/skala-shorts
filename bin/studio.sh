#!/usr/bin/env bash
# Live preview: Remotion Studio for a project at http://localhost:${PORT:-3000} (scrub the timeline, see edits live).
# usage: bin/studio.sh <project_dir>   (Claude: start it in the background, then open the URL in the browser pane)
set -euo pipefail
cd "$1"
exec npx remotion studio src/index.ts --port "${PORT:-3000}" --no-open
