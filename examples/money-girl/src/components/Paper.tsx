import React from "react";
import {AbsoluteFill, interpolate} from "remotion";
import {C, PAPER_SHADOW} from "../theme";
import {clamp} from "../timeline";

export const PaperDefs: React.FC = () => {
  return (
    <svg
      width="0"
      height="0"
      style={{position: "absolute", pointerEvents: "none"}}
      aria-hidden
    >
      <defs>
        <filter
          id="paper-cut"
          x="-12%"
          y="-12%"
          width="124%"
          height="124%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.065"
            numOctaves="2"
            seed="11"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="paper-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow
            dx="0"
            dy="16"
            stdDeviation="14"
            floodColor={C.shadow}
            floodOpacity=".34"
          />
        </filter>
        <filter id="paper-shadow-close" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="7"
            floodColor={C.shadow}
            floodOpacity=".42"
          />
        </filter>
        <filter id="lantern-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="soft-haze" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="32" />
        </filter>
        <filter id="tiny-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".92"
            numOctaves="2"
            seed="5"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .22 0"
          />
        </filter>
        <radialGradient id="moon-paper" cx="35%" cy="30%" r="76%">
          <stop offset="0" stopColor="#fff4d2" />
          <stop offset=".62" stopColor={C.moon} />
          <stop offset="1" stopColor={C.moonDeep} />
        </radialGradient>
        <radialGradient id="lantern-paper" cx="42%" cy="34%" r="70%">
          <stop offset="0" stopColor="#fff4b5" />
          <stop offset=".5" stopColor={C.lantern} />
          <stop offset="1" stopColor={C.amber} />
        </radialGradient>
        <linearGradient id="paper-warmth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1c7" />
          <stop offset="1" stopColor="#d99858" />
        </linearGradient>
        <linearGradient id="door-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.58" stopColor="#f2ca78" />
          <stop offset="1" stopColor="#b96b42" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const GrainOverlay: React.FC<{opacity?: number}> = ({opacity = 0.24}) => {
  return (
    <AbsoluteFill style={{pointerEvents: "none", mixBlendMode: "multiply", opacity}}>
      <svg width="100%" height="100%">
        <rect width="100%" height="100%" filter="url(#tiny-grain)" opacity=".18" />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(116deg, transparent 0 11px, rgba(255,255,255,.018) 12px, transparent 13px 29px)",
        }}
      />
    </AbsoluteFill>
  );
};

export const PaperEdge: React.FC<{
  points: string;
  fill: string;
  stroke?: string;
  shadow?: boolean;
  opacity?: number;
}> = ({points, fill, stroke = "transparent", shadow = true, opacity = 1}) => (
  <path
    d={points}
    fill={fill}
    stroke={stroke}
    strokeWidth={stroke === "transparent" ? 0 : 2}
    filter={shadow ? "url(#paper-shadow)" : undefined}
    opacity={opacity}
  />
);

