// KFC short timeline: shots, camera keys, lens and impact kicks, timed to the voice (events.json, frames at 30 fps).
// Built with the engine's camera grammar (../skala/camera.ts). World layout: ../skala/room.ts.
import { FPS, V3, smooth, shotsFrom, shotAtOf, layersOf, Key, pushK, dolly, rolled, kickOf, camOf, Dof, dofOf, skalaEyes } from "../skala/camera";
import { SCREEN } from "../skala/room";
import EVJ from "./events.json";

export const EV = EVJ as unknown as Record<string, number>;
export const TOTAL = 1845; // last frame of the picture timeline (voice end + ~1.7 s tail)
const CUTS = [0, 112, 182, 298, 432, 523, 568, 613, 705, 780, 820, 996, 1047, 1084, 1160, 1241, 1335, 1454, 1520, 1752, TOTAL];
export const SHOTS = shotsFrom(CUTS);
export const XFADE: Record<number, number> = { 15: 6, 19: 8 };
export const FLASH_AT = EV.flash; // 4-frame white flash after the hook
export const shotAt = shotAtOf(SHOTS);
export const layersAt = layersOf(SHOTS, XFADE);

/** fraction of the 120 map restaurants still open at frame f (closures start "day three", >half shut by "day five", last one on "no") */
export const openFrac = (f: number) => {
  if (f < EV.closing) return 1;
  if (f < EV.half + 10) return 1 - 0.3 * smooth((f - EV.closing) / (EV.day5 - EV.closing)) - 0.3 * smooth((f - EV.day5) / (EV.half + 10 - EV.day5));
  if (f < EV.shop) return 0.4 - 0.3 * smooth((f - EV.half - 10) / (EV.shop - EV.half - 10));
  if (f < EV.no) return 0.1 - 0.09 * smooth((f - EV.shop) / (EV.no - 4 - EV.shop));
  return f < EV.no + 1 ? 1 / 120 : 0;
};


