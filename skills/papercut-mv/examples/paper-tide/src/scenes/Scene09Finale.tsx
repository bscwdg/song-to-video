import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {
  CUTS,
  clamp,
  easeInOutCubic,
  easeOutCubic,
  localBeatIndex,
  localBeatProgress,
} from "../timeline";
import {
  GrainOverlay,
  Moon,
  OrigamiBoat,
  PaperSpeckField,
  StarField,
  vignette,
} from "../components/Paper";

const ringPath = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const a = (i / 80) * Math.PI * 2;
    const rr = r + Math.sin(i * 0.91) * 8 + Math.cos(i * 0.37) * 6;
    pts.push(`${i === 0 ? "M" : "L"} ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`);
  }
  return `${pts.join(" ")} Z`;
};

export const Scene09Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sceneStart = CUTS[8];
  const beatNo = Math.max(0, localBeatIndex(t, sceneStart));
  const phase = localBeatProgress(t, sceneStart);
  const sail = easeInOutCubic(clamp(t / 1.52));
  const fade = 1 - easeInOutCubic(clamp((t - 1.46) / 0.21));
  const boatX = 590 + sail * 308;
  const boatY = 876 - sail * 248;
  const boatScale = 0.48 - sail * 0.21;
  const spin = t * 2.2;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#020b12", opacity: fade}}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 53%, #173c46 0%, #0a2531 27%, #06141d 68%, #030a10 100%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <StarField time={t + sceneStart} count={42} opacity={0.5} />
        <ellipse cx="960" cy="598" rx="492" ry="492" fill="#d6b870" opacity=".06" filter="url(#soft-haze)" />
        <Moon x={960} y={584} radius={285} glow={1.5} rotation={spin} opacity={0.9} />

        {Array.from({length: 6}, (_, i) => {
          const myBeat = Math.max(0, beatNo - i + 1);
          const fallP = clamp((beatNo - (5 - i) + phase) / 1.5);
          const show = i <= 4 + beatNo;
          const drop = i < 5 ? easeInOutCubic(fallP) * (210 + i * 36) : 0;
          const opacity = show ? 0.58 - i * 0.05 : 0.12;
          return (
            <g
              key={i}
              opacity={opacity}
              transform={`translate(0 ${drop + i * 24})`}
              filter="url(#paper-cut)"
            >
              <path d={ringPath(960, 584, 345 + i * 82)} fill="none" stroke={i % 2 ? "#1c4a55" : "#11343f"} strokeWidth={42 - i * 3} />
              <path d={ringPath(960, 584, 345 + i * 82)} fill="none" stroke={C.foam} strokeWidth="2" opacity=".14" />
            </g>
          );
        })}

        <g opacity={0.74}>
          <path
            d="M -50 979 C 322 911 665 936 952 994 C 1242 1053 1577 1009 1971 940 L 1971 1100 L -50 1100 Z"
            fill="#071923"
            filter="url(#paper-cut)"
          />
          <path
            d="M -50 1024 C 330 966 663 989 955 1034 C 1261 1082 1604 1042 1971 984"
            fill="none"
            stroke="#39646b"
            strokeWidth="4"
            opacity=".28"
          />
        </g>

        <g transform={`translate(${boatX} ${boatY}) rotate(${-22 + sail * 16}) scale(${boatScale})`}>
          <path d="M -330 128 C -148 172 174 170 342 122" fill="none" stroke={C.foam} strokeWidth="5" opacity=".16" />
          <OriginBoatHero />
        </g>

        {Array.from({length: 4}, (_, i) => {
          const start = 0.14 + i * 0.418;
          const p = easeOutCubic(clamp((t - start) / 0.84));
          return (
            <g key={i} opacity={0.42 * (1 - p)} transform={`translate(${420 + i * 350} ${760 - p * 460}) rotate(${i * 13 + t * 7})`}>
              <path d="M 0 0 Q 48 -17 92 2 Q 52 34 0 0 Z" fill="#f2d9a5" filter="url(#paper-cut)" />
            </g>
          );
        })}
        <PaperSpeckField time={t + sceneStart} count={42} color="#f5ddad" opacity={0.34} direction={-1} />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(1,6,10,.2), transparent 43%, transparent 68%, rgba(1,6,10,.5))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.24} />
    </AbsoluteFill>
  );
};

const OriginBoatHero: React.FC = () => (
  <g>
    <OrigamiBoat x={0} y={0} scale={1} color="#07141b" accent={C.moon} boy lanternGlow={1.6} />
    <circle cx="40" cy="-70" r="30" fill={C.lantern} opacity=".18" filter="url(#soft-haze)" />
  </g>
);
