// STARTER timeline (replace for each video): shots, camera keys, lens, kicks. See references/authoring.md and the
// worked example in examples/kfc/video/story.ts. Frames are 30 fps on the final voice (voice/words.txt).
import { V3, shotsFrom, shotAtOf, layersOf, Key, pushK, dolly, kickOf, camOf, Dof, dofOf, skalaEyes } from "../skala/camera";
import EVJ from "./events.json";

export const EV = EVJ as unknown as Record<string, number>;
export const TOTAL = (EVJ as { _total: number })._total; // last frame (voice end + ~1.5 s tail)
const CUTS = [0, 75, TOTAL]; // shot start frames, then TOTAL
export const SHOTS = shotsFrom(CUTS);
export const XFADE: Record<number, number> = {}; // shot id -> crossfade frames (place/time changes only)
export const FLASH_AT = EV.flash; // white flash after the hook (negative = none)
export const shotAt = shotAtOf(SHOTS);
export const layersAt = layersOf(SHOTS, XFADE);

const CAMS: Record<number, Key[]> = {
  // 1: medium shot of Skala in the aisle, slow push-in
  1: [{ f: 0, s: (f) => dolly([-0.2, 1.25, 3.3], [-0.6, 1.05, -0.6], pushK(f, 0, 0.0022), { fov: 38 }) }],
  // 2: wide office, Skala waving by the wall display
  2: [{ f: 75, s: (f) => dolly([0.5, 2.2, 7.4], [-0.3, 1.3, -4.0], pushK(f, 75, 0.002), { fov: 44 }) }],
};
const KICKS: [number, number][] = [];
export const camAt = camOf(CAMS, kickOf(KICKS));

const DOF: Dof[] = [
  { f: 0, cInf: 11, focus: skalaEyes(-0.6, -0.6) },
  { f: 75, cInf: 0 },
];
export const dofAt = dofOf(DOF);
/** full-frame colour wash at frame f (null = none) */
export const washAt = (_f: number): string | null => null;
/** captions to hide (lower-case), e.g. text already printed on screen */
export const CAPTION_SKIP: string[] = [];
export type { V3 };