// newspaper on Skala's desk (props.ts draws it)
const PAPER: V3 = [-2.25, 0.744, -1.0];
const CAL: V3 = [-1.72, 0.74, -1.22];
const SC = SCREEN;
const CAMS: Record<number, Key[]> = {
  // 1 hook: CU Skala with the bucket
  1: [{ f: 0, s: (f) => dolly([-1.6, 1.3, 3.0], [-2.2, 1.05, -0.2], pushK(f, 0, 0.0025, 0.006, 30), { fov: 40, roll: -0.02 }) },
    { f: EV.chicken1 - 10, dur: 20, s: (f) => dolly([-1.6, 1.3, 3.0], [-2.2, 1.05, -0.2], pushK(f, 0, 0.0025, 0.006, 30) * 0.92, { fov: 40, roll: 0.04 }) }],
  // 2 wide establishing (Valentine's Day)
  2: [{ f: 112, s: (f) => dolly([1.2, 2.3, 7.2], [0, 1.35, -4.5], pushK(f, 112, 0.002), { fov: 46 }) }],
  // 3 Skala presenting next to the screen ("KFC handed every delivery to a brand-new partner")
  3: [{ f: 182, s: (f) => dolly([-0.2, 1.6, 2.8], [-1.15, 1.55, -5.6], pushK(f, 182, 0.0022), { fov: 46, roll: 0.02 }) },
    { f: EV.partner - 9, dur: 18, s: (f) => dolly([-0.2, 1.6, 2.8], [-1.0, 1.6, -5.6], pushK(f, 182, 0.0022) * 0.92, { fov: 44, roll: -0.03 }) }],
  // 4 screen: one warehouse feeds 900 restaurants (punch on "nine hundred")
  4: [{ f: 298, s: (f) => dolly([0.4, 1.95, -1.4], [0.05, 1.95, SC[2]], pushK(f, 298, 0.002, 0.006, 35), { fov: 48 }) },
    { f: EV.nine - 10, dur: 22, s: (f) => dolly([0.4, 1.95, -1.4], [0.05, 1.95, SC[2]], pushK(f, 298, 0.002, 0.006, 35) * 0.9, { fov: 46, roll: 0.035 }) }],
  // 5 screen CU: trucks late
  5: [{ f: 432, s: (f) => dolly([-0.6, 1.75, -2.9], [-0.15, 1.85, SC[2]], pushK(f, 432, 0.003), { fov: 38, roll: -0.03 }) }],
  // 6 desk calendar flips, Skala worried behind the desk
  6: [{ f: 523, s: (f) => dolly([-1.0, 1.25, 1.2], [-2.0, 1.1, -1.4], pushK(f, 523, 0.003), { fov: 40 }) }],
  // 7 screen: restaurants closing
  7: [{ f: 568, s: (f) => dolly([0.9, 2.0, -2.0], [0.0, 1.9, SC[2]], pushK(f, 568, 0.0025), { fov: 44, roll: 0.03 }) }],
  // 8 Skala MS in front of the half-dark screen ("By day five ... shut")
  8: [{ f: 613, s: (f) => dolly([0.9, 1.35, 0.6], [-0.8, 1.2, -4.6], pushK(f, 613, 0.002), { fov: 46 }) },
    { f: EV.half - 10, dur: 22, s: (f) => dolly([0.9, 1.35, 0.6], [-0.9, 1.15, -4.6], pushK(f, 613, 0.002) * 0.86, { fov: 44, roll: -0.04 }) }],
  // 9 wide office, phones ringing
  9: [{ f: 705, s: (f) => dolly([0.5, 2.5, 8.2], [-0.1, 0.95, 0.6], pushK(f, 705, 0.0022), { fov: 44 }) }],
  // 10 police! blue coworker on the phone
  10: [{ f: 780, s: (f) => dolly([-3.4, 1.25, 2.9], [-4.2, 1.05, -0.2], pushK(f, 780, 0.004), { fov: 38, roll: 0.04 }) }],
  // 11 the police tweet on the screen (punch on "not a police matter")
  11: [{ f: 820, s: (f) => dolly([0.5, 1.95, -1.7], [0.45, 1.95, SC[2]], pushK(f, 820, 0.0018), { fov: 46 }) },
    { f: EV.matter - 10, dur: 22, s: (f) => dolly([0.5, 1.95, -1.7], [0.75, 1.95, SC[2]], pushK(f, 820, 0.0018) * 0.86, { fov: 44, roll: 0.035 }) }],
  // 12 "A chicken shop." CU Skala holding the empty bucket
  12: [{ f: 996, s: (f) => dolly([-2.8, 1.3, 3.0], [-2.2, 1.05, -0.2], pushK(f, 996, 0.003), { fov: 40, roll: 0.03 }) }],
  // 13 the last dot goes out
  13: [{ f: 1047, s: (f) => dolly([0.2, 1.9, -2.3], [0.0, 1.9, SC[2]], pushK(f, 1047, 0.0035), { fov: 40 }) }],
  // 14 the whole country laughing (over Skala's shoulder at the screen)
  14: [{ f: 1084, s: (f) => dolly([-0.2, 1.5, 1.8], [0.0, 1.75, -5.8], pushK(f, 1084, 0.002), { fov: 48 }) }],
  // 15 "Luckily, nobody got hurt."
  15: [{ f: 1160, s: (f) => dolly([-0.1, 1.25, 3.3], [-0.6, 1.05, -0.6], pushK(f, 1160, 0.0022), { fov: 38 }) }],
  // 16 "Unluckily, everybody got hungry." the hungry queue (roll on "hungry")
  16: [{ f: 1241, s: (f) => dolly([0.4, 4.1, 7.4], [0.0, 0.9, -1.2], pushK(f, 1241, 0.002), { fov: 40 }) },
    { f: EV.hungry - 10, dur: 22, s: rolled((f) => dolly([0.4, 4.1, 7.4], [0.0, 0.9, -1.2], pushK(f, 1241, 0.002, 0.005, 30), { fov: 40 }), 0.04) }],
  // 17 hiding behind the corporate statement
  17: [{ f: 1335, s: (f) => dolly([-0.25, 1.3, 3.3], [-0.6, 1.05, -0.6], pushK(f, 1335, 0.0022), { fov: 38 }) }],
  // 18 crumple it, the newspaper ad instead
  18: [{ f: 1454, s: (f) => dolly([0.3, 1.25, 3.2], [-0.7, 1.05, -0.6], pushK(f, 1454, 0.0025), { fov: 40, roll: -0.04 }) }],
  // 19 newspaper top-down: bucket, letters shuffle
  19: [{ f: 1520, s: (f) => dolly([PAPER[0] + 0.05, 2.25, PAPER[2] + 0.55], [PAPER[0], PAPER[1], PAPER[2] - 0.02], pushK(f, 1520, 0.0015), { fov: 40 }) },
    { f: EV.F - 8, dur: 18, s: (f) => dolly([PAPER[0] + 0.03, 2.0, PAPER[2] + 0.42], [PAPER[0], PAPER[1], PAPER[2] - 0.08], pushK(f, 1520, 0.0015), { fov: 40, roll: 0.03 }) }],
  // 20 "We're sorry." then pull back to Skala's sheepish smile
  20: [{ f: 1752, s: (f) => dolly([PAPER[0] + 0.03, 2.0, PAPER[2] + 0.42], [PAPER[0], PAPER[1], PAPER[2] + 0.05], pushK(f, 1752, 0.002), { fov: 40 }) },
    { f: 1800, dur: 36, s: (f) => dolly([-1.4, 1.5, 3.2], [-2.9, 1.05, -0.7], pushK(f, 1800, 0.002), { fov: 42 }) }],
};

