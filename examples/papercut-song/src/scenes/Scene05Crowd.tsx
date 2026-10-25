import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {
  beatIndex,
  clamp,
  easeInOutCubic,
  localBeatIndex,
  localBeatProgress,
} from "../timeline";
import {
  GrainOverlay,
  Lantern,
  Moon,
  PaperSpeckField,
  StarField,
  vignette,
} from "../components/Paper";

const PeopleRow: React.FC<{
  y: number;
  scale: number;
  color: string;
  direction: 1 | -1;
  beatNo: number;
  phase: number;
  step: number;
  count: number;
}> = ({y, scale, color, direction, beatNo, phase, step, count}) => {
  const width = 1960;
  const scroll = ((direction * (beatNo + easeInOutCubic(phase)) * step) % width + width) % width;
  return (
    <g transform={`translate(${direction > 0 ? -scroll : scroll - width} 0)`}>
      {Array.from({length: count * 2}, (_, i) => {
        const x = (i % count) * (width / count) + ((i * 71) % 67);
        const h = 0.7 + ((i * 3) % 7) * 0.055;
        const stride = Math.sin(phase * Math.PI * 2 + i * 1.31) * 5;
        return (
          <g key={`${beatNo}-${i}`} transform={`translate(${x} ${y}) scale(${scale})`}>
            <circle cx="0" cy={-84 * h} r={13 * h} fill={color} />
            <path
              d={`M ${-13 * h} ${-68 * h} Q 0 ${-77 * h} ${13 * h} ${-68 * h}
                  L ${18 * h} ${-18 * h} L ${7 * h} ${-16 * h} L ${4 * h} ${7 * h}
                  L ${13 * h + stride} ${75 * h} L ${3 * h} ${76 * h} L ${-3 * h} ${24 * h}
                  L ${-9 * h} ${76 * h} L ${-19 * h} ${74 * h} L ${-10 * h + stride} ${7 * h}
                  L ${-15 * h} ${-16 * h} L ${-22 * h} ${-18 * h} Z`}
              fill={color}
            />
          </g>
        );
      })}
    </g>
  );
};

export const Scene05Crowd: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sceneStart = 10.472;
  const beatNo = Math.max(0, localBeatIndex(t, sceneStart));
  const phase = localBeatProgress(t, sceneStart);
  const pulse = 1 - easeInOutCubic(clamp(phase / 0.2));
  const pan = easeInOutCubic(clamp(t / 3.4)) * -38;
  const moonLift = easeInOutCubic(clamp(t / 1.7)) * 32;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#8f5971"}}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #5e466a 0%, #9a5d73 30%, #d08387 57%, #e3a08f 68%, #3d2b45 68.2%, #2f233a 100%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(${pan} 0)`}>
          <StarField time={t + sceneStart} count={22} opacity={0.4} color="#ffe6cb" />
          <Moon x={1576} y={232 - moonLift} radius={106} glow={0.5} rotation={5} opacity={0.74} />

          <path
            d="M -100 570 C 260 534 510 550 804 574 C 1121 600 1473 565 2010 541"
            fill="none"
            stroke="#f3b9a2"
            strokeWidth="3"
            opacity=".21"
          />
          <path
            d="M -80 617 C 260 584 596 610 891 626 C 1212 644 1612 612 1992 583"
            fill="none"
            stroke="#ffe1c9"
            strokeWidth="2"
            opacity=".15"
          />

          <g opacity=".76">
            <PeopleRow y={625} scale={0.39} color="#885a6e" direction={-1} beatNo={beatNo} phase={phase} step={86} count={19} />
            <PeopleRow y={666} scale={0.48} color="#68435e" direction={1} beatNo={beatNo} phase={phase} step={112} count={15} />
            <PeopleRow y={718} scale={0.61} color="#4c314b" direction={-1} beatNo={beatNo} phase={phase} step={148} count={12} />
            <PeopleRow y={787} scale={0.78} color="#352238" direction={1} beatNo={beatNo} phase={phase} step={190} count={9} />
          </g>

          <path
            d="M -40 731 C 260 704 522 735 830 744 C 1105 752 1458 718 1960 689 L 1960 1090 L -40 1090 Z"
            fill="#221a2d"
            filter="url(#paper-cut)"
          />
          <path
            d="M -30 770 C 348 743 638 775 929 781 C 1219 787 1556 750 1942 727"
            fill="none"
            stroke="#7f5a67"
            strokeWidth="3"
            opacity=".44"
          />

          {Array.from({length: 8}, (_, i) => {
            const x = 85 + i * 270;
            return (
              <g key={i} transform={`translate(${x} 726)`}>
                <path d="M -4 0 V 118 M 4 0 V 118" stroke="#161220" strokeWidth="8" />
                <circle cx="0" cy="-11" r="11" fill="#171321" />
                {i % 2 === 0 ? <Lantern x={0} y={-55} scale={0.42} glow={0.7} opacity={0.84} /> : null}
              </g>
            );
          })}

          <g transform={`translate(0 ${-pulse * 4})`}>
            <path
              d="M 0 1010 C 308 947 622 972 966 1003 C 1244 1028 1553 1002 1920 949 L 1920 1090 L 0 1090 Z"
              fill="#17121e"
              filter="url(#paper-cut)"
            />
          </g>
          <PaperSpeckField time={t + sceneStart} count={20} color="#f5c7ac" opacity={0.22} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(40,22,43,.16), transparent 42%, rgba(24,13,22,.3))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.22} />
    </AbsoluteFill>
  );
};
