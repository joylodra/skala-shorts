// Camera + lens + shot-timeline machinery (engine). A video's story.ts builds its SHOTS / CAMS / DOF / KICKS with these.
// Grammar (cartoon-3d-short look, measured on the reference channel): hard cuts on big reframes; smootherstep glides of
// 18-40 f; every hold creeps (pushK); impact kicks flip sign every frame and decay over 7 f; rolls of ~4-5 deg (0.035-0.045 rad)
// on emphasis beats.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;

// ---------------- shots ----------------
export type ShotDef = { id: number; a: number; b: number; light: "day" };
/** CUTS = shot start frames + the total length as the last entry */
export const shotsFrom = (cuts: number[]): ShotDef[] => cuts.slice(0, -1).map((a, i) => ({ id: i + 1, a, b: cuts[i + 1], light: "day" }));
export const shotAtOf = (shots: ShotDef[]) => (f: number) => shots.find((s) => f >= s.a && f < s.b) ?? shots[shots.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade (XFADE: shot id -> frames) */
export const layersOf = (shots: ShotDef[], xfade: Record<number, number>) => (f: number): { id: number; alpha: number }[] => {
  for (const s of shots) {
    const x = xfade[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAtOf(shots)(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = Partial<Cam> & { pos: V3; look: V3 };
/** f = frame the key starts; dur = glide length (default 24); cut = jump instead of glide; s = framing as a function of f */
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
export const runKeys = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0: ~rate per frame (0.0015-0.0035 typical); punch raises it for n frames on a punch word */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly: camera slides toward the look point by factor k (k from pushK) */
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push (camera stays put, for lenses close to walls): tan(fov/2) shrinks by k */
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
export const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

/** impact kicks: [seconds, gain]; the image offset flips sign every frame and decays over 7 f */
export const kickOf = (kicks: [number, number][]) => (t: number) => {
  let a = 0;
  for (const [t0, g] of kicks) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camOf = (cams: Record<number, Key[]>, kickAt: (t: number) => number) => (id: number, f: number): Cam => {
  const c = runKeys(cams[id], f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
/** cInf = blur radius in px at 1080 wide for things at infinity (0 = all sharp; CU 12-16, MS 8-12, wides 0).
 *  Entries switch on their frame, or ramp over dur. focus = world point (default: the camera look point). */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const dofOf = (table: Dof[]) => (f: number) => {
  let i = 0; while (i + 1 < table.length && f >= table[i + 1].f) i++;
  const d = table[i], p = table[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
/** eyes of a standing full-size Skala at (x, z): focus target for DOF */
export const skalaEyes = (x: number, z: number, scale = 1) => (): V3 => [x, 1.0 * scale, z];
