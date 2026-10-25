import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {CUTS, clamp, easeInOutCubic, easeOutCubic, localBeatIndex, localBeatProgress} from "../timeline";
import {Boy, Girl, GrainOverlay, PaperSpeckField, vignette} from "../components/Paper";

export const Scene03Longing: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sceneStart = CUTS[2];
  const warmth = easeInOutCubic(clamp(t / 1.72));
  const beatNo = Math.max(0, localBeatIndex(t, sceneStart));
  const beatHit = 1 - localBeatProgress(t, sceneStart);
  const scale = 0.86 + Math.min(3, beatNo) * 0.045 + easeOutCubic(clamp(beatHit / 0.28)) * 0.018;
  const float = Math.sin(t * 2.4) * 7;
  const bubbleOpen = easeOutCubic(clamp((t - 0.18) / 0.54));

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#071821"}}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(154deg,
            hsl(${198 - warmth * 166} 30% ${12 + warmth * 8}%) 0%,
            hsl(${194 - warmth * 154} 31% ${17 + warmth * 10}%) 56%,
            hsl(${188 - warmth * 143} 26% ${22 + warmth * 11}%) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 29% 30%, rgba(246,190,105,${warmth * 0.22}), transparent 32%),
            radial-gradient(circle at 74% 76%, rgba(207,113,78,${warmth * 0.16}), transparent 33%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(0 ${float})`}>
          <g
            transform={`translate(1025 955) scale(${scale}) translate(-1025 -955)`}
            opacity={0.98}
          >
            <Boy
              x={1050}
              y={936}
              scale={4.15}
              facing={-1}
              color={warmth > 0.6 ? "#141b1e" : "#0c1820"}
              lantern
              lanternGlow={0.8 + warmth * 1.2}
            />
          </g>

          <g
            opacity={bubbleOpen}
            transform={`translate(0 ${(1 - bubbleOpen) * 90}) scale(${0.82 + bubbleOpen * 0.18})`}
            style={{transformOrigin: "650px 350px"}}
          >
            <path
              d="M 522 198 C 579 87 711 57 832 101 C 938 139 1007 227 973 325 C 936 430 797 470 674 439 C 556 409 464 316 522 198 Z"
              fill={warmth > 0.65 ? "#e8c98d" : "#c9d5cd"}
              opacity=".17"
              filter="url(#soft-haze)"
            />
            <path
              d="M 502 188 C 575 64 728 45 854 99 C 969 149 1015 259 954 350 C 899 432 754 464 630 423 C 514 385 438 295 502 188 Z"
              fill="none"
              stroke="#f8e7bd"
              strokeWidth="10"
              opacity={0.62 + warmth * 0.16}
              filter="url(#paper-cut)"
            />
            <path
              d="M 635 424 C 616 474 577 508 521 519 C 555 476 563 445 556 418"
              fill="none"
              stroke="#f8e7bd"
              strokeWidth="9"
              opacity=".54"
              filter="url(#paper-cut)"
            />
            <circle cx="777" cy="256" r="118" fill="#f4d79f" opacity={0.25 + warmth * 0.28} filter="url(#soft-haze)" />
            <Girl
              x={777}
              y={355}
              scale={2.02}
              facing={-1}
              color={warmth > 0.5 ? "#593f3d" : "#415363"}
              waving={false}
            />
            <path
              d="M 585 360 C 647 294 732 275 841 290"
              fill="none"
              stroke="#ffe9b6"
              strokeWidth="3"
              opacity=".32"
            />
            <path
              d="M 618 386 C 700 321 801 320 900 350"
              fill="none"
              stroke="#ffe9b6"
              strokeWidth="2"
              opacity=".21"
            />
          </g>

          <g opacity={0.28 + warmth * 0.24}>
            <path
              d="M -40 1020 C 238 961 434 977 650 1027 C 852 1073 1082 1030 1254 1007 C 1448 981 1722 1002 1962 1057 L 1962 1120 L -40 1120 Z"
              fill="#d09b63"
              filter="url(#paper-cut)"
            />
            <path
              d="M -30 1059 C 350 1011 592 1052 829 1075 C 1122 1103 1389 1029 1650 1048 C 1772 1057 1872 1077 1960 1101"
              fill="none"
              stroke="#f5dba8"
              strokeWidth="5"
              opacity=".34"
            />
          </g>
          <PaperSpeckField time={t + sceneStart} count={18} opacity={0.24} direction={1} />
        </g>
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,8,12,.28), transparent 26%, transparent 68%, rgba(46,20,20,.16))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.25} />
    </AbsoluteFill>
  );
};
