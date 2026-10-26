import React from "react";
import {AbsoluteFill} from "remotion";
import {clamp} from "../timeline";

export const PaintDefs: React.FC = () => (
  <svg width="0" height="0" style={{position: "absolute"}} aria-hidden>
    <defs>
      <filter id="watercolor-bleed" x="-40%" y="-40%" width="180%" height="180%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.03"
          numOctaves="3"
          seed="8"
          result="noise"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" />
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <filter id="ink-boil" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.02 0.09"
          numOctaves="2"
          seed="4"
          result="noise"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
      </filter>
      <filter id="paper-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="2"
          seed="12"
        />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.18" />
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>
);

export const PaperBackground: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <>
    <rect width="1920" height="1080" fill="#f5ead5" />
    <rect
      width="1920"
      height="1080"
      fill="#f5ead5"
      filter="url(#paper-grain)"
      opacity={0.55 * opacity}
    />
  </>
);

export const WatercolorBlob: React.FC<{
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: string;
  opacity?: number;
}> = ({x, y, rx, ry, color, opacity = 0.32}) => (
  <ellipse
    cx={x}
    cy={y}
    rx={rx}
    ry={ry}
    fill={color}
    opacity={opacity}
    filter="url(#watercolor-bleed)"
  />
);

export const InkLine: React.FC<{
  d: string;
  color?: string;
  width?: number;
  reveal?: number;
  opacity?: number;
  fill?: string;
}> = ({
  d,
  color = "#20252a",
  width = 5,
  reveal = 1,
  opacity = 1,
  fill = "none",
}) => (
  <path
    d={d}
    pathLength={1}
    fill={fill}
    stroke={color}
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray="1 1"
    strokeDashoffset={1 - clamp(reveal)}
    opacity={opacity}
    filter="url(#ink-boil)"
  />
);

export const PaintedFigure: React.FC<{
  x: number;
  y: number;
  scale?: number;
  time: number;
  facing?: 1 | -1;
  opacity?: number;
}> = ({x, y, scale = 1, time, facing = 1, opacity = 1}) => {
  const step = Math.sin(time * 7) * 9;
  const bob = Math.sin(time * 7) * 3;
  return (
    <g
      transform={`translate(${x} ${y + bob}) scale(${scale * facing} ${scale})`}
      opacity={opacity}
      filter="url(#ink-boil)"
    >
      <circle cx="0" cy="-105" r="27" fill="#d9765f" />
      <path
        d="M -31 -83 C -9 -96 22 -92 34 -70 L 38 35 L 15 38 L 4 -18 L -8 38 L -32 34 Z"
        fill="#5c8f9b"
      />
      <path
        d="M 27 -62 C 49 -54 60 -37 63 -18"
        fill="none"
        stroke="#20252a"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={`M -18 34 L ${-38 + step} 105 M 15 35 L ${30 - step} 106`}
        stroke="#20252a"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d={`M -4 12 C 18 ${18 + step * 0.2} 38 12 52 0`}
        fill="none"
        stroke="#d9a441"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </g>
  );
};

export const WatercolorFlower: React.FC<{
  x: number;
  y: number;
  scale: number;
  time: number;
  accent?: string;
}> = ({x, y, scale, time, accent = "#d9765f"}) => (
  <g
    transform={`translate(${x} ${y}) scale(${scale}) rotate(${Math.sin(time * 0.8) * 4})`}
    filter="url(#watercolor-bleed)"
    opacity=".8"
  >
    {Array.from({length: 6}, (_, index) => {
      const angle = (Math.PI * 2 * index) / 6;
      return (
        <ellipse
          key={index}
          cx={Math.cos(angle) * 28}
          cy={Math.sin(angle) * 28}
          rx="25"
          ry="14"
          fill={index % 2 === 0 ? accent : "#d9a441"}
        />
      );
    })}
    <circle r="13" fill="#f5ead5" />
  </g>
);

export const SceneFrame: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: "#f5ead5", overflow: "hidden"}}>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
      {children}
    </svg>
  </AbsoluteFill>
);
