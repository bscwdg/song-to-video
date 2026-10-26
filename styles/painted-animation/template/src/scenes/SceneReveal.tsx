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
import {beatPhase, clamp, easeOutCubic, type SceneProps} from "../timeline";

export const SceneReveal: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const reveal = easeOutCubic(clamp(local / 1.5));
  const beat = beatPhase(time, 120);

  return (
    <SceneFrame>
      <PaperBackground />
      <WatercolorBlob x={400} y={350} rx={330} ry={240} color="#5c8f9b" opacity={0.22} />
      <WatercolorBlob x={1430} y={360} rx={370} ry={260} color="#d9765f" opacity={0.18} />
      <WatercolorBlob x={980} y={680} rx={480} ry={180} color="#d9a441" opacity={0.2} />
      <g opacity={reveal}>
        <path
          d="M 610 860 L 610 560 L 960 360 L 1310 560 L 1310 860 Z"
          fill="#d9a441"
          opacity=".34"
          filter="url(#watercolor-bleed)"
        />
        <InkLine
          d="M 610 860 L 610 560 L 960 360 L 1310 560 L 1310 860 Z"
          reveal={reveal}
          width={8}
        />
        <InkLine d="M 890 860 L 890 690 L 1030 690 L 1030 860" reveal={reveal} width={6} />
        <InkLine d="M 760 570 L 760 680 L 850 680" reveal={reveal} width={5} opacity={0.7} />
        <InkLine d="M 1070 570 L 1070 680 L 1160 680" reveal={reveal} width={5} opacity={0.7} />
      </g>
      <g opacity={reveal}>
        <path
          d="M 1430 860 C 1430 760 1430 700 1440 650"
          fill="none"
          stroke="#20252a"
          strokeWidth="14"
          strokeLinecap="round"
          filter="url(#ink-boil)"
        />
        <circle cx="1440" cy="615" r="110" fill="#5c8f9b" opacity=".35" filter="url(#watercolor-bleed)" />
        <InkLine
          d="M 1320 585 C 1370 510 1450 500 1520 555 C 1490 610 1400 640 1320 585 Z"
          reveal={reveal}
          width={4}
          opacity={0.55}
          fill="#5c8f9b"
        />
      </g>
      <PaintedFigure x={1100} y={880} scale={0.82} time={time} facing={-1} opacity={reveal} />
      <WatercolorFlower
        x={800}
        y={900}
        scale={0.75 + Math.exp(-beat * 4) * 0.06}
        time={time}
        accent="#d9765f"
      />
      <InkLine
        d="M 480 920 C 700 940 900 900 1120 920 C 1300 936 1450 900 1580 920"
        reveal={reveal}
        width={4}
        opacity={0.45}
      />
    </SceneFrame>
  );
};