export const Moon: React.FC<{
  x: number;
  y: number;
  radius: number;
  opacity?: number;
  glow?: number;
  rotation?: number;
}> = ({x, y, radius, opacity = 1, glow = 0, rotation = -6}) => {
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${rotation})`}>
      {glow > 0 ? (
        <circle
          cx={0}
          cy={0}
          r={radius * 1.65}
          fill={C.moon}
          opacity={glow * 0.18}
          filter="url(#soft-haze)"
        />
      ) : null}
      <circle r={radius} fill="url(#moon-paper)" filter="url(#paper-cut)" />
      <circle r={radius} fill="none" stroke="#e5c77b" strokeWidth="6" opacity=".35" />
      <path
        d={`M ${-radius * 0.47} ${-radius * 0.3}
            c ${radius * 0.16} ${-radius * 0.15} ${radius * 0.34} ${-radius * 0.02} ${radius * 0.28} ${radius * 0.13}
            c ${-radius * 0.05} ${radius * 0.12} ${-radius * 0.31} ${radius * 0.1} ${-radius * 0.28} ${-radius * 0.13} z
            M ${radius * 0.21} ${radius * 0.25}
            c ${radius * 0.08} ${-radius * 0.06} ${radius * 0.2} ${-radius * 0.01} ${radius * 0.16} ${radius * 0.08}
            c ${radius * 0.01} ${radius * 0.07} ${-radius * 0.19} ${radius * 0.12} ${-radius * 0.16} ${-radius * 0.08} z`}
        fill="#d8bb70"
        opacity=".26"
      />
      <path
        d={`M ${-radius * 0.72} ${radius * 0.1} q ${radius * 0.23} ${-radius * 0.19} ${radius * 0.48} ${-radius * 0.02}`}
        fill="none"
        stroke="#fff4d1"
        strokeWidth="9"
        opacity=".23"
      />
    </g>
  );
};

export const StarField: React.FC<{
  time: number;
  count?: number;
  halfBeat?: number;
  color?: string;
  opacity?: number;
}> = ({time, count = 42, halfBeat = 0.209, color = C.cream, opacity = 0.85}) => {
  const stars = Array.from({length: count}, (_, i) => {
    const x = ((i * 379 + 83) % 1870) + 25;
    const y = ((i * 197 + 47) % 560) + 35;
    const phase = (i * 0.618) % 1;
    const cycle = Math.floor(time / halfBeat + phase);
    const pulse = ((time / halfBeat + phase) % 1) < 0.18 ? 1.8 : 1;
    const size = 2 + ((i * 7) % 5) * 0.7;
    return {x, y, pulse, size, cycle};
  });
  return (
    <g opacity={opacity}>
      {stars.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.pulse})`}>
          <circle r={s.size} fill={color} opacity={s.cycle % 3 === 0 ? 0.88 : 0.42} />
          {s.cycle % 5 === 0 ? (
            <path
              d={`M ${-s.size * 3.2} 0 H ${s.size * 3.2} M 0 ${-s.size * 3.2} V ${s.size * 3.2}`}
              stroke={color}
              strokeWidth="1.2"
              opacity=".34"
            />
          ) : null}
        </g>
      ))}
    </g>
  );
};

export const Lantern: React.FC<{
  x: number;
  y: number;
  scale?: number;
  glow?: number;
  opacity?: number;
  rot?: number;
}> = ({x, y, scale = 1, glow = 1, opacity = 1, rot = 0}) => (
  <g
    transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}
    opacity={opacity}
  >
    <circle r={58} fill={C.lantern} opacity={0.13 * glow} filter="url(#soft-haze)" />
    <g filter="url(#paper-shadow-close)">
      <path
        d="M -17 -24 L 17 -24 L 23 22 L 15 35 L -15 35 L -23 22 Z"
        fill="url(#lantern-paper)"
        filter="url(#paper-cut)"
      />
      <path d="M -18 -27 H 18" stroke="#7c4a31" strokeWidth="4" strokeLinecap="round" />
      <path d="M -15 34 H 15" stroke="#7c4a31" strokeWidth="4" strokeLinecap="round" />
      <path d="M 0 -28 V -40" stroke="#75402c" strokeWidth="2" />
      <path d="M -8 -18 L -12 25 M 8 -18 L 12 25" stroke="#e58b43" strokeWidth="2" opacity=".45" />
    </g>
    <circle cx="-6" cy="3" r="8" fill="#fff5c0" opacity={0.85 * glow} filter="url(#soft-haze)" />
  </g>
);

