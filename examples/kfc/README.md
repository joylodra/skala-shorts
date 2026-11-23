# Example: "The Chicken Shop With No Chicken" (KFC 2018 apology), English, 48 s

Files: `SCRIPT.md` (facts + sources + script), `video/` (the finished src/video files), `voice_final.mp3` (the tightened
read), `video/words.json` / `words_fast.json` (original and tightened word timings).

This one was built on the original read and then re-timed after the read was sped up, so it uses a real time map
(`video/timemap.ts`, `video/timemap.json`); new videos are timed directly on the final voice (identity map).

Rebuild it:
```bash
bash <skill>/bin/new_project.sh ~/tmp/kfc && cd ~/tmp/kfc
cp <skill>/examples/kfc/video/* src/video/
ffmpeg -i <skill>/examples/kfc/voice_final.mp3 -ar 48000 -ac 1 voice/voice_final.wav
cp src/video/timemap.json voice/timemap.json
~/.skala-short/venv/bin/python <skill>/audio/make_audio.py .
bash <skill>/bin/render.sh . kfc.mp4
```
