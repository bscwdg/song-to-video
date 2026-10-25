import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {
  beatIndexAt,
  clamp,
  easeInOutCubic,
  type SceneProps,
} from "../timeline";
import {
  Boy,
  Girl,
  GrainOverlay,
  Moon,
  OrigamiBoat,
  PaperSpeckField,
  vignette,
} from "../components/Paper";

const tornEdge = (x: number, top: number, bottom: number, side: 1 | -1) => {
  const points: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const y = top + ((bottom - top) * i) / 12;
    const dx = (Math.sin(i * 2.31) * 13 + Math.cos(i * 0.73) * 7) * side;
    points.push(`${i === 0 ? "M" : "L"} ${x + dx} ${y}`);
  }
  return points.join(" ");
};

/**
 * Generic torn-paper split transition.
 * The split starts on the beat nearest the middle of this scene.
 */
export const SceneSplit: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localTime = frame / fps;
  const absoluteTime = sceneStart + localTime;
  const middle = sceneStart + sceneDuration * 0.52;
  const before = beats.filter((beat) => beat <= middle);
  const splitBeat = before[before.length - 1] ?? middle;
  const split = easeInOutCubic(clamp((absoluteTime - splitBeat) / Math.min(1.1, sceneDuration * 0.42)));
  const gap = 18 + split * 420;
  const leftEdge = 960 - gap / 2;
  const rightEdge = 960 + gap / 2;
  const sceneBeatIndex = beatIndexAt(absoluteTime, beats) - beatIndexAt(sceneStart, beats);
  const wave = Math.sin(localTime * 3.2) * 5;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#4b2f48"}}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #4b3a5a 0%, #985e73 32%, #d18a86 57%, #2d3648 57.5%, #162735 100%)",
        }}
      />
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{position: "absolute", inset: 0}}
      >
        <defs>
          <clipPath id="starter-left-paper">
            <path d={`M 0 0 H ${leftEdge} ${tornEdge(leftEdge, 0, 1080, 1).replace("M", "L")} L 0 1080 Z`} />
          </clipPath>
          <clipPath id="starter-right-paper">
            <path d={`${tornEdge(rightEdge, 0, 1080, -1)} L 1920 1080 L 1920 0 Z`} />
          </clipPath>
        </defs>
        <Moon x={960} y={220} radius={120} glow={0.9} rotation={-3} />
        <path
          d="M -60 657 C 310 627 635 648 969 669 C 1263 687 1587 652 1980 621"
          fill="none"
          stroke={C.cream}
          strokeWidth="3"
          opacity=".18"
        />
        <g transform={`translate(${-gap * 0.33} 0)`}>
          <g clipPath="url(#starter-left-paper)">
            <path
              d="M -40 715 C 256 665 506 697 760 715 C 856 722 937 722 1015 716 L 1015 856 L -40 856 Z"
              fill="#24202d"
              filter="url(#paper-cut)"
            />
            <path
              d="M -40 748 C 295 713 572 744 881 760 L 881 1080 L -40 1080 Z"
              fill="#171621"
              filter="url(#paper-cut)"
            />
            <Girl x={622} y={753} scale={1.3} facing={-1} color="#15141b" waving />
          </g>
        </g>
        <g transform={`translate(${gap * 0.33} 0)`}>
          <g clipPath="url(#starter-right-paper)">
            <path
              d="M 818 928 C 1009 914 1245 932 1456 963 C 1626 987 1781 983 1980 948 L 1980 1090 L 818 1090 Z"
              fill="#15141c"
              filter="url(#paper-cut)"
            />
            <path
              d="M 862 753 C 1110 719 1352 744 1588 784 L 1588 894 C 1305 858 1055 856 862 880 Z"
              fill="#211c28"
              filter="url(#paper-cut)"
            />
            <g transform={`translate(0 ${wave})`}>
              <OrigamiBoat
                x={1260}
                y={812}
                scale={0.62}
                color="#0e1118"
                accent="#e3c999"
                boy
                lanternGlow={1.1 + Math.max(0, sceneBeatIndex) * 0.03}
              />
            </g>
          </g>
        </g>
        <PaperSpeckField time={absoluteTime} count={28} color="#f6d2ab" opacity={0.2} direction={-1} />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(28,13,27,.18), transparent 42%, rgba(18,11,21,.38))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.23} />
    </AbsoluteFill>
  );
};
