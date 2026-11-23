import React from "react";
import { Composition } from "remotion";
import { SkalaShort, SHORT_FRAMES } from "./skala/SkalaShort";
import { SkalaSheet, SkalaSheetExtra, SHEET_W, SHEET_H, EXTRA_W, EXTRA_H } from "./skala/Sheet";
export const Root: React.FC = () => (
  <>
    <Composition id="SkalaShort" component={SkalaShort} durationInFrames={SHORT_FRAMES} fps={30} width={1080} height={1920} />
    {/* character sheets: npx remotion still src/index.ts SkalaSheet out/sheet.png */}
    <Composition id="SkalaSheet" component={SkalaSheet} durationInFrames={1} fps={30} width={SHEET_W} height={SHEET_H} />
    <Composition id="SkalaSheetExtra" component={SkalaSheetExtra} durationInFrames={1} fps={30} width={EXTRA_W} height={EXTRA_H} />
  </>
);
