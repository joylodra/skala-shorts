// The standard Skala office as one three.js scene (engine): a simple minimalist room (soft teal back wall with two big
// windows over a city skyline, a wall display, white standing desks, plants), the video's own props (video/props.ts) and
// the cast (video/staging.ts). update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "./build";
import { ctex, rng } from "./paint";
import { Pen, INK } from "./toon";
import { LIGHTS, LOOK } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, V3 } from "./camera";
import { SCREEN, SCREEN_W, SCREEN_H, MYDESK, DESK_H, DESKS, ROOM } from "./room";
import { DynTex, makeKit } from "./kit";
import { SHOTS, camAt } from "../video/story";
import { drawScreen, buildProps } from "../video/props";

const q = (v: number, n = 60) => Math.round(v * n) / n;

// ---------------- static textures ----------------
const floorTex = () => ctex("officeFloor", 1024, 1024, (g, r) => {
  const cols = ["#dcc19a", "#d6b990", "#e1c8a3", "#d2b58b"];
  for (let row = 0; row < 8; row++) {
    let x = -r() * 300;
    while (x < 1024) {
      const w = 260 + r() * 220;
      g.fillStyle = cols[Math.floor(r() * 4)]; g.fillRect(x, row * 128, w, 128);
      g.fillStyle = "rgba(90,60,40,0.35)"; g.fillRect(x, row * 128, 3, 128);
      x += w;
    }
    g.fillStyle = "rgba(90,60,40,0.4)"; g.fillRect(0, row * 128, 1024, 3);
  }
});
const boardTex = () => ctex("whiteboard", 1024, 512, (g) => {
  g.fillStyle = "#fbfbf8"; g.fillRect(0, 0, 1024, 512);
  g.lineCap = "round"; g.lineJoin = "round";
  const pen = (c: string, pts: [number, number][], w = 9) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
  pen("#3b6fd6", [[90, 380], [200, 300], [300, 330], [420, 200], [520, 240], [640, 120]]);
  pen("#3b6fd6", [[620, 112], [646, 118], [636, 142]]);
  pen("#e2453c", [[720, 120], [900, 120]]); pen("#e2453c", [[720, 180], [860, 180]]); pen("#e2453c", [[720, 240], [930, 240]]);
  pen("#2f9a5c", [[760, 330], [790, 360], [850, 290]], 11);
  pen("#241726", [[80, 440], [940, 440]], 4); pen("#241726", [[80, 440], [80, 80]], 4);
});
const clockTex = () => ctex("clock", 256, 256, (g) => {
  g.fillStyle = "#fbfaf6"; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#241726"; g.lineCap = "round";
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; g.lineWidth = 8; g.beginPath(); g.moveTo(128 + 95 * Math.cos(a), 128 + 95 * Math.sin(a)); g.lineTo(128 + 108 * Math.cos(a), 128 + 108 * Math.sin(a)); g.stroke(); }
  g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 62); g.stroke();
  g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(184, 150); g.stroke();
});
const monitorTex = () => ctex("monitorUI", 256, 160, (g) => {
  g.fillStyle = "#cfe8ff"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#3b6fd6"; g.fillRect(0, 0, 256, 22);
  for (let k = 0; k < 4; k++) { g.fillStyle = ["#ff9424", "#4fd08a", "#b48cff", "#5aa2ff"][k]; g.fillRect(24 + k * 56, 120 - k * 22 - 20, 36, 30 + k * 22); }
});

