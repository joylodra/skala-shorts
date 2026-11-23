// Test short props: the wall display tells the Burbn -> Instagram story (app icon, cluttered feature tiles, a flat
// usage chart, tiles crossed out, photo / filter / like, a sign-up counter). No real logos: generic icons only.
import { Pen, INK } from "../skala/toon";
import { clamp01, easeOut, smooth } from "../skala/camera";
import type { PropKit } from "../skala/kit";
import { EV } from "./story";

const W = 2048, H = 1152;
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};
const pop = (f: number, a: number) => (f < a - 2 ? 0 : Math.min(1, easeOut((f - a + 2) / 7) * 1.12 - 0.12 * smooth((f - a - 5) / 6)));

type Tile = { name: string; col: string; icon: (p: Pen, g: CanvasRenderingContext2D) => void; at: number };
const ICON = {
  pin: (p: Pen) => { p.poly([[0, -60], [40, -30], [0, 60], [-40, -30]], "#ffffff", 8); p.ell(0, -22, 16, 16, "#e2453c", 6); },
  star: (p: Pen) => { const s: [number, number][] = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 26 : 60; s.push([r * Math.cos(a), r * Math.sin(a)]); } p.poly(s, "#ffd23f", 8); },
  cal: (p: Pen) => { p.poly([[-55, -45], [55, -45], [55, 55], [-55, 55]], "#ffffff", 8); p.poly([[-55, -45], [55, -45], [55, -15], [-55, -15]], "#e2453c", 8); for (const x of [-25, 5, 35]) p.ell(x, 20, 9, 9, INK, 0); },
  cam: (p: Pen) => { p.poly([[-62, -32], [-25, -32], [-15, -50], [15, -50], [25, -32], [62, -32], [62, 48], [-62, 48]], "#ffffff", 8); p.ell(0, 8, 30, 30, "#5aa2ff", 8); },
  chat: (p: Pen) => { p.poly([[-60, -45], [60, -45], [60, 30], [-10, 30], [-35, 55], [-30, 30], [-60, 30]], "#ffffff", 8); },
  map: (p: Pen) => { p.poly([[-60, -40], [-20, -55], [20, -40], [60, -55], [60, 45], [20, 60], [-20, 45], [-60, 60]], "#bfe6c8", 8); },
  bell: (p: Pen) => { p.poly([[-40, 30], [-35, -20], [0, -50], [35, -20], [40, 30]], "#ffd23f", 8); p.ell(0, 42, 12, 12, "#ffd23f", 6); },
  gear: (p: Pen) => { p.ell(0, 0, 50, 50, "#c9cfdb", 8); p.ell(0, 0, 18, 18, "#3a4258", 6); },
  filter: (p: Pen) => { p.ell(-18, -10, 36, 36, "#ff8fb1", 7); p.ell(18, -10, 36, 36, "#8fd0ff", 7); p.ell(0, 20, 36, 36, "#ffd23f", 7); },
  heart: (p: Pen) => { const s: [number, number][] = []; for (let k = 0; k < 40; k++) { const t = (k / 40) * Math.PI * 2; s.push([3.6 * 16 * Math.sin(t) ** 3, -3.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } p.poly(s, "#ff5d7a", 8); },
};
const FEATURES: Tile[] = [
  { name: "checkin", col: "#ff8a5c", icon: (p) => ICON.pin(p), at: EV.checkin },
  { name: "poin", col: "#7f6cf0", icon: (p) => ICON.star(p), at: EV.poin },
  { name: "rencana", col: "#3ec27a", icon: (p) => ICON.cal(p), at: EV.rencana },
  { name: "foto", col: "#3b6fd6", icon: (p) => ICON.cam(p), at: EV.foto2 },
  { name: "chat", col: "#ffb347", icon: (p) => ICON.chat(p), at: EV.macam - 4 },
  { name: "map", col: "#2fa3a8", icon: (p) => ICON.map(p), at: EV.macam + 2 },
  { name: "bell", col: "#e2453c", icon: (p) => ICON.bell(p), at: EV.macam + 8 },
  { name: "gear", col: "#5a6178", icon: (p) => ICON.gear(p), at: EV.macam + 14 },
];
const tile = (g: CanvasRenderingContext2D, x: number, y: number, s: number, t: Tile | { col: string; icon: (p: Pen, g: CanvasRenderingContext2D) => void }, dim = 0) => {
  if (s <= 0.01) return;
  const p = new Pen(g);
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = t.col; rr(g, -95, -95, 190, 190, 40); g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
  t.icon(p, g);
  if (dim > 0) { g.fillStyle = `rgba(24,34,58,${0.7 * dim})`; rr(g, -95, -95, 190, 190, 40); g.fill(); }
  g.restore();
};
const glow = (g: CanvasRenderingContext2D, x: number, y: number, r: number, k: number) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,220,120,${0.55 * k})`); gr.addColorStop(1, "rgba(255,220,120,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
};
const phoneFrame = (g: CanvasRenderingContext2D) => {
  g.fillStyle = "#11182b"; rr(g, 664, 40, 720, 1072, 90); g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  g.fillStyle = "#f4f1ea"; rr(g, 700, 110, 648, 950, 50); g.fill();
};
const text = (g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, col = "#ffffff", weight = 800) => {
  g.font = `${weight} ${size}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};

