# Authoring a Skala short: shots, camera, staging, props

Contents: 1 The set · 2 Shot grammar · 3 Camera API · 4 Framing table · 5 Staging API · 6 Props + wall display ·
7 Lens (DOF) · 8 Re-timing · 9 Checklist

## 1. The set (src/skala/room.ts)
Units are metres. x across the room (-8..8), y up, z toward the camera side. Floor y = 0.
- Back wall z = -6: soft teal, two big windows (x -7.4..-3.2 and 3.2..7.4, y 0.9..3.1) over a city skyline, and the
  **wall display** in the middle: centre (0, 1.95, -5.93), 4.8 x 2.7 m. Anything story-specific (maps, charts, posts,
  numbers, logos-as-text) goes on this display.
- Side walls x = ±8: whiteboard on the right wall (z -3.8..-1.2), bookshelf + clock on the left wall.
- Standing desks 1.6 x 0.8, top at 0.74: front row z = -1 (x ±2.2, ±4.2), back row z = 3.6. Skala's own desk is
  (-2.2, -1) (no monitor; props go here). Plants in the corners.
- No ceiling: never aim the camera above ~25° up.
- `SPOTS`: presenter (-1.5, -4.35) next to the display; myDeskFront (-2.2, -0.2); behindMyDesk (-2.55, -1.95);
  aisle (-0.6, -0.6); aisleBack (-1.7, -3.0).
- Characters are camera-facing cards: they always face the lens (no backs). `look` shifts the eyes left/right (-1..1).

## 2. Shot grammar (keep the house look)
- Cut every 1.5-4 s, on words. Big reframes are cuts; small ones are glides (dur 18-40 f, centred on the word).
- Every hold creeps in: `pushK(f, f0, 0.0015-0.0035)`; on a punch word use `pushK(f, f0, rate, 0.005-0.006, 30-35)`.
- Rolls of 0.035-0.045 rad on emphasis beats (`rolled(...)` or `roll:` in a key), alternate sign between beats.
- Impact kicks (`KICKS: [seconds, gain 0.5-1.2]`) on thuds, slams, "shut", the last light out, a newspaper landing.
- A white 4-frame flash at the end of the hook (`events.json` "flash"; negative = none).
- Crossfades (`XFADE`) only for place/time changes (6-8 f).
- About 1/3 of the screen time with lens blur (CU/MS), wides and screen inserts sharp.

## 3. Camera API (src/skala/camera.ts)
```ts
const CAMS: Record<number, Key[]> = {
  3: [{ f: 182, s: (f) => dolly([-0.2, 1.6, 2.8], [-1.15, 1.55, -5.6], pushK(f, 182, 0.0022), { fov: 46, roll: 0.02 }) },
      { f: 240, dur: 18, s: (f) => dolly([-0.2, 1.6, 2.8], [-1.0, 1.6, -5.6], pushK(f, 182, 0.0022) * 0.92, { fov: 44, roll: -0.03 }) }],
};
```
- `dolly(pos, look, k, {fov, roll})`: camera at `pos` looking at `look`, slid toward the look point by k (<1 = closer).
- A key with `cut: true` jumps; otherwise it glides from the previous key over `dur`. Every shot id needs a CAMS entry.
- `shotsFrom(CUTS)`: CUTS = shot start frames + TOTAL at the end. Shot ids are 1-based in CUTS order.

## 4. Framing table (measured; Skala full size: 1.88 m tall, hood 1.95 m wide, face centre y ≈ 1.0)
The 9:16 frame is narrow: horizontal half-width ≈ 0.2 × distance at fov 40.
| Shot | Camera distance to Skala | fov | look y | Notes |
|---|---|---|---|---|
| CU (face + hands + held prop) | 3.0-3.3 m | 38-40 | 1.05 | hood just fits; prop at waist |
| MS (full body, a bit of room) | 3.3-3.8 m | 38 | 1.05 | aisle spot from (≈0, 1.25, 2.7-3.3) |
| Full + context (Skala + display) | 6-8 m | 44-46 | 1.5-1.6 | Skala ≤ 1.1 m off the view line |
| Wide office | 8-9 m, y 2.2-2.5 | 44-46 | 0.9-1.3 | group people within x ±2 of the look point |
| Screen insert | 3.5-4.5 m from the wall, y 1.9 | 40-48 | 1.9 | look at a point on the display |
| Top-down prop insert | 1.2-1.5 m above the desk | 40 | desk | newspaper / paper / laptop |
- Groups: side-by-side Skalas need ~1.7 m spacing (hoods overlap faces otherwise). For a line/queue use a **high camera
  looking down a straight line** (camera y ≈ 4, z ≈ 7.4; people every 1.7 m in z) so each face sits above the hood in
  front (see KFC shot 16). Or stage in depth with the hero in front and others small behind.
- Second Skala in a CU: keep it ≥ 2 m to the side or ≥ 2 m behind, or it covers the hero's face.
- Back-row desk monitors face the lens: cameras between z 3.0 and 4.2 must stay in the aisle (|x| < 1.3).

