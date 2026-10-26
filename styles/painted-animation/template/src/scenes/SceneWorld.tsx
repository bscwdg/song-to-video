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
import {
  beatPhase,
  clamp,
  easeInOutCubic,
  type SceneProps,
} from "../timeline";

export const SceneWorld: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const walk = easeInOutCubic(clamp(local / sceneDuration));
  const beat = beatPhase(time, 120);

  return (
    <SceneFrame>
      <PaperBackground />
      <WatercolorBlob x={430} y={330} rx={320} ry={210} color="#5c8f9b" opacity={0.28} />
      <WatercolorBlob x={1290} y={290} rx={360} ry={230} color="#d9765f" opacity={0.24} />
      <WatercolorBlob x={940} y={620} rx={470} ry={220} color="#d9a441" opacity={0.18} />
      <WatercolorBlob x={1480} y={245} rx={120} ry={120} color="#d9a441" opacity={0.5} />
      <g transform="translate(0 0)" filter="url(#watercolor-bleed)">
        <path
          d="M -80 760 C 210 590 430 640 690 720 C 960 806 1170 590 1450 660 C 1660 714 1810 680 2000 610 L 2000 1080 L -80 1080 Z"
          fill="#5c8f9b"
          opacity=".28"
        />
        <path
          d="M -80 840 C 290 720 560 790 820 820 C 1110 854 1330 730 1570 790 C 1730 830 1850 810 2000 760 L 2000 1080 L -80 1080 Z"
          fill="#20252a"
          opacity=".2"
        />
      </g>
      <InkLine
        d="M -60 840 C 280 735 550 790 820 820 C 1110 850 1330 730 1570 790 C 1730 830 1850 810 1990 765"
        reveal={clamp(local / 1.6)}
        width={4}
        opacity={0.48}
      />
      <InkLine
        d="M 1160 330 C 1220 300 1280 300 1340 330"
        reveal={clamp((local - 0.5) / 0.8)}
        width={3}
        opacity={0.45}
      />
      <PaintedFigure x={480 + walk * 780} y={910} scale={1.08} time={time} facing={1} />
      <WatercolorFlower
        x={700}
        y={790}
        scale={0.7 + Math.exp(-beat * 4) * 0.08}
        time={time}
        accent="#d9765f"
      />
      <WatercolorFlower x={1510} y={830} scale={0.55} time={time + 1.2} accent="#d9a441" />
    </SceneFrame>
  );
};
