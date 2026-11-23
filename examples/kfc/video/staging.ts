// KFC short staging: who stands where in each shot, with which expression / arms / prop, plus effect cards.
// Engine API (../skala/cast.ts): add(Who) places a Skala card (+ contact shadow); out.fx.push(FxPlace) adds an effect card.
// Reactions land 0-3 frames before their word (L = 2).
import { Variant, Expr, Arms, Prop, fxHeart, fxLaugh, fxGrowl, fxSweat, paperBallFx } from "../skala/skala";
import { Who, StageAPI, ringFx, pop, hh, q } from "../skala/cast";
import { clamp01, smooth } from "../skala/camera";
import { SCREEN } from "../skala/room";
import { EV } from "./story";

const DESK_Z = -0.2;
const team = (f: number, exprs: Partial<Record<Variant, Expr>> = {}, arms: Partial<Record<Variant, Arms>> = {}, props: Partial<Record<Variant, Prop>> = {}): Who[] => [
  { i: 11, v: "blue", x: -4.25, z: DESK_Z, expr: exprs.blue ?? "neutral", arms: arms.blue, prop: props.blue, look: 1 },
  { i: 12, v: "green", x: 2.15, z: DESK_Z, expr: exprs.green ?? "neutral", arms: arms.green, prop: props.green, look: -1 },
  { i: 13, v: "purple", x: 4.25, z: DESK_Z, expr: exprs.purple ?? "neutral", arms: arms.purple, prop: props.purple, look: -1 },
  { i: 14, v: "teal", x: -4.25, z: 4.4, expr: exprs.teal ?? "neutral", arms: arms.teal, prop: props.teal, look: 1 },
  { i: 15, v: "green", x: 3.4, z: 4.4, expr: exprs.green ?? "neutral", arms: arms.green, prop: props.green, look: -1, scale: 0.96 },
];

