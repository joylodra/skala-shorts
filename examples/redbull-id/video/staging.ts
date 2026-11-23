// Red Bull Stratos staging (see PLAN.md): Skala + the team watch the jump on the wall display.
import { brandPose, jumpPose, bouncePose, shakePose, fxExclaim, fxStarBurst, fxCross, fxLightbulb, fxSparkles, Variant } from "../skala/skala";
import { StageAPI, pop } from "../skala/cast";
import { SPOTS } from "../skala/room";
import { EV, JUMP0, skalaFall } from "./story";

const L = 2;
// the watch-party crew for the wide shots (in front of the display, all visible from the wide camera)
const CREW: [number, Variant, number, number][] = [[11, "blue", -1.35, 1.3], [12, "green", 0.95, 0.9], [13, "purple", 0.15, 2.4], [14, "teal", -0.55, -0.6]];
const HERO: [number, number] = [-1.9, 2.6];

export const staging = (id: number, f: number, api: StageAPI) => {
  const { add, fx } = api;
  const t = f / 30;
  switch (id) {
    case 1: { // hook, in space: Skala on the capsule step with an energy can, mindblown on "angkasa"
      const wow = f >= EV.angkasa - L;
      add({ i: 1, v: "skala", x: 0, z: 0, floor: 300, ...(wow ? { expr: "mindblown", arms: "holdR", prop: "can" } : { expr: "talk", arms: "holdR", prop: "can", talk: true }) });
      const k = pop(f, EV.angkasa - L, 999);
      if (k > 0) fx({ key: "ex", cw: 300, ch: 300, draw: fxExclaim, x: 0.8, y: 301.95, z: 0.05, w: 0.42 * k, h: 0.42 * k, rot: 0.12 });
      break;
    }
    case 2: { // "cuma buat dia lompat": smug, then Skala jumps off the step and drops out of frame
      const d = skalaFall(f), gone = f >= JUMP0;
      const dt = Math.max(0, (f - JUMP0) / 30);
      add({ i: 1, v: "skala", x: 3.0 * dt, z: 0.1 + 0.6 * dt, floor: 300, hop: d, noShadow: gone, tilt: gone ? -40 * dt : 0,
        expr: gone ? "excited" : "smug", arms: gone ? "cheer" : "shrugUp", ...(gone ? {} : { look: 0.5 }) });
      break;
    }
    case 3: { // watch party gathers
      CREW.forEach(([i, v, x, z], n) => add({ i, v, x, z, ...(n % 2 ? brandPose("skala-react-popcorn") : { expr: "happy", arms: "wave" }), ...bouncePose(t + n * 0.4, 1.2) }));
      add({ i: 1, v: "skala", x: HERO[0], z: HERO[1], ...brandPose("skala-talking") });
      break;
    }
    case 5: { // "sampai ketinggian 39 km": pointing up at the counter
      const [x, z] = SPOTS.presenter;
      add({ i: 1, v: "skala", x, z, ...(f < EV.km39 - L ? brandPose("skala-teach-point-up") : { ...brandPose("skala-teach-aha"), expr: "mindblown" }) });
      break;
    }
    case 7: { // "Lalu… dia lompat": hold your breath -> shock
      const [x, z] = SPOTS.aisle;
      add({ i: 1, v: "skala", x, z, ...(f < EV.lompat2 - L ? { expr: "scared", arms: "coverMouth" } : { expr: "shock", arms: "cheeks", ...jumpPose(t, (EV.lompat2 - L) / 30, 0.5, 0.12) }) });
      break;
    }
    case 9: { // sonic boom: everybody flinches on "suara"
      const boom = f >= EV.suara - L;
      CREW.forEach(([i, v, x, z]) => add({ i, v, x, z, ...(boom ? { expr: "scared", arms: "flinch", tilt: -6 } : { expr: "ooh", arms: "handsChest" }) }));
      add({ i: 1, v: "skala", x: HERO[0], z: HERO[1], ...(boom ? brandPose("skala-react-mindblown") : { expr: "ooh", arms: "fists" }) });
      const k = pop(f, EV.suara - L, EV.suara + 40);
      if (k > 0) fx({ key: "boom", cw: 300, ch: 300, draw: fxStarBurst, x: 0, y: 2.2, z: -5.4, w: 1.6 * k, h: 1.6 * k, rot: f * 0.02 });
      break;
    }
    case 11: { // popcorn, then everybody cheers on "Rekor"
      const cheer = f >= EV.rekor - L;
      CREW.forEach(([i, v, x, z], n) => {
        const j0 = (EV.rekor - L) / 30 + n * 0.06;
        add({ i, v, x, z, ...(cheer ? { ...brandPose("skala-celebrate"), ...jumpPose(t, j0, 0.8, 0.35) } : brandPose("skala-react-popcorn")) });
      });
      add({ i: 1, v: "skala", x: HERO[0], z: HERO[1], ...(cheer ? { ...brandPose("skala-celebrate"), ...jumpPose(t, (EV.rekor - L) / 30, 0.8, 0.35) } : brandPose("skala-react-popcorn")) });
      if (cheer) { const k = pop(f, EV.rekor - L, 999); fx({ key: "spk", cw: 300, ch: 300, draw: fxSparkles, x: -0.4, y: 2.3, z: 1.0, w: 0.6 * k, h: 0.6 * k }); }
      break;
    }
    case 12: { // "Red Bull ga bikin iklan": head shake + red X on "iklan"
      const [x, z] = SPOTS.aisle;
      add({ i: 1, v: "skala", x, z, ...(f < EV.ga - L ? brandPose("skala-teach-explain") : { ...brandPose("skala-teach-no"), ...shakePose(t, (EV.ga - L) / 30) }) });
      const k = pop(f, EV.iklan - L, 999);
      if (k > 0) fx({ key: "x", cw: 300, ch: 300, draw: fxCross, x: x + 0.55, y: 1.95, z: z + 0.05, w: 0.45 * k, h: 0.45 * k });
      break;
    }
    case 13: { // "tapi bikin momen": the lesson
      const [x, z] = SPOTS.aisle;
      const aha = f >= EV.momen - L;
      add({ i: 1, v: "skala", x, z, ...(aha ? { ...brandPose("skala-teach-aha"), expr: "excited" } : brandPose("skala-teach-point-up")) });
      const k = pop(f, EV.momen - L, 999);
      if (k > 0) fx({ key: "bulb", cw: 300, ch: 300, draw: fxLightbulb, x: x + 0.5, y: 1.55, z: z + 0.05, w: 0.5 * k, h: 0.5 * k });
      break;
    }
    case 14: { // "semua orang": everybody cheers, Skala's CTA in front
      CREW.forEach(([i, v, x, z], n) => add({ i, v, x, z, ...brandPose("skala-celebrate"), ...bouncePose(t + n * 0.3, 2) }));
      add({ i: 1, v: "skala", x: -0.45, z: 3.6, ...brandPose("skala-follow-cta") });
      break;
    }
  }
};
