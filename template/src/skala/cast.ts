// Skala + the mini-Skala team as lit flat cards (cardShade), effects as unlit cards. Canvas pool / Actor / Fx are the
// bridge short's (templates/bridge/cast.ts); the staging below is this short's own.
import * as THREE from "three";
import { Pen, fxContact } from "./toon";
import { drawSkala, SkalaOpts, Variant, Expr, Arms, Prop, fxRing } from "./skala";
import { FPS, clamp01, smooth, easeOut } from "./camera";
import { staging } from "../video/staging";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SK = 0.0023; // metres per design unit: Skala is ~1.88 m to the hood top
const BODY = (() => { const g = new THREE.PlaneGeometry(1000 * SK, 1000 * SK); g.translate(0, (940 - 500) * SK, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(BODY, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 2; }
  }
}

// ---------------- placements ----------------
export type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale?: number; sx?: number; sy?: number; roll?: number; size: [number, number, number] };
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const q = (v: number, n = 120) => Math.round(v * n) / n;
const tier = (d: number): [number, number, number] => (d < 3.2 ? [2000, 2000, 2] : d < 6.5 ? [1200, 1200, 1.2] : d < 16 ? [600, 600, 0.6] : [300, 300, 0.3]);
const tmp = new THREE.Vector3();

/** blinks: gaps 0.5-2.3 s, 4-frame half / shut / shut / half */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f0: number, i: number) => {
  const f = Math.round(f0);
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};

/** one Skala on stage. Spread a brand pose (`...brandPose("skala-teach-explain")`) or a motion (`...walkPose(t)`) into it.
 *  hop = metres off the floor; sx/sy = squash-stretch (from motions); legs = foot lift -1..1; facing -1 mirrors. */
export type Who = { i: number; v: Variant; x: number; z: number; expr: Expr; arms?: Arms; prop?: Prop; look?: number; hop?: number; tilt?: number;
  talk?: boolean | number; scale?: number; legs?: number; facing?: 1 | -1; text?: string; sx?: number; sy?: number };
export const skala = (cam: CamInfo, f: number, w: Who, out: Stage) => {
  const sc = w.scale ?? 1, y = w.hop ?? 0;
  const d = cam.pos.distanceTo(tmp.set(w.x, y + 1.0 * sc, w.z)) / sc;
  const [cw, ch, k] = tier(d);
  // talking mouth flaps at ~5 Hz while the voice runs (presenter beats only)
  const talk = w.talk ? (Math.sin(f * 1.05 + w.i) > 0.1 ? 1 : 0) : 0;
  const q2 = (v: number | undefined) => (v === undefined ? undefined : Math.round(v * 20) / 20);
  const o: SkalaOpts = { v: w.v, expr: w.expr, arms: w.arms, prop: w.prop, look: q2(w.look), tilt: q2(w.tilt), talk,
    blink: w.expr === "happy" || w.expr === "grin" ? 0 : lidAt(f, w.i), legs: q2(w.legs) ?? 0, facing: w.facing, text: w.text };
  const key = `sk|${JSON.stringify(o)}`;
  out.places.push({ key, draw: (p) => drawSkala(p, o), x: w.x, y, z: w.z, scale: sc, sx: w.sx, sy: w.sy, size: [cw, ch, k] });
  // tight contact shadow under the feet (bright floor, multiply)
  const cc = "#a8a3b8";
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: w.x, y: 0.012, z: w.z + 0.02,
    w: 1.15 * sc * (1 - 0.3 * clamp01(y / 0.3)), h: 0.55 * sc, flat: true });
};

export const ringFx = (f: number, x: number, y: number, z: number, i: number, out: Stage) => {
  const u = q(((f + i * 7) % 14) / 14, 14);
  out.fx.push({ key: `ring${u}`, cw: 300, ch: 300, draw: (p) => fxRing(p, u), x, y, z, w: 0.55, h: 0.55, rot: (hh(i) - 0.5) * 0.4 });
};
/** 0..1 pop-in / pop-out scale for an effect card shown from frame a to b */
export const pop = (f: number, a: number, b: number) => (f < a || f >= b ? 0 : Math.min(1, easeOut((f - a) / 6) * 1.15 - 0.15 * smooth((f - a - 6) / 6)) * (f > b - 6 ? (b - f) / 6 : 1));

// ---------------- the video's staging ----------------
/** API handed to video/staging.ts: add a Skala, push an effect card, helpers */
export type StageAPI = { f: number; cam: CamInfo; out: Stage; add: (w: Who) => void; fx: (p: FxPlace) => void };
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  staging(id, f, { f, cam, out, add: (w) => skala(cam, f, w, out), fx: (p) => out.fx.push(p) });
  return out;
};