export const staging = (id: number, f: number, api: StageAPI) => {
  const { out, add } = api;
  const L = 2; // reactions land 0-3 f before the word
  switch (id) {
    case 1: {
      const e: Expr = f < EV.out - L ? "happy" : f < EV.chicken1 - L ? "neutral" : "shock";
      add({ i: 1, v: "skala", x: -2.2, z: -0.2, expr: e, arms: "hold", prop: "bucket", look: f >= EV.out - L && f < EV.chicken1 - L ? -0.5 : 0 });
      team(f).slice(0, 2).forEach(add);
      if (f >= EV.chicken1 - L) out.fx.push({ key: "sweat", cw: 140, ch: 140, draw: fxSweat, x: -1.72, y: 1.55, z: -0.15, w: 0.16, h: 0.16 });
      break;
    }
    case 2: case 3: {
      add({ i: 1, v: "skala", x: -1.5, z: -4.35, expr: "talk", arms: id === 3 && f >= EV.partner - 4 ? "point" : "wave", talk: true });
      team(f, { blue: "happy", green: "happy", purple: "neutral", teal: "happy" }).forEach(add);
      const k = pop(f, EV.valentine - 1, 176);
      if (k > 0) out.fx.push({ key: "heart", cw: 400, ch: 380, draw: fxHeart, x: -0.9, y: 2.9 + 0.15 * (f - EV.valentine) / 60, z: -5.2, w: 0.7 * k, h: 0.66 * k, rot: 0.15 * Math.sin(f * 0.2) });
      break;
    }
    case 6: add({ i: 1, v: "skala", x: -2.55, z: -1.95, expr: "worried", arms: "slump", look: 0.5 }); break;
    case 8: {
      const e: Expr = f < EV.half - L ? "worried" : f < EV.shut - L ? "sad" : "shock";
      add({ i: 1, v: "skala", x: -1.35, z: -4.15, expr: e, arms: f < EV.shut - L ? "slump" : "cheeks", look: 1 });
      break;
    }
    case 9: case 10: {
      const ex: Partial<Record<Variant, Expr>> = { blue: id === 10 ? "shock" : "worried", green: "worried", purple: "shock", teal: "worried" };
      const ar: Partial<Record<Variant, Arms>> = { blue: "phone", green: "phone", purple: "phone", teal: "phone" };
      const pr: Partial<Record<Variant, Prop>> = { blue: "phone", green: "phone", purple: "phone", teal: "phone" };
      const spots: [number, number][] = id === 9 ? [[-1.35, 1.3], [0.95, 0.9], [0.15, 2.4], [-0.55, -0.6], [1.55, 2.9]] : [];
      team(f, ex, ar, pr).forEach((w, k) => add(id === 9 ? { ...w, x: spots[k][0], z: spots[k][1] } : w));
      add({ i: 1, v: "skala", x: id === 9 ? -0.9 : -2.2, z: id === 9 ? 3.2 : -0.2, expr: "shock", arms: "cheeks" });
      // desk phones still ringing
      [[-2.7, -1.17], [-1.75, 1.55], [0.55, 0.45], [1.35, 2.2], [-0.15, -0.95]].forEach(([x, z], i) => ringFx(f, x, 1.05, z, i, out));
      break;
    }
    case 12: add({ i: 1, v: "skala", x: -2.2, z: -0.2, expr: f < EV.shop + 20 ? "worried" : "sad", arms: "hold", prop: "bucket", look: -0.3 }); break;
    case 14: {
      add({ i: 1, v: "skala", x: -1.7, z: -3.0, expr: "deadpan", arms: "slump" });
      for (let n = 0; n < 26; n++) { // laughing reactions float up off the screen
        const t0 = EV.laughing - 6 + n * 2.6, u = (f - t0) / 70;
        if (u < 0 || u > 1) continue;
        const x = SCREEN[0] + (hh(n, 1) - 0.5) * 4.6, y = SCREEN[1] - 0.9 + u * 2.2 + hh(n, 2) * 0.6, s = 0.32 + 0.22 * hh(n, 3);
        const k = Math.min(1, u * 8) * (u > 0.85 ? (1 - u) / 0.15 : 1);
        out.fx.push({ key: `laugh${n % 2}`, cw: 300, ch: 300, draw: (p) => fxLaugh(p, n % 2), x, y, z: SCREEN[2] + 0.35 + hh(n, 4) * 0.6, w: s * k, h: s * k, rot: 0.3 * Math.sin(u * 8 + n) });
      }
      break;
    }
    case 15: add({ i: 1, v: "skala", x: -0.6, z: -0.6, expr: f < EV.luckily + 25 ? "neutral" : "deadpan", arms: "shrug", look: 0 }); break;
    case 16: {
      const Q: [Variant, number, number][] = [["skala", 0.1, 2.0], ["blue", -0.15, 0.3], ["purple", 0.15, -1.4], ["green", -0.15, -3.1], ["teal", 0.15, -4.8]];
      Q.forEach(([v, x, z], i) => add({ i: 30 + i, v, x, z, expr: "sad", arms: "hold", prop: "bucket", look: (hh(i) - 0.5) * 1.5, tilt: (hh(i, 5) - 0.5) * 6 }));
      if (f >= EV.hungry - L) {
        const u = q(((f - EV.hungry) % 20) / 20, 20);
        Q.forEach(([, x, z], i) => { if (i % 2 === 0) out.fx.push({ key: `growl${u}`, cw: 300, ch: 200, draw: (p) => fxGrowl(p, u), x: x + 0.75, y: 1.45, z: z + 0.1, w: 0.42, h: 0.28 }); });
      }
      break;
    }
    case 17: add({ i: 1, v: "skala", x: -0.6, z: -0.6, expr: "worried", arms: "hide", prop: "scroll", hop: f >= EV.hide - L ? 0.04 * Math.sin(Math.min(1, (f - EV.hide) / 6) * Math.PI) : 0 }); break;
    case 18: {
      const thrown = f >= EV.newspaper - 14;
      add({ i: 1, v: "skala", x: -0.6, z: -0.6, expr: thrown ? "happy" : "grin", arms: thrown ? "up" : "crumple", prop: thrown ? null : "ball" });
      if (thrown) { // the ball flies off screen right
        const u = (f - (EV.newspaper - 14)) / 18;
        if (u < 1) out.fx.push({ key: "ball", cw: 240, ch: 240, draw: paperBallFx, x: -0.6 + 2.2 * u, y: 1.35 + 0.9 * u - 1.4 * u * u, z: -0.5, w: 0.3, h: 0.3, rot: u * 6 });
      }
      break;
    }
    case 20: if (f >= 1790) {
      add({ i: 1, v: "skala", x: -2.95, z: -0.25, expr: "sheepish", arms: "rest", look: 1 });
      add({ i: 11, v: "blue", x: -4.0, z: -1.7, expr: "happy", arms: "up" });
    } break;
  }
};
