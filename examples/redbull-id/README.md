# Example: Red Bull Stratos, Bahasa Indonesia, 35.7 s

A real team brief: final script + recorded voiceover (45.2 s, tightened to 34.6 s). Shows:
- a **scene outside the office**: the hook happens in space (star dome, cartoon Earth, capsule step; `kit.office` hidden
  for shots 1-2, Skala on `floor: 300`, a ballistic `hop` for the jump, the camera tilting after him);
- the **wall display as the storyteller** for a live event: date card, balloon ascent + altitude counter, the view from the
  capsule door, freefall timer + speed counter, a sonic-boom ring, a live-viewer counter, a crossed-out "IKLAN" card,
  the parachute — all inside the screen-close-up safe zone (x 700-1350);
- a **mini Skala as the hero on screen** (no likeness of the real jumper), and the generic energy-drink `can` prop.
Note: "ke luar angkasa" in the read is a simplification (39 km = stratosphere; space starts ~100 km).
Rebuild: `bin/new_project.sh`, copy `video/*` into `src/video/`, `ffmpeg -i voice_final.mp3 -ar 48000 -ac 1
voice/voice_final.wav`, then `make_audio.py` and `render.sh`.
