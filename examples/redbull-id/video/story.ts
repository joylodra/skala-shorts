// Red Bull Stratos short: shots + camera + lens on the final voice (events.json). See PLAN.md.
import { FPS, V3, shotsFrom, shotAtOf, layersOf, Key, pushK, dolly, rolled, kickOf, camOf, Dof, dofOf, skalaEyes } from "../skala/camera";
import { SCREEN } from "../skala/room";
import EVJ from "./events.json";

export const EV = EVJ as unknown as Record<string, number>;
export const TOTAL = (EVJ as { _total: number })._total;
const CUTS = [0, 92, 133, 200, 302, 386, 476, 520, 685, 787, 838, 914, 955, 1007, TOTAL];
export const SHOTS = shotsFrom(CUTS);
export const XFADE: Record<number, number> = {};
export const FLASH_AT = EV.flash;
export const shotAt = shotAtOf(SHOTS);
export const layersAt = layersOf(SHOTS, XFADE);
const SZ = SCREEN[2];
/** Skala's hop off the capsule step on "lompat" (metres relative to the step; negative = falling) */
export const JUMP0 = EVJ.lompat1 - 6;
export const skalaFall = (f: number) => { const d = (f - JUMP0) / 30; return d <= 0 ? 0 : 3.2 * d - 8.5 * d * d; };
const CTX = (f: number, f0: number, k = 1) => dolly([-0.2, 1.6, 2.8], [-1.15, 1.55, -5.6], pushK(f, f0, 0.0022) * k, { fov: 46 });
const AISLE = (f: number, f0: number, k = 1) => dolly([-0.15, 1.25, 3.3], [-0.6, 1.05, -0.6], pushK(f, f0, 0.0022) * k, { fov: 38 });
const SCR = (f: number, f0: number, k = 1, x = 0.3) => dolly([x, 1.95, -1.6], [0.05, 1.95, SZ], pushK(f, f0, 0.0022) * k, { fov: 46 });
const WIDE = (f: number, f0: number) => dolly([0.5, 2.5, 8.2], [-0.1, 1.05, 0.5], pushK(f, f0, 0.0022), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  // 1-2: the hook in space (SPACE set at y 300 in props.ts): Skala on the capsule step, Earth curving below
  1: [{ f: 0, s: (f) => dolly([0.7, 302.2, 4.6], [-0.2, 300.75, -1.0], pushK(f, 0, 0.0022), { fov: 44, roll: -0.02 }) },
    { f: EV.angkasa - 9, dur: 18, s: (f) => dolly([0.7, 302.2, 4.6], [-0.2, 300.75, -1.0], pushK(f, 0, 0.0022) * 0.9, { fov: 44, roll: 0.04 }) }],
  2: [{ f: 92, s: (f) => dolly([-0.6, 302.3, 5.0], [0.3, 300.8 + Math.min(0, skalaFall(f)) * 0.5, -0.5], pushK(f, 92, 0.002), { fov: 44, roll: -0.03 }) }],
  3: [{ f: 133, s: (f) => WIDE(f, 133) }],
  4: [{ f: 200, s: (f) => SCR(f, 200) }],
  5: [{ f: 302, s: (f) => CTX(f, 302) },
    { f: EV.km39 - 10, dur: 20, s: (f) => ({ ...CTX(f, 302, 0.88), roll: 0.04 }) }],
  6: [{ f: 386, s: (f) => dolly([-0.4, 1.9, -2.0], [0.0, 1.95, SZ], pushK(f, 386, 0.003), { fov: 44 }) }],
  7: [{ f: 476, s: (f) => dolly([-0.3, 1.2, 2.9], [-0.6, 1.05, -0.6], pushK(f, 476, 0.003), { fov: 38, roll: 0.03 }) }],
  8: [{ f: 520, s: (f) => SCR(f, 520, 1, -0.3) },
    { f: EV.speed - 10, dur: 20, s: (f) => ({ ...SCR(f, 520, 0.88, -0.3), roll: -0.035 }) }],
  9: [{ f: 685, s: (f) => dolly([-0.6, 2.4, 7.8], [0.1, 1.15, -0.3], pushK(f, 685, 0.0022), { fov: 46 }) }],
  10: [{ f: 787, s: (f) => SCR(f, 787, 1, 0.6) }],
  11: [{ f: 838, s: (f) => WIDE(f, 838) },
    { f: EV.rekor - 9, dur: 18, s: rolled((f) => WIDE(f, 838), 0.035) }],
  12: [{ f: 914, s: (f) => AISLE(f, 914) }],
  13: [{ f: 955, s: (f) => dolly([-0.35, 1.2, 2.95], [-0.6, 1.08, -0.6], pushK(f, 955, 0.0025, 0.005, 30), { fov: 38, roll: 0.03 }) }],
  14: [{ f: 1007, s: (f) => dolly([-0.6, 2.4, 7.8], [0.1, 1.2, -0.6], pushK(f, 1007, 0.0022), { fov: 46, roll: -0.02 }) }],
};
const KICKS: [number, number][] = [[EV.km39 / FPS, 0.4], [EV.lompat2 / FPS, 0.8], [EV.suara / FPS, 1.2]];
export const camAt = camOf(CAMS, kickOf(KICKS));

const DOF: Dof[] = [
  { f: 0, cInf: 10, focus: () => [0, 301.0, 0] },
  { f: 133, cInf: 0 },
  { f: 302, cInf: 6, focus: skalaEyes(-1.5, -4.35) },
  { f: 386, cInf: 0 },
  { f: 476, cInf: 12, focus: skalaEyes(-0.6, -0.6) },
  { f: 520, cInf: 0 },
  { f: 914, cInf: 11, focus: skalaEyes(-0.6, -0.6) },
  { f: 1007, cInf: 0 },
];
export const dofAt = dofOf(DOF);
export const washAt = (_f: number): string | null => null;
export const CAPTION_SKIP: string[] = [];
export type { V3 };
