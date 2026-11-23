# Example: "Instagram dulunya bukan aplikasi foto" (Burbn -> Instagram), Bahasa Indonesia, 35 s

The skill's end-to-end test (2026-11-23): `script.txt` -> placeholder voice (`say -v Damayanti`) -> prepare_voice.py
(auto-detected `id`, tightened 38.3 s -> 33.6 s) -> PLAN.md -> `video/` files -> stills -> sound -> render.sh.
Shows: brand poses, shakePose / jumpPose / bouncePose, fx cards (question, sweat, zzz, lightbulb, sparkles, star
burst, paper ball), an animated wall display that carries the story (props.ts), Indonesian captions (fixed by hand:
"Burbn", "poin", "audiens", "25.000"). Timed directly on the final voice (identity time map).

Rebuild: `bin/new_project.sh`, copy `video/*` into `src/video/`, `ffmpeg -i voice_final.mp3 -ar 48000 -ac 1
voice/voice_final.wav`, then `make_audio.py` and `render.sh`.
