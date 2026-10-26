import React from "react";
import {AbsoluteFill} from "remotion";
import {hash, signed, tornRect} from "./geom";
import type {Palette} from "./palette";

/**
 * Shared paper material.
 *
 * Rules:
 * - one displacement filter pass per silhouette, never per fibre;
 * - every lit shape gets a thin back-lit edge, not a plastic highlight;
 * - texture is a full-frame multiply pass, so it does not cost per element.
 */
export const PaperDefs: React.FC = () => (
  <svg width="0" height="0" style={{position: "absolute", pointerEvents: "none"}} aria-hidden>
    <defs>
      <filter id="pc-torn" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.05" numOctaves="3" seed="11" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="pc-torn-fine" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.12" numOctaves="2" seed="23" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="pc-shadow" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow dx="0" dy="14" stdDeviation="13" floodColor="#050b10" floodOpacity=".38" />
      </filter>
      <filter id="pc-shadow-soft" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#050b10" floodOpacity=".3" />
      </filter>
      <filter id="pc-torn-shadow" x="-40%" y="-40%" width="180%" height="200%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.015 0.075" numOctaves="2" seed="11" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="shape" />
        <feDropShadow in="shape" dx="0" dy="14" stdDeviation="13" floodColor="#050b10" floodOpacity=".38" />
      </filter>
      <filter id="pc-glow" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="26" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="pc-haze" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="46" />
      </filter>
      <filter id="pc-grain" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".86" numOctaves="3" seed="9" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.55  0 0 0 0 0.55  0 0 0 .55 0" />
      </filter>
      <filter id="pc-fiber" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="4" seed="5" result="n" />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0 0.14  0 0 0 .3 0"
        />
      </filter>
      <linearGradient id="pc-shaft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff3cf" stopOpacity=".55" />
        <stop offset=".55" stopColor="#ffe4a8" stopOpacity=".18" />
        <stop offset="1" stopColor="#ffe4a8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="pc-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".14" />
        <stop offset=".52" stopColor="#ffffff" stopOpacity=".02" />
        <stop offset="1" stopColor="#000000" stopOpacity=".06" />
      </linearGradient>
      <radialGradient id="pc-vignette" cx="50%" cy="46%" r="76%">
        <stop offset=".55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".42" />
      </radialGradient>
    </defs>
  </svg>
);

type PaperProps = {
  d: string;
  fill: string;
  edge?: string;
  torn?: boolean;
  shadow?: boolean;
  opacity?: number;
  edgeOpacity?: number;
  filterId?: string;
};

export const PaperShape: React.FC<PaperProps> = ({
  d,
  fill,
  edge,
  torn = true,
  shadow = true,
  opacity = 1,
  edgeOpacity = 0.22,
  filterId,
}) => {
  const id = filterId ?? (shadow ? "pc-torn-shadow" : "pc-torn");
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={edge ?? "#0a1218"} strokeWidth={4} opacity={0.14} transform="translate(0 3)" />
      <path d={d} fill={fill} filter={torn ? `url(#${id})` : shadow ? "url(#pc-shadow)" : undefined} />
      {edge ? (
        <>
          <path d={d} fill="none" stroke={edge} strokeWidth={2.4} opacity={edgeOpacity} />
          <path d={d} fill="none" stroke={edge} strokeWidth={8} opacity={edgeOpacity * 0.3} filter="url(#pc-glow)" />
        </>
      ) : null}
      <path d={d} fill="url(#pc-sheen)" opacity={0.5} />
    </g>
  );
};

export const PaperRect: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  edge?: string;
  seed?: number;
  amp?: number;
  opacity?: number;
  torn?: boolean;
  shadow?: boolean;
  edgeOpacity?: number;
}> = ({x, y, w, h, fill, edge, seed = 1, amp = 5, opacity = 1, torn = true, shadow = true, edgeOpacity}) => (
  <PaperShape
    d={tornRect(x, y, w, h, amp, 38, seed)}
    fill={fill}
    edge={edge}
    torn={torn}
    shadow={shadow}
    opacity={opacity}
    edgeOpacity={edgeOpacity}
  />
);

export const PaperCircle: React.FC<{
  cx: number;
  cy: number;
  r: number;
  fill: string;
  edge?: string;
  opacity?: number;
  shadow?: boolean;
  edgeOpacity?: number;
}> = ({cx, cy, r, fill, edge, opacity = 1, shadow = false, edgeOpacity = 0.3}) => (
  <g opacity={opacity}>
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      filter={shadow ? "url(#pc-torn-shadow)" : "url(#pc-torn)"}
    />
    {edge ? <circle cx={cx} cy={cy} r={r} fill="none" stroke={edge} strokeWidth={2} opacity={edgeOpacity} /> : null}
  </g>
);

/** Full-frame fibre pass. Draw once, above the artwork, below subtitles. */
export const PaperTexture: React.FC<{opacity?: number}> = ({opacity = 0.55}) => (
  <AbsoluteFill style={{pointerEvents: "none", mixBlendMode: "multiply", opacity}}>
    <svg width="100%" height="100%">
      <rect width="100%" height="100%" filter="url(#pc-fiber)" />
    </svg>
  </AbsoluteFill>
);

export const Vignette: React.FC<{opacity?: number}> = ({opacity = 0.9}) => (
  <AbsoluteFill style={{pointerEvents: "none", opacity}}>
    <svg width="100%" height="100%">
      <rect width="100%" height="100%" fill="url(#pc-vignette)" />
    </svg>
  </AbsoluteFill>
);

/** Film grain: overlay, not multiply, so it adds tooth to the paper. */
export const FilmGrain: React.FC<{opacity?: number}> = ({opacity = 0.16}) => (
  <AbsoluteFill style={{pointerEvents: "none", mixBlendMode: "overlay", opacity}}>
    <svg width="100%" height="100%">
      <rect width="100%" height="100%" filter="url(#pc-grain)" />
    </svg>
  </AbsoluteFill>
);

/** Deterministic dust / paper motes. Never uses Math.random per frame. */
export const Motes: React.FC<{
  time: number;
  count?: number;
  width: number;
  height: number;
  color: string;
  opacity?: number;
  seed?: number;
  speed?: number;
}> = ({time, count = 26, width, height, color, opacity = 0.3, seed = 3, speed = 1}) => (
  <g opacity={opacity}>
    {Array.from({length: count}, (_, i) => {
      const baseX = hash(i * 7 + seed, seed) * width;
      const baseY = hash(i * 11 + seed * 2, seed) * height;
      const r = 1.2 + hash(i * 17, seed) * 2.6;
      const driftX = Math.sin(time * 0.35 * speed + i * 1.7) * width * 0.012 + time * 5 * signed(i, seed);
      const driftY = -time * (7 + hash(i, seed) * 12) * speed + Math.cos(time * 0.28 + i) * 18;
      const wrappedY = ((baseY + driftY) % (height + 120) + height + 120) % (height + 120) - 60;
      return (
        <circle
          key={i}
          cx={baseX + driftX}
          cy={wrappedY}
          r={r}
          fill={color}
          opacity={0.18 + hash(i * 3, seed) * 0.5}
        />
      );
    })}
  </g>
);

export const LightShaft: React.FC<{
  points: string;
  opacity?: number;
}> = ({points, opacity = 0.6}) => (
  <path d={points} fill="url(#pc-shaft)" opacity={opacity} />
);

export const paletteInk = (p: Palette) => p.ink;
