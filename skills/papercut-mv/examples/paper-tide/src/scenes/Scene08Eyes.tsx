import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {CUTS, clamp, easeInOutCubic} from "../timeline";
import {
  Boy,
  Girl,
  GrainOverlay,
  Moon,
  PaperSpeckField,
  StarField,
  vignette,
} from "../components/Paper";

const irisPath = "M 960 350 A 190 190 0 1 1 959.9 350 Z";
const eyePath =
  "M 202 545 C 408 283 669 182 961 183 C 1257 184 1517 293 1718 545 C 1471 765 1228 835 959 835 C 685 835 441 760 202 545 Z";

export const Scene08Eyes: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sceneStart = CUTS[7];
  const push = easeInOutCubic(clamp((t - 0.28) / 1.55));
  const zoom = 1.05 + push * 5.6;
  const innerOpacity = clamp((t - 0.15) / 0.85);
  const moonOpacity = clamp(1 - (t - 0.35) / 0.65);
  const eyeGlow = 0.5 + Math.sin(t * 5.2) * 0.035;
  const boatFloat = Math.sin(t * 2.2) * 3;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#07151e"}}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 51% 49%, #24434b 0%, #102832 31%, #07151e 72%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <clipPath id="eye-shape">
            <path d={eyePath} />
          </clipPath>
          <clipPath id="iris-shape">
            <circle cx="960" cy="545" r="192" />
          </clipPath>
          <radialGradient id="iris-depth" cx="38%" cy="32%" r="72%">
            <stop offset="0" stopColor="#b88e55" />
            <stop offset=".43" stopColor="#714e39" />
            <stop offset=".85" stopColor="#2b2b2d" />
            <stop offset="1" stopColor="#11181d" />
          </radialGradient>
        </defs>

        <StarField time={t + sceneStart} count={34} opacity={0.48} />
        <g opacity={moonOpacity}>
          <Moon x={248} y={222} radius={133} glow={1.1} rotation={-11} />
          <path d="M 307 320 C 403 379 516 441 611 485" fill="none" stroke={C.moon} strokeWidth="2" opacity=".26" strokeDasharray="7 13" />
        </g>

        <g transform={`translate(960 545) scale(${zoom}) translate(-960 -545)`}>
          <g clipPath="url(#eye-shape)">
            <path d={eyePath} fill="#e1c5aa" filter="url(#paper-cut)" />
            <path
              d="M 202 545 C 408 283 669 182 961 183 C 1257 184 1517 293 1718 545 C 1471 765 1228 835 959 835 C 685 835 441 760 202 545 Z"
              fill="none"
              stroke="#a17768"
              strokeWidth="18"
              opacity=".36"
            />
            <path
              d="M 233 535 C 444 300 685 213 959 213 C 1221 213 1455 303 1688 532 C 1447 713 1216 791 959 791 C 694 791 453 720 233 535 Z"
              fill="#f0dcc0"
              opacity=".18"
            />
            <g clipPath="url(#iris-shape)">
              <circle cx="960" cy="545" r="192" fill="url(#iris-depth)" />
              <circle cx="960" cy="545" r="192" fill="#5e7c74" opacity={innerOpacity * 0.24} />
              <g opacity={innerOpacity}>
                <rect x="780" y="310" width="380" height="470" fill="#19404a" />
                <StarField time={t + sceneStart} count={18} opacity={0.75} />
                <Moon x={960} y={485} radius={92} glow={1} rotation={3} />
                <path
                  d="M 773 604 C 849 581 905 592 965 601 C 1028 610 1082 595 1149 575 L 1149 684 L 773 684 Z"
                  fill="#0a1e27"
                  filter="url(#paper-cut)"
                />
                <g transform={`translate(960 ${565 + boatFloat}) scale(.34)`}>
                  <path d="M -154 19 C -78 36 82 36 154 14 L 141 50 C 69 67 -71 67 -141 48 Z" fill="#09141a" filter="url(#paper-cut)" />
                  <path d="M -38 28 L -9 -42 L 21 26 Z" fill="#09141a" />
                  <Boy x={-28} y={17} scale={0.52} facing={1} color="#071117" lantern lanternGlow={1.4} />
                  <Girl x={29} y={21} scale={0.5} facing={-1} color="#071117" waving={false} />
                </g>
                <path d="M 793 547 C 856 520 905 527 963 541 C 1023 556 1081 537 1128 520" fill="none" stroke="#e6c17d" strokeWidth="2" opacity=".25" />
              </g>
              <circle
                cx="960"
                cy="545"
                r="192"
                fill="none"
                stroke="#d5b171"
                strokeWidth="13"
                opacity={0.45 + eyeGlow * 0.2}
                filter="url(#paper-cut)"
              />
              <circle cx="893" cy="482" r="35" fill="#fff1c8" opacity=".75" filter="url(#soft-haze)" />
              <circle cx="882" cy="470" r="16" fill="#fff8dd" opacity=".94" />
              <circle cx="960" cy="545" r="116" fill="none" stroke="#c09160" strokeWidth="3" opacity=".18" />
            </g>
            <path
              d="M 204 545 C 420 282 687 183 960 184 C 1252 184 1508 292 1717 545"
              fill="none"
              stroke="#4c3031"
              strokeWidth="30"
              strokeLinecap="round"
              filter="url(#paper-cut)"
            />
            <path
              d="M 205 546 C 442 759 688 834 959 834 C 1229 834 1473 761 1717 546"
              fill="none"
              stroke="#7f4f48"
              strokeWidth="16"
              strokeLinecap="round"
              opacity=".7"
              filter="url(#paper-cut)"
            />
            {Array.from({length: 9}, (_, i) => {
              const x = 290 + i * 32;
              const y = 493 + i * 3.6;
              return <path key={i} d={`M ${x} ${y} L ${x - 53} ${y - 33 - (i % 3) * 9}`} stroke="#3a2427" strokeWidth="6" strokeLinecap="round" opacity=".78" />;
            })}
            {Array.from({length: 9}, (_, i) => {
              const x = 1640 - i * 30;
              const y = 500 + i * 2.7;
              return <path key={i} d={`M ${x} ${y} L ${x + 49} ${y - 27 - (i % 2) * 10}`} stroke="#3a2427" strokeWidth="5" strokeLinecap="round" opacity=".74" />;
            })}
          </g>
        </g>
        <PaperSpeckField time={t + sceneStart} count={22} color="#ffe2a7" opacity={0.2} direction={1} />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(3,10,15,.23), transparent 40%, transparent 72%, rgba(4,10,14,.34))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.24} />
    </AbsoluteFill>
  );
};
