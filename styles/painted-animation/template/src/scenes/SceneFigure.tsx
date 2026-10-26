import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {
  InkLine,
  PaintedFigure,
  PaperBackground,
  SceneFrame,
  WatercolorBlob,
  WatercolorFlower,
} from "../components/Paint";
import {beatPhase, clamp, easeInOutCubic, type SceneProps} from "../timeline";

export const SceneFigure: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const push = 1 + easeInOutCubic(clamp(local / sceneDuration)) * 0.08;
  const beat = beatPhase(time, 120);
  const heart = 0.82 + Math.exp(-beat * 5) * 0.08;

  return (
    <SceneFrame>
      <PaperBackground />
      <g transform={`translate(960 540) scale(${push}) translate(-960 -540)`}>
        <WatercolorBlob x={620} y={330} rx={410} ry={270} color="#5c8f9b" opacity={0.26} />
        <WatercolorBlob x={1320} y={430} rx={460} ry={310} color="#d9765f" opacity={0.24} />
        <WatercolorBlob x={950} y={620} rx={420} ry={220} color="#d9a441" opacity={0.18} />
        <g transform={`translate(960 470) scale(${heart})`} filter="url(#watercolor-bleed)" opacity=".55">
          <path d="M 0 150 C -230 -12 -150 -190 0 -72 C 150 -190 230 -12 0 150 Z" fill="#d9765f" />
        </g>
        <InkLine
          d="M 620 650 C 760 570 840 570 960 620 C 1080 670 1190 640 1300 560"
          reveal={clamp(local / 1.0)}
          width={4}
          opacity={0.45}
        />
        <PaintedFigure x={960} y={1010} scale={2.15} time={time} facing={-1} />
        <WatercolorFlower x={700} y={790} scale={0.9} time={time + 0.8} accent="#d9a441" />
        <WatercolorFlower x={1260} y={820} scale={0.72} time={time + 1.8} accent="#d9765f" />
      </g>
    </SceneFrame>
  );
};
