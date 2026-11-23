// Helpers a video's props.ts gets from the engine: dynamic canvas textures, unlit planes, lit boxes, shared materials.
import * as THREE from "three";
import { boxGeo, V, lam } from "./build";
import type { V3 } from "./camera";

/** canvas texture redrawn only when its state key changes */
export class DynTex {
  cv: HTMLCanvasElement; tex: THREE.CanvasTexture; private last = "";
  constructor(w: number, h: number) {
    this.cv = document.createElement("canvas"); this.cv.width = w; this.cv.height = h;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 16;
  }
  set(key: string, draw: (g: CanvasRenderingContext2D) => void) {
    if (key === this.last) return;
    this.last = key;
    const g = this.cv.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height);
    draw(g); this.tex.needsUpdate = true;
  }
}

export type PropKit = {
  root: THREE.Group;
  /** unlit picture plane (screens, paper, signs): map, width, height, position, yaw, pitch, brightness */
  unlit: (map: THREE.Texture, w: number, h: number, pos: V3, ry?: number, rx?: number, k?: number) => THREE.Mesh;
  /** lit, ink-outlined box with one of the room colours (or any css colour) */
  box: (min: V3, max: V3, color: string) => THREE.Mesh;
  DynTex: typeof DynTex;
};
export const makeKit = (root: THREE.Group, unlit: PropKit["unlit"]): PropKit => ({
  root, unlit, DynTex,
  box: (min, max, color) => {
    const m = new THREE.Mesh(boxGeo(V(...min), V(...max)), lam("pk" + color, () => ({ color })));
    m.castShadow = true; m.receiveShadow = true; root.add(m); return m;
  },
});