/** impact kicks [seconds, gain]: "shut", the last light out, the newspaper landing, the K */
const KICKS: [number, number][] = [[EV.shut / FPS, 0.8], [EV.no / FPS, 1.2], [EV.newspaper / FPS, 0.6], [EV.K / FPS, 0.5]];
export const camAt = camOf(CAMS, kickOf(KICKS));


// ---------------- lens ----------------
const DOF: Dof[] = [
  { f: 0, cInf: 14, focus: skalaEyes(-2.2, -0.2) },
  { f: 112, cInf: 0 }, // establishing
  { f: 182, cInf: 8, focus: skalaEyes(-1.6, -4.4) },
  { f: 298, cInf: 0 }, // screen
  { f: 523, cInf: 13, focus: () => [CAL[0], CAL[1] + 0.1, CAL[2]] }, // calendar CU, Skala soft behind
  { f: 568, cInf: 0 },
  { f: 613, cInf: 10, focus: skalaEyes(-1.3, -4.2) },
  { f: 705, cInf: 0 },
  { f: 780, cInf: 13, focus: skalaEyes(-4.2, -0.2) },
  { f: 820, cInf: 0 },
  { f: 996, cInf: 14, focus: skalaEyes(-2.2, -0.2) },
  { f: 1047, cInf: 0 },
  { f: 1084, cInf: 6 }, // focus = look (the screen), Skala's back soft
  { f: 1160, cInf: 11, focus: skalaEyes(-0.6, -0.6) },
  { f: 1241, cInf: 6, focus: () => [0, 1.0, 0.3] },
  { f: 1335, cInf: 11, focus: skalaEyes(-0.6, -0.6) },
  { f: 1520, cInf: 7 }, // newspaper: focus = look
  { f: 1800, dur: 36, cInf: 11, focus: skalaEyes(-3.3, -1.0) },
];
export const dofAt = dofOf(DOF);

/** full-frame colour wash (multiply) at story frame f, e.g. the police siren on "called the police"; null = none */
export const washAt = (f: number) => (f >= 778 && f < 822 ? (Math.floor(f / 5) % 2 ? "rgba(60,110,255,0.16)" : "rgba(255,60,60,0.16)") : null);
/** captions not shown (lower-case): text already printed on screen */
export const CAPTION_SKIP = ["we're sorry"];
