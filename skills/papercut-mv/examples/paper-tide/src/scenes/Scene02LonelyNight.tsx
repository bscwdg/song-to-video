import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {
  CUTS,
  beatPulse,
  clamp,
  easeInOutCubic,
  easeOutCubic,
} from "../timeline";
import {
  CloudBank,
  GrainOverlay,
  Moon,
  OrigamiBoat,
  PaperSpeckField,
  StarField,
  vignette,
} from "../components/Paper";

const wave = (y: number, shift: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 18; i++) {
    const x = -100 + i * 116;
    const yy = y + Math.sin(i * 0.72 + shift) * 18 + Math.cos(i * 0.33) * 12;
    pts.push(`${i === 0 ? "M" : "L"} ${x} ${yy}`);
  }
  return `${pts.join(" ")} L 2020 1150 L -100 1150 Z`;
};

export const Scene02LonelyNight: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sceneStart = CUTS[1];
  const zoomOut = 1.18 - easeInOutCubic(clamp(t / 2.12)) * 0.18;
  const cloudPass = easeInOutCubic(clamp((t - 0.4) / 1.45));
  const lanternPulse = 0.62 + beatPulse(t + sceneStart, 5.6) * 0.8;
  const bob = Math.sin(t * 2.7) * 6;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#031018"}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 46% 21%, #153b4b 0%, ${C.night2} 34%, #06131d 80%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(960 540) scale(${zoomOut}) translate(-960 -540)`}>
          <StarField time={t + sceneStart} count={56} opacity={0.9} halfBeat={0.209} />
          <Moon x={964} y={270} radius={166} glow={0.8} rotation={4} opacity={0.92} />
          <CloudBank
            y={303}
            offset={cloudPass * 310 - 90}
            scale={0.82}
            color="#081925"
            opacity={0.78}
            seed={2.4}
          />
          <CloudBank
            y={370}
            offset={cloudPass * 220 - 220}
            scale={0.7}
            color="#0b202b"
            opacity={0.9}
            seed={5.1}
          />
          <path d={wave(685, 0.4)} fill="#0a2734" filter="url(#paper-cut)" />
          <path d={wave(752, 2.1)} fill="#0e3442" filter="url(#paper-cut)" />
          <path d={wave(835, 3.2)} fill="#123f4b" filter="url(#paper-cut)" />
          <path d={wave(930, 4.4)} fill="#174854" filter="url(#paper-cut)" />

          <g transform={`translate(0 ${bob})`}>
            <g opacity={0.5} filter="url(#soft-haze)">
              <ellipse cx="972" cy="786" rx="170" ry="48" fill={C.lantern} opacity={lanternPulse * 0.38} />
            </g>
            <OrigamiBoat
              x={972}
              y={797}
              scale={0.42}
              color="#101e27"
              accent={C.moon}
              boy
              lanternGlow={lanternPulse}
            />
            <circle cx="1001" cy="778" r={13 * lanternPulse} fill={C.lantern} filter="url(#soft-haze)" />
          </g>

          <PaperSpeckField time={t + sceneStart} count={15} opacity={0.18} direction={1} />
        </g>
        <rect width="1920" height="1080" fill="url(#soft-haze)" opacity=".035" />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(1,6,10,.42) 0%, transparent 32%, transparent 65%, rgba(1,7,12,.4) 100%)",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.24} />
    </AbsoluteFill>
  );
};
