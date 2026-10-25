import React from "react";
import {C} from "../theme";
import {clamp} from "../timeline";

export const beatsInScene = (
  sceneStart: number,
  sceneDuration: number,
  beats: number[],
) =>
  beats.filter(
    (beat) => beat >= sceneStart - 0.001 && beat < sceneStart + sceneDuration,
  );

export const beatEntry = (
  time: number,
  beat: number | undefined,
  duration = 0.38,
) =>
  beat === undefined ? 1 : clamp((time - beat) / Math.max(duration, 0.001));

export const PaperFigure: React.FC<{
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  kind?: "bride" | "groom" | "parent" | "old" | "guest";
  color?: string;
  accent?: string;
  opacity?: number;
  arm?: number;
}> = ({
  x,
  y,
  scale = 1,
  facing = 1,
  kind = "guest",
  color = C.ink,
  accent = C.gold,
  opacity = 1,
  arm = 0,
}) => {
  if (kind === "bride") {
    return (
      <g
        transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}
        opacity={opacity}
        filter="url(#paper-cut)"
      >
        <path
          d="M -35 -195 C -44 -168 -36 -144 -22 -123 L 24 -123 C 37 -148 43 -174 33 -196 C 17 -214 -16 -214 -35 -195 Z"
          fill={C.cream}
        />
        <circle cx="0" cy="-202" r="27" fill={C.skin} />
        <path
          d="M -33 -214 C -21 -243 22 -243 35 -213 C 14 -222 -15 -223 -33 -214 Z"
          fill={color}
        />
        <path
          d="M -44 -195 C -61 -150 -59 -115 -51 -75 L -92 17 C -52 35 52 35 93 17 L 49 -75 C 58 -122 56 -161 43 -195 Z"
          fill={C.paper}
        />
        <path
          d="M -87 14 C -51 29 50 30 89 13 L 104 36 C 58 53 -56 53 -101 35 Z"
          fill={accent}
          opacity=".64"
        />
        <path
          d="M 38 -155 C 64 -140 78 -117 82 -93"
          fill="none"
          stroke={C.skin}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <g transform={`translate(79 -80) rotate(${arm * 8})`}>
          <circle r="17" fill={C.rose} />
          <circle cx="-8" cy="-8" r="11" fill={C.blush} />
          <circle cx="9" cy="-7" r="10" fill={C.goldPale} />
          <circle cx="2" cy="8" r="9" fill={C.roseDeep} />
        </g>
      </g>
    );
  }

  if (kind === "groom") {
    return (
      <g
        transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}
        opacity={opacity}
        filter="url(#paper-cut)"
      >
        <circle cx="0" cy="-201" r="27" fill={C.skin} />
        <path
          d="M -29 -218 C -10 -240 19 -238 32 -215 C 12 -225 -10 -226 -29 -218 Z"
          fill={color}
        />
        <path
          d="M -45 -181 C -21 -194 20 -194 45 -181 L 57 -52 L 26 -46 L 12 -158 L 1 -46 L -29 -52 Z"
          fill={color}
        />
        <path d="M -26 -182 L 0 -167 L 26 -182 L 22 -142 L 0 -126 L -22 -142 Z" fill={C.cream} />
        <path d="M -7 -179 L 7 -179 L 11 -164 L 0 -156 L -11 -164 Z" fill={C.red} />
        <path
          d="M 42 -159 C 65 -143 76 -120 80 -98"
          fill="none"
          stroke={color}
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path d="M -24 -47 L -37 25 L -12 27 L 1 -28 L 17 27 L 41 22 L 26 -49 Z" fill={C.night} />
        <path d="M -41 20 L -53 35 L -23 38 L -14 24 Z" fill={C.night} />
        <path d="M 22 22 L 47 35 L 57 23 L 40 13 Z" fill={C.night} />
      </g>
    );
  }

  if (kind === "parent") {
    return (
      <g
        transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}
        opacity={opacity}
        filter="url(#paper-cut)"
      >
        <circle cx="0" cy="-125" r="23" fill={C.skin} />
        <path
          d="M -23 -139 C -8 -154 13 -152 24 -136 C 7 -143 -8 -144 -23 -139 Z"
          fill={C.mist}
        />
        <path
          d="M -38 -115 C -14 -127 17 -127 38 -113 L 52 18 L 28 22 L 14 -59 L 1 22 L -28 20 Z"
          fill={color}
        />
        <path
          d="M -37 -95 C -55 -80 -64 -55 -64 -31"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 36 -96 C 51 -82 58 -64 60 -44"
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path d="M 58 -4 L 64 20" stroke={C.gold} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }

  if (kind === "old") {
    return (
      <g
        transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}
        opacity={opacity}
        filter="url(#paper-cut)"
      >
        <circle cx="3" cy="-129" r="23" fill={color} />
        <path
          d="M -21 -145 C -3 -157 20 -151 29 -132 L 20 -119 L -24 -121 Z"
          fill={C.inkSoft}
        />
        <path
          d="M -25 -113 C -10 -123 17 -119 32 -103 C 42 -83 44 -51 42 -20 L 24 -13 L 11 -79 L 4 -7 L -24 -9 C -31 -49 -37 -86 -25 -113 Z"
          fill={color}
        />
        <path
          d="M 31 -88 C 47 -74 54 -59 54 -42"
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M -21 -87 C -38 -75 -48 -60 -50 -44"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}
      opacity={opacity}
      filter="url(#paper-cut)"
    >
      <circle cx="0" cy="-118" r="21" fill={color} />
      <path
        d="M -31 -103 C -10 -116 13 -115 31 -101 L 38 16 L 16 19 L 5 -45 L -4 19 L -29 16 Z"
        fill={color}
      />
      <path d="M 30 -86 C 43 -74 49 -59 50 -43" fill="none" stroke={color} strokeWidth="10" />
      <path d="M -30 -86 C -43 -74 -49 -59 -50 -43" fill="none" stroke={color} strokeWidth="10" />
    </g>
  );
};