## 5. Staging API (src/skala/cast.ts -> video/staging.ts)
```ts
export const staging = (id: number, f: number, api: StageAPI) => {
  const { add, out } = api;
  switch (id) {
    case 1: add({ i: 1, v: "skala", x: -2.2, z: -0.2, expr: f < EV.out - 2 ? "happy" : "shock", arms: "hold", prop: "bucket" }); break;
  }
};
```
`Who` fields: `i` (stable id, drives blinks), `v` ("skala" | "blue" | "green" | "purple" | "teal"), `x, z`, `expr`,
`arms`, `prop`, `look` (-1..1), `tilt` (deg), `hop` (m, lifts the card), `scale` (0.8 for a background extra),
`talk` (mouth flaps), `floor` (ground height in m for scenes off the office floor), `noShadow`. Brand poses: `...brandPose("skala-teach-explain")`. Motions (walk/jump/bounce/nod/shake) return
fields to spread in: see mascot.md. Each `add` also drops a contact shadow.
Effect cards: `out.fx.push({ key, cw, ch, draw, x, y, z, w, h, rot?, flat?, soft? })`: `key` must change when the
drawing changes (it caches canvases by key); `cw/ch` canvas size; `w/h` metres; `pop(f, a, b)` gives a 0..1 pop-in/out
scale. Examples: heart over the display, sweat drop by a face, laugh reactions rising off the display, ringing phones
(`ringFx`), growl squiggles.

## 6. Props + wall display (video/props.ts)
- `drawScreen(g, f)`: paint the 2048 x 1152 display every frame (Canvas2D). Keep text big (≥ 60 px) and few words;
  icons drawn with `Pen` read best. The display shows in many shots, so make its content follow the story state.
  Vertical shots see only the middle of it: in screen close-ups (camera ~4 m from the wall) only x ≈ 650-1400 of
  the 2048 canvas is visible. Put every number, counter and key icon inside x 700-1350; wides show more.
- `buildProps(kit)`: once; returns `update(f, shotId)`. Kit: `kit.unlit(texture, w, h, pos, yaw, pitch, brightness)`,
  `kit.box(min, max, colour)` (lit, ink-outlined), `new kit.DynTex(w, h)` with `.set(key, draw)` (redraws only when the
  key changes). Desk top y = 0.744 (DESK_H + 0.004). KFC example: a desk calendar that flips, a newspaper that drops
  onto the desk and whose bucket letters shuffle.

### Scenes outside the office (space, a stage, outdoors)
Build the set in `buildProps` far from the office (e.g. 300 m up), and in its update toggle
`space.visible = id <= 2; kit.office.visible = !(id <= 2)` for the shots that happen there. Stand characters on it with
`floor: 300`; materials for sky/planets use `fog: false`, background domes go on the `NOINK` layer. Worked example:
the Red Bull hook (examples/redbull-id): a star dome, a cartoon Earth sphere (R 2000 m, 150 m below, ocean + clouds
texture, faint atmosphere shell), a capsule and a step; Skala jumps off with `hop` driven by a ballistic curve and the
camera tilts after him.

## 7. Lens (DOF)
`DOF: Dof[]` entries `{ f, dur?, cInf, focus? }`: cInf px at 1080 wide (CU 12-14, MS 8-11, context 6, wide/screen 0);
`focus: skalaEyes(x, z)` or a world point; default focus = camera look point. Entries switch on their frame.

## 8. Re-timing (voice changed after the picture is built)
Don't edit every frame number. Make a time map: anchors (old seconds -> new seconds) and put them in
`src/video/timemap.ts` (`toNew`/`toOld`) and `voice/timemap.json` (`{"anchors": [[old, new], ...]}`); the composition
plays the story on the old timeline through the map and the sound engine maps every cue. The KFC example was re-timed
this way after the read was sped up (examples/kfc/video/timemap.ts, timemap.json). Captions must be rebuilt from the new
voice (prepare_voice.py on the new file, then put the old-timeline map back).

### Wall display copy
Prefer drawn icons + numbers over word labels (a stopwatch, not "TIME"; an eye + a crowd of mini-Skala hoods, not
"VIEWERS"; a trophy, not "RECORD!"). Universal badges such as the red "● LIVE" pill are fine. Keep a title card only
where it sets the scene (name + date + place).

## 9. Checklist before the final render
- Every shot's mid-frame still checked; hook frame and every punchline frame checked.
- Nobody cut off unless on purpose; no camera inside furniture; no hood covering a face.
- Captions don't sit on a face or on printed text (CAPTION_SKIP for text the picture already shows).
- Events and SFX land on their words (check a few in words.txt).
- No pop-ins: nothing appears in the last frames of a shot (check the 6 frames before every cut). Anything that should
  be there for a shot is there from its first frame, or animates in on a word.
- Counters and labels fit their boxes at their LONGEST value (e.g. "1.357 km/jam", not "0 km/jam"), and still fit
  during the shot's tightest camera punch: size boxes from `measureText`, centre them, scale down if needed.
- Each shot has one subject: don't put a character in front of the thing the voice is describing.
