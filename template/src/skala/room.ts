// The standard Skala office set (engine): fixed layout so every video shares the same world.
// Units are metres. x runs across the room (-8..8), y up, z toward the camera side. Back wall (windows + wall display)
// at z = -6; the open side faces +z, so cameras usually sit at z > 0 looking toward -z.
import type { V3 } from "./camera";

export const ROOM = { halfWidth: 8, backZ: -6, wallH: 3.6 };
/** wall display centre and size (canvas 2048 x 1152, drawn by the video's props.ts drawScreen) */
export const SCREEN: V3 = [0, 1.95, -5.93];
export const SCREEN_W = 4.8, SCREEN_H = 2.7;
/** standing desks (centre x, z); top height DESK_H; each 1.6 x 0.8 m. Front row z = -1, back row z = 3.6 */
export const DESKS: [number, number][] = [[-4.2, -1.0], [-2.2, -1.0], [2.2, -1.0], [4.2, -1.0], [-4.2, 3.6], [-2.2, 3.6], [2.2, 3.6], [4.2, 3.6]];
export const DESK_H = 0.74;
/** Skala's own desk (no monitor, room for props: newspaper, calendar, laptop ...) */
export const MYDESK: V3 = [-2.2, 0, -1.0];
/** handy marks: where people usually stand */
export const SPOTS = {
  presenter: [-1.5, -4.35] as [number, number], // left of the wall display
  myDeskFront: [-2.2, -0.2] as [number, number], // in front of Skala's desk, facing camera
  behindMyDesk: [-2.55, -1.95] as [number, number], // behind Skala's desk (desk hides the legs)
  aisle: [-0.6, -0.6] as [number, number], // centre aisle, best for close/medium shots from (x~0, z 2.6-3.3)
  aisleBack: [-1.7, -3.0] as [number, number], // between aisle and screen (over-the-shoulder at the display)
};