export const Banknote: React.FC<{
  x: number;
  y: number;
  width?: number;
  rotation?: number;
  color?: string;
  accent?: string;
  opacity?: number;
  scale?: number;
}> = ({
  x,
  y,
  width = 156,
  rotation = 0,
  color = "#d7b46d",
  accent = "#6d472e",
  opacity = 1,
  scale = 1,
}) => {
  const height = width * 0.48;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
      opacity={opacity}
      filter="url(#paper-shadow-close)"
    >
      <path
        d={`M ${-width / 2} ${-height * 0.43}
            L ${width * 0.43} ${-height / 2}
            L ${width / 2} ${-height * 0.35}
            L ${width * 0.46} ${height * 0.47}
            L ${-width * 0.4} ${height / 2}
            L ${-width / 2} ${height * 0.32} Z`}
        fill={color}
        filter="url(#paper-cut)"
      />
      <rect
        x={-width * 0.44}
        y={-height * 0.34}
        width={width * 0.88}
        height={height * 0.68}
        rx={height * 0.09}
        fill="none"
        stroke={accent}
        strokeWidth={width * 0.012}
        opacity=".7"
      />
      <ellipse
        cx={-width * 0.24}
        cy="0"
        rx={width * 0.1}
        ry={height * 0.2}
        fill={accent}
        opacity=".55"
      />
      <path
        d={`M ${width * 0.08} ${-height * 0.2} h ${width * 0.25}
            v ${height * 0.4} h ${-width * 0.25} Z`}
        fill="none"
        stroke={accent}
        strokeWidth={width * 0.01}
        opacity=".4"
      />
      <text
        x={width * 0.2}
        y={height * 0.11}
        textAnchor="middle"
        fill={accent}
        fontFamily="Georgia, serif"
        fontWeight="700"
        fontSize={height * 0.34}
        opacity=".74"
      >
        ¥
      </text>
    </g>
  );
};

