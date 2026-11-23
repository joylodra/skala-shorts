// Skala character sheets (stills): SkalaSheet = all 38 brand poses; SkalaSheetExtra = every expression, arm pose,
// prop (with its recommended arms), fx card and a walk/jump strip. Plain canvas + Pen + drawSkala, no three.js.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen } from "./toon";
import * as S from "./skala";
import type { SkalaOpts } from "./skala";

const BG = "#f4efe6", LABEL = "#3a2c3c";
const label = (g: CanvasRenderingContext2D, t: string, x: number, y: number, size = 26) => {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = LABEL; g.font = `600 ${size}px Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "top"; g.fillText(t, x, y);
};
/** draw design-space region [rx, ry, rw] (square) into a cell at (x, y) of width w */
const skalaAt = (g: CanvasRenderingContext2D, o: SkalaOpts, x: number, y: number, w: number, reg: [number, number, number, number] = [0, 0, 1000, 1000]) => {
  const k = w / reg[2];
  g.save(); g.setTransform(k, 0, 0, k, x - reg[0] * k, y - reg[1] * k);
  g.beginPath(); g.rect(reg[0], reg[1], reg[2], reg[3]); g.clip();
  S.drawSkala(new Pen(g), o);
  g.restore();
};
const heading = (g: CanvasRenderingContext2D, t: string, y: number) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = LABEL; g.font = "800 44px Arial, sans-serif"; g.textAlign = "left"; g.textBaseline = "top"; g.fillText(t, 40, y);
};
const useCanvas = (draw: (g: CanvasRenderingContext2D) => void) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const g = ref.current!.getContext("2d")!; g.fillStyle = BG; g.fillRect(0, 0, g.canvas.width, g.canvas.height); draw(g); }, []);
  return ref;
};

export const SHEET_W = 2400, SHEET_H = 3420;
export const SkalaSheet: React.FC = () => {
  const ref = useCanvas((g) => {
    heading(g, "Skala — brand poses (SKALA_CATALOG.brandPoses / brandPose(name))", 30);
    Object.keys(S.SKALA_CATALOG.brandPoses).forEach((name, i) => {
      const c = i % 6, r = Math.floor(i / 6), x = c * 400, y = 110 + r * 470;
      skalaAt(g, S.brandPose(name), x + 10, y, 380);
      label(g, name, x + 200, y + 400, 28);
    });
  });
  return <AbsoluteFill style={{ background: BG }}><canvas ref={ref} width={SHEET_W} height={SHEET_H} /></AbsoluteFill>;
};

type FxDraw = (p: Pen) => void;
const FX: [string, FxDraw][] = [
  ["fxHeart", (p) => { p.g.translate(40, 20); p.g.scale(0.72, 0.72); S.fxHeart(p); }], ["fxRing", (p) => S.fxRing(p, 0.4)], ["fxLaugh", (p) => S.fxLaugh(p, 1)], ["fxGrowl", (p) => S.fxGrowl(p, 0)],
  ["fxSweat", (p) => { p.g.translate(90, 80); p.g.scale(1.2, 1.2); S.fxSweat(p); }], ["fxSiren", (p) => S.fxSiren(p, 0.2)], ["paperBallFx", S.paperBallFx],
  ["fxExclaim", S.fxExclaim], ["fxQuestion", S.fxQuestion], ["fxSparkles", (p) => S.fxSparkles(p)], ["fxAngerVein", S.fxAngerVein],
  ["fxSweatDrops", (p) => S.fxSweatDrops(p)], ["fxZzz", (p) => S.fxZzz(p)], ["fxLightbulb", S.fxLightbulb], ["fxHeartsFloat", (p) => S.fxHeartsFloat(p)],
  ["fxMoney", (p) => S.fxMoney(p)], ["fxFire", (p) => S.fxFire(p)], ["fxCheck", S.fxCheck], ["fxCross", S.fxCross], ["fxStarBurst", S.fxStarBurst],
  ["fxMusic", (p) => S.fxMusic(p)], ["fxSpeech", (p) => S.fxSpeech(p, "Hi!")],
];
export const EXTRA_W = 2400, EXTRA_H = 5300;
export const SkalaSheetExtra: React.FC = () => {
  const ref = useCanvas((g) => {
    const C = S.SKALA_CATALOG;
    let y = 30;
    heading(g, `Expressions (${C.expressions.length})`, y); y += 80;
    C.expressions.forEach((e, i) => {
      const c = i % 8, r = Math.floor(i / 8), x = c * 300, yy = y + r * 250;
      skalaAt(g, { expr: e, talk: 1 }, x + 15, yy, 270, [90, 110, 840, 560]);
      label(g, e, x + 150, yy + 192);
    });
    y += Math.ceil(C.expressions.length / 8) * 250 + 20;
    heading(g, `Arm poses (${C.arms.length})`, y); y += 80;
    C.arms.forEach((a, i) => {
      const c = i % 10, r = Math.floor(i / 10), x = c * 240, yy = y + r * 280;
      skalaAt(g, { expr: "smile", arms: a }, x + 10, yy, 220);
      label(g, a, x + 120, yy + 230, 24);
    });
    y += Math.ceil(C.arms.length / 10) * 280 + 20;
    heading(g, `Props (${C.props.length}) — shown with recommended arms`, y); y += 80;
    const OLD: Record<string, SkalaOpts["arms"]> = { bucket: "hold", phone: "phone", scroll: "hide", ball: "crumple" };
    C.props.forEach((pr, i) => {
      const c = i % 8, r = Math.floor(i / 8), x = c * 300, yy = y + r * 330;
      const arms = (C.propArms as Record<string, SkalaOpts["arms"]>)[pr] ?? OLD[pr];
      skalaAt(g, { expr: "smile", arms, prop: pr, text: pr === "sign" ? "SALE!" : undefined }, x + 15, yy, 270);
      label(g, `${pr} · ${arms}`, x + 150, yy + 280, 24);
    });
    y += Math.ceil(C.props.length / 8) * 330 + 20;
    heading(g, `FX cards (${FX.length}, 300×300 canvas)`, y); y += 80;
    FX.forEach(([n, f], i) => {
      const c = i % 10, r = Math.floor(i / 10), x = c * 240, yy = y + r * 270;
      g.save(); g.setTransform(0.7, 0, 0, 0.7, x + 15, yy); f(new Pen(g)); g.restore();
      label(g, n, x + 120, yy + 222, 24);
    });
    y += Math.ceil(FX.length / 10) * 270 + 20;
    heading(g, "Motions: walkPose (8 phases, facing -1) · jumpPose (6 phases)", y); y += 80;
    for (let i = 0; i < 8; i++) {
      const m = S.walkPose(i / 8);
      skalaAt(g, { expr: "smile", arms: "rest", legs: m.legs, tilt: m.tilt, squash: m, facing: -1, look: -0.6 }, i * 150 + 10, y + 40 - m.hop * 435 * 0.14, 140);
    }
    for (let i = 0; i < 6; i++) {
      const m = S.jumpPose(0.05 + i * 0.17, 0);
      skalaAt(g, { expr: i > 0 && i < 4 ? "happy" : "smile", arms: i > 0 && i < 4 ? "cheer" : "rest", legs: m.legs, tilt: m.tilt, squash: m }, 1220 + i * 190, y + 40 - m.hop * 435 * 0.18, 180);
    }
  });
  return <AbsoluteFill style={{ background: BG }}><canvas ref={ref} width={EXTRA_W} height={EXTRA_H} /></AbsoluteFill>;
};
