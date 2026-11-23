# Skala mascot library (src/skala/skala.ts)

Look at `assets/skala_sheet_brand.png` (the 38 official brand poses) and `assets/skala_sheet_extra.png` (every
expression, arm pose, prop, effect and motion) before choosing poses. Regenerate them after changing skala.ts:
`npx remotion still src/index.ts SkalaSheet out/sheet_brand.png` (and `SkalaSheetExtra`).

## Using it in staging.ts
```ts
import { brandPose, walkPose, jumpPose, bouncePose, nodPose, shakePose, fxExclaim } from "../skala/skala";
add({ i: 1, v: "skala", x, z, ...brandPose("skala-research-magnify") });            // a brand pose
add({ i: 1, v: "skala", x, z, expr: "thinking", arms: "chin" });                     // free combination
add({ i: 1, v: "skala", x, z, expr: "happy", arms: "holdUp", prop: "sign", text: "SALE!" });
add({ i: 2, v: "blue", x: x0 + 0.9 * t, z, expr: "smile", ...walkPose(t, 1.6), facing: 1 }); // walking right
add({ i: 1, v: "skala", x, z, expr: "happy", arms: "cheer", ...jumpPose(f / 30, EV.yay / 30) });
api.fx({ key: "exclaim", cw: 300, ch: 300, draw: fxExclaim, x: x + 0.5, y: 1.9, z, w: 0.4 * k, h: 0.4 * k });
```
`i` must be stable per character (it drives blinks). Variants: `"skala"` (hero, orange), `"blue"`, `"green"`,
`"purple"`, `"teal"` (the mini-Skala team: coworkers, fans, customers, crowds). `scale: 0.8` for background extras.
Motions return `{ legs, hop, tilt, sx, sy, look }` — spread them after the pose so they win.

## Brand poses (`brandPose(name, extra?)`) — the 38 official poses
| name | expr + arms (+ prop) | use for |
|---|---|---|
| skala-annoyed | annoyed + crossed | "seriously?", bad takes |
| skala-celebrate | happy + cheer (hop) | wins, launches, numbers going up |
| skala-clipboard | smile + writing + clipboard | planning, checklists |
| skala-confused | confused + scratch | "wait, what?" |
| skala-creator-film | wink + holdFront + camera | content shoots |
| skala-creator-mic | smile + mic + mic | podcasts, talking |
| skala-creator-selfie | wink + selfie + selfie | creators, posting |
| skala-cringe | cringe + flinch | bad posts, awkward moments |
| skala-determined | determined + fists | "let's go", commitment |
| skala-dreamy | dreamy + handsChest | wishes, ideals |
| skala-follow-cta | wink + thumbsUp | end card: follow / save |
| skala-overwhelmed | dizzy + cheeks | too many things |
| skala-point-right | smile + pointRight | introducing what's beside him |
| skala-point-viewer | wink + pointViewer | "you!", direct address |
| skala-react-bored | bored + chin | boring content |
| skala-react-facepalm | annoyed + facepalm | mistakes |
| skala-react-mindblown | mindblown + cheeks | surprising facts |
| skala-react-popcorn | smile + popcorn + popcorn | drama, watching |
| skala-react-proud | proud + hips | success |
| skala-react-sleepy | sleepy + slump | boring, late |
| skala-research-calc | ooh + holdFront + calculator | numbers, budget |
| skala-research-magnify | smile + magnify + magnifier | investigating |
| skala-research-notes | smile + writing + notes | notes, research |
| skala-sad-low | sad + slump | failures |
| skala-shrug | smug + shrugUp | "whatever", "who knows" |
| skala-skeptical | skeptical + chin | doubt |
| skala-talking | talk + gesture (mouth flaps) | narrating |
| skala-teach-aha | smile + stickUp + pointer | the insight |
| skala-teach-ask | smile + stickAsk + pointer | asking the audience |
| skala-teach-attention | determined + stickRight + pointer | "listen up" |
| skala-teach-book-read | smile + read + book | learning |
| skala-teach-explain | smile + stickDown + pointer | explaining |
| skala-teach-good-job | happy + stickThumb + pointer | praise |
| skala-teach-no | smug + stickNo + pointer | "don't do this" |
| skala-teach-point-up | smile + stickUpRight + pointer | "one rule", the lesson |
| skala-teach-tap-stick | smile + tap + pointer | "now pay attention" |
| skala-teach-write | smile + writeUp + marker | writing on a board |
| skala-teach-yay | happy + stickYay + pointer (hop) | celebrating a lesson |
Known weaker: annoyed (crossed arms read stacked), react-bored / skeptical (elbow pokes out at the bottom),
creator-film uses a film camera (not a phone).

