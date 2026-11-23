// Test short (Burbn -> Instagram): shots + camera + lens on the final voice (events.json). See PLAN.md.
import { FPS, V3, shotsFrom, shotAtOf, layersOf, Key, pushK, dolly, rolled, kickOf, camOf, Dof, dofOf, skalaEyes } from "../skala/camera";
import { SCREEN } from "../skala/room";
import EVJ from "./events.json";

export const EV = EVJ as unknown as Record<string, number>;
export const TOTAL = (EVJ as { _total: number })._total;
const CUTS = [0, 84, 159, 244, 347, 421, 531, 670, 805, 901, TOTAL];
export const SHOTS = shotsFrom(CUTS);
export const XFADE: Record<number, number> = {};
export const FLASH_AT = EV.flash;
export const shotAt = shotAtOf(SHOTS);
export const layersAt = layersOf(SHOTS, XFADE);
const SZ = SCREEN[2];
const CTX = (f: number, f0: number, k = 1) => dolly([-0.2, 1.6, 2.8], [-1.15, 1.55, -5.6], pushK(f, f0, 0.0022) * k, { fov: 46 });
const AISLE = (f: number, f0: number, k = 1, rate = 0.0022) => dolly([-0.15, 1.25, 3.3], [-0.6, 1.05, -0.6], pushK(f, f0, rate) * k, { fov: 38 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => dolly([-1.5, 1.35, 3.5], [-2.2, 1.1, -0.2], pushK(f, 0, 0.0022), { fov: 40, roll: -0.02 }) },
    { f: EV.bukan - 9, dur: 18, s: (f) => dolly([-1.5, 1.35, 3.5], [-2.2, 1.1, -0.2], pushK(f, 0, 0.0022) * 0.92, { fov: 40, roll: 0.04 }) }],
  2: [{ f: 84, s: (f) => ({ ...CTX(f, 84), roll: 0.02 }) }],
  3: [{ f: 159, s: (f) => ({ ...AISLE(f, 159), roll: -0.03 }) }],
  4: [{ f: 244, s: (f) => dolly([0.35, 1.95, -1.5], [0.05, 1.95, SZ], pushK(f, 244, 0.002), { fov: 46 }) },
    { f: EV.foto2 - 10, dur: 20, s: (f) => dolly([0.35, 1.95, -1.5], [0.05, 1.95, SZ], pushK(f, 244, 0.002, 0.006, 30) * 0.9, { fov: 44, roll: 0.035 }) }],
  5: [{ f: 347, s: (f) => dolly([0.5, 2.5, 8.2], [-0.1, 0.95, 0.6], pushK(f, 347, 0.0022), { fov: 44 }) }],
  6: [{ f: 421, s: (f) => CTX(f, 421) },
    { f: EV.foto3 - 10, dur: 20, s: (f) => ({ ...CTX(f, 421, 0.88), roll: -0.04 }) }],
  7: [{ f: 531, s: (f) => dolly([-0.5, 1.8, -2.4], [-0.1, 1.9, SZ], pushK(f, 531, 0.0025), { fov: 44, roll: -0.03 }) }],
  8: [{ f: 670, s: (f) => dolly([-0.6, 2.4, 8.0], [0.1, 1.15, -0.4], pushK(f, 670, 0.0025), { fov: 46, roll: 0.02 }) }],
  9: [{ f: 805, s: (f) => AISLE(f, 805) },
    { f: EV.jangan - 9, dur: 18, s: rolled((f) => AISLE(f, 805, 0.94), 0.035) }],
  10: [{ f: 901, s: (f) => dolly([-0.35, 1.2, 2.9], [-0.6, 1.05, -0.6], pushK(f, 901, 0.0025), { fov: 38, roll: -0.03 }) },
    { f: EV.buang - 10, dur: 22, s: (f) => dolly([0.1, 1.3, 3.6], [-0.6, 1.1, -0.6], pushK(f, 901, 0.002), { fov: 40, roll: 0.03 }) }],
};
const KICKS: [number, number][] = [[EV.semuanya / FPS, 0.9], [EV.pakai / FPS, 0.5]];
export const camAt = camOf(CAMS, kickOf(KICKS));

const DOF: Dof[] = [
  { f: 0, cInf: 14, focus: skalaEyes(-2.2, -0.2) },
  { f: 84, cInf: 6, focus: skalaEyes(-1.5, -4.35) },
  { f: 159, cInf: 11, focus: skalaEyes(-0.6, -0.6) },
  { f: 244, cInf: 0 },
  { f: 421, cInf: 6, focus: skalaEyes(-1.5, -4.35) },
  { f: 531, cInf: 0 },
  { f: 805, cInf: 11, focus: skalaEyes(-0.6, -0.6) },
];
export const dofAt = dofOf(DOF);
export const washAt = (_f: number): string | null => null;
export const CAPTION_SKIP: string[] = [];
export type { V3 };
