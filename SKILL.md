---
name: skala-short
description: Make a Skala+ animated vertical short (30-75 s, 9:16, 2K) starring the Skala mascot and the mini-Skala team in the minimalist 3D cartoon office, from a script + voiceover. Flat ink-outlined Skala cards in a painted three.js world rendered with Remotion, with simple white captions, an original score and synthesized sound effects. Use whenever someone on the Skala+ team wants a Skala video, a mascot video, a "short like the KFC one", an animated explainer/story reel for Instagram/TikTok/Shorts, or hands over a script and a voice file (English or Bahasa Indonesia), even if they don't name the skill.
---

# Skala short (script + voiceover -> finished 2K vertical video)

The team hands over **a script and a voiceover file**. You plan the shots, stage Skala, build any story props, make the
sound, render, check, and deliver an MP4 plus a one-line Instagram caption. The look is fixed by the engine so every video
matches the house style (reference: `assets/kfc_frames.jpg`, the "The Chicken Shop With No Chicken" short, 2026-11-23).

Layout of this skill:
- `template/` Remotion project. `src/skala/` = **engine** (look, office, Skala drawing, camera grammar) — do not restyle it
  per video. `src/video/` = **the only files you write per video**: `events.json`, `story.ts`, `staging.ts`, `props.ts`,
  `sound.py` (+ generated `captions.ts`, `timemap.ts`).
- `audio/` voice prep (`prepare_voice.py`), sound engine (`engine.py`), `make_audio.py`.
- `bin/` `setup.sh` (once per machine), `new_project.sh`, `render.sh`.
- `examples/kfc/` a complete finished video (all `src/video` files + script). Read it before writing your first video.
- `references/` read as needed: `authoring.md` (shots, camera, staging, props — read before planning),
  `mascot.md` (every expression / arm pose / prop / effect / brand pose / motion), `sound.md`, `style.md`.

