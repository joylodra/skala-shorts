// Skala (and the mini-Skala team) in the cartoon-3d-short character style: flat fills + painted shadow side,
// thick-thin plum ink, no catchlights, no blush. Design space 1000 x 1000, soles at y = 940 (card geometry in cast.ts).
// Approved look: skala-test/skala-test-v2.png (2026-11-23).
import { Pen, INK } from "./toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

export const chaikin = (pts: P2[], it = 4): P2[] => {
  for (let k = 0; k < it; k++) {
    const out: P2[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    pts = out;
  }
  return pts;
};
export const ellP = (cx: number, cy: number, rx: number, ry: number, rot = 0, n = 64): P2[] => {
  const r = rad(rot), out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, x = rx * Math.cos(a), y = ry * Math.sin(a);
    out.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return out;
};
const LIGHT = rad(-135);
const fill = (p: Pen, pts: P2[], col: string) => p.poly(pts, col, 0);
const shape = (p: Pen, pts: P2[], base: string, shadow: string, w = 14) => {
  p.gradFill(pts, base, shadow, LIGHT, 0.3);
  p.inkRing(pts, w, rad(60), 0.55);
};

// ---------------- palettes ----------------
export type Variant = "skala" | "blue" | "green" | "purple" | "teal";
const PAL: Record<Variant, { hood: [string, string]; body: [string, string] }> = {
  skala: { hood: ["#ff9424", "#e8321f"], body: ["#ff9a2e", "#e9561c"] },
  blue: { hood: ["#5aa2ff", "#2f56c8"], body: ["#64a8ff", "#3a66cf"] },
  green: { hood: ["#4fd08a", "#1d8a57"], body: ["#5ad493", "#26935f"] },
  purple: { hood: ["#b48cff", "#6a40c8"], body: ["#ba95ff", "#7650cf"] },
  teal: { hood: ["#3fd0cf", "#14808f"], body: ["#4ad6d2", "#1b8a96"] },
};
const FACE: [string, string] = ["#fff7ef", "#efd9cc"];
const EYE = "#2e1a1c", MOUTH = "#5a1e28", TONGUE = "#ef7a82";

const HOOD = chaikin([
  [480, 128], [640, 122], [684, 140], [692, 180], [692, 320], [705, 338], [890, 342], [928, 362], [936, 400],
  [934, 525], [912, 556], [720, 582], [520, 610], [300, 606], [130, 602], [98, 585], [90, 545], [96, 430],
  [118, 375], [190, 340], [300, 318], [360, 280], [410, 200], [440, 150],
], 3);
const FACEP = chaikin([[340, 372], [500, 362], [665, 372], [705, 430], [722, 585], [690, 640], [500, 652], [310, 640], [278, 585], [295, 430]], 4);
const BODYP = ellP(505, 705, 200, 118);

// ---------------- face ----------------
type OldExpr = "talk" | "happy" | "worried" | "shock" | "sad" | "deadpan" | "sheepish" | "neutral" | "grin";
export type Expr = OldExpr | NewExpr;
const eyes = (p: Pen, e: Expr, lid: number, dx: number) => {
  const E: P2[] = [[418 + dx, 498], [612 + dx, 490]];
  for (const [i, [x, y]] of E.entries()) {
    if (e === "happy" || e === "grin") {
      p.stroke([...Array(13)].map((_, k): P2 => { const a = rad(200 + (140 * k) / 12); return [x + 44 * Math.cos(a), y + 14 + 36 * Math.sin(a)]; }), 15, EYE);
      continue;
    }
    if (lid >= 0.99) { p.stroke([[x - 40, y + 6], [x + 40, y + 6]], 13, EYE); continue; }
    if (e === "shock") {
      const o = ellP(x, y, 50, 58); fill(p, o, "#ffffff"); p.inkRing(o, 9, rad(60), 0.3); fill(p, ellP(x + 4, y + 6, 20, 24), EYE); continue;
    }
    const ry = (e === "deadpan" ? 30 : 48) * (1 - 0.85 * lid), rx = e === "worried" && i === 1 ? 34 : 40;
    const cy = e === "deadpan" ? y + 10 : y;
    fill(p, ellP(x, cy + (48 - ry) * 0.3, rx, Math.max(6, ry)), EYE);
    if (e === "deadpan") p.stroke([[x - 46, cy - 22], [x + 46, cy - 22]], 12, EYE); // heavy lid
  }
  if (e === "worried" || e === "sad") {
    p.stroke([[372 + dx, 438], [452 + dx, 424]], 11, EYE);
    p.stroke([[576 + dx, 424], [652 + dx, 438]], 11, EYE);
  }
};
const dMouth = (p: Pen, mx: number, my: number, s: number) => {
  const pts: P2[] = [...Array(25)].map((_, k): P2 => { const a = rad((180 * k) / 24); return [mx + 48 * s * Math.cos(a), my - 6 + 52 * s * Math.sin(a)]; });
  pts.push([mx - 48 * s, my - 6], [mx - 20 * s, my - 18], [mx + 20 * s, my - 18], [mx + 48 * s, my - 6]);
  const sm = chaikin(pts, 2);
  fill(p, sm, MOUTH);
  p.clip(sm, () => fill(p, ellP(mx, my + 44 * s, 36 * s, 26 * s), TONGUE));
  p.inkRing(sm, 7, rad(60), 0.3);
};
const mouth = (p: Pen, e: Expr, dx: number, talk: number) => {
  const mx = 515 + dx, my = 548;
  switch (e) {
    case "talk": if (talk > 0.5) dMouth(p, mx, my, 0.8); else p.stroke([[mx - 30, my + 4], [mx, my + 14], [mx + 30, my + 4]], 11, MOUTH); break;
    case "happy": dMouth(p, mx, my, 1.0); break;
    case "grin": dMouth(p, mx, my, 1.3); break;
    case "neutral": p.stroke([[mx - 28, my + 8], [mx, my + 16], [mx + 28, my + 8]], 11, MOUTH); break;
    case "worried": p.stroke([...Array(17)].map((_, k): P2 => [mx - 40 + 5 * k, my + 12 + 7 * Math.sin(k * 0.8)]), 10, MOUTH); break;
    case "shock": { const o = ellP(mx, my + 16, 24, 30); fill(p, o, MOUTH); p.inkRing(o, 6, rad(60), 0.3); break; }
    case "sad": p.stroke([[mx - 32, my + 24], [mx, my + 10], [mx + 32, my + 24]], 11, MOUTH); break;
    case "deadpan": p.stroke([[mx - 30, my + 14], [mx + 30, my + 14]], 11, MOUTH); break;
    case "sheepish": p.stroke([[mx - 36, my + 6], [mx - 6, my + 20], [mx + 34, my + 2]], 11, MOUTH); break;
  }
};

// ---------------- arms + props ----------------
type OldArms = "rest" | "wave" | "up" | "cheeks" | "hold" | "phone" | "shrug" | "point" | "slump" | "hide" | "crumple";
export type Arms = OldArms | NewArms;
export type Prop = null | "bucket" | "phone" | "scroll" | "ball" | "paper" | NewProp;
type ArmDef = [number, number, number, number, number]; // cx, cy, rx, ry, rot
const ARMS: Record<OldArms, [ArmDef, ArmDef]> = {
  rest: [[320, 725, 66, 58, 20], [690, 725, 66, 58, -20]],
  wave: [[360, 690, 80, 66, -30], [752, 640, 70, 62, -20]],
  up: [[205, 640, 78, 64, -40], [810, 620, 78, 64, 40]],
  cheeks: [[330, 610, 70, 60, -60], [690, 610, 70, 60, 60]],
  hold: [[400, 720, 66, 58, -10], [620, 720, 66, 58, 10]],
  phone: [[320, 725, 66, 58, 20], [745, 560, 64, 58, -50]],
  shrug: [[215, 700, 74, 58, 10], [795, 700, 74, 58, -10]],
  point: [[320, 725, 66, 58, 20], [850, 640, 78, 56, -15]],
  slump: [[330, 770, 62, 56, 30], [680, 770, 62, 56, -30]],
  hide: [[330, 470, 64, 56, -20], [690, 470, 64, 56, 20]],
  crumple: [[430, 690, 66, 58, -20], [590, 690, 66, 58, 20]],
};
const bucket = (p: Pen, cx: number, cy: number, s: number, letters: string | null = null) => {
  const w0 = 150 * s, w1 = 110 * s, h = 170 * s;
  const B: P2[] = chaikin([[cx - w0, cy - h], [cx + w0, cy - h], [cx + w1, cy + h], [cx - w1, cy + h]], 2);
  p.gradFill(B, "#ffffff", "#e6dad6", LIGHT, 0.5);
  p.clip(B, () => {
    for (let k = -3; k <= 3; k++) {
      const x0 = cx + k * 64 * s;
      fill(p, [[x0 - 16 * s, cy - h - 10], [x0 + 16 * s, cy - h - 10], [x0 + 12 * s, cy + h + 10], [x0 - 12 * s, cy + h + 10]], "#e23a2e");
    }
    if (letters) {
      fill(p, [[cx - 120 * s, cy - 55 * s], [cx + 120 * s, cy - 55 * s], [cx + 112 * s, cy + 55 * s], [cx - 112 * s, cy + 55 * s]], "#ffffff");
    }
  });
  p.inkRing(B, 10 * Math.max(0.6, s), rad(60), 0.4);
  const rim = ellP(cx, cy - h, w0 + 6, 26 * s);
  p.poly(rim, "#f2ddd5", 0);
  p.poly(ellP(cx, cy - h + 6 * s, w0 - 18 * s, 14 * s), "#d9bdb3", 0);
  p.inkRing(rim, 8 * Math.max(0.6, s), rad(60), 0.3);
};
const phone = (p: Pen, cx: number, cy: number) => {
  const R = chaikin([[cx - 34, cy - 70], [cx + 34, cy - 70], [cx + 34, cy + 70], [cx - 34, cy + 70]], 2);
  p.poly(R, "#2c2f3c", 9);
  fill(p, chaikin([[cx - 24, cy - 56], [cx + 24, cy - 56], [cx + 24, cy + 52], [cx - 24, cy + 52]], 2), "#8fd0ff");
};
const scroll = (p: Pen) => {
  const S: P2[] = [[300, 360], [710, 360], [720, 990], [290, 990]];
  p.poly(S, "#fbfaf6", 10);
  for (let k = 0; k < 13; k++) p.stroke([[335, 400 + k * 44], [k % 4 === 3 ? 520 : 670, 400 + k * 44]], 9, "#b9b5c4");
  p.ell(505, 362, 215, 20, "#ece8df", 9);
};
export const paperBallFx = (p: Pen) => { p.g.translate(-390, -570); paperBall(p); };
const paperBall = (p: Pen) => {
  const pts = chaikin([...Array(12)].map((_, k): P2 => { const a = rad(k * 30), r = k % 2 ? 70 : 88; return [510 + r * Math.cos(a), 690 + r * Math.sin(a)]; }), 1);
  p.poly(pts, "#fbfaf6", 9);
  p.stroke([[470, 660], [520, 700], [560, 670]], 6, "#b9b5c4");
  p.stroke([[480, 730], [540, 720]], 6, "#b9b5c4");
};

export type SkalaOpts = {
  v?: Variant; expr: Expr; arms?: Arms; prop?: Prop; blink?: number; look?: number; talk?: number; tilt?: number;
  legs?: number; // walk / hop phase -1..1 (feet lift)
  facing?: 1 | -1; // -1 mirrors the whole drawing (walking left); look/tilt are in character space
  squash?: { sx: number; sy: number }; // squash & stretch about the soles (see squash()/stretch()/jumpPose())
  text?: string; // sign prop text
};

export const drawSkala = (p: Pen, o: SkalaOpts) => {
  const pal = PAL[o.v ?? "skala"], g = p.g, dx = (o.look ?? 0) * 22, arms = ARMS[(o.arms ?? "rest") as OldArms];
  const pose = POSES[o.arms as NewArms] as Pose | undefined, prop2 = PROPS2[o.prop as NewProp] as PropFn | undefined;
  g.save();
  if (o.facing === -1) { g.translate(1000, 0); g.scale(-1, 1); }
  if (o.squash) { g.translate(500, 940); g.scale(o.squash.sx, o.squash.sy); g.translate(-500, -940); }
  g.translate(500, 940); g.rotate(rad(o.tilt ?? 0)); g.translate(-500, -940);
  // legs + feet (feet stay inside the card: soles at y 940)
  const lg = o.legs ?? 0;
  for (const [x, side, i] of [[400, -1, 0], [610, 1, 1]] as const) {
    const lift = i === 0 ? Math.max(0, lg) * 40 : Math.max(0, -lg) * 40;
    const leg = chaikin([[x - 62, 740], [x + 62, 740], [x + 56 + side * 10, 885 - lift], [x - 56 + side * 10, 885 - lift]], 3);
    shape(p, leg, pal.body[0], pal.body[1], 12);
    shape(p, ellP(x + side * 20, 900 - lift, 80, 40, side * 6), pal.body[0], pal.body[1], 13);
  }
  shape(p, BODYP, pal.body[0], pal.body[1], 14);
  shape(p, HOOD, pal.hood[0], pal.hood[1], 16);
  shape(p, FACEP, FACE[0], FACE[1], 11);
  const f2 = FACE2[o.expr as NewExpr];
  if (f2) f2({ p, L: [418 + dx, 498], R: [612 + dx, 490], M: [515 + dx, 548], lid: o.blink ?? 0 });
  else { eyes(p, o.expr, o.blink ?? 0, dx); mouth(p, o.expr, dx, o.talk ?? 0); }
  if (o.prop === "scroll") scroll(p);
  if (o.prop === "phone") phone(p, 735, 500);
  if (o.prop === "bucket") bucket(p, 510, 790, 0.58);
  if (o.prop === "ball") paperBall(p);
  const anchor = pose?.anchor ?? (pose ? pose.R.pts[pose.R.pts.length - 1] : OLD_ANCHOR[(o.arms ?? "rest") as OldArms] ?? [690, 725]);
  const pc: PropCtx = { p, a: anchor, pose, o, dx, pal };
  if (prop2 && !PROP_OVER.has(o.prop as NewProp)) prop2(pc);
  if (pose) {
    const order = pose.first === "R" ? [pose.R, pose.L] : [pose.L, pose.R];
    order.forEach((l) => drawLimb(p, l, pal.body));
  } else arms.forEach((a) => shape(p, ellP(...a), pal.body[0], pal.body[1], 13));
  if (prop2 && PROP_OVER.has(o.prop as NewProp)) prop2(pc);
  g.restore();
};

// ---------------- effect drawings (unlit cards) ----------------
export const fxHeart = (p: Pen) => {
  const pts: P2[] = [];
  for (let k = 0; k < 60; k++) {
    const t = (k / 60) * Math.PI * 2;
    pts.push([200 + 9.5 * 16 * Math.sin(t) ** 3, 190 - 9.5 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
  }
  p.gradFill(pts, "#ff5d7a", "#d42752", LIGHT, 0.35); p.inkRing(pts, 14, rad(60), 0.5);
  p.ell(140, 120, 26, 16, "#ffb3c2", 0, 0, 360, -30);
};
export const fxRing = (p: Pen, u: number) => { // phone-ring arcs, u 0..1 loop
  for (let k = 0; k < 3; k++) {
    const r = 60 + 50 * k + 30 * u, a = 1 - Math.abs(u - 0.5) * 0.6;
    p.g.globalAlpha = a;
    p.arc(150, 150, r * 0.55, r * 0.55, -150, -100, 16);
    p.arc(150, 150, r * 0.55, r * 0.55, -80, -30, 16);
  }
  p.g.globalAlpha = 1;
};
export const fxLaugh = (p: Pen, kind: number) => { // laughing reaction bubble
  const C = ellP(150, 150, 120, 120);
  p.gradFill(C, "#ffd84a", "#f0a51c", LIGHT, 0.4); p.inkRing(C, 12, rad(60), 0.4);
  for (const x of [100, 200]) p.arc(x, 130, 26, 20, 200, 340, 13, INK);
  const m: P2[] = [...Array(17)].map((_, k): P2 => { const a = rad((180 * k) / 16); return [150 + 62 * Math.cos(a), 170 + 52 * Math.sin(a)]; });
  p.poly(m, "#5a1e28", 9);
  if (kind) { p.ell(70, 160, 16, 26, "#7fd0ff", 6, 0, 360, -20); p.ell(230, 160, 16, 26, "#7fd0ff", 6, 0, 360, 20); }
};
export const fxGrowl = (p: Pen, u: number) => { // hunger squiggle
  for (let k = 0; k < 3; k++) {
    const y = 60 + k * 50, pts: P2[] = [];
    for (let i = 0; i <= 20; i++) pts.push([30 + i * 12, y + 14 * Math.sin(i * 0.9 + u * 6 + k)]);
    p.stroke(pts, 11, INK);
  }
};
export const fxSweat = (p: Pen) => {
  const d: P2[] = chaikin([[60, 0], [100, 70], [92, 110], [60, 126], [28, 110], [20, 70]], 2);
  p.poly(d, "#8fd3ff", 8);
};
export const fxSiren = (p: Pen, u: number) => {
  const red = u < 0.5;
  p.g.globalAlpha = 0.55;
  p.ell(150, 150, 140, 140, red ? "#ff3b3b" : "#3b7bff", 0);
  p.g.globalAlpha = 1;
};
export { bucket as drawBucket };

// =====================================================================================================
// v2 library (2026-11-23): more expressions, tube arms with mittens, props, fx cards, motion helpers and
// the brand-pose catalog (one entry per official mascot PNG in skala+/mascot). Everything above is unchanged.
// =====================================================================================================
const arcP = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14): P2[] =>
  [...Array(n + 1)].map((_, k): P2 => { const a = rad(a0 + ((a1 - a0) * k) / n); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const starP = (cx: number, cy: number, ro: number, ri: number, n = 5, rot = -90): P2[] =>
  [...Array(2 * n)].map((_, k): P2 => { const a = rad(rot + (180 * k) / n), r = k % 2 ? ri : ro; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
const heartP = (cx: number, cy: number, s: number, n = 48): P2[] =>
  [...Array(n)].map((_, k): P2 => {
    const t = (k / n) * Math.PI * 2;
    return [cx + s * 16 * Math.sin(t) ** 3, cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
  });
/** rounded rect centred on 0,0 (clockwise on screen) */
const rrL = (w: number, h: number, r: number, n = 6): P2[] => {
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2, out: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) out.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return out;
};
/** local -> design space: rotate (deg), scale, translate */
const xf = (pts: P2[], cx: number, cy: number, rot = 0, s = 1): P2[] => {
  const r = rad(rot), c = Math.cos(r), sn = Math.sin(r);
  return pts.map(([x, y]): P2 => [cx + s * (x * c - y * sn), cy + s * (x * sn + y * c)]);
};
/** force clockwise-on-screen winding (inkRing needs it) */
const cw = (pts: P2[]): P2[] => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
  return a < 0 ? [...pts].reverse() : pts;
};
/** flat object with painted shadow side + thick-thin ink */
const obj = (p: Pen, pts: P2[], base: string, shadow: string, w = 10) => {
  const q = cw(pts);
  p.gradFill(q, base, shadow, LIGHT, 0.35); p.inkRing(q, w, rad(60), 0.4);
};
/** the same linear gradient gradFill() would build for `pts` (lets arm tubes blend seamlessly into the body) */
const linGrad = (p: Pen, pts: P2[], base: string, shadow: string, flat = 0.3) => {
  const dx = Math.cos(LIGHT), dy = Math.sin(LIGHT), n = pts.length;
  let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
  for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
  const dc = cx * dx + cy * dy;
  const gr = p.g.createLinearGradient(cx + dx * (hi - dc), cy + dy * (hi - dc), cx + dx * (lo - dc), cy + dy * (lo - dc));
  gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
  return gr;
};

// ---------------- v2 faces ----------------
export type NewExpr = "thinking" | "angry" | "annoyed" | "love" | "wink" | "cry" | "laughcry" | "smug" | "sleepy" | "mindblown"
  | "scared" | "excited" | "cringe" | "skeptical" | "proud" | "dreamy" | "determined" | "bored" | "confused" | "dizzy" | "ooh" | "smile";
type FC = { p: Pen; L: P2; R: P2; M: P2; lid: number };
const BLUE = "#8fd3ff", BLUE2 = "#4fa6e0";
/** dark oval eye, blink-squashed; `keep` = clip region (lids) */
const ov = (p: Pen, x: number, y: number, rx: number, ry: number, lid = 0, keep?: P2[]) => {
  const r = Math.max(6, ry * (1 - 0.85 * lid)), pts = ellP(x, y + (ry - r) * 0.3, rx, r);
  if (keep && lid < 0.99) p.clip(keep, () => fill(p, pts, EYE)); else fill(p, pts, EYE);
};
const below = (x0: number, y0: number, x1: number, y1: number): P2[] => [[x0, y0], [x1, y1], [x1, y1 + 240], [x0, y0 + 240]];
const br = (p: Pen, pts: P2[], w = 12) => p.stroke(pts, w, EYE);
const hEye = (p: Pen, x: number, y: number) => p.stroke(arcP(x, y + 14, 44, 36, 200, 340, 12), 15, EYE); // ^ closed happy
const sEye = (p: Pen, x: number, y: number) => p.stroke(arcP(x, y - 6, 40, 24, 20, 160, 12), 14, EYE); // u closed relaxed
const wEye = (p: Pen, x: number, y: number, rx: number, ry: number, pr: number) => {
  const o = ellP(x, y, rx, ry); fill(p, o, "#ffffff"); p.inkRing(o, 9, rad(60), 0.3); fill(p, ellP(x + 3, y + 5, pr, pr * 1.2), EYE);
};
/** half-lidded eye: flat lid at y+cut */
const halfEye = (p: Pen, x: number, y: number, cut: number, lid: number, look = 0) => {
  ov(p, x + look, y, 38, 44, lid, below(x - 80, y + cut, x + 80, y + cut));
  p.stroke([[x - 44, y + cut], [x + 44, y + cut]], 11, EYE);
};
/** eye with the lid sloping down toward the nose (angry / determined); inner = +1 for the screen-left eye */
const angEye = (p: Pen, x: number, y: number, inner: 1 | -1, lid: number, deep = 30) => {
  const yo = y - 56, yi = y - 56 + deep;
  ov(p, x, y, 40, 48, lid, inner > 0 ? below(x - 70, yo, x + 70, yi) : below(x - 70, yi, x + 70, yo));
};
const xEye = (p: Pen, x: number, y: number, dir: 1 | -1) => p.stroke([[x - 28 * dir, y - 30], [x + 26 * dir, y], [x - 28 * dir, y + 30]], 14, EYE);
const spiral = (p: Pen, x: number, y: number) => p.stroke([...Array(41)].map((_, k): P2 => { const a = (k / 40) * 5 * Math.PI, r = 4 + (40 * k) / 40; return [x + r * Math.cos(a), y + r * Math.sin(a)]; }), 8, EYE);
const oM = (p: Pen, x: number, y: number, rx: number, ry: number) => {
  const o = ellP(x, y, rx, ry); fill(p, o, MOUTH);
  p.clip(o, () => fill(p, ellP(x, y + ry * 0.85, rx * 0.8, ry * 0.5), TONGUE)); p.inkRing(o, 6, rad(60), 0.3);
};
const grim = (p: Pen, x: number, y: number, w: number, h: number) => { // gritted teeth
  const R = xf(rrL(w, h, h * 0.42), x, y);
  fill(p, R, "#ffffff");
  p.clip(R, () => { p.stroke([[x - w / 2, y], [x + w / 2, y]], 5, MOUTH); for (let k = 1; k < 4; k++) p.stroke([[x - w / 2 + (k * w) / 4, y - h], [x - w / 2 + (k * w) / 4, y + h]], 5, MOUTH); });
  p.inkRing(R, 7, rad(60), 0.3);
};
const frownO = (p: Pen, x: number, y: number, s: number) => { // wailing mouth (upside-down D)
  const pts = chaikin(arcP(x, y + 34 * s, 46 * s, 44 * s, 180, 360, 24), 2);
  fill(p, pts, MOUTH); p.clip(pts, () => fill(p, ellP(x, y + 34 * s, 30 * s, 16 * s), TONGUE)); p.inkRing(pts, 7, rad(60), 0.3);
};
const wavy = (p: Pen, x: number, y: number, w = 40) => p.stroke([...Array(17)].map((_, k): P2 => [x - w + (w / 8) * k, y + 6 * Math.sin(k * 1.15)]), 10, MOUTH);
const dropP = (x: number, y: number, s: number, rot = 0): P2[] => chaikin(xf([[0, -40], [24, 0], [20, 22], [0, 32], [-20, 22], [-24, 0]], x, y, rot, s), 2);
const drop = (p: Pen, x: number, y: number, s: number, rot = 0, w = 6) => obj(p, dropP(x, y, s, rot), BLUE, BLUE2, w);
const stream = (p: Pen, x: number, y: number) => obj(p, chaikin([[x - 12, y], [x + 12, y], [x + 20, y + 110], [x, y + 132], [x - 20, y + 110]], 2), BLUE, BLUE2, 6);
const smile = (p: Pen, x: number, y: number, rx = 28, ry = 18) => p.stroke(arcP(x, y, rx, ry, 20, 160, 12), 11, MOUTH);

const FACE2: Record<NewExpr, (c: FC) => void> = {
  thinking: ({ p, L, R, M, lid }) => {
    ov(p, L[0] + 12, L[1] - 8, 34, 42, lid); ov(p, R[0] + 12, R[1] - 8, 34, 42, lid);
    br(p, [[L[0] - 44, L[1] - 64], [L[0] + 38, L[1] - 68]]); br(p, [[R[0] - 40, R[1] - 72], [R[0], R[1] - 92], [R[0] + 42, R[1] - 80]]);
    p.stroke([[M[0] - 4, M[1] + 18], [M[0] + 38, M[1] + 8]], 11, MOUTH);
  },
  angry: ({ p, L, R, M, lid }) => {
    angEye(p, L[0], L[1], 1, lid, 38); angEye(p, R[0], R[1], -1, lid, 38);
    br(p, [[L[0] - 50, L[1] - 64], [L[0] + 42, L[1] - 34]], 14); br(p, [[R[0] - 42, R[1] - 34], [R[0] + 50, R[1] - 64]], 14);
    grim(p, M[0], M[1] + 18, 86, 32);
  },
  annoyed: ({ p, L, R, M, lid }) => {
    halfEye(p, L[0], L[1], -6, lid, 6); halfEye(p, R[0], R[1], -6, lid, 6);
    br(p, [[L[0] - 46, L[1] - 58], [L[0] + 40, L[1] - 44]]); br(p, [[R[0] - 40, R[1] - 44], [R[0] + 46, R[1] - 58]]);
    p.stroke([[M[0] - 26, M[1] + 14], [M[0] + 22, M[1] + 12]], 11, MOUTH);
  },
  love: ({ p, L, R, M }) => {
    for (const [x, y] of [L, R]) obj(p, heartP(x, y - 4, 3.0), "#ff5d7a", "#d42752", 8);
    dMouth(p, M[0], M[1], 1.0);
  },
  wink: ({ p, L, R, M, lid }) => { ov(p, L[0], L[1], 40, 48, lid); hEye(p, R[0], R[1]); dMouth(p, M[0], M[1], 0.9); },
  cry: ({ p, L, R, M }) => {
    sEye(p, L[0], L[1]); sEye(p, R[0], R[1]);
    br(p, [[L[0] - 46, L[1] - 54], [L[0] + 34, L[1] - 70]], 11); br(p, [[R[0] - 34, R[1] - 70], [R[0] + 46, R[1] - 54]], 11);
    stream(p, L[0] + 4, L[1] + 18); stream(p, R[0] - 4, R[1] + 18);
    frownO(p, M[0], M[1], 0.85);
  },
  laughcry: ({ p, L, R, M }) => {
    hEye(p, L[0], L[1]); hEye(p, R[0], R[1]); dMouth(p, M[0], M[1], 1.25);
    drop(p, L[0] - 86, L[1] + 6, 0.9, -50); drop(p, R[0] + 86, R[1] + 6, 0.9, 50);
  },
  smug: ({ p, L, R, M, lid }) => {
    halfEye(p, L[0], L[1], -2, lid, 8); halfEye(p, R[0], R[1], -2, lid, 8);
    br(p, [[R[0] - 38, R[1] - 70], [R[0] + 4, R[1] - 86], [R[0] + 44, R[1] - 74]], 11);
    p.stroke([[M[0] - 34, M[1] + 12], [M[0] + 4, M[1] + 20], [M[0] + 40, M[1]]], 11, MOUTH);
  },
  sleepy: ({ p, L, R, M }) => { sEye(p, L[0], L[1] + 8); sEye(p, R[0], R[1] + 8); oM(p, M[0], M[1] + 20, 15, 17); },
  mindblown: ({ p, L, R, M }) => { wEye(p, L[0], L[1], 50, 58, 24); wEye(p, R[0], R[1], 50, 58, 24); oM(p, M[0], M[1] + 22, 34, 42); },
  scared: ({ p, L, R, M }) => {
    wEye(p, L[0], L[1], 46, 54, 13); wEye(p, R[0], R[1], 46, 54, 13);
    br(p, [[L[0] - 44, L[1] - 64], [L[0] + 34, L[1] - 82]], 11); br(p, [[R[0] - 34, R[1] - 82], [R[0] + 44, R[1] - 64]], 11);
    grim(p, M[0], M[1] + 20, 96, 34);
  },
  excited: ({ p, L, R, M }) => {
    for (const [x, y] of [L, R]) obj(p, starP(x, y + 2, 62, 28), "#ffd84a", "#f0a51c", 7);
    dMouth(p, M[0], M[1], 1.25);
  },
  cringe: ({ p, L, R, M }) => { xEye(p, L[0], L[1], 1); xEye(p, R[0], R[1], -1); grim(p, M[0], M[1] + 16, 112, 38); },
  skeptical: ({ p, L, R, M, lid }) => {
    halfEye(p, L[0], L[1], -4, lid); ov(p, R[0], R[1], 42, 52, lid);
    br(p, [[L[0] - 46, L[1] - 50], [L[0] + 40, L[1] - 44]]); br(p, arcP(R[0], R[1] - 70, 44, 22, 200, 340, 10));
    p.stroke([[M[0] - 30, M[1] + 18], [M[0] + 30, M[1] + 6]], 11, MOUTH);
  },
  proud: ({ p, L, R, M }) => { hEye(p, L[0], L[1]); hEye(p, R[0], R[1]); dMouth(p, M[0], M[1], 0.65); },
  dreamy: ({ p, L, R, M, lid }) => {
    ov(p, L[0] + 6, L[1] - 14, 36, 44, lid); ov(p, R[0] + 6, R[1] - 14, 36, 44, lid);
    br(p, arcP(L[0], L[1] - 62, 34, 12, 200, 340, 10), 10); br(p, arcP(R[0], R[1] - 62, 34, 12, 200, 340, 10), 10);
    smile(p, M[0], M[1] - 2);
  },
  determined: ({ p, L, R, M, lid }) => {
    angEye(p, L[0], L[1], 1, lid, 24); angEye(p, R[0], R[1], -1, lid, 24);
    br(p, [[L[0] - 46, L[1] - 66], [L[0] + 40, L[1] - 46]], 13); br(p, [[R[0] - 40, R[1] - 46], [R[0] + 46, R[1] - 66]], 13);
    dMouth(p, M[0], M[1], 0.8);
  },
  bored: ({ p, L, R, M, lid }) => {
    halfEye(p, L[0], L[1], 4, lid, 12); halfEye(p, R[0], R[1], 4, lid, 12);
    p.stroke([[M[0] - 12, M[1] + 16], [M[0] + 28, M[1] + 14]], 11, MOUTH);
  },
  confused: ({ p, L, R, M, lid }) => {
    ov(p, L[0], L[1], 42, 52, lid); ov(p, R[0], R[1] + 6, 28, 34, lid);
    br(p, [[L[0] - 44, L[1] - 74], [L[0] + 38, L[1] - 80]], 11); br(p, [[R[0] - 36, R[1] - 58], [R[0] + 40, R[1] - 44]], 11);
    wavy(p, M[0], M[1] + 16, 36);
  },
  dizzy: ({ p, L, R, M }) => { spiral(p, L[0], L[1]); spiral(p, R[0], R[1]); wavy(p, M[0], M[1] + 18, 44); },
  ooh: ({ p, L, R, M, lid }) => { ov(p, L[0], L[1], 40, 50, lid); ov(p, R[0], R[1], 40, 50, lid); oM(p, M[0], M[1] + 18, 16, 20); },
  smile: ({ p, L, R, M, lid }) => { ov(p, L[0], L[1], 40, 48, lid); ov(p, R[0], R[1], 40, 48, lid); dMouth(p, M[0], M[1], 0.95); },
};
/** expressions whose eyes are not plain ovals (blink has no effect) */
export const NO_BLINK: Expr[] = ["happy", "grin", "love", "cry", "laughcry", "sleepy", "mindblown", "scared", "excited", "cringe", "proud", "dizzy"];

// ---------------- v2 arms: round tube from the shoulder + mitten ----------------
export type NewArms = "thumbsUp" | "facepalm" | "chin" | "clap" | "salute" | "crossed" | "hips" | "pointUp" | "pointLeft" | "pointRight"
  | "pointViewer" | "present" | "coverMouth" | "typing" | "wave2" | "holdUp" | "writing" | "tap" | "holdFront" | "read" | "mic"
  | "magnify" | "selfie" | "popcorn" | "cheer" | "handsChest" | "fists" | "gesture" | "scratch" | "flinch" | "holdR" | "megaphone"
  | "shrugUp" | "stickUp" | "stickAsk" | "stickThumb" | "stickNo" | "stickRight" | "stickUpRight" | "stickYay" | "stickDown" | "writeUp";
type E5 = [number, number, number, number, number];
/** pts: shoulder, [elbow], hand centre. hand: mitten rx, ry, rot. under: thumb/finger ellipses behind the mitten; over: in front */
type Limb = { pts: P2[]; hand: [number, number, number]; under?: E5[]; over?: E5[]; w?: number };
type Pose = { L: Limb; R: Limb; first?: "L" | "R"; anchor?: P2; stick?: [P2, P2] };
const SL: P2 = [352, 670], SR: P2 = [658, 670];
const restL: Limb = { pts: [SL, [322, 724]], hand: [64, 56, 20] }, restR: Limb = { pts: [SR, [688, 724]], hand: [64, 56, -20] };
const thumbR: Limb = { pts: [SR, [752, 650], [742, 588]], hand: [56, 50, 0], under: [[730, 518, 24, 40, 8]] };
const stickL: Limb = { pts: [SL, [300, 692]], hand: [48, 52, 0] };
const STICK_ASK: [P2, P2] = [[326, 742], [128, 250]];
const POSES: Record<NewArms, Pose> = {
  thumbsUp: { L: restL, R: thumbR },
  facepalm: { L: restL, R: { pts: [SR, [748, 650], [624, 508]], hand: [74, 62, -35] } },
  chin: { L: restL, R: { pts: [SR, [706, 738], [580, 642]], hand: [56, 50, -25] } },
  clap: { L: { pts: [SL, [474, 630]], hand: [50, 62, -12] }, R: { pts: [SR, [536, 630]], hand: [50, 62, 12] } },
  salute: { L: restL, R: { pts: [SR, [806, 578], [702, 434]], hand: [74, 38, -32] } },
  crossed: { L: { pts: [SL, [614, 690]], hand: [58, 50, -10], w: 64 }, R: { pts: [SR, [396, 740]], hand: [58, 50, 10], w: 64 } },
  hips: { L: { pts: [SL, [262, 748], [318, 784]], hand: [46, 52, 30] }, R: { pts: [SR, [748, 748], [692, 784]], hand: [46, 52, -30] } },
  shrugUp: { L: { pts: [SL, [262, 702], [212, 664]], hand: [60, 40, -15], under: [[188, 632, 16, 28, -30]] }, R: { pts: [SR, [748, 702], [798, 664]], hand: [60, 40, 15], under: [[822, 632, 16, 28, 30]] } },
  pointUp: { L: restL, R: { pts: [SR, [815, 575], [830, 445]], hand: [52, 58, 0], under: [[836, 366, 18, 44, 4]] } },
  pointLeft: { L: { pts: [SL, [178, 642]], hand: [68, 50, 8], under: [[108, 630, 44, 18, 8]] }, R: restR },
  pointRight: { L: restL, R: { pts: [SR, [826, 602]], hand: [68, 50, -18], under: [[896, 577, 44, 18, -18]] } },
  pointViewer: { L: restL, R: { pts: [SR, [648, 656]], hand: [94, 88, 0], over: [[650, 636, 34, 32, 0]] } },
  present: { L: restL, R: { pts: [SR, [806, 638]], hand: [68, 42, -6], under: [[782, 598, 18, 30, 25]] }, anchor: [806, 596] },
  coverMouth: { L: { pts: [SL, [476, 590]], hand: [50, 58, 12] }, R: { pts: [SR, [554, 590]], hand: [50, 58, -12] } },
  typing: { L: { pts: [SL, [418, 748]], hand: [50, 40, 0] }, R: { pts: [SR, [592, 748]], hand: [50, 40, 0] }, anchor: [505, 790] },
  wave2: { L: { pts: [SL, [248, 632]], hand: [68, 60, 20] }, R: { pts: [SR, [652, 702]], hand: [66, 58, 30] } },
  holdUp: { L: restL, R: { pts: [SR, [790, 578], [802, 452]], hand: [54, 52, 0] }, anchor: [802, 452] },
  writing: { L: { pts: [SL, [392, 776]], hand: [50, 46, -20] }, R: { pts: [SR, [592, 666]], hand: [48, 46, 20] }, anchor: [440, 712] },
  tap: { L: { pts: [SL, [392, 738]], hand: [50, 48, 0] }, R: { pts: [SR, [622, 732]], hand: [50, 48, 0] }, stick: [[296, 744], [748, 724]] },
  holdFront: { L: { pts: [SL, [392, 702]], hand: [48, 54, -10] }, R: { pts: [SR, [618, 702]], hand: [48, 54, 10] }, anchor: [505, 690] },
  read: { L: { pts: [SL, [372, 736]], hand: [48, 52, 0] }, R: { pts: [SR, [638, 736]], hand: [48, 52, 0] }, anchor: [505, 706] },
  mic: { L: { pts: [SL, [430, 662]], hand: [46, 50, 0] }, R: { pts: [SR, [782, 600]], hand: [64, 58, -25] }, anchor: [430, 662] },
  magnify: { L: { pts: [SL, [326, 620]], hand: [46, 50, 25] }, R: restR, anchor: [326, 620] },
  selfie: { L: restL, R: { pts: [SR, [800, 582], [795, 472]], hand: [52, 56, 0] }, anchor: [795, 472] },
  popcorn: { L: { pts: [SL, [350, 778]], hand: [46, 48, 20] }, R: { pts: [SR, [700, 662], [600, 614]], hand: [46, 46, -20] }, anchor: [404, 738] },
  cheer: { L: { pts: [SL, [240, 582], [205, 492]], hand: [60, 56, -20] }, R: { pts: [SR, [770, 582], [805, 492]], hand: [60, 56, 20] } },
  handsChest: { L: { pts: [SL, [466, 658]], hand: [48, 58, -25] }, R: { pts: [SR, [548, 658]], hand: [48, 58, 25] } },
  fists: { L: { pts: [SL, [404, 668]], hand: [52, 50, 0] }, R: { pts: [SR, [742, 652], [714, 578]], hand: [56, 52, 0] } },
  gesture: { L: { pts: [SL, [426, 670]], hand: [50, 48, -20] }, R: { pts: [SR, [772, 632], [788, 562]], hand: [54, 62, 15], under: [[742, 590, 18, 30, -40]] } },
  scratch: { L: restL, R: { pts: [SR, [812, 572], [732, 424]], hand: [60, 54, -30] } },
  flinch: { L: restL, R: { pts: [SR, [752, 642], [702, 528]], hand: [54, 60, -15] } },
  holdR: { L: restL, R: { pts: [SR, [706, 652]], hand: [52, 50, 0] }, anchor: [706, 652] },
  megaphone: { L: restL, R: { pts: [SR, [732, 652], [692, 614]], hand: [50, 48, 0] }, anchor: [692, 614] },
  stickUp: { L: { pts: [SL, [276, 652]], hand: [48, 52, 0] }, R: { pts: [SR, [790, 632]], hand: [64, 44, -8], under: [[768, 594, 18, 30, 25]] }, stick: [[274, 716], [240, 140]] },
  stickAsk: { L: stickL, R: { pts: [SR, [782, 602], [772, 522]], hand: [54, 62, 10], under: [[724, 550, 18, 30, -40]] }, stick: STICK_ASK },
  stickThumb: { L: stickL, R: thumbR, stick: STICK_ASK },
  stickNo: { L: stickL, R: { pts: [SR, [792, 582], [778, 472]], hand: [56, 64, 0], under: [[726, 502, 18, 30, -40]] }, stick: STICK_ASK },
  stickRight: { L: restL, R: { pts: [SR, [790, 652], [800, 612]], hand: [50, 54, 0] }, stick: [[803, 690], [824, 110]] },
  stickUpRight: { L: restL, R: { pts: [SR, [790, 622]], hand: [50, 52, 0] }, stick: [[755, 686], [962, 152]] },
  stickYay: { L: { pts: [SL, [240, 602], [215, 522]], hand: [60, 56, -20] }, R: { pts: [SR, [770, 602], [790, 542]], hand: [50, 52, 0] }, stick: [[764, 604], [958, 120]] },
  stickDown: { L: { pts: [SL, [300, 742]], hand: [48, 50, 0] }, R: { pts: [SR, [800, 612]], hand: [66, 42, -6], under: [[778, 572, 18, 30, 25]] }, stick: [[334, 718], [62, 905]] },
  writeUp: { L: restL, R: { pts: [SR, [795, 582], [800, 472]], hand: [52, 56, 0] }, anchor: [800, 472] },
};
const drawLimb = (p: Pen, L: Limb, body: [string, string]) => {
  const g = p.g, w = L.w ?? 58, s = L.pts[0], h = L.pts[L.pts.length - 1];
  if (L.pts.length > 1) {
    g.lineCap = "round"; g.lineJoin = "round";
    // ink tube, cut away around the shoulder so the arm grows out of the body without an end cap
    g.save();
    const r = w / 2 + 18;
    g.beginPath(); g.rect(-3000, -3000, 7000, 7000); g.moveTo(s[0] + r, s[1]); g.arc(s[0], s[1], r, 0, Math.PI * 2); g.clip("evenodd");
    p.path(L.pts, false); g.strokeStyle = INK; g.lineWidth = w + 24; g.stroke();
    g.restore();
    p.path(L.pts, false); g.strokeStyle = linGrad(p, BODYP, body[0], body[1]); g.lineWidth = w; g.stroke();
  }
  for (const e of L.under ?? []) shape(p, ellP(...e), body[0], body[1], 11);
  shape(p, ellP(h[0], h[1], ...L.hand), body[0], body[1], 13);
  for (const e of L.over ?? []) shape(p, ellP(...e), body[0], body[1], 11);
};
const OLD_ANCHOR: Partial<Record<OldArms, P2>> = { hold: [510, 720], phone: [745, 560], point: [850, 640], up: [810, 620], wave: [752, 640], rest: [690, 725] };

// ---------------- v2 props ----------------
export type NewProp = "laptop" | "coffee" | "megaphone" | "sign" | "trophy" | "clipboard" | "mic" | "camera" | "selfie" | "magnifier"
  | "book" | "calculator" | "notes" | "pointer" | "popcorn" | "chart" | "money" | "lightbulb" | "marker" | "can";
type PropCtx = { p: Pen; a: P2; pose?: Pose; o: SkalaOpts; dx: number; pal: { hood: [string, string]; body: [string, string] } };
type PropFn = (c: PropCtx) => void;
const DARK: [string, string] = ["#4a4d5c", "#262833"], WOOD: [string, string] = ["#d99a5b", "#a8652f"], GOLD: [string, string] = ["#ffd84a", "#e09a12"];
const PAPER2: [string, string] = ["#fffdf7", "#ebe3d6"];
const rHand = (c: PropCtx): P2 => (c.pose ? c.pose.R.pts[c.pose.R.pts.length - 1] : [690, 725]);
const pencil = (p: Pen, x: number, y: number, rot: number) => { // tip along local -x
  obj(p, xf([[-40, -11], [52, -11], [52, 11], [-40, 11]], x, y, rot), "#ffcf3a", "#e8a41a", 7);
  obj(p, xf([[52, -11], [72, -11], [72, 11], [52, 11]], x, y, rot), "#ff8fa0", "#e06a7d", 7);
  obj(p, xf([[-40, -11], [-40, 11], [-70, 0]], x, y, rot), "#f3d2a8", "#d9b083", 7);
  p.dot(...xf([[-66, 0]], x, y, rot)[0], 6, INK);
};
const bulb = (p: Pen, x: number, y: number, s = 1, rays = true) => {
  if (rays) for (let k = 0; k < 7; k++) { const a = rad(-180 + k * 30); p.line([[x + 92 * s * Math.cos(a), y + 92 * s * Math.sin(a)], [x + 122 * s * Math.cos(a), y + 122 * s * Math.sin(a)]], "#ffd23f", 10 * s); }
  obj(p, xf(rrL(58, 46, 10), x, y + 76 * s, 0, s), "#c9ccd6", "#8e93a3", 8);
  p.stroke([[x - 26 * s, y + 70 * s], [x + 26 * s, y + 70 * s]], 5, "#6d7182"); p.stroke([[x - 26 * s, y + 84 * s], [x + 26 * s, y + 84 * s]], 5, "#6d7182");
  const B = chaikin([...arcP(x, y, 64 * s, 64 * s, 130, 410, 20), [x + 26 * s, y + 64 * s], [x - 26 * s, y + 64 * s]], 2);
  obj(p, B, "#fff27a", "#ffc21f", 11);
  p.stroke([[x - 18 * s, y + 40 * s], [x - 12 * s, y + 2 * s], [x, y + 18 * s], [x + 12 * s, y + 2 * s], [x + 18 * s, y + 40 * s]], 6, "#f08a2a");
};
const bill = (p: Pen, x: number, y: number, rot: number, s = 1) => {
  obj(p, xf(rrL(150, 78, 10), x, y, rot, s), "#a8e69a", "#5fb563", 8);
  obj(p, xf(ellP(0, 0, 24, 24), x, y, rot, s), "#d7f5cf", "#a8e69a", 5);
  const g = p.g; g.save(); g.translate(x, y); g.rotate(rad(rot)); g.scale(s, s);
  g.fillStyle = "#2f7a3a"; g.font = "900 34px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", 0, 2); g.restore();
};
const coin = (p: Pen, x: number, y: number, r: number) => {
  obj(p, ellP(x, y, r, r), GOLD[0], GOLD[1], 8); p.ell(x, y, r * 0.62, r * 0.62, null, 5);
};
const PROPS2: Record<NewProp, PropFn> = {
  laptop: ({ p, a }) => {
    obj(p, xf(rrL(330, 172, 16), a[0], a[1] + 32), "#d3d6df", "#9a9fb0", 11);
    obj(p, xf(ellP(0, 0, 22, 22), a[0], a[1] + 30), "#ffffff", "#e6e8ee", 6);
    obj(p, xf(rrL(372, 22, 9), a[0], a[1] + 124), "#b9bdcb", "#80869a", 9);
  },
  coffee: ({ p, a }) => {
    const x = a[0] - 4, y = a[1] - 62;
    for (const k of [-1, 1]) p.stroke([...Array(9)].map((_, i): P2 => [x + 18 * k + 9 * Math.sin(i * 0.9), y - 82 - i * 10]), 8, "#b9b5c4");
    const C = cw(chaikin([[x - 46, y - 58], [x + 46, y - 58], [x + 36, y + 60], [x - 36, y + 60]], 1));
    p.gradFill(C, "#ffffff", "#e3dad3", LIGHT, 0.4);
    p.clip(C, () => fill(p, [[x - 60, y - 14], [x + 60, y - 14], [x + 60, y + 26], [x - 60, y + 26]], "#b9773f"));
    p.inkRing(C, 9, rad(60), 0.4);
    obj(p, xf(rrL(104, 24, 9), x, y - 64), "#f3e9e0", "#d2c3b6", 8);
  },
  can: ({ p, a }) => { // generic energy-drink can (no logo): silver body, blue band, lightning stripe
    const x = a[0] - 4, y = a[1] - 70;
    const C = cw(chaikin([[x - 34, y - 78], [x + 34, y - 78], [x + 34, y + 78], [x - 34, y + 78]], 1));
    p.gradFill(C, "#e9edf3", "#a7afbd", LIGHT, 0.35);
    p.clip(C, () => {
      fill(p, [[x - 50, y - 30], [x + 50, y - 30], [x + 50, y + 34], [x - 50, y + 34]], "#2f56c8");
      fill(p, [[x - 6, y - 28], [x + 14, y - 28], [x + 2, y - 2], [x + 16, y - 2], [x - 12, y + 32], [x - 2, y + 6], [x - 16, y + 6]], "#ffd23f");
    });
    p.inkRing(C, 9, rad(60), 0.4);
    obj(p, xf(rrL(60, 14, 6), x, y - 82), "#cfd5df", "#9aa2b2", 7);
  },
  megaphone: ({ p, a }) => {
    const T = (pts: P2[]) => xf(pts, a[0] + 10, a[1] - 96, -22, 1.2);
    obj(p, T(xf(rrL(24, 56, 8), -26, 46)), DARK[0], DARK[1], 7);
    const cone = T(chaikin([[-112, -22], [110, -72], [110, 72], [-112, 22]], 1));
    p.gradFill(cw(cone), "#ffffff", "#e3d6d0", LIGHT, 0.4);
    p.clip(cone, () => fill(p, T([[10, -120], [44, -120], [44, 120], [10, 120]]), "#e23a2e"));
    p.inkRing(cw(cone), 10, rad(60), 0.4);
    obj(p, T(ellP(112, 0, 18, 74)), "#ff5a4a", "#c9221c", 9);
    obj(p, T(ellP(-114, 0, 8, 22)), DARK[0], DARK[1], 6);
  },
  sign: ({ p, a, o }) => {
    const bx = a[0] - 44, by = a[1] - 236;
    p.band([[a[0] + 2, a[1] + 44], [bx + 30, by + 80]], WOOD[0], 18, 5, "round");
    const B = xf(rrL(320, 196, 18), bx, by);
    obj(p, B, "#fffaf0", "#eadfcf", 11);
    if (o.text) {
      const g = p.g; g.save(); g.translate(bx, by); if (o.facing === -1) g.scale(-1, 1);
      let size = 76; g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
      const lines = o.text.split("\n"); const wmax = Math.max(...lines.map((l) => g.measureText(l).width));
      size = Math.min(76, (size * 270) / wmax, 160 / lines.length); g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
      g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle";
      lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.05 + 4));
      g.restore();
    }
  },
  trophy: ({ p, a }) => {
    const x = a[0], y = a[1] - 80;
    for (const k of [-1, 1]) p.line(arcP(x + 70 * k, y - 46, 34, 32, k > 0 ? -80 : 260, k > 0 ? 80 : 100, 12), GOLD[1], 13);
    obj(p, xf(rrL(28, 46, 6), x, y + 40), GOLD[0], GOLD[1], 8);
    obj(p, xf(rrL(116, 30, 10), x, y + 72), "#8a5a3a", "#5e3a22", 9);
    obj(p, chaikin(arcP(x, y - 74, 72, 92, 0, 180, 24), 1), GOLD[0], GOLD[1], 11);
    obj(p, starP(x, y - 36, 24, 11), "#fff3b0", "#ffd84a", 5);
  },
  clipboard: (c) => {
    const { p, a } = c;
    obj(p, xf(rrL(196, 256, 16), a[0], a[1], -10), WOOD[0], WOOD[1], 10);
    obj(p, xf(rrL(164, 206, 8), a[0], a[1], -10).map(([x, y]): P2 => [x + 2, y + 12]), PAPER2[0], PAPER2[1], 6);
    for (let k = 0; k < 5; k++) p.stroke(xf([[-58, -50 + k * 34], [k === 4 ? 0 : 58, -50 + k * 34]], a[0] + 2, a[1] + 12, -10), 7, "#b9b5c4");
    obj(p, xf(rrL(86, 32, 9), a[0], a[1], -10).map(([x, y]): P2 => [x - 22, y - 124]), "#c9ccd6", "#8e93a3", 7);
    const h = rHand(c); pencil(p, h[0] - 26, h[1] + 14, -40);
  },
  mic: ({ p, a }) => {
    p.band([[a[0] + 4, a[1] + 56], [a[0] + 8, a[1] - 70]], "#3a3c48", 22, 6, "round");
    const H = ellP(a[0] + 10, a[1] - 92, 36, 36);
    obj(p, H, "#8e93a3", "#4a4d5c", 9);
    p.clip(H, () => { for (let k = -2; k <= 2; k++) { p.stroke([[a[0] + 10 + k * 14, a[1] - 140], [a[0] + 10 + k * 14, a[1] - 40]], 3, "#3a3c48"); p.stroke([[a[0] - 40, a[1] - 92 + k * 14], [a[0] + 60, a[1] - 92 + k * 14]], 3, "#3a3c48"); } });
    obj(p, xf(rrL(44, 16, 6), a[0] + 9, a[1] - 54), DARK[0], DARK[1], 6);
  },
  camera: ({ p, a }) => {
    const x = a[0], y = a[1] + 52;
    for (const k of [-1, 1]) { obj(p, ellP(x + 62 * k, y - 96, 38, 38), DARK[0], DARK[1], 9); p.dot(x + 62 * k, y - 96, 9, "#c9ccd6"); }
    obj(p, xf(rrL(236, 124, 20), x, y), DARK[0], DARK[1], 11);
    obj(p, ellP(x, y + 4, 42, 42), "#6aa8ff", "#2f56c8", 9);
    p.ell(x, y + 4, 20, 20, "#1d2a55", 5);
    p.dot(x + 88, y - 36, 10, "#ff4a3d");
  },
  selfie: ({ p, a }) => {
    const x = a[0] + 10, y = a[1] - 100;
    obj(p, xf(rrL(76, 150, 14), x, y, 10), "#3a3d4c", "#22232c", 9);
    p.poly(xf(rrL(56, 120, 8), x, y + 2, 10), "#8fd0ff", 0);
  },
  magnifier: ({ p, dx }) => {
    const x = 418 + dx, y = 494;
    p.band([[x - 52, y + 60], [x - 104, y + 128]], "#3a3c48", 26, 6, "round");
    const G = ellP(x, y, 70, 70);
    p.clip(G, () => {
      p.g.globalAlpha = 0.45; fill(p, G, "#d8f0ff"); p.g.globalAlpha = 1;
      fill(p, ellP(x, y + 6, 44, 52), EYE);
      p.stroke(arcP(x, y, 52, 52, 200, 250, 8), 9, "#ffffff");
    });
    p.inkRing(G, 30, rad(60), 0.25); p.inkRing(G, 16, rad(60), 0.2, "#5b5f70");
  },
  book: ({ p, a }) => {
    const x = a[0], y = a[1];
    obj(p, chaikin([[x - 156, y - 84], [x + 156, y - 84], [x + 156, y + 88], [x - 156, y + 88]], 1), "#3f6fb5", "#24477f", 10);
    for (const k of [-1, 1]) {
      const pg: P2[] = [[x, y - 62], [x + 60 * k, y - 80], [x + 142 * k, y - 74], [x + 142 * k, y + 74], [x + 60 * k, y + 66], [x, y + 80]];
      obj(p, chaikin(pg, 1), PAPER2[0], PAPER2[1], 7);
      for (let i = 0; i < 4; i++) p.stroke([[x + 22 * k, y - 40 + i * 30], [x + 118 * k, y - 46 + i * 30]], 6, "#c3bfcc");
    }
    p.stroke([[x, y - 62], [x, y + 80]], 6, INK);
  },
  calculator: ({ p, a }) => {
    const x = a[0], y = a[1] + 10;
    obj(p, xf(rrL(140, 184, 18), x, y), DARK[0], DARK[1], 10);
    obj(p, xf(rrL(106, 40, 8), x, y - 54), "#c8f0d0", "#9fd3ab", 6);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++)
      obj(p, xf(rrL(26, 20, 5), x - 34 + k * 34, y - 4 + r * 30), r === 2 && k === 2 ? "#ff9424" : "#eeeff4", r === 2 && k === 2 ? "#e8321f" : "#c9ccd6", 4);
  },
  notes: (c) => {
    const { p, a } = c;
    obj(p, xf(rrL(166, 206, 12), a[0], a[1] + 6, -8), "#fff6d8", "#eadcae", 9);
    for (let k = 0; k < 4; k++) p.stroke(xf([[-56, -38 + k * 34], [56, -38 + k * 34]], a[0], a[1] + 6, -8), 6, "#c9b98d");
    for (let k = 0; k < 6; k++) { const [sx, sy] = xf([[-60 + k * 24, -100]], a[0], a[1] + 6, -8)[0]; p.ell(sx, sy, 7, 12, "#c9ccd6", 5); }
    const h = rHand(c); pencil(p, h[0] - 26, h[1] + 14, -40);
  },
  pointer: ({ p, pose, a }) => {
    const [s0, s1] = pose?.stick ?? [[a[0] + 10, a[1] + 40], [a[0] + 120, a[1] - 300]];
    p.band([s0, s1], "#ff9a2e", 14, 5, "round");
    p.ell(s1[0], s1[1], 14, 14, "#e8321f", 6);
  },
  popcorn: (c) => {
    const { p, a } = c, x = a[0], y = a[1] - 22;
    const puffs: P2[] = [[-52, -88], [-18, -100], [20, -96], [54, -86], [-36, -116], [6, -126], [40, -112], [-62, -66], [64, -64]];
    for (const [u, v] of puffs) obj(p, ellP(x + u, y + v, 26, 22), "#fff7d6", "#f2d27a", 6);
    const B = cw(chaikin([[x - 76, y - 80], [x + 76, y - 80], [x + 56, y + 84], [x - 56, y + 84]], 1));
    p.gradFill(B, "#ffffff", "#e6dad6", LIGHT, 0.5);
    p.clip(B, () => { for (let k = -3; k <= 3; k++) { const x0 = x + k * 44; fill(p, [[x0 - 11, y - 90], [x0 + 11, y - 90], [x0 + 8, y + 90], [x0 - 8, y + 90]], "#e23a2e"); } });
    p.inkRing(B, 9, rad(60), 0.4);
    const h = rHand(c); obj(p, ellP(h[0] - 6, h[1] - 50, 20, 17), "#fff7d6", "#f2d27a", 6);
  },
  chart: ({ p, a }) => {
    const x = a[0], y = a[1] + 6;
    obj(p, xf(rrL(268, 196, 14), x, y), "#ffffff", "#e6e3ec", 10);
    p.stroke([[x - 104, y - 72], [x - 104, y + 70], [x + 108, y + 70]], 6, INK);
    ([[-70, 50, "#5aa2ff", "#2f56c8"], [-10, 88, "#4fd08a", "#1d8a57"], [50, 126, "#ff9424", "#e8321f"]] as const).forEach(([u, h, c0, c1]) =>
      obj(p, [[x + u - 22, y + 68 - h], [x + u + 22, y + 68 - h], [x + u + 22, y + 68], [x + u - 22, y + 68]], c0, c1, 6));
    p.stroke([[x - 80, y - 10], [x - 20, y - 40], [x + 20, y - 30], [x + 84, y - 78]], 8, "#e8321f");
    p.stroke([[x + 58, y - 80], [x + 86, y - 80], [x + 82, y - 54]], 8, "#e8321f");
  },
  money: ({ p, a }) => {
    bill(p, a[0] + 8, a[1] - 56, -24); bill(p, a[0] + 22, a[1] - 66, 4);
    coin(p, a[0] - 74, a[1] - 100, 28);
  },
  lightbulb: ({ p, a }) => bulb(p, a[0], a[1] - 138, 0.95),
  marker: (c) => {
    const { p } = c, h = rHand(c), x = h[0] + 22, y = h[1] - 42, rot = -62;
    obj(p, xf(rrL(120, 30, 10), x, y, rot), "#ffffff", "#d9dbe3", 8);
    obj(p, xf(rrL(40, 32, 8), 0, 0).map(([u, v]): P2 => [u + 72, v]).map((q) => xf([q], x, y, rot)[0]), "#ff9424", "#e8321f", 8);
  },
};
const PROP_OVER = new Set<NewProp>(["laptop"]);
/** recommended arm pose for each prop */
export const PROP_ARMS: Record<NewProp, Arms> = {
  laptop: "typing", coffee: "holdR", can: "holdR", megaphone: "megaphone", sign: "holdUp", trophy: "holdUp", clipboard: "writing", mic: "mic",
  camera: "holdFront", selfie: "selfie", magnifier: "magnify", book: "read", calculator: "holdFront", notes: "writing",
  pointer: "stickAsk", popcorn: "popcorn", chart: "holdFront", money: "holdR", lightbulb: "holdUp", marker: "writeUp",
};

// ---------------- v2 effect cards (unlit, 300 x 300 canvas each; u = 0..1 loop phase where taken) ----------------
export const fxExclaim = (p: Pen) => {
  obj(p, chaikin([[116, 30], [184, 30], [168, 196], [132, 196]], 2), "#ff5a4a", "#d8262a", 12);
  obj(p, ellP(150, 248, 27, 27), "#ff5a4a", "#d8262a", 12);
};
export const fxQuestion = (p: Pen) => {
  p.line([...arcP(150, 100, 56, 54, 185, 390, 18), [156, 168], [150, 200]], "#ffffff", 30);
  p.poly(ellP(150, 252, 22, 22), "#ffffff", 12);
};
export const fxSparkles = (p: Pen, u = 0) => {
  ([[150, 140, 74], [68, 232, 38], [236, 230, 46], [240, 66, 32]] as const).forEach(([x, y, r], k) => {
    const s = 1 + 0.18 * Math.sin(2 * Math.PI * (u + k / 4));
    obj(p, starP(x, y, r * s, r * s * 0.3, 4), "#ffe066", "#f0a51c", 8);
  });
};
export const fxAngerVein = (p: Pen) => {
  for (let k = 0; k < 4; k++) p.line(xf([[-96, -28], [-52, -30], [-36, -36], [-30, -52], [-28, -96]], 150, 150, 90 * k), "#ff3b30", 24);
};
export const fxSweatDrops = (p: Pen, u = 0) => {
  ([[86, 160, 1.5, -30], [172, 96, 1.15, -8], [228, 196, 0.9, 22]] as const).forEach(([x, y, s, r], k) => drop(p, x, y - 24 * ((u + k / 3) % 1), s, r, 8));
};
export const fxZzz = (p: Pen, u = 0) => {
  ([[70, 236, 50], [140, 162, 70], [218, 74, 92]] as const).forEach(([x, y, s], k) => {
    const yy = y - 12 * Math.sin(2 * Math.PI * (u + k / 3));
    p.line([[x - s / 2, yy - s / 2], [x + s / 2, yy - s / 2], [x - s / 2, yy + s / 2], [x + s / 2, yy + s / 2]], "#a8d0ff", 14);
  });
};
export const fxLightbulb = (p: Pen) => bulb(p, 150, 140, 1.05);
export const fxHeartsFloat = (p: Pen, u = 0) => {
  ([[88, 210, 3.2], [190, 128, 4.4], [236, 240, 2.4]] as const).forEach(([x, y, s], k) => obj(p, heartP(x, y - 30 * ((u + k / 3) % 1), s), "#ff5d7a", "#d42752", 8));
};
export const fxMoney = (p: Pen, u = 0) => {
  bill(p, 150, 120 - 10 * Math.sin(2 * Math.PI * u), -14, 1.3); coin(p, 88, 220, 40); coin(p, 214, 230, 32);
};
export const fxFire = (p: Pen, u = 0) => {
  const w = 10 * Math.sin(2 * Math.PI * u);
  obj(p, chaikin([[150 + w, 18], [196, 92], [244, 150], [236, 220], [196, 272], [104, 272], [64, 220], [60, 150], [98, 116], [112 - w, 56]], 3), "#ffd23f", "#ff3b1c", 12);
  p.poly(chaikin([[150 - w, 120], [184, 180], [190, 232], [150, 260], [110, 232], [116, 180]], 3), "#fff1a0", 0);
};
export const fxCheck = (p: Pen) => { obj(p, ellP(150, 150, 122, 122), "#4fd08a", "#1d8a57", 12); p.line([[94, 156], [134, 198], [210, 106]], "#ffffff", 30); };
export const fxCross = (p: Pen) => {
  obj(p, ellP(150, 150, 122, 122), "#ff5a4a", "#c9221c", 12);
  p.line([[104, 104], [196, 196]], "#ffffff", 30); p.line([[196, 104], [104, 196]], "#ffffff", 30);
};
export const fxStarBurst = (p: Pen) => { obj(p, starP(150, 150, 142, 94, 12), "#ffe066", "#ff9424", 12); obj(p, starP(150, 150, 84, 56, 12), "#fff6c2", "#ffe066", 0); };
export const fxMusic = (p: Pen, u = 0) => {
  const b = 8 * Math.sin(2 * Math.PI * u);
  p.ell(84, 226 + b, 32, 24, INK, 0, 0, 360, -20); p.stroke([[112, 218 + b], [112, 80 + b]], 12); p.stroke([[112, 80 + b], [150, 110 + b], [148, 150 + b]], 12);
  p.ell(172, 206 - b, 30, 22, INK, 0, 0, 360, -20); p.ell(246, 184 - b, 30, 22, INK, 0, 0, 360, -20);
  p.stroke([[198, 198 - b], [198, 66 - b]], 12); p.stroke([[272, 176 - b], [272, 44 - b]], 12);
  p.poly([[192, 60 - b], [278, 38 - b], [278, 64 - b], [192, 86 - b]], INK, 0);
};
export const fxSpeech = (p: Pen, text?: string) => {
  const B = chaikin([[24, 40], [276, 40], [276, 206], [138, 206], [76, 282], [94, 206], [24, 206]], 3);
  obj(p, B, "#ffffff", "#ece8f2", 12);
  if (text) { const g = p.g; g.fillStyle = INK; g.font = `900 ${Math.min(64, 3000 / Math.max(4, text.length * 6))}px "Arial Black", Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 150, 124); }
};

// ---------------- motion helpers (pure functions of time in seconds) ----------------
/** hop is in metres (cast.ts Who.hop units; Skala ≈ 1.9 m tall); sx/sy can be fed straight into SkalaOpts.squash */
export type Motion = { legs: number; hop: number; tilt: number; sx: number; sy: number; look: number };
const REST: Motion = { legs: 0, hop: 0, tilt: 0, sx: 1, sy: 1, look: 0 };
const vol = (sy: number) => ({ sx: 1 / Math.sqrt(sy), sy });
export const squash = (k: number) => vol(1 - k); // k 0..0.4
export const stretch = (k: number) => vol(1 + k);
/** waddle walk: speed = cycles per second (1 cycle = 2 steps) */
export const walkPose = (t: number, speed = 1): Motion => {
  const s = Math.sin(2 * Math.PI * t * speed), a = Math.abs(s);
  return { legs: s, hop: 0.035 * a, tilt: 4 * s, ...vol(1 + 0.03 * (2 * a - 1)), look: 0 };
};
/** jump that starts at t0: anticipation squash (0-20 %), air (20-75 %), landing squash (75-100 %) */
export const jumpPose = (t: number, t0: number, dur = 1, height = 0.45): Motion => {
  const u = (t - t0) / dur;
  if (u <= 0 || u >= 1) return { ...REST };
  if (u < 0.2) { const k = Math.sin((u / 0.2) * Math.PI * 0.5); return { ...REST, ...squash(0.2 * k) }; }
  if (u < 0.75) { const v = (u - 0.2) / 0.55; return { ...REST, hop: height * 4 * v * (1 - v), legs: 0.5 * Math.sin(v * Math.PI), ...stretch(0.14 * Math.abs(1 - 2 * v)) }; }
  const w = (u - 0.75) / 0.25; return { ...REST, ...squash(0.22 * Math.sin(Math.PI * (0.5 + 0.5 * w))) };
};
/** idle bounce, rate in Hz */
export const bouncePose = (t: number, rate = 1.5): Motion => { const s = Math.sin(2 * Math.PI * rate * t); return { ...REST, hop: 0.012 * Math.max(0, s), ...vol(1 + 0.025 * s) }; };
/** nod (yes): small dips, count nods over dur seconds */
export const nodPose = (t: number, t0: number, dur = 0.7, count = 2): Motion => {
  const u = (t - t0) / dur; if (u <= 0 || u >= 1) return { ...REST };
  const s = Math.max(0, Math.sin(2 * Math.PI * count * u)) * (1 - u); return { ...REST, tilt: 2 * s, ...squash(0.06 * s) };
};
/** head shake (no): eyes/mouth swing via look + slight tilt */
export const shakePose = (t: number, t0: number, dur = 0.8, count = 3): Motion => {
  const u = (t - t0) / dur; if (u <= 0 || u >= 1) return { ...REST };
  const s = Math.sin(2 * Math.PI * count * u) * (1 - u * 0.6); return { ...REST, look: s, tilt: 2.5 * s };
};

// ---------------- catalog ----------------
export const SKALA_CATALOG = {
  expressions: ["talk", "happy", "worried", "shock", "sad", "deadpan", "sheepish", "neutral", "grin", "thinking", "angry", "annoyed", "love", "wink",
    "cry", "laughcry", "smug", "sleepy", "mindblown", "scared", "excited", "cringe", "skeptical", "proud", "dreamy", "determined", "bored",
    "confused", "dizzy", "ooh", "smile"] as Expr[],
  arms: ["rest", "wave", "up", "cheeks", "hold", "phone", "shrug", "point", "slump", "hide", "crumple", ...(Object.keys(POSES) as NewArms[])] as Arms[],
  props: ["bucket", "phone", "scroll", "ball", ...(Object.keys(PROPS2) as NewProp[])] as Exclude<Prop, null>[],
  fx: ["fxHeart", "fxRing", "fxLaugh", "fxGrowl", "fxSweat", "fxSiren", "paperBallFx", "fxExclaim", "fxQuestion", "fxSparkles", "fxAngerVein",
    "fxSweatDrops", "fxZzz", "fxLightbulb", "fxHeartsFloat", "fxMoney", "fxFire", "fxCheck", "fxCross", "fxStarBurst", "fxMusic", "fxSpeech"],
  motions: ["walkPose", "jumpPose", "bouncePose", "nodPose", "shakePose", "squash", "stretch"],
  propArms: PROP_ARMS,
  brandPoses: {
    "skala-annoyed": { expr: "annoyed", arms: "crossed" },
    "skala-celebrate": { expr: "happy", arms: "cheer", legs: 0.7, tilt: -5 },
    "skala-clipboard": { expr: "smile", arms: "writing", prop: "clipboard" },
    "skala-confused": { expr: "confused", arms: "scratch", tilt: 4 },
    "skala-creator-film": { expr: "wink", arms: "holdFront", prop: "camera" },
    "skala-creator-mic": { expr: "smile", arms: "mic", prop: "mic" },
    "skala-creator-selfie": { expr: "wink", arms: "selfie", prop: "selfie" },
    "skala-cringe": { expr: "cringe", arms: "flinch", tilt: -4 },
    "skala-determined": { expr: "determined", arms: "fists" },
    "skala-dreamy": { expr: "dreamy", arms: "handsChest", tilt: 5, legs: 0.4 },
    "skala-follow-cta": { expr: "wink", arms: "thumbsUp" },
    "skala-overwhelmed": { expr: "dizzy", arms: "cheeks" },
    "skala-point-right": { expr: "smile", arms: "pointRight" },
    "skala-point-viewer": { expr: "wink", arms: "pointViewer" },
    "skala-react-bored": { expr: "bored", arms: "chin" },
    "skala-react-facepalm": { expr: "annoyed", arms: "facepalm" },
    "skala-react-mindblown": { expr: "mindblown", arms: "cheeks" },
    "skala-react-popcorn": { expr: "smile", arms: "popcorn", prop: "popcorn" },
    "skala-react-proud": { expr: "proud", arms: "hips" },
    "skala-react-sleepy": { expr: "sleepy", arms: "slump", tilt: 6 },
    "skala-research-calc": { expr: "ooh", arms: "holdFront", prop: "calculator" },
    "skala-research-magnify": { expr: "smile", arms: "magnify", prop: "magnifier" },
    "skala-research-notes": { expr: "smile", arms: "writing", prop: "notes" },
    "skala-sad-low": { expr: "sad", arms: "slump" },
    "skala-shrug": { expr: "smug", arms: "shrugUp" },
    "skala-skeptical": { expr: "skeptical", arms: "chin" },
    "skala-talking": { expr: "talk", arms: "gesture", talk: 1 },
    "skala-teach-aha": { expr: "smile", arms: "stickUp", prop: "pointer" },
    "skala-teach-ask": { expr: "smile", arms: "stickAsk", prop: "pointer" },
    "skala-teach-attention": { expr: "determined", arms: "stickRight", prop: "pointer" },
    "skala-teach-book-read": { expr: "smile", arms: "read", prop: "book" },
    "skala-teach-explain": { expr: "smile", arms: "stickDown", prop: "pointer" },
    "skala-teach-good-job": { expr: "happy", arms: "stickThumb", prop: "pointer" },
    "skala-teach-no": { expr: "smug", arms: "stickNo", prop: "pointer" },
    "skala-teach-point-up": { expr: "smile", arms: "stickUpRight", prop: "pointer" },
    "skala-teach-tap-stick": { expr: "smile", arms: "tap", prop: "pointer" },
    "skala-teach-write": { expr: "smile", arms: "writeUp", prop: "marker" },
    "skala-teach-yay": { expr: "happy", arms: "stickYay", prop: "pointer", legs: 0.6 },
  } as Record<string, SkalaOpts>,
};
export type BrandPose = keyof typeof SKALA_CATALOG.brandPoses;
/** "skala-research-magnify" (or "research-magnify") -> SkalaOpts; extra opts (v, look, blink, facing...) override */
export const brandPose = (name: string, extra: Partial<SkalaOpts> = {}): SkalaOpts => {
  const k = name.startsWith("skala-") ? name : `skala-${name}`, b = SKALA_CATALOG.brandPoses[k];
  if (!b) throw new Error(`unknown Skala brand pose: ${name}`);
  return { ...b, ...extra };
};
