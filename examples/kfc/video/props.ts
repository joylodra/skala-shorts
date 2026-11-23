// KFC short props: the wall-display map (restaurants, trucks, warehouse, police tweet), the desk calendar and the
// newspaper ad (bucket letters K-F-C shuffle to F-C-K, "We're sorry."). Engine contract (see references/authoring.md):
//   drawScreen(g, f)  -> paints the 2048 x 1152 wall display at story frame f
//   buildProps(kit)   -> builds extra scene objects once, returns update(f, shotId) called every frame
import * as THREE from "three";
import { rng } from "../skala/paint";
import { Pen, INK } from "../skala/toon";
import { drawBucket, chaikin } from "../skala/skala";
import { smooth, clamp01, easeOut, V3 } from "../skala/camera";
import { DESK_H } from "../skala/room";
import type { PropKit } from "../skala/kit";
import { EV, openFrac } from "./story";

const q = (v: number, n = 60) => Math.round(v * n) / n;
export const PAPER: V3 = [-2.25, DESK_H + 0.004, -1.0];
export const CAL: V3 = [-1.72, DESK_H, -1.22];

// ---------------- the wall-screen map ----------------
// stylised Great Britain in a 1000 x 1300 box (x right, y down)
const GB: [number, number][] = [[380, 40], [470, 30], [520, 90], [480, 150], [540, 200], [600, 230], [560, 300], [520, 330], [560, 380], [530, 440],
  [600, 520], [640, 600], [700, 660], [760, 760], [820, 820], [880, 860], [900, 940], [860, 1010], [920, 1060], [820, 1100], [700, 1110], [600, 1130],
  [500, 1150], [400, 1180], [300, 1230], [220, 1240], [300, 1150], [380, 1080], [330, 1040], [280, 980], [330, 900], [300, 860], [380, 820], [420, 760],
  [380, 700], [400, 620], [330, 560], [300, 500], [250, 470], [280, 400], [220, 330], [260, 260], [220, 200], [280, 140], [300, 80]];
const GBS = chaikin(GB, 2);
const inPoly = (x: number, y: number, P: [number, number][]) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const DOTS = (() => {
  const r = rng(77), out: { x: number; y: number; close: number; on: number }[] = [];
  while (out.length < 120) {
    const x = 200 + r() * 720, y = 60 + r() * 1180;
    // denser in the south / Midlands where most restaurants are
    if (!inPoly(x, y, GB) || r() > 0.35 + y / 1700) continue;
    if (out.some((d) => Math.hypot(d.x - x, d.y - y) < 34)) continue;
    out.push({ x, y, close: 0, on: r() });
  }
  out.forEach((d, i) => (d.close = (i + 0.5) / 120)); // open while close < openFrac
  out.sort(() => r() - 0.5).forEach((d, i) => (d.close = (i + 0.5) / 120));
  return out;
})();
const WH: [number, number] = [600, 860]; // the single warehouse (Midlands)
const ROUTES = DOTS.filter((_, i) => i % 9 === 0).slice(0, 12);
const MX = 470, MY = 80, MS = 0.77, MSX = 0.9; // map placement on the 2048 x 1152 screen canvas
const mp = (x: number, y: number): [number, number] => [MX + x * MSX, MY + y * MS];

