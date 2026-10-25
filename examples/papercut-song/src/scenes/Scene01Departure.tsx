import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {
  beatIndex,
  beatPulse,
  beatTime,
  clamp,
  easeInOutCubic,
  easeOutCubic,
} from "../timeline";
import {
  GrainOverlay,
  Lantern,
  Moon,
  OrigamiBoat,
  PaperSpeckField,
  StarField,
  vignette,
} from "../components/Paper";

const WAVE_COLORS = [
  "#0b2835",
  "#103441",
  "#15414d",
  "#1c5158",
  "#28615f",
  "#3d746a",
];

const wavePath = (base: number, amp: number, phase: number, slope: number) => {
  const points: string[] = [];
  for (let i = 0; i <= 18; i++) {
    const x = -80 + i * 116;
    const y =
      base +
      Math.sin(i * 0.82 + phase) * amp +
      Math.cos(i * 0.41 + phase * 0.6) * amp * 0.38 +
      i * slope;
    points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  return `${points.join(" ")} L 2000 1180 L -80 1180 Z`;
};

export const Scene01Departure: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const globalBeat = beatIndex(t);
  const boatRise = easeOutCubic(clamp((t - beatTime(6)) / 0.48));
  const camera = 1 + easeInOutCubic(clamp(t / 3.65)) * 0.055;
  const lanternPulse = 0.72 + beatPulse(t, 7) * 0.55;
  const lanternFlicker = 1 + Math.sin(t * 17.7) * 0.025 + Math.sin(t * 31.1) * 0.012;

  return (
    <AbsoluteFill style={{backgroundColor: C.night, overflow: "hidden"}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 35% 27%, #1b4350 0%, ${C.night2} 38%, ${C.night} 82%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(960 540) scale(${camera}) translate(-960 -540)`}>
          <StarField time={t} count={35} opacity={0.72} />
          <Moon x={542} y={328} radius={214} glow={1} rotation={-7} />

          <path
            d="M 85 602 C 350 570 625 588 858 617 C 1120 651 1452 606 1832 573"
            fill="none"
            stroke={C.mist}
            strokeWidth="3"
            opacity=".1"
          />
          <path
            d="M 102 620 C 410 599 662 612 896 638 C 1163 666 1496 632 1819 603"
            fill="none"
            stroke={C.cream}
            strokeWidth="1.5"
            opacity=".09"
          />

          {WAVE_COLORS.map((color, i) => {
            const entry = easeOutCubic(clamp((t - beatTime(i)) / 0.34));
            const baseY = 734 + i * 54;
            const lift = (1 - entry) * 145;
            const overshoot = Math.sin(entry * Math.PI) * (12 - i) + 1;
            return (
              <g
                key={color}
                opacity={0.42 + entry * 0.58}
                transform={`translate(0 ${lift - overshoot})`}
              >
                <path
                  d={wavePath(baseY, 28 + i * 4, i * 1.31, -i * 2.4)}
                  fill={color}
                  filter="url(#paper-cut)"
                />
                <path
                  d={wavePath(baseY - 9, 25 + i * 3, i * 1.31, -i * 2.4)}
                  fill="none"
                  stroke={i > 3 ? C.foam : C.seaLight}
                  strokeWidth={i > 4 ? 5 : 3}
                  opacity={0.15 + i * 0.04}
                />
              </g>
            );
          })}

          <g
            opacity={boatRise}
            transform={`translate(0 ${(1 - boatRise) * 175}) rotate(${Math.sin(t * 2.4) * 1.4} 1132 747)`}
          >
            <OrigamiBoat
              x={1128}
              y={770}
              scale={0.82}
              color={C.ink}
              accent={C.moon}
              boy
              lanternGlow={lanternPulse * lanternFlicker}
            />
          </g>

          <g opacity={0.3 * boatRise}>
            <Lantern x={1170} y={820} scale={1.2} glow={2.8} opacity={0.8} />
          </g>
          <PaperSpeckField time={t} count={22} opacity={0.27} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,8,14,.08), transparent 42%, rgba(2,10,15,.28))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.2} />
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 64,
          color: C.cream,
          opacity: 0.32,
          letterSpacing: "0.32em",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        PAPER TIDE · 01
      </div>
    </AbsoluteFill>
  );
};
