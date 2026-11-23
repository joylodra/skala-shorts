// STARTER props (replace for each video). drawScreen paints the 2048 x 1152 wall display every frame;
// buildProps adds extra scene objects once and returns a per-frame update. See examples/kfc/video/props.ts.
import type { PropKit } from "../skala/kit";

export const drawScreen = (g: CanvasRenderingContext2D, f: number) => {
  const bg = g.createLinearGradient(0, 0, 0, 1152); bg.addColorStop(0, "#22304f"); bg.addColorStop(1, "#18223a");
  g.fillStyle = bg; g.fillRect(0, 0, 2048, 1152);
  // idle: a soft orange plus that breathes
  const s = 1 + 0.04 * Math.sin(f * 0.1);
  g.save(); g.translate(1024, 576); g.scale(s, s); g.fillStyle = "#ff8a24";
  g.fillRect(-60, -200, 120, 400); g.fillRect(-200, -60, 400, 120); g.restore();
};
export const buildProps = (_kit: PropKit) => (_f: number, _id: number) => {};