const truckIcon = (g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) => {
  const p = new Pen(g); g.save(); g.translate(x, y); g.scale(s, s);
  p.poly([[-60, -34], [22, -34], [22, 26], [-60, 26]], col, 7);
  p.poly([[22, -14], [48, -14], [62, 6], [62, 26], [22, 26]], col, 7);
  p.poly([[34, -8], [46, -8], [54, 4], [34, 4]], "#bfe6ff", 4);
  p.ell(-36, 30, 13, 13, "#2b2f3c", 5); p.ell(40, 30, 13, 13, "#2b2f3c", 5);
  g.restore();
};
const warehouseIcon = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  const p = new Pen(g); g.save(); g.translate(x, y); g.scale(s, s);
  p.poly([[-70, -10], [0, -60], [70, -10], [70, 50], [-70, 50]], "#f4f1ea", 7);
  p.poly([[-30, 10], [30, 10], [30, 50], [-30, 50]], "#8a8fa3", 6);
  for (let k = 0; k < 3; k++) p.stroke([[-30, 20 + k * 10], [30, 20 + k * 10]], 3, "#5a5f73");
  g.restore();
};
const badgeIcon = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  const p = new Pen(g); g.save(); g.translate(x, y); g.scale(s, s);
  p.ell(0, 0, 60, 60, "#1f4fa8", 7);
  const st: [number, number][] = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 16 : 38; st.push([r * Math.cos(a), r * Math.sin(a)]); }
  p.poly(st, "#e8eef9", 4);
  g.restore();
};
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};

