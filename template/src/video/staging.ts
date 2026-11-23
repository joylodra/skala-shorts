// STARTER staging (replace for each video): who stands where, with which pose. See references/mascot.md for every
// expression / arm pose / prop / effect / brand pose, and examples/kfc/video/staging.ts for a full video.
import { brandPose } from "../skala/skala";
import { StageAPI } from "../skala/cast";
import { SPOTS } from "../skala/room";
import { EV } from "./story";

export const staging = (id: number, f: number, api: StageAPI) => {
  const { add } = api;
  const L = 2; // reactions land 0-3 frames before their word
  switch (id) {
    case 1: {
      const [x, z] = SPOTS.aisle;
      add({ i: 1, v: "skala", x, z, ...(f < EV.hello - L ? brandPose("skala-talking") : brandPose("skala-celebrate")) });
      break;
    }
    case 2: {
      const [x, z] = SPOTS.presenter;
      add({ i: 1, v: "skala", x, z, expr: "happy", arms: f < EV.wave - L ? "rest" : "wave", talk: true });
      add({ i: 11, v: "blue", x: -4.25, z: -0.2, expr: "happy" });
      add({ i: 12, v: "green", x: 2.15, z: -0.2, expr: "happy", look: -1 });
      break;
    }
  }
};
