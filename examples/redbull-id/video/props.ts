// Red Bull Stratos wall display: the jump as a live broadcast. No real logos and no likeness of the jumper
// (a tiny white-suited figure). States follow the voice (events.json).
import * as THREE from "three";
import { Pen, INK } from "../skala/toon";
import { drawSkala } from "../skala/skala";
import { lam } from "../skala/build";
import { NOINK } from "../skala/ink";
import { clamp01, easeOut, smooth } from "../skala/camera";
import type { PropKit } from "../skala/kit";
import { continueRender, delayRender, staticFile } from "remotion";

/** the brand's own product shot (supplied by the Skala+ team, used unaltered): public/brand/redbull-can.png, 316 x 868 */
export const CAN_ASPECT = 316 / 868;
export const canImg: HTMLImageElement | null = (() => {
  if (typeof document === "undefined") return null;
  const img = new Image(), h = delayRender("brand can");
  img.onload = () => continueRender(h);
  img.onerror = () => continueRender(h);
  img.src = staticFile("brand/redbull-can.png");
  return img;
})();
import { EV } from "./story";

const W = 2048, H = 1152, CX = 1024;
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};
const text = (g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, col = "#ffffff", weight = 800, align: CanvasTextAlign = "center") => {
  g.font = `${weight} ${size}px sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};
const mixHex = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), k = clamp01(t);
  const c = (s: number) => Math.round(((A >> s) & 255) * (1 - k) + ((B >> s) & 255) * k);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};
const hash = (i: number) => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
const fmt = (n: number) => Math.round(n).toLocaleString("id-ID");

/** altitude in km: lift-off on "Red Bull", 39 km exactly on "km" */
const alt = (f: number) => 39 * smooth((f - (EV.redbull + 6)) / (EV.km39 - EV.redbull - 6)) ** 1.15;

const stars = (g: CanvasRenderingContext2D, a: number) => {
  if (a <= 0) return;
  g.fillStyle = `rgba(255,255,255,${a})`;
  for (let i = 0; i < 90; i++) { const x = hash(i) * W, y = hash(i + 99) * H * 0.8, r = 1.5 + 2.5 * hash(i + 7); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
};
/** curved Earth: horizon arc centred below the frame; lift = how high the arc rises (px) */
const earth = (g: CanvasRenderingContext2D, top: number, R = 2600) => {
  const cy = top + R;
  const glow = g.createRadialGradient(CX, cy, R - 10, CX, cy, R + 70);
  glow.addColorStop(0, "rgba(120,190,255,0.9)"); glow.addColorStop(1, "rgba(120,190,255,0)");
  g.fillStyle = glow; g.beginPath(); g.arc(CX, cy, R + 70, 0, Math.PI * 2); g.fill();
  const sea = g.createLinearGradient(0, top, 0, H); sea.addColorStop(0, "#3a7fd0"); sea.addColorStop(1, "#1d4f9a");
  g.fillStyle = sea; g.beginPath(); g.arc(CX, cy, R, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,255,255,0.75)"; // cloud bands
  for (let i = 0; i < 9; i++) { const x = hash(i + 3) * W, y = top + 40 + hash(i + 31) * 260, w = 160 + 260 * hash(i + 13); g.beginPath(); g.ellipse(x, y + (Math.abs(x - CX) / R) * 120, w, 22, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#c9a26b"; g.beginPath(); g.ellipse(CX + 260, top + 210, 230, 60, -0.1, 0, Math.PI * 2); g.fill(); // a continent
};
const figure = (g: CanvasRenderingContext2D, x: number, y: number, s: number, rot = 0, spread = 1) => {
  const p = new Pen(g); g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  for (const [a, b] of [[[-10, 0], [-46 * spread, -30]], [[10, 0], [46 * spread, -30]], [[-8, 30], [-30 * spread, 70]], [[8, 30], [30 * spread, 70]]] as [number, number][][])
    p.line([a, b], "#f4f1ea", 16);
  p.ell(0, 12, 22, 34, "#f4f1ea", 7); p.ell(0, -34, 18, 18, "#f4f1ea", 7); p.ell(4, -34, 10, 8, "#ffb84a", 0);
  g.restore();
};
/** stratospheric balloon: tall teardrop envelope with gore seams, ropes tied to a round-topped capsule */
const balloon = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  const p = new Pen(g); g.save(); g.translate(x, y); g.scale(s, s);
  const env: [number, number][] = [];
  for (let k = 0; k <= 28; k++) { const a = Math.PI * (0.92 + 1.16 * (k / 28)); env.push([210 * Math.cos(a), -560 + 230 * Math.sin(a)]); }
  env.push([150, -430], [70, -300], [22, -190], [0, -165], [-22, -190], [-70, -300], [-150, -430]);
  const E = env.map(([u, v]) => [u, v] as [number, number]);
  p.gradFill(E, "#ffffff", "#c6d0e6", -Math.PI * 0.75, 0.4);
  g.save(); p.path(E, true); g.clip();
  g.strokeStyle = "rgba(120,135,170,0.55)"; g.lineWidth = 4;
  for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) { g.beginPath(); g.moveTo(0, -790); g.quadraticCurveTo(k * 420, -520, 0, -165); g.stroke(); }
  g.restore();
  p.inkRing(E, 10, 1, 0.4);
  // ropes from the envelope tail to the capsule ring
  for (const k of [-1, 0, 1]) p.stroke([[0, -165], [k * 52, 40]], 4, "#5a6178");
  p.poly([[-60, 40], [60, 40], [60, 52], [-60, 52]], "#8a90a0", 6);
  // capsule: dome top, wide base, round window, small door
  const C: [number, number][] = [];
  for (let k = 0; k <= 16; k++) { const a = Math.PI + (k / 16) * Math.PI; C.push([82 * Math.cos(a), 120 + 70 * Math.sin(a)]); }
  C.push([92, 200], [-92, 200]);
  p.gradFill(C, "#f4f1ea", "#c9ccd6", -Math.PI * 0.75, 0.4); p.inkRing(C, 8, 1, 0.4);
  p.ell(0, 112, 26, 26, "#2c3554", 6);
  p.poly([[-22, 150], [22, 150], [22, 196], [-22, 196]], "#8a90a0", 5);
  g.restore();
};
/** a mini Skala on the screen canvas (the jumper): design space 1000 x 1000, centred on (x, y) */
const miniSkala = (g: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, calm: boolean) => {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.translate(-500, -560);
  drawSkala(new Pen(g), { v: "skala", expr: calm ? "happy" : "excited", arms: calm ? "up" : "cheer", blink: 0 });
  g.restore();
};
// ---------------- wordless HUD: every label is a drawn icon (numbers stay) ----------------
type IconFn = (g: CanvasRenderingContext2D, x: number, y: number) => void;
const ink = (g: CanvasRenderingContext2D, w = 8) => { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };
const hud = (g: CanvasRenderingContext2D, icon: IconFn, value: string, x: number, y: number, align: "left" | "right" | "center", hot = 0, scale = 1) => {
  if (scale !== 1) { g.save(); g.translate(x, y); g.scale(scale, scale); hud(g, icon, value, 0, 0, align, hot, 1); g.restore(); return; }
  g.font = "900 78px sans-serif";
  const w = Math.max(470, 145 + g.measureText(value).width + 40); // grows to fit its text
  const x0 = align === "left" ? x : align === "right" ? x - w : x - w / 2; // center: grows evenly, stays in the safe zone
  g.fillStyle = "rgba(10,14,30,0.72)"; rr(g, x0, y, w, 150, 26); g.fill();
  icon(g, x0 + 75, y + 75);
  text(g, value, x0 + 145, y + 78, 78, hot > 0 ? mixHex("#ffffff", "#ffd23f", hot) : "#ffffff", 900, "left");
};
/** altitude: a ruler with a little balloon climbing it (u 0..1) */
const iconAlt = (u: number): IconFn => (g, x, y) => {
  g.fillStyle = "#e8eef9"; rr(g, x - 14, y - 58, 28, 116, 12); g.fill(); ink(g, 6);
  g.strokeStyle = "#7a86a3"; g.lineWidth = 4; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x - 8, y - 40 + k * 20); g.lineTo(x + 8, y - 40 + k * 20); g.stroke(); }
  const by = y + 44 - 88 * u;
  g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(x + 34, by - 12, 16, 20, 0, 0, Math.PI * 2); g.fill(); ink(g, 5);
  g.fillStyle = "#f4f1ea"; g.fillRect(x + 28, by + 12, 12, 10); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(x + 28, by + 12, 12, 10);
};
/** stopwatch with a sweeping hand */
const iconWatch = (frac: number): IconFn => (g, x, y) => {
  g.fillStyle = "#c9cfdb"; rr(g, x - 12, y - 64, 24, 16, 5); g.fill(); ink(g, 5);
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y + 6, 48, 0, Math.PI * 2); g.fill(); ink(g, 8);
  const a = -Math.PI / 2 + frac * Math.PI * 2;
  g.strokeStyle = "#e2453c"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y + 6); g.lineTo(x + 36 * Math.cos(a), y + 6 + 36 * Math.sin(a)); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(x, y + 6, 7, 0, Math.PI * 2); g.fill();
};
/** speedometer: needle swings from left to the red zone (frac 0..1) */
const iconSpeed = (frac: number): IconFn => (g, x, y) => {
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y + 22, 56, Math.PI, 0); g.closePath(); g.fill(); ink(g, 8);
  g.strokeStyle = "#e2453c"; g.lineWidth = 12; g.lineCap = "butt"; g.beginPath(); g.arc(x, y + 22, 44, -0.45, 0); g.stroke();
  const a = Math.PI + frac * Math.PI * 0.96;
  g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y + 22); g.lineTo(x + 46 * Math.cos(a), y + 22 + 46 * Math.sin(a)); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(x, y + 22, 8, 0, Math.PI * 2); g.fill();
};
/** on-air badge: the familiar red "LIVE" pill with a pulsing dot */
const live = (g: CanvasRenderingContext2D, f: number) => {
  g.fillStyle = "#e2453c"; rr(g, 60, 50, 190, 74, 18); g.fill();
  g.fillStyle = Math.floor(f / 15) % 2 ? "#ffffff" : "#ffb3ad"; g.beginPath(); g.arc(102, 87, 14, 0, Math.PI * 2); g.fill();
  text(g, "LIVE", 182, 89, 46, "#ffffff", 900);
};
/** an eye (the "watching" icon) */
const iconEye: IconFn = (g, x, y) => {
  g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(x - 60, y); g.quadraticCurveTo(x, y - 52, x + 60, y); g.quadraticCurveTo(x, y + 52, x - 60, y); g.closePath(); g.fill(); ink(g, 8);
  g.fillStyle = "#3b6fd6"; g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
};
/** the audience: rows of tiny mini-Skala hoods filling up with the count (0..1) */
const crowd = (g: CanvasRenderingContext2D, x0: number, y0: number, w: number, frac: number, f: number) => {
  const cols = 12, rows = 3, n = Math.round(cols * rows * frac), cw = w / cols;
  const pal = ["#ff9424", "#5aa2ff", "#4fd08a", "#b48cff", "#3fd0cf"];
  for (let k = 0; k < n; k++) {
    const c = k % cols, r = Math.floor(k / cols), x = x0 + cw * (c + 0.5) + (r % 2 ? cw / 2 : 0) * 0.5, y = y0 + r * 52 + 4 * Math.sin(f * 0.3 + k);
    g.fillStyle = pal[(k * 7) % 5];
    g.beginPath(); g.rect(x - 9, y - 20, 18, 40); g.rect(x - 20, y - 8, 40, 16); g.fill();
    g.fillStyle = "#fff7ef"; g.beginPath(); g.arc(x, y + 6, 9, 0, Math.PI * 2); g.fill();
  }
};
/** gold trophy (the record) */
const trophy = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  const p = new Pen(g); g.save(); g.translate(x, y); g.scale(s, s);
  for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * 62, -40, 26, 34, 0, 0, Math.PI * 2); g.lineWidth = 14; g.strokeStyle = INK; g.stroke(); g.lineWidth = 7; g.strokeStyle = "#ffd23f"; g.stroke(); }
  const cup: [number, number][] = []; for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI; cup.push([-62 * Math.cos(a) * -1, -86 + 96 * Math.sin(a)]); }
  cup.push([-62, -86]);
  p.gradFill(cup, "#ffe066", "#e09a12", -Math.PI * 0.75, 0.35); p.inkRing(cup, 9, 1, 0.4);
  p.poly([[-14, 10], [14, 10], [20, 46], [-20, 46]], "#f0b42a", 7); p.poly([[-46, 46], [46, 46], [46, 70], [-46, 70]], "#8a5a2b", 7);
  const st: [number, number][] = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 9 : 22; st.push([r * Math.cos(a), -46 + r * Math.sin(a)]); }
  p.poly(st, "#fff7c2", 4);
  g.restore();
};
/** a TV playing a generic ad (gift box + progress bar), no words */
const tvAd = (g: CanvasRenderingContext2D, f: number) => {
  const p = new Pen(g);
  g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(-40, -230); g.lineTo(-90, -300); g.moveTo(40, -230); g.lineTo(90, -300); g.stroke();
  g.fillStyle = "#3a4050"; rr(g, -330, -230, 660, 430, 40); g.fill(); ink(g, 10);
  g.fillStyle = "#ffd9a0"; rr(g, -290, -195, 580, 330, 20); g.fill();
  p.poly([[-70, -110], [70, -110], [70, 30], [-70, 30]], "#e2453c", 8); p.poly([[-84, -140], [84, -140], [84, -100], [-84, -100]], "#ff7a6e", 8);
  g.fillStyle = "#ffd23f"; g.fillRect(-12, -140, 24, 170);
  g.fillStyle = "rgba(0,0,0,0.25)"; rr(g, -270, 100, 540, 18, 9); g.fill();
  g.fillStyle = "#e2453c"; rr(g, -270, 100, 540 * (0.2 + 0.3 * ((f % 60) / 60)), 18, 9); g.fill();
  g.fillStyle = "#c9cfdb"; g.beginPath(); g.arc(250, -150, 26, 0, Math.PI * 2); g.fill(); ink(g, 5);
  g.fillStyle = INK; g.beginPath(); g.moveTo(242, -164); g.lineTo(262, -150); g.lineTo(242, -136); g.closePath(); g.fill();
};

export const drawScreen = (g: CanvasRenderingContext2D, f: number) => {
  g.fillStyle = "#18223a"; g.fillRect(0, 0, W, H);
  if (f < EV.tgl) { g.fillStyle = "#ff8a24"; g.fillRect(964, 376, 120, 400); g.fillRect(824, 516, 400, 120); return; }
  if (f < EV.redbull) { // date card
    const k = easeOut((f - EV.tgl) / 10);
    live(g, f);
    g.save(); g.globalAlpha = k;
    if (canImg?.complete) g.drawImage(canImg, CX - 600, 270, 640 * CAN_ASPECT, 640); // the real can, left of the title
    text(g, "Red Bull Stratos", CX + 150, 420, 84, "#ffffff", 800);
    text(g, "14.10.2012", CX + 150, 570, 140 * (0.85 + 0.15 * k));
    text(g, "Roswell, New Mexico", CX + 150, 710, 54, "#9fb6e6", 700); g.restore();
    return;
  }
  if (f < EV.dibawah) { // ascent
    const a = alt(f), u = a / 39;
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mixHex("#5fa8ef", "#05070f", u * 1.2)); sky.addColorStop(1, mixHex("#bfe2ff", "#123a7a", u));
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    stars(g, clamp01((a - 22) / 10));
    if (a > 14) earth(g, H - 40 - 140 * clamp01((a - 14) / 25), 2600 + 1200 * (1 - u));
    const groundY = 900 + a * 120; // the desert drops away
    if (groundY < H) { g.fillStyle = "#d9b27a"; g.fillRect(0, groundY, W, H - groundY); g.fillStyle = "#b98b55"; g.fillRect(0, groundY, W, 10); }
    { const bs = 0.78 - 0.28 * u; balloon(g, CX, 270 + 790 * bs + 6 * Math.sin(f * 0.08), bs); }
    hud(g, iconAlt(u), `${a.toFixed(1).replace(".", ",")} km`, CX - 235, 70, "left", f >= EV.km39 - 2 ? clamp01(1 - (f - EV.km39) / 20) : 0);
    live(g, f);
    return;
  }
  if (f < EV.jatuh) { // view from the capsule door, then the step off
    g.fillStyle = "#04060d"; g.fillRect(0, 0, W, H); stars(g, 1);
    earth(g, 560 - 0.25 * (f - EV.dibawah), 3000);
    g.strokeStyle = "#2a2f3d"; g.lineWidth = 120; rr(g, 60, 40, W - 120, H - 80, 120); g.stroke(); // door frame
    g.strokeStyle = INK; g.lineWidth = 10; rr(g, 120, 100, W - 240, H - 200, 90); g.stroke();
    // the view alone: curved Earth + black sky (no figure here; the mini Skala appears in the freefall)
    return;
  }
  // freefall / broadcast (from "jatuh" to the end)
  const parachute = f >= EV.semua - 4;
  g.fillStyle = "#04060d"; g.fillRect(0, 0, W, H); stars(g, parachute ? 0.2 : 1);
  if (parachute) {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#5fa8ef"); sky.addColorStop(1, "#d8ecff");
    g.fillStyle = sky; g.fillRect(0, 0, W, H); g.fillStyle = "#d9b27a"; g.fillRect(0, 980, W, 172);
  } else earth(g, 640 - 0.5 * (f - EV.jatuh) * 0.4, 2400);
  const fallX = CX - 60, fallY = 560 + (parachute ? 80 * smooth((f - EV.semua) / 40) : 0);
  if (!parachute) { // speed lines
    g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 5;
    for (let i = 0; i < 26; i++) { const x = hash(i + 50) * W, y = ((hash(i + 80) * H) - (f * 38) % H + H) % H; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 90 + 80 * hash(i)); g.stroke(); }
  }
  if (parachute) { // canopy
    const k = easeOut((f - EV.semua + 4) / 10), p = new Pen(g);
    const can: [number, number][] = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; can.push([fallX + 260 * k * Math.cos(a), fallY - 230 + 150 * k * Math.sin(a)]); }
    can.push([fallX + 260 * k, fallY - 230]);
    p.gradFill(can, "#ff9424", "#e8321f", -Math.PI * 0.75, 0.35); p.inkRing(can, 10, 1, 0.4);
    for (const s of [-1, -0.4, 0.4, 1]) p.stroke([[fallX + 250 * k * s, fallY - 230], [fallX + 60 * s, fallY - 90]], 4, "#5a6178");
  }
  miniSkala(g, fallX, fallY + 10 * Math.sin(f * 0.3), 0.26, parachute ? 0 : 0.25 * Math.sin(f * 0.07), parachute);
  // sonic boom ring
  if (f >= EV.suara - 2 && f < EV.suara + 30) {
    const u = (f - EV.suara + 2) / 32;
    g.strokeStyle = `rgba(255,255,255,${1 - u})`; g.lineWidth = 30 * (1 - u) + 4;
    g.beginPath(); g.ellipse(fallX, fallY, 120 + 900 * u, 60 + 450 * u, 0, 0, Math.PI * 2); g.stroke();
  }
  live(g, f);
  // HUD: freefall timer and speed (until the broadcast panel takes over)
  const sec = 259 * smooth((f - EV.jatuh) / (EV.jam - EV.jatuh));
  const kmh = 1357 * smooth((f - EV.kecepatan) / (EV.speed + 40 - EV.kecepatan));
  if (f < EV.dan) {
    hud(g, iconWatch((sec % 60) / 60), `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`, CX - 235, 60, "left");
    hud(g, iconSpeed(kmh / 1357), `${fmt(kmh)} km/jam`, CX, H - 330, "center", f >= EV.suara - 2 ? clamp01(1 - (f - EV.suara) / 30) : f >= EV.speed + 38 ? clamp01(1 - (f - EV.speed - 38) / 20) : 0, 0.78);
  } else {
    // viewers panel + floating hearts
    const v = 8_000_000 * smooth((f - EV.dan - 4) / (EV.juta + 14 - EV.dan));
    g.fillStyle = "rgba(255,255,255,0.96)"; rr(g, CX - 300, 60, 600, 170, 34); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    iconEye(g, CX - 205, 145);
    text(g, f >= EV.juta + 14 ? "8.000.000+" : fmt(v), CX - 120, 148, 88, "#241726", 900, "left");
    g.fillStyle = "rgba(10,14,30,0.55)"; rr(g, CX - 300, 250, 600, 170, 30); g.fill();
    crowd(g, CX - 290, 290, 580, Math.min(1, v / 8_000_000), f);
    if (f >= EV.rekor - 2 && f < EV.rb2) {
      const k = easeOut((f - EV.rekor + 2) / 8);
      for (let q = 0; q < 8; q++) { const a = (q / 8) * Math.PI * 2 + f * 0.02; g.strokeStyle = "rgba(255,226,120,0.8)"; g.lineWidth = 8; g.beginPath(); g.moveTo(CX + 330 + 90 * k * Math.cos(a), 170 + 90 * k * Math.sin(a)); g.lineTo(CX + 330 + 130 * k * Math.cos(a), 170 + 130 * k * Math.sin(a)); g.stroke(); }
      trophy(g, CX + 330, 190, 0.9 * k);
    }
    for (let i = 0; i < 12; i++) {
      const u = ((f - EV.dan) * 0.012 + i * 0.083) % 1, x = CX + 280 + 60 * Math.sin(i * 2.1 + u * 6), y = H - 60 - u * 560;
      g.globalAlpha = 1 - u; g.fillStyle = ["#ff5d7a", "#ffd23f", "#5aa2ff"][i % 3]; g.beginPath();
      g.moveTo(x, y + 18); g.bezierCurveTo(x - 40, y - 10, x - 18, y - 40, x, y - 18); g.bezierCurveTo(x + 18, y - 40, x + 40, y - 10, x, y + 18); g.fill(); g.globalAlpha = 1;
    }
  }
  // "ga bikin iklan": a TV-ad card, crossed out on "iklan"
  if (f >= EV.rb2 && f < EV.momen) {
    const k = easeOut((f - EV.rb2) / 8);
    g.save(); g.translate(CX, 600); g.scale(k * 0.8, k * 0.8);
    tvAd(g, f);
    const x = clamp01((f - EV.iklan + 2) / 10);
    if (x > 0) { g.strokeStyle = "#e2453c"; g.lineWidth = 34; g.lineCap = "round"; g.beginPath(); g.moveTo(-260, -160); g.lineTo(-260 + 520 * x, -160 + 320 * x); g.stroke(); if (x > 0.5) { const y = (x - 0.5) * 2; g.beginPath(); g.moveTo(260, -160); g.lineTo(260 - 520 * y, -160 + 320 * y); g.stroke(); } }
    g.restore();
  }
};
// ---------------- the space set for the hook (shots 1-2): stars, a cartoon Earth, the capsule step ----------------
export const SPACE: [number, number, number] = [0, 300, 0];
const earthTex = () => {
  const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 1024;
  const g = cv.getContext("2d")!;
  const sea = g.createLinearGradient(0, 0, 0, 1024); sea.addColorStop(0, "#1a4fa8"); sea.addColorStop(0.5, "#2a68c4"); sea.addColorStop(1, "#1a4fa8");
  g.fillStyle = sea; g.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < 5; i++) { g.fillStyle = "#4f9a58"; g.beginPath(); g.ellipse(200 + 400 * i + 80 * hash(i + 400), 250 + 500 * hash(i + 500), 40 + 50 * hash(i + 600), 18 + 22 * hash(i + 700), hash(i) * 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 160; i++) { g.beginPath(); g.ellipse(hash(i + 800) * 2048, hash(i + 900) * 1024, 30 + 110 * hash(i + 1000), 6 + 14 * hash(i + 1100), 0.3 * (hash(i + 1200) - 0.5), 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const starTex = () => {
  const cv = document.createElement("canvas"); cv.width = 4096; cv.height = 2048;
  const g = cv.getContext("2d")!; g.fillStyle = "#03050c"; g.fillRect(0, 0, 4096, 2048);
  for (let i = 0; i < 1400; i++) { const r = 1.5 + 3.5 * hash(i + 3000) ** 3; g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * hash(i + 4000)})`; g.beginPath(); g.arc(hash(i + 1200) * 4096, hash(i + 2200) * 2048, r, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};
export const buildProps = (kit: PropKit) => {
  const space = new THREE.Group(); kit.root.add(space);
  const [sx, sy, sz] = SPACE;
  const stars = new THREE.Mesh(new THREE.SphereGeometry(850, 48, 24), new THREE.MeshBasicMaterial({ map: starTex(), side: THREE.BackSide, fog: false, depthWrite: false }));
  stars.position.set(sx, sy, sz); stars.layers.set(NOINK); stars.renderOrder = -0.5; space.add(stars);
  const R = 2000, ec = new THREE.Vector3(sx, sy - R - 150, sz - 200);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 64), new THREE.MeshBasicMaterial({ map: earthTex(), fog: false, color: new THREE.Color(0.85, 0.85, 0.95) }));
  earth.position.copy(ec); earth.rotation.x = Math.PI / 2; space.add(earth);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R + 22, 128, 64), new THREE.MeshBasicMaterial({ color: "#6fb6ff", transparent: true, opacity: 0.1, fog: false, depthWrite: false }));
  atmo.position.copy(ec); atmo.layers.set(NOINK); space.add(atmo);
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1.4, 40, 24), lam("capsuleHull", () => ({ color: "#e3e6ec" })));
  hull.scale.set(1.15, 1.1, 1.0); hull.position.set(sx - 2.75, sy + 1.3, sz - 1.4); hull.castShadow = true; hull.receiveShadow = true; space.add(hull);
  const door = kit.box([sx - 1.75, sy, sz - 1.0], [sx - 1.3, sy + 1.95, sz - 0.2], "#2c303c"); space.add(door);
  const step = kit.box([sx - 1.6, sy - 0.18, sz - 0.6], [sx + 0.55, sy, sz + 0.4], "#8a90a0"); space.add(step);
  const rail = kit.box([sx - 1.6, sy - 0.24, sz + 0.36], [sx + 0.55, sy - 0.16, sz + 0.46], "#5a6178"); space.add(rail);
  return (_f: number, id: number) => {
    const inSpace = id <= 2;
    space.visible = inSpace; kit.office.visible = !inSpace;
  };
};