export const drawScreen = (g: CanvasRenderingContext2D, f: number) => {
  const W = 2048, H = 1152;
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#22304f"); bg.addColorStop(1, "#18223a");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 2;
  for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // land
  g.beginPath(); GBS.forEach(([x, y], i) => { const [a, b] = mp(x, y); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.closePath();
  g.fillStyle = "#3d5a8a"; g.fill(); g.lineWidth = 7; g.strokeStyle = "#8fb3e6"; g.stroke();
  const open = openFrac(f);
  // routes + trucks (after "one single warehouse")
  if (f >= EV.warehouse) {
    const late = f >= EV.late, kR = smooth((f - EV.warehouse - 10) / 30);
    ROUTES.forEach((d, i) => {
      const [x0, y0] = mp(...WH), [x1, y1] = mp(d.x, d.y);
      g.strokeStyle = late ? "rgba(255,110,90,0.7)" : "rgba(255,226,140,0.65)"; g.lineWidth = 5; g.setLineDash([16, 14]);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * kR, y0 + (y1 - y0) * kR); g.stroke(); g.setLineDash([]);
      if (kR >= 1 && f < EV.closing + 40) {
        // trucks travel out, slow down "within days", stop dead when "late"
        const speed = f < EV.within ? 1 : f < EV.late ? 1 - smooth((f - EV.within) / (EV.late - EV.within)) * 0.85 : 0;
        const tt = f < EV.late ? ((f - EV.warehouse) * 0.012 * speed + i * 0.13) % 1 : ((EV.late - EV.warehouse) * 0.012 * 0.3 + i * 0.13) % 0.5;
        const jig = late ? (f % 4 < 2 ? 2 : -2) : 0;
        truckIcon(g, x0 + (x1 - x0) * tt + jig, y0 + (y1 - y0) * tt - 18, 0.42, late ? "#ff6b5a" : "#ffd23f");
      }
    });
    warehouseIcon(g, ...mp(...WH), 0.9 + 0.12 * Math.max(0, 1 - Math.abs(f - EV.warehouse - 6) / 8));
  }
  // restaurants: appear on "nine hundred", go dark as they close
  if (f >= EV.nine - 4) {
    for (const d of DOTS) {
      const a = clamp01((f - (EV.nine - 4) - d.on * 36) / 5);
      if (a <= 0) continue;
      const [x, y] = mp(d.x, d.y), lit = d.close < open;
      const pop = 1 + 0.5 * Math.max(0, 1 - (f - (EV.nine - 4) - d.on * 36) / 6);
      if (lit) {
        g.fillStyle = "rgba(255,210,63,0.25)"; g.beginPath(); g.arc(x, y, 20 * pop, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#ffd23f";
      } else g.fillStyle = "#4a5470";
      g.beginPath(); g.arc(x, y, 9.5 * pop * a, 0, Math.PI * 2); g.fill();
    }
  }
  // the brand-new partner: a big truck slides in on "brand-new partner"
  if (f >= EV.partner - 2 && f < EV.warehouse) {
    const k = easeOut((f - EV.partner + 2) / 10);
    truckIcon(g, 1650 - 200 * (1 - k), 560, 2.2 * k, "#ffd23f");
    g.fillStyle = "#ffffff";
    for (let s = 0; s < 3; s++) { const a = -0.9 + s * 0.6, r = 260 + 20 * Math.sin(f * 0.4 + s); g.beginPath(); g.arc(1650 + r * Math.cos(a), 560 + r * Math.sin(a) - 20, 10, 0, Math.PI * 2); g.fill(); }
  }
  // the police tweet card
  if (f >= EV.tweet - 30 && f < 996) {
    const k = easeOut((f - (EV.tweet - 30)) / 12), x0 = 1290 + 120 * (1 - k);
    g.save(); g.globalAlpha = k;
    g.fillStyle = "#ffffff"; rr(g, x0, 250, 640, 560, 36); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    badgeIcon(g, x0 + 100, 350, 1.0);
    g.fillStyle = "#2b2f3c"; rr(g, x0 + 190, 320, 260, 30, 15); g.fill();
    g.fillStyle = "#9aa3b8"; rr(g, x0 + 190, 368, 170, 22, 11); g.fill();
    const hl = f >= EV.matter - 2 ? smooth((f - EV.matter + 2) / 12) : 0;
    for (let l = 0; l < 4; l++) {
      const w = [520, 470, 500, 300][l], y = 470 + l * 66;
      if (l === 2 && hl > 0) { g.fillStyle = "#ffe066"; rr(g, x0 + 50, y - 12, w * hl + 20, 54, 12); g.fill(); }
      g.fillStyle = "#5a6178"; rr(g, x0 + 60, y, w, 28, 14); g.fill();
    }
    // reply / repost / like counters ticking up
    const n = Math.floor(clamp01((f - EV.tweet) / 120) * 9);
    for (let s = 0; s < 3; s++) { g.fillStyle = s === 2 ? "#ff5d7a" : "#9aa3b8"; g.beginPath(); g.arc(x0 + 90 + s * 190, 760, 16, 0, Math.PI * 2); g.fill(); rr(g, x0 + 120 + s * 190, 748, 40 + n * 8, 24, 12); g.fill(); }
    g.restore();
  }
};

// ---------------- desk calendar + newspaper ----------------
const drawCal = (g: CanvasRenderingContext2D, day: number, flip: number) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 300);
  g.fillStyle = "#e2453c"; g.fillRect(0, 0, 256, 78);
  g.fillStyle = "#ffffff"; g.font = "bold 52px sans-serif"; g.textAlign = "center"; g.fillText("FEB", 128, 58);
  g.fillStyle = "#241726"; g.font = "bold 150px sans-serif"; g.fillText(String(day), 128, 240);
  if (flip > 0) { g.fillStyle = "#f1ede6"; g.fillRect(0, 78, 256, 222 * flip); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 78 + 222 * flip - 6, 256, 6); }
  g.lineWidth = 10; g.strokeStyle = "#241726"; g.strokeRect(5, 5, 246, 290);
};
const LETTERS = ["K", "F", "C"]; // printed order on the bucket
/** slot of each letter (K, F, C) at frame f: F hops to the front, then C, then K bounces into last place */
const letterSlots = (f: number) => {
  const hop = (a: number) => smooth((f - a + 2) / 8);
  const kF = hop(EV.F), kC = hop(EV.C);
  return { K: 0 + kF + kC, F: 1 - kF, C: 2 - kC, lift: { F: Math.sin(Math.PI * clamp01((f - EV.F + 2) / 8)), C: Math.sin(Math.PI * clamp01((f - EV.C + 2) / 8)), K: Math.sin(Math.PI * clamp01((f - EV.K + 2) / 8)) } };
};
const drawPaper = (g: CanvasRenderingContext2D, f: number) => {
  const W = 1160, H = 1520;
  g.fillStyle = "#f4efe2"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#241726"; g.fillRect(60, 60, W - 120, 120); // masthead bar
  g.fillStyle = "#f4efe2"; for (let k = 0; k < 6; k++) g.fillRect(110 + k * 160, 100, 110, 40);
  g.fillStyle = "#241726"; g.fillRect(60, 196, W - 120, 6);
  // full-page ad: red frame
  g.fillStyle = "#c8312a"; g.fillRect(60, 230, W - 120, 1080);
  g.fillStyle = "#f7f2e8"; g.fillRect(84, 254, W - 168, 1032);
  if (f >= EV.bucket - 3) {
    const k = easeOut((f - EV.bucket + 3) / 8);
    const p = new Pen(g);
    g.save(); g.translate(W / 2, 760); g.scale(k * 2.1, k * 2.1); g.translate(-W / 2, -760);
    drawBucket(p, W / 2, 760, 1.0, "KFC");
    g.restore();
    if (k >= 1) {
      const s = letterSlots(f);
      g.font = "bold 190px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      for (const L of LETTERS as ("K" | "F" | "C")[]) {
        const x = W / 2 + (s[L] - 1) * 170, y = 770 - 160 * s.lift[L];
        g.lineWidth = 16; g.strokeStyle = "#f7f2e8"; g.strokeText(L, x, y);
        g.fillStyle = "#c8312a"; g.fillText(L, x, y);
      }
    }
  }
  if (f >= EV.sorry - 2) {
    const k = clamp01((f - EV.sorry + 2) / 10);
    g.save(); g.beginPath(); g.rect(84, 1150, (W - 168) * k, 140); g.clip();
    g.fillStyle = "#241726"; g.font = "bold 104px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("We're sorry.", W / 2, 1215); g.restore();
  }
  for (let l = 0; l < 3; l++) { g.fillStyle = "#b9b3a4"; g.fillRect(60, 1350 + l * 44, l === 2 ? 600 : W - 120, 18); }
};


