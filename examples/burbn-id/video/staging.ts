// Test short staging (see PLAN.md). Reactions land 2 frames before their word.
import { brandPose, walkPose, jumpPose, bouncePose, shakePose, fxQuestion, fxSweatDrops, fxZzz, fxLightbulb, fxSparkles, fxStarBurst, paperBallFx } from "../skala/skala";
import { StageAPI, pop } from "../skala/cast";
import { SPOTS } from "../skala/room";
import { EV } from "./story";

const L = 2;
export const staging = (id: number, f: number, api: StageAPI) => {
  const { add, fx } = api;
  const t = f / 30;
  switch (id) {
    case 1: { // hook: phone selfie, then "bukan?" skeptical
      const [x, z] = SPOTS.myDeskFront;
      const doubt = f >= EV.bukan - L;
      add({ i: 1, v: "skala", x, z, ...brandPose("skala-creator-selfie"), ...(doubt ? { expr: "skeptical" } : {}) });
      const k = pop(f, EV.bukan - L, 999);
      if (k > 0) fx({ key: "q", cw: 300, ch: 300, draw: fxQuestion, x: x + 0.75, y: 1.95, z: z + 0.05, w: 0.42 * k, h: 0.42 * k, rot: 0.15 });
      break;
    }
    case 2: { // presenting the Burbn icon
      const [x, z] = SPOTS.presenter;
      add({ i: 1, v: "skala", x, z, ...(f < EV.burbn - L ? brandPose("skala-talking") : { expr: "ooh", arms: "present" }) });
      break;
    }
    case 3: { // "isinya macam-macam": overwhelmed
      const [x, z] = SPOTS.aisle;
      const over = f >= EV.macam - L;
      add({ i: 1, v: "skala", x, z, ...(over ? brandPose("skala-overwhelmed") : brandPose("skala-talking")), ...(over ? shakePose(t, (EV.macam - L) / 30, 1.2, 4) : {}) });
      if (over) fx({ key: "sweat", cw: 300, ch: 300, draw: fxSweatDrops, x: x + 0.7, y: 1.75, z: z + 0.05, w: 0.4, h: 0.4 });
      break;
    }
    case 5: { // "hampir nggak ada yang pakai": nobody cares
      const spots: [number, number][] = [[-1.35, 1.3], [0.95, 0.9], [0.15, 2.4], [-0.55, -0.6]];
      add({ i: 11, v: "blue", x: spots[0][0], z: spots[0][1], ...brandPose("skala-react-sleepy") });
      add({ i: 12, v: "green", x: spots[1][0], z: spots[1][1], ...brandPose("skala-react-bored") });
      add({ i: 13, v: "purple", x: spots[2][0], z: spots[2][1], expr: "neutral", arms: "phone", prop: "phone", look: -1 });
      add({ i: 14, v: "teal", x: spots[3][0], z: spots[3][1], expr: "sleepy", arms: "slump" });
      add({ i: 1, v: "skala", x: -1.9, z: 2.6, ...brandPose("skala-sad-low") });
      fx({ key: "zzz", cw: 300, ch: 300, draw: fxZzz, x: spots[0][0] + 0.7, y: 1.95 + 0.05 * Math.sin(t * 3), z: spots[0][1], w: 0.45, h: 0.45 });
      break;
    }
    case 6: { // "satu fitur ... foto": the lesson pointer, lightbulb on "foto"
      const [x, z] = SPOTS.presenter;
      const aha = f >= EV.foto3 - L;
      add({ i: 1, v: "skala", x, z, ...(aha ? { ...brandPose("skala-teach-aha"), expr: "excited" } : brandPose("skala-teach-point-up")) });
      const k = pop(f, EV.foto3 - L, 999);
      if (k > 0) fx({ key: "bulb", cw: 300, ch: 300, draw: fxLightbulb, x: x + 0.15, y: 2.35, z, w: 0.55 * k, h: 0.55 * k });
      break;
    }
    case 8: { // launch day: everybody celebrates, jumps on "daftar"
      const crew: [number, "skala" | "blue" | "green" | "purple" | "teal", number, number][] = [
        [1, "skala", 0.1, 1.6], [11, "blue", -1.4, 0.4], [12, "green", 1.4, 0.2], [13, "purple", -0.6, -1.3], [14, "teal", 0.9, -1.5]];
      crew.forEach(([i, v, x, z], n) => {
        const jumpAt = (EV.daftar - L) / 30 + n * 0.07;
        const motion = t >= jumpAt ? jumpPose(t, jumpAt, 0.9, 0.4) : bouncePose(t + n * 0.3, 2);
        add({ i, v, x, z, ...brandPose("skala-celebrate"), ...motion });
      });
      if (f >= EV.daftar - L) {
        const k = pop(f, EV.daftar - L, 999);
        fx({ key: "burst", cw: 300, ch: 300, draw: fxStarBurst, x: 0.1, y: 2.4, z: 1.4, w: 0.7 * k, h: 0.7 * k, rot: f * 0.01 });
        fx({ key: "spark", cw: 300, ch: 300, draw: fxSparkles, x: -1.2, y: 2.2, z: 0.3, w: 0.5 * k, h: 0.5 * k });
        fx({ key: "spark", cw: 300, ch: 300, draw: fxSparkles, x: 1.5, y: 2.1, z: 0.1, w: 0.45 * k, h: 0.45 * k });
      }
      break;
    }
    case 9: { // "jangan tambah fitur": explain, then "no" with a head shake
      const [x, z] = SPOTS.aisle;
      const no = f >= EV.jangan - L;
      add({ i: 1, v: "skala", x, z, ...(no ? { ...brandPose("skala-teach-no"), ...shakePose(t, (EV.jangan - L) / 30) } : brandPose("skala-teach-explain")) });
      break;
    }
    case 10: { // "cari satu hal": point up; "buang sisanya": toss a paper ball; end on the follow CTA
      const [x, z] = SPOTS.aisle;
      if (f < EV.audiens - L) add({ i: 1, v: "skala", x, z, ...brandPose("skala-teach-point-up") });
      else if (f < EV.buang - L) add({ i: 1, v: "skala", x, z, expr: "smug", arms: "crumple", prop: "ball" });
      else if (f < EV.buang + 30) {
        add({ i: 1, v: "skala", x, z, expr: "happy", arms: "up" });
        const u = (f - EV.buang + L) / 18;
        if (u < 1) fx({ key: "ball", cw: 240, ch: 240, draw: paperBallFx, x: x + 2.0 * u, y: 1.35 + 0.9 * u - 1.4 * u * u, z: z + 0.1, w: 0.3, h: 0.3, rot: u * 6 });
      } else add({ i: 1, v: "skala", x, z, ...brandPose("skala-follow-cta") });
      break;
    }
  }
};
export const unused = walkPose;
