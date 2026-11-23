# Sound for a Skala short

`audio/make_audio.py <project>` runs `src/video/sound.py: build(S)` and mixes. Everything is synthesized (own
instruments in `audio/instruments.py`, SFX in `audio/engine.py`), so there are no licensing questions.

## Standard mix (don't change per video)
Voice normalised to -16 LUFS; music bed -25 LUFS then +3 dB, ducked up to 9 dB under the voice; SFX -19 LUFS momentary
then -6 dB; master -14 LUFS integrated with a soft limiter, true peak ≤ -1 dBTP.

## Score (house sound: bouncy office groove)
- `S.groove(t0, t1, ["C","Am","F","G"], melody)`: plucked bass on 1+3, off-beat chords, brushes; optional glock melody
  (per bar: list of (beat, midi, dur)). Use for setup, upbeat and payoff sections. Major progressions = happy,
  ["F","G","C","Am"] = cheeky.
- `S.tension(t0, t1, crisis_from=t)`: minor pizzicato ostinato + clock ticks; doubles to 16ths from `crisis_from`.
- Stops: leave silence for a beat right before/after a punchline (KFC: the music stops dead on "no chicken").
- `S.motif(t, [notes], step, inst)`: little vibes/glock lines (hook, a falling line under a laugh).
- `S.wahwah(t)` sad trombone; `S.resolve(t)` warm major chord; `S.sting(t)` end sting; `S.pad(t, chord, dur)`.
- `S.bpm` (default 116) sets the groove tempo.

## SFX (all `(t, g=gain, p=pan)`)
pop · thud · whoosh(t_peak) · sparkle · ticks(t0, dur, n) · horn · flip (paper/calendar) · boop_down (things switching
off) · ring(t, dur) (phones) · siren · notify (post/notification) · squeak (highlighter) · power_down · growl (stomach) ·
rustle · crumple · slap (paper landing) · boing(t, f0) (letters/hops) · footsteps(t0, t1) · jump · land · ding · clap ·
cash. Low-level: `S.add(signal, t, g, p)`, `S.sine_glide`, `S.noise_burst`.

## Timing
`S.t("event")` = seconds of an events.json event on the final timeline; `S.t("event", -14)` offsets by frames.
Put a whoosh on fast camera moves and throws, a pop on anything that appears, a kick-thud on impacts, ticks on lists of
things lighting up, and one signature SFX per gag. Fewer, well-placed SFX beat many.
