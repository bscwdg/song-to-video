import React from "react";
import {Composition} from "remotion";
import {PaintedFilm} from "./PaintedFilm";
import {DEMO_TIMELINE} from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PaintedFilm"
    component={PaintedFilm}
    durationInFrames={Math.round(DEMO_TIMELINE.meta.duration * DEMO_TIMELINE.meta.fps)}
    fps={DEMO_TIMELINE.meta.fps}
    width={DEMO_TIMELINE.meta.width}
    height={DEMO_TIMELINE.meta.height}
  />
);