export const drawScreen = (g: CanvasRenderingContext2D, f: number) => {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#22304f"); bg.addColorStop(1, "#18223a");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (f < EV.flash) { // idle: Skala+ plus
    g.fillStyle = "#ff8a24"; g.fillRect(964, 376, 120, 400); g.fillRect(824, 516, 400, 120); return;
  }
  if (f < EV.aplikasi) { // the Burbn app icon, 2010
    const k = pop(f, EV.flash + 6), kb = pop(f, EV.burbn);
    g.save(); g.translate(1024, 470); g.scale(k, k);
    g.fillStyle = "#8a4b2a"; rr(g, -170, -170, 340, 340, 80); g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
    const p = new Pen(g); p.poly([[-70, -90], [70, -90], [50, 90], [-50, 90]], "#ffd9a0", 9); p.poly([[-62, -20], [62, -20], [50, 90], [-50, 90]], "#e0913c", 0);
    g.restore();
    if (kb > 0) { g.save(); g.globalAlpha = Math.min(1, kb); text(g, "Burbn", 1024, 800, 150 * (0.8 + 0.2 * kb)); g.restore(); }
    text(g, "2010", 1024, 1000, 80, "#9fb6e6", 700);
    return;
  }
  // the cluttered phone
  phoneFrame(g);
  const crossK = smooth((f - EV.hapus) / 14), fallU = clamp01((f - EV.semuanya) / 18);
  const late = f >= EV.jadi;
  FEATURES.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 860 + col * 330, y = 250 + row * 230;
    const isPhoto = t.name === "foto";
    let s = pop(f, t.at), dy = 0, rot = 0;
    if (late && !isPhoto) { dy = 900 * fallU * fallU; rot = (i % 2 ? 1 : -1) * 0.8 * fallU; }
    const dim = f >= EV.tapi && !isPhoto ? smooth((f - EV.tapi) / 10) : 0;
    if (isPhoto && f >= EV.foto3 - 2) glow(g, x, y, 220, Math.min(1, (f - EV.foto3 + 2) / 6));
    g.save(); g.translate(x, y + dy); g.rotate(rot); tile(g, 0, 0, s, t, dim); g.restore();
    if (late && !isPhoto && crossK > 0 && fallU < 1) { // red X
      g.save(); g.translate(x, y + dy); g.rotate(rot); g.strokeStyle = "#e2453c"; g.lineWidth = 22; g.lineCap = "round";
      g.beginPath(); g.moveTo(-70, -70); g.lineTo(-70 + 140 * crossK, -70 + 140 * crossK); g.stroke();
      if (crossK > 0.5) { const k2 = (crossK - 0.5) * 2; g.beginPath(); g.moveTo(70, -70); g.lineTo(70 - 140 * k2, -70 + 140 * k2); g.stroke(); }
      g.restore();
    }
  });
  // "hampir nggak ada yang pakai": a flat usage line over the phone
  if (f >= EV.hasilnya && f < EV.tapi) {
    const k = clamp01((f - EV.hasilnya - 4) / 20);
    g.fillStyle = "rgba(255,255,255,0.95)"; rr(g, 1420, 380, 520, 360, 30); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = "#e2453c"; g.lineWidth = 12; g.beginPath(); g.moveTo(1470, 650);
    for (let i = 1; i <= 20; i++) { const x = 1470 + 21 * i; if (x > 1470 + 420 * k) break; g.lineTo(x, 650 - (i % 5 === 0 ? 14 : 0)); }
    g.stroke(); text(g, "users", 1680, 440, 48, "#5a6178", 700);
  }
  // photo + filter + like after the cut
  if (f >= EV.sisakan - 4 && fallU >= 1) {
    const trio = [{ t: FEATURES[3], at: EV.foto4 }, { t: { col: "#ff7aa8", icon: (p: Pen) => ICON.filter(p) }, at: EV.filter }, { t: { col: "#ffffff", icon: (p: Pen) => ICON.heart(p) }, at: EV.like }];
    g.fillStyle = "#f4f1ea"; rr(g, 700, 110, 648, 950, 50); g.fill();
    trio.forEach(({ t, at }, i) => tile(g, 1024, 270 + i * 260, f >= EV.hari ? 1 : Math.max(i === 0 ? 1 : 0, pop(f, at)), t as Tile));
  }
  // sign-ups counter on launch day
  if (f >= EV.hari) {
    const n = Math.round(25000 * smooth((f - EV.instagram) / (EV.daftar - EV.instagram)));
    g.fillStyle = "rgba(255,255,255,0.96)"; rr(g, 1410, 420, 560, 300, 36); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    text(g, n.toLocaleString("id-ID"), 1690, 545, 120, "#241726");
    text(g, "daftar", 1690, 650, 54, "#5a6178", 700);
    if (f >= EV.daftar) for (let k = 0; k < 14; k++) { // confetti
      const u = ((f - EV.daftar) * 0.02 + k * 0.071) % 1, x = 1420 + ((k * 137) % 540), y = 380 + u * 420;
      g.fillStyle = ["#ffd23f", "#ff5d7a", "#5aa2ff", "#4fd08a"][k % 4]; g.fillRect(x, y, 18, 30);
    }
  }
};
export const buildProps = (_kit: PropKit) => (_f: number, _id: number) => {};