## 0. Setup (once per machine)
`bash <skill>/bin/setup.sh` — installs the Node packages and a Python venv into `~/.skala-short`. Needs Node 18+,
Python 3.10+, ffmpeg and Google Chrome. Use `~/.skala-short/venv/bin/python` for every Python step below.
If it is missing, run it; if a tool is missing, tell the person what to install (don't install system software yourself).

## 1. Inputs
- **Script** (text) and **voiceover** (any audio file). If only a script is given, ask for the voice; for a quick test
  only, `say -v Samantha -o v.aiff -f script.txt` makes a placeholder voice (tell them it is a placeholder).
- Language: English or Bahasa Indonesia (auto-detected). Captions follow the voice language.
- Ask only what you can't decide: the project folder (default `~/Skala Shorts/<slug>`), and whether the read should be
  tightened (default yes: pauses cut to 0.2 s, tempo x1.12 — the team asked for a faster read; `--no-tighten` or
  `--speed 1.0` if they say the pace is already right).

## 2. New project + voice
```bash
bash <skill>/bin/new_project.sh "<project>"
~/.skala-short/venv/bin/python <skill>/audio/prepare_voice.py "<project>" "<voice file>" [--lang id] [--no-tighten]
```
This writes `voice/voice_final.wav`, `voice/words.json`, `voice/words.txt` (every word with its time and **frame**) and
the captions. Read `voice/words.txt`: everything in the picture is timed to those frames. Check the transcript against the
script; fix misheard caption words directly in `src/video/captions.ts` (keep the times).

## 3. Plan (write it down before coding)
Write `PLAN.md` in the project: the beats (hook, setting, escalation, snap, deadpan line, explanation/analogy,
consequence, callback — whatever the script has) and a **shot table**: shot id, start frame (on a word), what we see,
camera (CU / MS / wide / screen / insert, from where), who is staged where with which pose, props, effect cards, SFX.
Rules of thumb (details and numbers in `references/authoring.md`):
- A new shot every 1.5-4 s; cut on words; hook in the first 3 s; the punchline gets a camera punch or kick.
- Never show what the voice is literally saying in a boring way; show the joke, the consequence or the reaction.
- Skala is the hero; mini-Skalas (blue/green/purple/teal) are coworkers, fans, customers, crowds.
- Reuse the office set (room.ts spots); put story-specific things on the **wall display** (drawScreen) or as small props.
- No real logos or real people's likeness; generic shapes and the brand's name in plain text only when the joke needs it.
- Reactions land 0-3 frames before their word.

## 4. Build the video files (`src/video/`)
1. `events.json`: named events in frames (from words.txt), plus `_total` = last voice frame + ~45 f, `flash` (hook end).
2. `story.ts`: `CUTS`, `CAMS` (keys with dolly/pushK/rolled), `KICKS`, `DOF`, `washAt`, `CAPTION_SKIP`.
3. `staging.ts`: `switch (id)` per shot: `add({ i, v, x, z, expr, arms, prop, look, tilt, hop, scale, talk })` or
   `add({ i, v, x, z, ...brandPose("skala-research-magnify") })`; effect cards via `api.fx({...})`; motions from mascot.md.
4. `props.ts`: `drawScreen(g, f)` (2048 x 1152 wall display) and `buildProps(kit)` for desk props / signs / papers.
5. `sound.py`: score sections + SFX cues on events (see `references/sound.md`; copy patterns from the KFC example).
Type-check with `npx tsc --noEmit` in the project.

## 5. Look check with stills (iterate until clean)
```bash
cd "<project>" && node scripts/stills.mjs out/s1_ <frame,frame,...> 0.5
```
Render one still per shot (mid-shot) plus the punchlines, combine into a sheet (`ffmpeg ... hstack`) and look at it.
Fix before rendering: Skala cut off (hood is ~2 m wide: see the framing table in authoring.md), cameras inside desks or
walls, a monitor/prop blocking the lens, faces hidden behind another Skala's hood, captions over a face, unreadable
screen content. Expect 2-3 rounds.

## 6. Sound
```bash
~/.skala-short/venv/bin/python <skill>/audio/make_audio.py "<project>"
```
Writes `audio_out/mix.wav` at -14 LUFS (voice -16 LUFS, music ducked under the voice, standard levels). Re-run after
any timing change.

## 7. Render + QA
```bash
bash <skill>/bin/render.sh "<project>" "<project>/<slug>.mp4"
```
~10-15 min for 45-60 s at 1440 x 2560. Run it in the background. It muxes the sound and reports frozen/black spans and
writes `out/qa_sheet.jpg`. Look at the sheet; if anything is wrong, fix, re-render. If the render dies, read
`out/render.log` (see Gotchas).

## 8. Deliver
Send the MP4, list what is in each beat in a few lines, note anything you could not fix, and offer 3-5 one-line
Instagram captions (hook-first; one lesson line; one question line) plus 3-7 hashtags if asked.

## Gotchas (all hit for real)
- `--scale` must be exactly `1.3333333333333333` (1.3333 gives an odd width and H.264 refuses).
- macOS ignores case: never have two files that differ only by case (e.g. `Office.tsx` and `office.ts`).
- The vertical frame is narrow: horizontal field of view is ~56 % of the vertical one. A full Skala (hood 1.95 m wide)
  needs >= 3.2 m distance at fov 38-40 to fit; groups of 3+ need a high angle or depth staging (authoring.md).
- Back-row desks are at z 3.2-4.0 and their monitors face the lens: keep cameras out of x in [-5, -1.4] U [1.4, 5]
  for z in [3.0, 4.2], or the monitor fills the frame.
- `fx.ink.dispose` is guarded already; if you add post effects, guard their disposal the same way (crossfades unmount).
- Stills at 0.5 bundle in ~40 s then 1-3 s each; the full render is ~3-4 frames/s.
- If the voice changes after the picture is built, don't re-time by hand: see "Re-timing" in authoring.md.