export const buildProps = (kit: PropKit) => {
  const cal = new kit.DynTex(256, 300), paper = new kit.DynTex(1160, 1520);
  const calBlock = kit.box([CAL[0] - 0.11, CAL[1], CAL[2] - 0.06], [CAL[0] + 0.11, CAL[1] + 0.24, CAL[2]], "#2c303c");
  calBlock.geometry.translate(-CAL[0], -CAL[1], -CAL[2]); calBlock.position.set(...CAL); calBlock.rotation.x = -0.25;
  const calFace = kit.unlit(cal.tex, 0.2, 0.235, [CAL[0], CAL[1] + 0.12, CAL[2] + 0.034], 0, -0.25, 0.97);
  calFace.renderOrder = 1;
  const paperMesh = kit.unlit(paper.tex, 0.58, 0.76, [PAPER[0], PAPER[1], PAPER[2]], 0, -Math.PI / 2, 0.98);
  paperMesh.visible = false;
  return (f: number) => {
    const day = f < EV.day3 + 8 ? 14 : 17, flip = f >= EV.day3 && f < EV.day3 + 8 ? (f - EV.day3) / 8 : 0;
    cal.set(`c${day}${q(flip, 8)}`, (g) => drawCal(g, day, flip));
    const drop = EV.newspaper;
    paperMesh.visible = f >= drop - 12;
    if (paperMesh.visible) {
      const u = clamp01((f - (drop - 12)) / 12);
      paperMesh.position.set(PAPER[0], PAPER[1] + 0.9 * (1 - u * u), PAPER[2]);
      paperMesh.rotation.set(-Math.PI / 2 + 0.5 * (1 - u), 0, 0.4 * (1 - u), "YXZ");
      paper.set(`p${f >= EV.bucket - 3 ? f : 0}`, (g) => drawPaper(g, f));
    }
  };
};