export const Boy: React.FC<{
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  color?: string;
  lantern?: boolean;
  lanternGlow?: number;
}> = ({x, y, scale = 1, facing = 1, color = C.ink, lantern = true, lanternGlow = 1}) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`} filter="url(#paper-cut)">
      <circle cx="4" cy="-99" r="22" fill={color} />
      <path
        d="M -21 -78 C -5 -87 22 -83 26 -61 L 33 5 L 13 8 L 5 -39 L -4 8 L -27 3 L -21 -48 C -27 -61 -31 -71 -21 -78 Z"
        fill={color}
      />
      <path d="M 12 -55 C 33 -51 47 -39 54 -26" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      <path d="M -5 5 L -18 64 L 2 64 L 8 20 L 18 64 L 38 63 L 21 3 Z" fill={color} />
      {lantern ? (
        <>
          <path d="M 53 -27 V -14" stroke={color} strokeWidth="3" />
          <Lantern x={56} y={5} scale={0.62} glow={lanternGlow} />
        </>
      ) : null}
      <path
        d="M -9 -98 C 1 -113 27 -107 27 -91 C 15 -96 3 -102 -9 -98 Z"
        fill={color}
      />
    </g>
  );
};

export const Girl: React.FC<{
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  color?: string;
  waving?: boolean;
}> = ({x, y, scale = 1, facing = 1, color = C.ink, waving = true}) => (
  <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`} filter="url(#paper-cut)">
    <path
      d="M -27 -100 C -35 -65 -32 -37 -21 -9 L 24 -9 C 33 -44 29 -76 18 -101 C 4 -118 -15 -116 -27 -100 Z"
      fill={color}
    />
    <circle cx="-2" cy="-111" r="22" fill={color} />
    <path
      d="M -15 -126 C -4 -136 12 -132 19 -119 C 8 -127 -2 -129 -15 -126 Z"
      fill={color}
    />
    <path
      d="M -16 3 C -28 44 -26 77 -32 112 L -8 114 L 5 49 L 14 114 L 39 111 C 34 74 29 35 23 1 Z"
      fill={color}
    />
    <path
      d="M 18 -77 C 40 -72 54 -55 58 -32"
      fill="none"
      stroke={color}
      strokeWidth="10"
      strokeLinecap="round"
      transform={waving ? undefined : "rotate(-18 18 -77)"}
    />
    <path
      d="M -19 -77 C -37 -67 -43 -51 -40 -36"
      fill="none"
      stroke={color}
      strokeWidth="9"
      strokeLinecap="round"
    />
  </g>
);

export const OrigamiBoat: React.FC<{
  x: number;
  y: number;
  scale?: number;
  color?: string;
  accent?: string;
  boy?: boolean;
  lanternGlow?: number;
  opacity?: number;
}> = ({
  x,
  y,
  scale = 1,
  color = C.ink,
  accent = C.cream,
  boy = false,
  lanternGlow = 1,
  opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <g filter="url(#paper-shadow-close)">
      <path
        d="M -166 14 C -132 35 -72 49 0 51 C 78 49 143 33 176 8 L 144 69 C 81 87 -66 88 -143 69 Z"
        fill={color}
        filter="url(#paper-cut)"
      />
      <path d="M -150 18 C -89 35 92 35 159 11 L 132 31 C 77 48 -71 48 -131 31 Z" fill={accent} opacity=".18" />
      <path
        d="M -35 -3 L 0 -151 L 37 -3 Z"
        fill={color}
        opacity=".92"
        filter="url(#paper-cut)"
      />
      <path d="M 1 -138 L 89 -1 L 15 -10 Z" fill={accent} opacity=".86" filter="url(#paper-cut)" />
      <path d="M -4 -136 L -78 -1 L -10 -11 Z" fill={C.paper} opacity=".58" filter="url(#paper-cut)" />
      <path d="M -145 51 C -50 66 87 64 162 44" fill="none" stroke={accent} strokeWidth="3" opacity=".26" />
    </g>
    {boy ? <Boy x={14} y={-2} scale={0.72} facing={1} color={color} lantern lanternGlow={lanternGlow} /> : null}
  </g>
);

export const Whale: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  color?: string;
  accent?: string;
  opacity?: number;
}> = ({x, y, scale = 1, rotation = -10, color = C.inkSoft, accent = C.foam, opacity = 1}) => (
  <g
    transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
    opacity={opacity}
    filter="url(#paper-cut)"
  >
    <path
      d="M -178 3 C -125 -50 -28 -64 41 -26 C 72 -10 91 11 102 30 C 52 47 -41 50 -111 34 C -141 26 -166 13 -178 3 Z"
      fill={color}
    />
    <path
      d="M 92 25 C 128 6 151 -16 175 -49 C 165 -11 160 19 146 43 C 133 31 113 27 92 25 Z"
      fill={color}
    />
    <path
      d="M -168 2 C -135 -23 -110 -22 -86 -9 C -112 12 -143 20 -168 2 Z"
      fill={accent}
      opacity=".19"
    />
    <path d="M 3 -21 C 34 -28 58 -18 75 4 C 43 19 18 9 3 -21 Z" fill={accent} opacity=".12" />
    <circle cx="-97" cy="-7" r="5" fill={C.paper} opacity=".75" />
    <path d="M -160 19 C -84 33 13 35 83 23" fill="none" stroke={accent} strokeWidth="4" opacity=".3" />
    <path
      d="M -60 -28 C -32 -60 -8 -74 18 -81 C 7 -56 -7 -38 -20 -28 Z"
      fill={color}
      opacity=".9"
    />
  </g>
);