// ---------------- room layout ----------------
const RX = ROOM.halfWidth, BZ = ROOM.backZ, WALL_H = ROOM.wallH;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private screen = new DynTex(2048, 1152);
  private props: (f: number, id: number) => void;
  private sunCache = new Map<number, THREE.Vector3>();

  constructor() {
    const R = this.root;
    // ---- sky (5 stops by elevation, tone-map-inverted), lights ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);

    // ---- materials ----
    const M = {
      floor: lam("oFloor", () => ({ map: floorTex() })),
      back: lam("oBack", () => ({ color: "#9cc5c8" })),
      side: lam("oSide", () => ({ color: "#f0ebe2" })),
      trim: lam("oTrim", () => ({ color: "#fbfaf6" })),
      deskTop: lam("oDeskTop", () => ({ color: "#f7f5f0" })),
      deskLeg: lam("oDeskLeg", () => ({ color: "#454b5c" })),
      dark: lam("oDark", () => ({ color: "#2c303c" })),
      pot: lam("oPot", () => ({ color: "#e08a5c" })),
      leaf: lam("oLeaf", () => ({ color: "#55b06a" })),
      leaf2: lam("oLeaf2", () => ({ color: "#3f9a58" })),
      mug: lam("oMug", () => ({ color: "#ffd23f" })),
      rug: lam("oRug", () => ({ color: "#e6dccd" })),
      shelf: lam("oShelf", () => ({ color: "#c99a6b" })),
      book: [lam("oB1", () => ({ color: "#5aa2ff" })), lam("oB2", () => ({ color: "#ff9424" })), lam("oB3", () => ({ color: "#4fd08a" })), lam("oB4", () => ({ color: "#f3efe6" }))],
      bldg: [lam("oG1", () => ({ color: "#c8d4e6" })), lam("oG2", () => ({ color: "#aebfd8" })), lam("oG3", () => ({ color: "#dccfc0" })), lam("oG4", () => ({ color: "#b7c9c2" }))],
      ground: lam("oGround", () => ({ color: "#9fb0a2" })),
    };
    const b = new Batch();
    // floor + soft rug in the aisle
    const fl = new THREE.PlaneGeometry(2 * RX, 16, 1, 1); fl.rotateX(-Math.PI / 2); fl.translate(0, 0, 2);
    const uv = fl.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 4);
    b.add(fl, M.floor);
    // back wall with two window openings and the display in the middle
    const z0 = BZ - 0.2, z1 = BZ;
    b.add(boxGeo(V(-RX, 0, z0), V(RX, 0.9, z1)), M.back);
    b.add(boxGeo(V(-RX, 3.1, z0), V(RX, WALL_H, z1)), M.back);
    for (const [xa, xb] of [[-RX, -7.4], [-3.2, 3.2], [7.4, RX]]) b.add(boxGeo(V(xa, 0.9, z0), V(xb, 3.1, z1)), M.back);
    b.add(boxGeo(V(-RX, 0, z1), V(RX, 0.12, z1 + 0.03)), M.trim); // skirting
    for (const s of [-1, 1]) {
      const xa = s < 0 ? -7.4 : 3.2, xb = s < 0 ? -3.2 : 7.4;
      b.add(boxGeo(V(xa - 0.05, 0.82, z1), V(xb + 0.05, 0.9, z1 + 0.18)), M.trim); // sill
      for (const x of [xa, xb, (xa + xb) / 2]) b.add(boxGeo(V(x - 0.05, 0.9, z0 - 0.02), V(x + 0.05, 3.1, z1 + 0.02)), M.trim); // mullions
      b.add(boxGeo(V(xa, 3.05, z0 - 0.02), V(xb, 3.12, z1 + 0.02)), M.trim);
      b.add(boxGeo(V(xa, 2.15, z0 - 0.02), V(xb, 2.21, z1 + 0.02)), M.trim); // transom
    }
    // display bezel
    b.add(boxGeo(V(SCREEN[0] - SCREEN_W / 2 - 0.08, SCREEN[1] - SCREEN_H / 2 - 0.08, z1), V(SCREEN[0] + SCREEN_W / 2 + 0.08, SCREEN[1] + SCREEN_H / 2 + 0.08, z1 + 0.06)), M.dark);
    // side walls
    b.add(boxGeo(V(-RX - 0.2, 0, BZ - 0.2), V(-RX, WALL_H, 10)), M.side);
    b.add(boxGeo(V(RX, 0, BZ - 0.2), V(RX + 0.2, WALL_H, 10)), M.side);
    // whiteboard (right wall), shelf + clock (left wall)
    b.add(boxGeo(V(RX - 0.05, 1.0, -3.8), V(RX, 2.3, -1.2)), M.trim);
    b.add(boxGeo(V(-RX, 1.55, -3.6), V(-RX + 0.32, 1.6, -1.4)), M.shelf);
    for (let k = 0; k < 9; k++) {
      const z = -3.5 + k * 0.2 + (k > 5 ? 0.25 : 0), h = 0.26 + ((k * 37) % 5) * 0.03;
      b.add(boxGeo(V(-RX + 0.04, 1.6, z), V(-RX + 0.28, 1.6 + h, z + 0.15)), M.book[k % 4]);
    }
    // desks (standing desks, white tops, dark frames), monitors, phones, mugs
    DESKS.forEach(([x, z], i) => {
      b.add(boxGeo(V(x - 0.8, DESK_H - 0.05, z - 0.4), V(x + 0.8, DESK_H, z + 0.4)), M.deskTop);
      for (const s of [-1, 1]) b.add(boxGeo(V(x + s * 0.72 - 0.03, 0, z - 0.32), V(x + s * 0.72 + 0.03, DESK_H - 0.05, z + 0.32)), M.deskLeg);
      b.add(boxGeo(V(x - 0.72, 0.3, z - 0.02), V(x + 0.72, 0.34, z + 0.02)), M.deskLeg);
      const mine = x === MYDESK[0] && z === MYDESK[2];
      if (!mine) {
        b.add(boxGeo(V(x - 0.3, DESK_H + 0.12, z - 0.3), V(x + 0.3, DESK_H + 0.48, z - 0.27)), M.dark);
        b.add(boxGeo(V(x - 0.03, DESK_H, z - 0.33), V(x + 0.03, DESK_H + 0.14, z - 0.29)), M.dark);
      }
      b.add(boxGeo(V(x + (mine ? -0.6 : 0.4), DESK_H, z - 0.25), V(x + (mine ? -0.4 : 0.6), DESK_H + 0.05, z - 0.08)), M.dark); // desk phone
      if (i % 3 !== 1) b.add(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14).translate(x - 0.45 + (mine ? 1.0 : 0), DESK_H + 0.05, z + 0.2), M.mug);
    });
    // plants
    for (const [x, z, s] of [[-7.2, -5.2, 1.1], [7.2, -5.2, 1.2], [-7.3, 2.2, 0.95], [6.9, 3.2, 1.0]] as const) {
      b.add(new THREE.CylinderGeometry(0.3 * s, 0.24 * s, 0.55 * s, 20).translate(x, 0.275 * s, z), M.pot);
      const r = rng(Math.round(x * 10 + z * 100));
      for (let k = 0; k < 5; k++) {
        const g = new THREE.SphereGeometry((0.28 + r() * 0.12) * s, 18, 12);
        g.translate(x + (r() - 0.5) * 0.45 * s, (0.75 + k * 0.22 + r() * 0.1) * s, z + (r() - 0.5) * 0.4 * s);
        b.add(g, k % 2 ? M.leaf : M.leaf2);
      }
    }
    // outside: we are high up; ground far below, a skyline of simple blocks
    const gr = new THREE.PlaneGeometry(2000, 2000); gr.rotateX(-Math.PI / 2); gr.translate(0, -40, -500);
    b.add(gr, M.ground);
    const r = rng(5);
    for (let k = 0; k < 70; k++) {
      const x = (r() - 0.5) * 260, z = -22 - r() * 150, w = 8 + r() * 14, d = 8 + r() * 14, h = 25 + r() * 55 - Math.max(0, 40 - Math.abs(x)) * 0.15;
      if (Math.abs(x) < 8 && z > -40) continue;
      b.add(boxGeo(V(x - w / 2, -40, z - d / 2), V(x + w / 2, -40 + h, z + d / 2)), M.bldg[k % 4]);
    }
    b.build(R);

    // ---- unlit surfaces: display, monitors, whiteboard, clock, calendar, newspaper ----
    const unlit = (map: THREE.Texture, w: number, h: number, pos: V3, ry = 0, rx = 0, k = 1) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k), toneMapped: true }));
      m.position.set(...pos); m.rotation.set(rx, ry, 0, "YXZ"); R.add(m); return m;
    };
    unlit(this.screen.tex, SCREEN_W, SCREEN_H, [SCREEN[0], SCREEN[1], BZ + 0.065], 0, 0, 1.05);
    const mon = monitorTex();
    DESKS.forEach(([x, z]) => { if (!(x === MYDESK[0] && z === MYDESK[2])) unlit(mon, 0.54, 0.32, [x, DESK_H + 0.3, z - 0.265]); });
    unlit(boardTex(), 2.5, 1.2, [RX - 0.06, 1.65, -2.5], -Math.PI / 2, 0, 0.95);
    unlit(clockTex(), 0.5, 0.5, [-RX + 0.02, 2.55, -2.5], Math.PI / 2, 0, 0.95);
    this.props = buildProps(makeKit(R, unlit));
  }

  /** camera-relative sun frozen per shot: az degrees from the shot's mean view direction toward screen right */
  private shotSun(id: number, az: number, el: number) {
    let v = this.sunCache.get(id);
    if (v) return v;
    const s = SHOTS[id - 1];
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) { const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
    const hx = fx * Math.cos(a) - fz * Math.sin(a), hz = fz * Math.cos(a) + fx * Math.sin(a);
    v = new THREE.Vector3(hx * Math.cos(e), Math.sin(e), hz * Math.cos(e)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // ---- light: sun from behind-right of the lens, high (a bright office), two-tone uniforms ----
    const sunDir = this.shotSun(id, 145, 52);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 6, 9, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, 60); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 5; sc.far = 140; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = 40; this.fog.far = 260;
    scene.fog = this.fog; scene.background = null;

    // ---- props ----
    this.screen.set(`s${f}`, (g) => drawScreen(g, f));
    this.props(f, id);

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right });
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      const a = this.actor(ai++);
      const [w, h, k] = p.size;
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      // gentle breathing (no redraw): 1.5 % squash at ~0.4 Hz
      const br = 1 + 0.015 * Math.sin((f / FPS) * 2.5 + p.x * 3);
      a.mesh.scale.set((sc2 * (p.sx ?? 1)) / Math.sqrt(br), sc2 * (p.sy ?? 1) * br, sc2);
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus;
  }
}
export { twoTone };