## Expressions (`expr`, 31)
talk, happy, worried, shock, sad, deadpan, sheepish, neutral, grin, thinking, angry, annoyed, love, wink, cry,
laughcry, smug, sleepy, mindblown, scared, excited, cringe, skeptical, proud, dreamy, determined, bored, confused,
dizzy, ooh, smile. (`talk` + `talk: true` flaps the mouth. Closed-eye expressions don't blink.)

## Arm poses (`arms`, 53)
rest, wave, wave2, up, cheer, cheeks, hold (both hands in front, e.g. bucket), holdFront, holdR, holdUp, phone,
selfie, shrug, shrugUp, point, pointLeft, pointRight, pointUp, pointViewer, present, slump, hide (holding a scroll
up), crumple, thumbsUp, facepalm, chin, clap, salute, crossed, hips, coverMouth, typing, writing, writeUp, tap, read,
mic, magnify, popcorn, handsChest, fists, gesture, scratch, flinch, megaphone, stickUp, stickAsk, stickThumb,
stickNo, stickRight, stickUpRight, stickYay, stickDown.

## Props (`prop`, 24) with their matching arms (`PROP_ARMS`)
bucket (hold), phone (phone), scroll (hide), ball (crumple), laptop (typing), coffee (holdR), megaphone (megaphone),
sign (holdUp; `text: "..."` prints on it), trophy (holdUp), clipboard (writing), mic (mic), camera (holdFront),
selfie (selfie), magnifier (magnify), book (read), calculator (holdFront), notes (writing), pointer (stickAsk or any
stick* pose), popcorn (popcorn), chart (holdFront), money (holdR), lightbulb (holdUp), marker (writeUp), can (holdR; generic energy-drink can, no logo).

## Effect cards (unlit, drawn on their own canvas)
New ones use a 300 x 300 canvas: fxExclaim, fxQuestion, fxSparkles, fxAngerVein, fxSweatDrops, fxZzz, fxLightbulb,
fxHeartsFloat, fxMoney, fxFire, fxCheck, fxCross, fxStarBurst, fxMusic, fxSpeech.
Older: fxHeart (400 x 380), fxRing(u) phone ring (300), fxLaugh(kind) laughing reaction (300), fxGrowl(u)
(300 x 200), fxSweat (140), fxSiren(u) (300), paperBallFx (240). Size them 0.15-0.6 m in the world; place near the
head (y 1.6-2.1) or over the wall display (z ≈ -5.6); `pop(f, a, b)` for pop-in/out.

## Motions (pure functions of time)
- `walkPose(t, speed=1)`: waddle (feet, hop, tilt, squash); move x/z yourself (~0.8-1.2 m/s) and set `facing`.
- `jumpPose(t, t0, dur=1, height=0.45)`: anticipation squash -> jump -> land squash, starting at t0 (seconds).
- `bouncePose(t, rate?)`: idle excited bounce. `nodPose(t, t0, dur=0.7, count=2)`: yes. `shakePose(t, t0, dur=0.8, count=3)`: no (look/tilt).
- `squash(k)` / `stretch(k)`: `{ sx, sy }` volume-preserving, for custom impacts.

## Adding to the library
Draw new poses/props in skala.ts with the `Pen` API (flat fill + `gradFill` shadow side, `inkRing` outline, no
highlights), add them to `SKALA_CATALOG`, regenerate both sheets, update this file, commit.