export const Coin: React.FC<{
  x: number;
  y: number;
  radius: number;
  rotation?: number;
  color?: string;
  accent?: string;
  opacity?: number;
}> = ({x, y, radius, rotation = 0, color = C.gold, accent = C.amber, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotation})`} opacity={opacity} filter="url(#paper-shadow-close)">
    <circle r={radius} fill={color} filter="url(#paper-cut)" />
    <circle r={radius * 0.78} fill="none" stroke={accent} strokeWidth={radius * 0.08} opacity=".52" />
    <rect
      x={-radius * 0.21}
      y={-radius * 0.21}
      width={radius * 0.42}
      height={radius * 0.42}
      fill="none"
      stroke={accent}
      strokeWidth={radius * 0.08}
      opacity=".6"
    />
  </g>
);

export const PaperFlower: React.FC<{
  x: number;
  y: number;
  radius?: number;
  color?: string;
  center?: string;
  rotation?: number;
}> = ({x, y, radius = 18, color = C.blush, center = C.gold, rotation = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotation})`} filter="url(#paper-cut)">
    {Array.from({length: 5}, (_, index) => {
      const angle = (Math.PI * 2 * index) / 5;
      return (
        <ellipse
          key={index}
          cx={Math.cos(angle) * radius * 0.8}
          cy={Math.sin(angle) * radius * 0.8}
          rx={radius * 0.58}
          ry={radius * 0.38}
          fill={color}
          transform={`rotate(${(angle * 180) / Math.PI} ${Math.cos(angle) * radius * 0.8} ${Math.sin(angle) * radius * 0.8})`}
        />
      );
    })}
    <circle r={radius * 0.35} fill={center} />
  </g>
);

