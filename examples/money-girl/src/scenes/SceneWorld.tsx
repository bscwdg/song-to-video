import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {
  beatPulseAt,
  clamp,
  easeInOutCubic,
  easeOutCubic,
  type SceneProps,
} from "../timeline";
import {
  GrainOverlay,
  Moon,
  OrigamiBoat,
  PaperSpeckField,
  StarField,
  vignette,
} from "../components/Paper";

const wavePath = (base: number, amplitude: number, phase: number) => {
  const points: string[] = [];
  for (let i = 0; i <= 18; i++) {
    const x = -80 + i * 116;
    const y =
      base +
      Math.sin(i * 0.8 + phase) * amplitude +
      Math.cos(i * 0.35 + phase * 0.7) * amplitude * 0.35;
    points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  return `${points.join(" ")} L 2000 1120 L -80 1120 Z`;
};

const WAVE_COLORS = ["#0b2835", "#103441", "#15414d", "#1c5158", "#28615f"];

/**
 * Generic "establish the world" shot.
 * Replace the art, keep the beat-driven layer reveal and scene prop contract.
 */
export const SceneWorld: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localTime = frame / fps;
  const absoluteTime = sceneStart + localTime;
  const sceneBeats = beats.filter(
    (beat) => beat >= sceneStart - 0.001 && beat < sceneStart + sceneDuration,
  );
  const boatBeat = sceneBeats[Math.min(4, Math.max(0, sceneBeats.length - 1))] ?? sceneStart;
  const boatRise = easeOutCubic(clamp((absoluteTime - boatBeat) / 0.42));
  const camera = 1 + easeInOutCubic(clamp(localTime / sceneDuration)) * 0.05;
  const pulse = beatPulseAt(absoluteTime, beats, 7);

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: C.night}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 36% 28%, #183e4a 0%, ${C.night2} 42%, ${C.night} 84%)`,
        }}
      />
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{position: "absolute", inset: 0}}
      >
        <g transform={`translate(960 540) scale(${camera}) translate(-960 -540)`}>
          <StarField time={absoluteTime} count={34} opacity={0.7} />
          <Moon x={520} y={318} radius={210} glow={0.9} rotation={-6} />
          {WAVE_COLORS.map((color, index) => {
            const start =
              sceneBeats[Math.min(index, Math.max(0, sceneBeats.length - 1))] ?? sceneStart;
            const entry = easeOutCubic(clamp((absoluteTime - start) / 0.34));
            const lift = (1 - entry) * 120;
            return (
              <path
                key={color}
                d={wavePath(744 + index * 63, 26 + index * 3, index * 1.1)}
                fill={color}
                opacity={0.35 + entry * 0.65}
                transform={`translate(0 ${lift})`}
                filter="url(#paper-cut)"
              />
            );
          })}
          <g opacity={boatRise} transform={`translate(0 ${(1 - boatRise) * 150})`}>
            <OrigamiBoat
              x={1140}
              y={775}
              scale={0.78}
              color={C.ink}
              accent={C.moon}
              boy
              lanternGlow={0.8 + pulse * 0.8}
            />
          </g>
          <PaperSpeckField time={absoluteTime} count={22} opacity={0.25} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,8,14,.08), transparent 42%, rgba(2,10,15,.32))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.2} />
    </AbsoluteFill>
  );
};
