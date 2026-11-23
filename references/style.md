# The Skala short look (fixed by the engine — change only with the brand owner's OK)

Derived from the cartoon-3d-short skill ("2D characters in a colourful 3D world") and tuned for the Skala office.
Reference frames: `assets/kfc_frames.jpg`; approved mascot look: `assets/skala_approved_look.png`;
character sheets: `assets/skala_sheet_brand.png`, `assets/skala_sheet_extra.png`.

## Characters (src/skala/skala.ts, cardshade.ts)
- Skala: orange plus-sign hood (#ff9424 lit -> #e8321f shadow), cream face (#fff7ef), dark eyes (#2e1a1c, no
  catchlights), D-mouth (#5a1e28) with tongue (#ef7a82), round orange body, mitten arms, stubby legs with round feet.
- Mini-Skalas share the shape: blue #5aa2ff/#2f56c8, green #4fd08a/#1d8a57, purple #b48cff/#6a40c8, teal #3fd0cf/#14808f.
- Ink: plum #241726, thick-thin (heavier on the shadow side). No blush, no highlights, flat fill + soft painted shadow.
- Size: 1.88 m to the hood top (SK = 0.0023 m per design unit). Gentle breathing (1.5 % squash) on every card.
- Blinks every 0.5-2.3 s (4 frames). Reactions 0-3 frames before the word.

## World (office.ts, lights.ts, shade.ts, ink.ts, grade.ts)
- Minimal office: teal back wall #9cc5c8, cream side walls #f0ebe2, light oak floor, white desks, dark grey frames,
  terracotta pots + green plants, yellow mugs, city skyline outside with blue sky and light haze.
- Two-tone lighting from a camera-relative sun (behind-right of the lens, 52° up) so rooms read bright and warm.
- World ink lines near-black, ~3-5 px at 1080 wide; characters/effects carry their own plum ink.
- Post chain: ink -> lens blur -> bloom (emissive only) -> neutral tone map -> day grade. No film grain.

## Captions (SkalaShort.tsx)
White Inter Bold 74 px (at 1080 wide), centred, top at 66 % of the frame height (clear of faces in close shots, above the app UI), soft dark shadow, no box, no
punctuation, 2-3 words per chunk, exactly on the voice. Hide a caption the picture already prints (CAPTION_SKIP).

## Output
1440 x 2560 H.264 CRF 16, 30 fps, AAC 256 kbps, -14 LUFS. 30-75 s.