export const WeddingArch: React.FC<{
  x: number;
  y: number;
  scale?: number;
  color?: string;
  accent?: string;
  opacity?: number;
}> = ({x, y, scale = 1, color = C.cream, accent = C.rose, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <path
      d="M -330 0 L -330 -330 C -330 -560 330 -560 330 -330 L 330 0 L 242 0 L 242 -330 C 242 -488 -242 -488 -242 -330 L -242 0 Z"
      fill={color}
      filter="url(#paper-shadow)"
    />
    <path
      d="M -296 -322 C -296 -500 296 -500 296 -322"
      fill="none"
      stroke={accent}
      strokeWidth="12"
      opacity=".55"
      filter="url(#paper-cut)"
    />
    {Array.from({length: 9}, (_, index) => {
      const angle = Math.PI * (0.1 + index * 0.1);
      return (
        <PaperFlower
          key={index}
          x={Math.cos(angle) * 300}
          y={-330 - Math.sin(angle) * 145}
          radius={18 + (index % 3) * 5}
          color={index % 2 === 0 ? C.rose : C.blush}
          rotation={index * 31}
        />
      );
    })}
  </g>
);

export const Cup: React.FC<{
  x: number;
  y: number;
  scale?: number;
  color?: string;
  accent?: string;
  rotation?: number;
}> = ({x, y, scale = 1, color = C.cream, accent = C.gold, rotation = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} filter="url(#paper-shadow-close)">
    <path
      d="M -36 -74 L 36 -74 L 26 -14 L -26 -14 Z"
      fill={color}
      filter="url(#paper-cut)"
    />
    <path d="M 26 -14 L 31 47 L -31 47 L -26 -14 Z" fill={color} filter="url(#paper-cut)" />
    <path d="M -43 47 L 43 47 L 51 60 L -51 60 Z" fill={accent} filter="url(#paper-cut)" />
    <path d="M -31 -66 L 31 -66" stroke={accent} strokeWidth="5" opacity=".55" />
  </g>
);

export const House: React.FC<{
  x: number;
  y: number;
  scale?: number;
  lit?: number;
  progress?: number;
  color?: string;
  accent?: string;
}> = ({x, y, scale = 1, lit = 0, progress = 1, color = C.paper, accent = C.gold}) => {
  const windows = [
    {x: -164, y: -350},
    {x: 74, y: -350},
    {x: -164, y: -205},
    {x: 74, y: -205},
    {x: -45, y: -98},
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M -250 0 L -250 -408 L 0 -545 L 250 -408 L 250 0 Z"
        fill={color}
        filter="url(#paper-shadow)"
      />
      <path
        d="M -285 -402 L 0 -585 L 285 -402 L 250 -370 L 0 -520 L -250 -370 Z"
        fill={C.redDeep}
        filter="url(#paper-cut)"
      />
      <path
        d="M -225 -395 L -225 -36 L 225 -36 L 225 -395"
        fill="none"
        stroke={C.paperWarm}
        strokeWidth="10"
        opacity=".4"
      />
      {windows.map((window, index) => {
        const on = index < lit;
        return (
          <g key={index} transform={`translate(${window.x} ${window.y})`}>
            <rect width="92" height="92" fill={on ? accent : C.inkSoft} opacity={on ? 0.9 : 0.55} filter="url(#paper-cut)" />
            <path d="M 0 46 H 92 M 46 0 V 92" stroke={C.inkSoft} strokeWidth="5" opacity=".45" />
            {on ? <PaperFigure x={46} y={90} scale={0.24} color={C.inkSoft} opacity={0.7} /> : null}
          </g>
        );
      })}
      <path
        d="M -46 0 L -46 -102 L 46 -102 L 46 0 Z"
        fill={C.wine}
        filter="url(#paper-cut)"
      />
      <circle cx="28" cy="-50" r="5" fill={accent} />
      <path
        d="M -250 0 H 250 L 275 28 H -275 Z"
        fill={C.jadeDeep}
        opacity={clamp(progress)}
        filter="url(#paper-cut)"
      />
    </g>
  );
};

export const Doorway: React.FC<{
  x: number;
  y: number;
  scale?: number;
  open?: number;
  color?: string;
}> = ({x, y, scale = 1, open = 1, color = C.goldPale}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path
      d="M -150 0 L -150 -250 C -150 -390 150 -390 150 -250 L 150 0 Z"
      fill={color}
      opacity={0.12 + open * 0.35}
      filter="url(#soft-haze)"
    />
    <path
      d="M -130 0 L -130 -246 C -130 -355 130 -355 130 -246 L 130 0 Z"
      fill={C.night}
      opacity=".88"
      filter="url(#paper-cut)"
    />
    <path
      d="M -108 0 L -108 -241 C -108 -326 108 -326 108 -241 L 108 0 Z"
      fill="url(#door-light)"
      opacity={open}
    />
    <path
      d="M -146 0 L -146 -250 C -146 -365 146 -365 146 -250"
      fill="none"
      stroke={C.cream}
      strokeWidth="8"
      opacity=".45"
      filter="url(#paper-cut)"
    />
  </g>
);

export const PaperTearStrip: React.FC<{
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
}> = ({x, y, width = 12, height = 180, color = C.cream, opacity = 0.8, rotation = 0}) => (
  <path
    d={`M ${x} ${y}
        l ${width * 0.5} 18 l ${-width * 0.2} 26 l ${width * 0.45} 31
        l ${-width * 0.3} 34 l ${width * 0.3} ${height - 109} l ${-width * 0.8} 0
        l ${width * 0.2} ${-height + 108} l ${-width * 0.4} -29 l ${width * 0.2} -35
        l ${-width * 0.3} -32 Z`}
    fill={color}
    opacity={opacity}
    transform={`rotate(${rotation} ${x} ${y})`}
    filter="url(#paper-cut)"
  />
);

export const PaperBokeh: React.FC<{
  time: number;
  count?: number;
  color?: string;
  opacity?: number;
}> = ({time, count = 24, color = C.goldPale, opacity = 0.24}) => (
  <g opacity={opacity}>
    {Array.from({length: count}, (_, index) => {
      const x = ((index * 347 + 71) % 1860) + 30;
      const y = 80 + ((index * 191 + 53) % 820);
      const radius = 12 + (index % 7) * 8;
      const drift = Math.sin(time * 0.8 + index) * 14;
      return (
        <g key={index} transform={`translate(${x + drift} ${y})`}>
          <circle r={radius} fill={color} opacity={0.06 + (index % 4) * 0.025} />
          <circle r={radius * 0.5} fill={color} opacity={0.08} />
        </g>
      );
    })}
  </g>
);