export const CloudBank: React.FC<{
  y: number;
  offset: number;
  scale?: number;
  color?: string;
  opacity?: number;
  seed?: number;
}> = ({y, offset, scale = 1, color = C.night2, opacity = 1, seed = 1}) => {
  const points = Array.from({length: 10}, (_, i) => {
    const x = -120 + i * 235 + offset;
    const rise = 42 + 35 * Math.sin(i * 1.8 + seed) + 18 * Math.cos(i * 2.6 + seed);
    return `${i === 0 ? `M ${x}` : `L ${x}`} ${y - rise * scale}`;
  }).join(" ");
  return (
    <path
      d={`${points} L 2100 ${y + 130} L -200 ${y + 130} Z`}
      fill={color}
      opacity={opacity}
      filter="url(#paper-cut)"
    />
  );
};

export const dissolve = (time: number, start: number, duration = 0.22) =>
  interpolate(time, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const PaperSpeckField: React.FC<{
  time: number;
  color?: string;
  opacity?: number;
  direction?: 1 | -1;
  count?: number;
}> = ({time, color = C.paperWarm, opacity = 0.34, direction = 1, count = 32}) => {
  return (
    <g opacity={opacity}>
      {Array.from({length: count}, (_, i) => {
        const x0 = (i * 173 + 71) % 1980;
        const y0 = (i * 113 + 47) % 1030;
        const speed = 8 + (i % 7) * 3;
        const x = (x0 + direction * time * speed + 1920) % 1920;
        const y = y0 - time * (7 + (i % 3) * 3);
        const size = 1.5 + (i % 4) * 1.3;
        const angle = time * (12 + i) + i * 21;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={size * 2.7}
            height={size}
            rx={0.5}
            fill={color}
            opacity={0.35 + (i % 5) * 0.1}
            transform={`rotate(${angle} ${x} ${y})`}
          />
        );
      })}
    </g>
  );
};

export const PaperCard: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  fill?: string;
  opacity?: number;
  children?: React.ReactNode;
}> = ({x, y, width, height, rotation = 0, fill = C.paper, opacity = 1, children}) => (
  <g
    transform={`translate(${x} ${y}) rotate(${rotation})`}
    style={{filter: `drop-shadow(0 16px 19px rgba(4,12,18,.24))`}}
    opacity={opacity}
  >
    <path
      d={`M 0 0 L ${width * 0.92} 0 L ${width} ${height * 0.06} L ${width * 0.97} ${height}
          L ${width * 0.04} ${height * 0.97} L 0 ${height * 0.15} Z`}
      fill={fill}
      filter="url(#paper-cut)"
    />
    {children}
  </g>
);

export const fadeOpacity = (time: number, inStart: number, inDur: number, outStart: number, outDur: number) =>
  Math.min(
    clamp((time - inStart) / Math.max(inDur, 0.001)),
    clamp((outStart - time) / Math.max(outDur, 0.001)),
  );

export const vignette: React.CSSProperties = {
  boxShadow: "inset 0 0 180px rgba(1, 7, 12, .52)",
  pointerEvents: "none",
};
