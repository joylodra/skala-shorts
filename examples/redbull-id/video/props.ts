// Red Bull Stratos wall display: the jump as a live broadcast. No real logos and no likeness of the jumper
// (a tiny white-suited figure). States follow the voice (events.json).
import * as THREE from "three";
import { Pen, INK } from "../skala/toon";
import { drawSkala } from "../skala/skala";
import { lam } from "../skala/build";
import { NOINK } from "../skala/ink";
import { clamp01, easeOut, smooth } from "../skala/camera";
import type { PropKit } from "../skala/kit";
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
const hud = (g: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, align: "left" | "right", hot = 0) => {
  const w = 470, x0 = align === "left" ? x : x - w;
  g.fillStyle = "rgba(10,14,30,0.72)"; rr(g, x0, y, w, 150, 26); g.fill();
  text(g, label, x0 + 30, y + 40, 38, "#9fb6e6", 700, "left");
  text(g, value, x0 + 30, y + 100, 78, hot > 0 ? mixHex("#ffffff", "#ffd23f", hot) : "#ffffff", 900, "left");
};
const live = (g: CanvasRenderingContext2D, f: number) => {
  g.fillStyle = "#e2453c"; rr(g, 60, 50, 180, 70, 16); g.fill();
  g.fillStyle = Math.floor(f / 15) % 2 ? "#ffffff" : "#ffb3ad"; g.beginPath(); g.arc(100, 85, 13, 0, Math.PI * 2); g.fill();
  text(g, "LIVE", 175, 87, 44, "#ffffff", 900);
};

export const drawScreen = (g: CanvasRenderingContext2D, f: number) => {
  g.fillStyle = "#18223a"; g.fillRect(0, 0, W, H);
  if (f < EV.tgl) { g.fillStyle = "#ff8a24"; g.fillRect(964, 376, 120, 400); g.fillRect(824, 516, 400, 120); return; }
  if (f < EV.redbull) { // date card
    const k = easeOut((f - EV.tgl) / 10);
    live(g, f);
    g.save(); g.globalAlpha = k; text(g, "14.10.2012", CX, 520, 210 * (0.85 + 0.15 * k)); text(g, "Roswell, New Mexico", CX, 700, 70, "#9fb6e6", 700); g.restore();
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
    hud(g, "KETINGGIAN", `${a.toFixed(1).replace(".", ",")} km`, CX - 235, 70, "left", f >= EV.km39 - 2 ? clamp01(1 - (f - EV.km39) / 20) : 0);
    live(g, f);
    return;
  }
  if (f < EV.jatuh) { // view from the capsule door, then the step off
    g.fillStyle = "#04060d"; g.fillRect(0, 0, W, H); stars(g, 1);
    earth(g, 560 - 0.25 * (f - EV.dibawah), 3000);
    g.strokeStyle = "#2a2f3d"; g.lineWidth = 120; rr(g, 60, 40, W - 120, H - 80, 120); g.stroke(); // door frame
    g.strokeStyle = INK; g.lineWidth = 10; rr(g, 120, 100, W - 240, H - 200, 90); g.stroke();
    if (f >= EV.lalu - 4) {
      g.fillStyle = "#3a4050"; rr(g, CX - 220, H - 210, 440, 60, 14); g.fill(); // the step
      const drop = f >= EV.lompat2 - 2 ? clamp01((f - EV.lompat2 + 2) / 16) : 0;
      miniSkala(g, CX, H - 330 + 520 * drop * drop, 0.32 * (1 - 0.6 * drop), 0.6 * drop, false);
    }
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
    hud(g, "JATUH BEBAS", `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`, CX - 235, 60, "left");
    hud(g, "KECEPATAN", `${fmt(kmh)} km/jam`, CX - 235, H - 260, "left", f >= EV.suara - 2 ? clamp01(1 - (f - EV.suara) / 30) : f >= EV.speed + 38 ? clamp01(1 - (f - EV.speed - 38) / 20) : 0);
  } else {
    // viewers panel + floating hearts
    const v = 8_000_000 * smooth((f - EV.dan - 4) / (EV.juta + 14 - EV.dan));
    g.fillStyle = "rgba(255,255,255,0.96)"; rr(g, CX - 290, 60, 580, 250, 34); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    text(g, "PENONTON LIVE", CX, 120, 40, "#5a6178", 800);
    text(g, f >= EV.juta + 14 ? "8.000.000+" : fmt(v), CX, 220, 96, "#241726", 900);
    if (f >= EV.rekor - 2 && f < EV.rb2) { const k = easeOut((f - EV.rekor + 2) / 8); g.save(); g.translate(CX + 200, 360); g.rotate(-0.08); g.scale(k, k); g.fillStyle = "#ffd23f"; rr(g, -170, -55, 340, 110, 24); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); text(g, "REKOR!", 0, 4, 70, "#241726", 900); g.restore(); }
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
    g.fillStyle = "#f4f1ea"; rr(g, -330, -200, 660, 400, 30); g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
    text(g, "IKLAN", 0, -40, 120, "#241726", 900); g.fillStyle = "#c9cfdb"; rr(g, 120, 100, 180, 60, 14); g.fill(); text(g, "Skip ▸", 210, 132, 36, "#5a6178", 800);
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
