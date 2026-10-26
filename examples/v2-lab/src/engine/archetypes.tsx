import React from "react";
import type {CameraState} from "./camera";
import {beatPulse} from "./camera";
import type {Palette} from "./palette";
import type {Stage} from "./stage";
import {hash, signed, tornPolygon, tornRidge, tornRing, type Point} from "./geom";
import {Motes, PaperCircle, PaperShape} from "./paper";
import {ContactShadow, Parallax} from "./depth";
import {Puppet} from "./puppet";

export type ShotProps = {
  start: number;
  duration: number;
  time: number;
  p: number;
  cam: CameraState;
  palette: Palette;
  stage: Stage;
  beats: number[];
  intensity: number;
  seed: number;
};

const fog = (p: Palette, amount: number) => ({hazeColor: p.haze, hazeAmount: amount});

/* ------------------------------------------------------------------ */
/* Shared set pieces                                                    */
/* ------------------------------------------------------------------ */

const PaperTree: React.FC<{
  x: number;
  groundY: number;
  scale: number;
  palette: Palette;
  seed: number;
  time: number;
}> = ({x, groundY, scale, palette, seed, time}) => {
  const sway = Math.sin(time * 0.8 + seed) * 2.5;
  return (
    <g transform={`translate(${x} ${groundY}) scale(${scale})`}>
      <path
        d={`M -14 0 L -8 -150 L -2 -206 L 4 -150 L 12 0 Z`}
        fill={palette.ink}
        filter="url(#pc-torn-fine)"
      />
      <g fill="none" stroke={palette.ink} strokeLinecap="round">
        <path d="M -4 -146 C -34 -186 -62 -210 -86 -244" strokeWidth={9} />
        <path d="M 6 -164 C 42 -200 68 -220 96 -250" strokeWidth={8} />
        <path d="M -38 -200 C -50 -222 -64 -234 -70 -258" strokeWidth={5} />
        <path d="M 56 -218 C 66 -238 74 -248 84 -266" strokeWidth={4.5} />
        <path d="M -84 -244 C -96 -252 -104 -262 -110 -274" strokeWidth={3.5} />
        <path d="M 94 -248 C 106 -256 114 -266 120 -278" strokeWidth={3.5} />
        <path d="M -60 -210 C -72 -206 -84 -208 -94 -214" strokeWidth={3} />
        <path d="M 38 -198 C 50 -194 60 -196 70 -202" strokeWidth={3} />
        <path d="M 14 -176 C 16 -196 24 -210 32 -222" strokeWidth={4} />
      </g>
      {Array.from({length: 9}, (_, i) => (
        <circle
          key={i}
          cx={-86 + signed(i, seed) * 34 + (i % 3) * 42}
          cy={-238 + hash(i, seed) * 40}
          r={3 + hash(i + 2, seed) * 3}
          fill={palette.shade}
          opacity={0.35}
        />
      ))}
    </g>
  );
};

const PaperBoat: React.FC<{
  x: number;
  y: number;
  scale: number;
  palette: Palette;
  opacity?: number;
}> = ({x, y, scale, palette, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <path
      d="M -54 0 Q 0 22 54 0 L 40 20 Q 0 34 -40 20 Z"
      fill={palette.ink}
      filter="url(#pc-torn-fine)"
    />
    <path d="M 0 -2 L 0 -62 L 38 -8 Z" fill={palette.paperWarm} opacity={0.88} filter="url(#pc-torn-fine)" />
    <path d="M 0 -2 L 0 -48 L -30 -8 Z" fill={palette.paper} opacity={0.6} filter="url(#pc-torn-fine)" />
    <path d="M -54 0 Q 0 22 54 0" fill="none" stroke={palette.light} strokeWidth={1.6} opacity={0.3} />
  </g>
);

const PaperHouse: React.FC<{
  x: number;
  y: number;
  scale: number;
  palette: Palette;
}> = ({x, y, scale, palette}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path
      d="M -92 0 L -92 -108 L 0 -172 L 92 -108 L 92 0 Z"
      fill={palette.paper}
      filter="url(#pc-torn-shadow)"
    />
    <path
      d="M -112 -102 L 0 -182 L 112 -102 L 92 -84 L 0 -150 L -92 -84 Z"
      fill={palette.inkSoft}
      filter="url(#pc-torn)"
    />
    <rect x="-58" y="-84" width="34" height="34" fill={palette.accent} opacity={0.85} />
    <rect x="22" y="-84" width="34" height="34" fill={palette.accent} opacity={0.5} />
    <path d="M -22 0 L -22 -52 L 22 -52 L 22 0 Z" fill={palette.ink} filter="url(#pc-torn-fine)" />
    <path d="M -92 0 L -92 -108 L 0 -172 L 92 -108 L 92 0" fill="none" stroke={palette.light} strokeWidth={2} opacity={0.25} />
  </g>
);

/* ------------------------------------------------------------------ */
/* 1. Establishing wide: low horizon, big low sun, layered ridges.     */
/* ------------------------------------------------------------------ */

export const WideHorizon: React.FC<ShotProps> = ({
  time,
  cam,
  palette,
  stage,
  beats,
  intensity,
  seed,
}) => {
  const {w, h} = stage;
  const pulse = beatPulse(time, beats, 6);
  const sunR = h * 0.118;
  const sunX = w * 0.735;
  const sunY = h * 0.545;
  const horizon = h * 0.7;
  const breathe = 1 + pulse * 0.015;

  return (
    <>
      <defs>
        <linearGradient id={`wh-sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyTop} />
          <stop offset=".42" stopColor={palette.inkSoft} />
          <stop offset=".66" stopColor={palette.skyBottom} />
          <stop offset=".82" stopColor={palette.glow} />
          <stop offset="1" stopColor={palette.haze} />
        </linearGradient>
        <radialGradient id={`wh-sun-${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={palette.paperWarm} />
          <stop offset=".55" stopColor={palette.light} />
          <stop offset=".84" stopColor={palette.glow} />
          <stop offset="1" stopColor={palette.accent} />
        </radialGradient>
        <linearGradient id={`wh-water-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.haze} stopOpacity=".85" />
          <stop offset=".18" stopColor={palette.mid} stopOpacity=".95" />
          <stop offset="1" stopColor={palette.ink} />
        </linearGradient>
      </defs>

      <rect width={w} height={h} fill={`url(#wh-sky-${seed})`} />
      <ellipse cx={sunX} cy={horizon} rx={w * 0.62} ry={h * 0.12} fill={palette.glow} opacity={0.22} filter="url(#pc-haze)" />

      {/* paper clouds: a few organically placed torn strips */}
      <Parallax cam={cam} depth={0.06} width={w} height={h}>
        {Array.from({length: 5}, (_, i) => {
          const cw = w * (0.1 + hash(i + 3, seed) * 0.28);
          const ch = h * (0.008 + hash(i + 4, seed) * 0.014);
          const cx = w * (0.02 + hash(i + 7, seed) * 0.9) - cw / 2;
          const cy = h * (0.14 + hash(i + 11, seed) * 0.26);
          return (
            <g key={i} opacity={0.24 + hash(i + 13, seed) * 0.2}>
              <path
                d={tornPolygon(
                  [
                    [cx, cy],
                    [cx + cw, cy - ch * 0.6],
                    [cx + cw * 0.96, cy + ch],
                    [cx + cw * 0.06, cy + ch * 1.5],
                  ],
                  4,
                  48,
                  seed + i,
                )}
                fill={palette.skyBottom}
                filter="url(#pc-torn)"
              />
              <path
                d={`M ${cx + cw * 0.08} ${cy + ch * 1.15} L ${cx + cw * 0.9} ${cy + ch * 0.4}`}
                stroke={palette.light}
                strokeWidth={1.6}
                opacity={0.26}
              />
            </g>
          );
        })}
      </Parallax>

      {/* sun: layered paper disc */}
      <g transform={`translate(${sunX} ${sunY}) scale(${breathe})`}>
        <circle r={sunR * 1.55} fill={palette.glow} opacity={0.22} filter="url(#pc-haze)" />
        <circle r={sunR * 1.18} fill={palette.glow} opacity={0.32} filter="url(#pc-haze)" />
        <circle r={sunR} fill={`url(#wh-sun-${seed})`} filter="url(#pc-torn)" />
        <circle r={sunR * 0.98} fill="none" stroke={palette.paperWarm} strokeWidth={3} opacity={0.42} />
        <circle r={sunR * 0.62} fill={palette.paperWarm} opacity={0.16} />
      </g>

      {/* far mountains, three paper cuts */}
      <Parallax cam={cam} depth={0.1} width={w} height={h} {...fog(palette, 0.12)}>
        <g transform={`translate(${-w * 0.2} 0)`}>
          <path d={tornRidge(w * 1.4, h * 1.2, h * 0.585, h * 0.055, seed + 2, 11, 6)} fill={palette.far} opacity={0.95} />
          <path d={`M ${w * 0.34} ${h * 0.62} L ${w * 0.42} ${h * 0.53} L ${w * 0.48} ${h * 0.61} Z`} fill={palette.far} filter="url(#pc-torn)" />
        </g>
      </Parallax>
      <Parallax cam={cam} depth={0.22} width={w} height={h} {...fog(palette, 0.16)}>
        <g transform={`translate(${-w * 0.2} 0)`}>
          <path d={tornRidge(w * 1.4, h * 1.2, h * 0.635, h * 0.038, seed + 5, 16, 6)} fill={palette.mid} />
          <path
            d={`M ${w * 0.06} ${h * 0.64} L ${w * 0.16} ${h * 0.6} L ${w * 0.25} ${h * 0.645}`}
            fill="none"
            stroke={palette.shade}
            strokeWidth={2}
            opacity={0.18}
          />
        </g>
      </Parallax>
      <Parallax cam={cam} depth={0.34} width={w} height={h}>
        <g transform={`translate(${-w * 0.2} 0)`}>
          <path d={tornRidge(w * 1.4, h * 1.2, h * 0.675, h * 0.022, seed + 8, 18, 4)} fill={palette.near} />
        </g>
      </Parallax>

      {/* water + sun path */}
      <Parallax cam={cam} depth={0.46} width={w} height={h}>
        <rect x={-w * 0.2} y={horizon} width={w * 1.4} height={h * 0.24} fill={`url(#wh-water-${seed})`} />
        <rect x={-w * 0.2} y={horizon} width={w * 1.4} height={2} fill={palette.light} opacity={0.55} />
        {Array.from({length: 22}, (_, i) => {
          const spread = 0.03 + i * 0.012;
          const rw = w * spread * (0.4 + hash(i, seed) * 0.9);
          const ry = horizon + h * (0.008 + i * 0.0095);
          const shimmer = 0.35 + 0.5 * Math.abs(Math.sin(time * 1.7 + i * 0.9));
          return (
            <path
              key={i}
              d={`M ${sunX - rw / 2 + Math.sin(time + i) * 6} ${ry} L ${sunX + rw / 2 + Math.sin(time + i) * 6} ${ry}`}
              stroke={palette.glow}
              strokeWidth={2 + (i % 3) * 2}
              opacity={shimmer * (0.65 - i * 0.018)}
              strokeLinecap="round"
            />
          );
        })}
        <PaperBoat x={w * 0.55} y={horizon + h * 0.055} scale={0.52} palette={palette} opacity={0.9} />
        <path d={`M ${w * 0.53} ${horizon + h * 0.075} L ${w * 0.6} ${horizon + h * 0.075}`} stroke={palette.accent} strokeWidth={2} opacity={0.2} />
      </Parallax>

      {/* birds */}
      <Parallax cam={cam} depth={0.4} width={w} height={h}>
        {Array.from({length: 6}, (_, i) => {
          const bx = w * (0.12 + i * 0.075) + Math.sin(time * 0.5 + i) * 18;
          const by = h * (0.24 + (i % 4) * 0.045) + Math.cos(time * 0.8 + i) * 8;
          const flap = Math.sin(time * 3 + i * 1.4) * 3;
          return (
            <path
              key={i}
              d={`M ${bx - 10} ${by} q 10 ${-8 - flap} 10 0 q 0 ${-8 + flap} 10 0`}
              fill="none"
              stroke={palette.ink}
              strokeWidth={2.4}
              opacity={0.62}
              strokeLinecap="round"
            />
          );
        })}
      </Parallax>

      {/* foreground cliff + tree + singer */}
      <Parallax cam={cam} depth={0.92} width={w} height={h}>
        <path
          d={tornPolygon(
            [
              [-w * 0.08, h * 1.08],
              [-w * 0.08, h * 0.84],
              [w * 0.06, h * 0.815],
              [w * 0.18, h * 0.835],
              [w * 0.29, h * 0.805],
              [w * 0.38, h * 0.83],
              [w * 0.44, h * 0.88],
              [w * 0.47, h * 1.08],
            ],
            8,
            38,
            seed + 11,
          )}
          fill={palette.ink}
          filter="url(#pc-torn-shadow)"
        />
        <path
          d={`M ${-w * 0.02} ${h * 0.836} L ${w * 0.06} ${h * 0.815} L ${w * 0.18} ${h * 0.835} L ${w * 0.29} ${h * 0.805} L ${w * 0.38} ${h * 0.83}`}
          fill="none"
          stroke={palette.light}
          strokeWidth={2.4}
          opacity={0.3}
        />
        <ContactShadow cx={w * 0.315} cy={h * 0.818} rx={w * 0.045} ry={h * 0.01} color={palette.ink} opacity={0.55} />
        <Puppet
          x={w * 0.315}
          groundY={h * 0.818}
          scale={0.6 * (1 + intensity * 0.08)}
          palette={palette}
          pose="idle"
          time={time}
          seed={seed}
          kind="figure"
          tone="silhouette"
        />
        {/* grass tufts */}
        {Array.from({length: 18}, (_, i) => {
          const gx = -w * 0.04 + (i / 17) * w * 0.48;
          const gy = h * 0.82 + hash(i, seed) * h * 0.02;
          const gh = h * (0.02 + hash(i + 5, seed) * 0.035);
          return (
            <path
              key={i}
              d={`M ${gx} ${gy} q ${signed(i, seed) * 6} ${-gh * 0.6} ${signed(i, seed) * 12} ${-gh}`}
              fill="none"
              stroke={palette.ink}
              strokeWidth={2}
              opacity={0.8}
              strokeLinecap="round"
            />
          );
        })}
      </Parallax>

      {/* light shaft from the sun to the cliff */}
      <Parallax cam={cam} depth={0.6} width={w} height={h}>
        <path
          d={`M ${sunX - sunR} ${sunY} L ${sunX + sunR} ${sunY} L ${w * 0.55} ${h * 0.95} L ${w * 0.18} ${h * 0.95} Z`}
          fill="url(#pc-shaft)"
          opacity={0.18}
        />
      </Parallax>

      <Motes time={time} count={24} width={w} height={h} color={palette.light} opacity={0.22} seed={seed + 3} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 2. Corridor: receding frames, one walker, strong parallax.           */
/* ------------------------------------------------------------------ */

export const Corridor: React.FC<ShotProps> = ({
  time,
  cam,
  palette,
  stage,
  beats,
  intensity,
  seed,
}) => {
  const {w, h} = stage;
  const vpx = w * 0.55;
  const vpy = h * 0.49;
  const pulse = beatPulse(time, beats, 5);
  const frames = 7;

  return (
    <>
      <defs>
        <linearGradient id={`co-end-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyTop} />
          <stop offset=".55" stopColor={palette.skyBottom} />
          <stop offset="1" stopColor={palette.glow} />
        </linearGradient>
        <radialGradient id={`co-glow-${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={palette.light} stopOpacity=".95" />
          <stop offset=".5" stopColor={palette.glow} stopOpacity=".45" />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={w} height={h} fill={palette.near} />
      <rect width={w} height={h} fill={palette.ink} opacity={0.34} />

      {/* floor and ceiling first, so the far opening sits inside them */}
      <Parallax cam={cam} depth={0.16} width={w} height={h}>
        <path d={`M 0 ${h} L ${vpx} ${vpy} L ${w} ${h} Z`} fill={palette.mid} opacity={0.6} />
        <path d={`M 0 0 L ${vpx} ${vpy} L ${w} 0 Z`} fill={palette.inkSoft} opacity={0.72} />
        <path d={`M ${vpx - w * 0.3} ${h} Q ${vpx} ${vpy + h * 0.2} ${vpx + w * 0.3} ${h} L ${vpx + w * 0.22} ${h} Q ${vpx} ${vpy + h * 0.32} ${vpx - w * 0.22} ${h} Z`} fill={palette.glow} opacity={0.12} />
        {Array.from({length: 9}, (_, i) => {
          const t = i / 8;
          const x = vpx + (t - 0.5) * w * 1.2;
          return <path key={i} d={`M ${vpx} ${vpy + h * 0.152} L ${x} ${h}`} stroke={palette.ink} strokeWidth={2} opacity={0.22} />;
        })}
        {Array.from({length: 7}, (_, i) => {
          const yy = vpy + (h - vpy) * Math.pow((i + 1) / 8, 1.8);
          return <path key={i} d={`M 0 ${yy} L ${w} ${yy}`} stroke={palette.ink} strokeWidth={2} opacity={0.12} />;
        })}
      </Parallax>

      {/* the world beyond the last door, drawn on top of the floor */}
      <Parallax cam={cam} depth={0.03} width={w} height={h}>
        <g>
          <rect x={vpx - w * 0.142} y={vpy - h * 0.152} width={w * 0.284} height={h * 0.304} fill={`url(#co-end-${seed})`} />
          <circle cx={vpx + w * 0.042} cy={vpy + h * 0.028} r={h * 0.052} fill={palette.paperWarm} opacity={0.95} filter="url(#pc-torn)" />
          <path d={`M ${vpx - w * 0.142} ${vpy + h * 0.09} Q ${vpx - w * 0.02} ${vpy + h * 0.05} ${vpx + w * 0.08} ${vpy + h * 0.092} T ${vpx + w * 0.142} ${vpy + h * 0.075} L ${vpx + w * 0.142} ${vpy + h * 0.152} L ${vpx - w * 0.142} ${vpy + h * 0.152} Z`} fill={palette.far} opacity={0.9} />
          <path d={`M ${vpx - w * 0.142} ${vpy + h * 0.112} Q ${vpx} ${vpy + h * 0.085} ${vpx + w * 0.142} ${vpy + h * 0.115} L ${vpx + w * 0.142} ${vpy + h * 0.152} L ${vpx - w * 0.142} ${vpy + h * 0.152} Z`} fill={palette.mid} />
        </g>
        <ellipse cx={vpx} cy={vpy} rx={w * 0.2} ry={h * 0.27} fill={`url(#co-glow-${seed})`} opacity={0.65} />
      </Parallax>

      {/* frames: far -> near, each a torn paper portal with visible thickness */}
      {Array.from({length: frames}, (_, i) => {
        const k = i / (frames - 1);
        const depth = 0.2 + k * 0.62;
        const halfW = w * (0.14 + 0.36 * k);
        const halfH = h * (0.15 + 0.41 * k);
        const thick = h * (0.016 + 0.052 * k);
        const x = vpx - halfW;
        const y = vpy - halfH;
        const innerX = x + thick;
        const innerY = y + thick;
        const innerW = halfW * 2 - thick * 2;
        const innerH = halfH * 2 - thick * 2;
        const lit = Math.max(0, 1 - Math.abs(k - ((time * 0.12) % 1)) * 5) * pulse;
        const fill = i % 2 === 0 ? palette.ink : palette.mid;
        return (
          <Parallax key={i} cam={cam} depth={depth} width={w} height={h}>
            <path
              d={`M ${x} ${y} H ${x + halfW * 2} V ${y + halfH * 2} H ${x} Z
                  M ${innerX} ${innerY} V ${innerY + innerH} H ${innerX + innerW} V ${innerY} Z`}
              fill={fill}
              fillRule="evenodd"
              filter="url(#pc-torn)"
              opacity={0.97}
            />
            {/* paper thickness on the inner lip */}
            <path
              d={`M ${innerX} ${innerY} V ${innerY + innerH} H ${innerX + innerW} V ${innerY}`}
              fill="none"
              stroke={palette.shade}
              strokeWidth={thick * 0.22}
              opacity={0.28}
            />
            <path
              d={`M ${innerX} ${innerY} V ${innerY + innerH} H ${innerX + innerW} V ${innerY}`}
              fill="none"
              stroke={palette.light}
              strokeWidth={2.4 + k * 4}
              opacity={0.1 + lit * 0.5}
            />
            <path
              d={`M ${x} ${y} H ${x + halfW * 2} V ${y + halfH * 2} H ${x}`}
              fill="none"
              stroke={palette.shade}
              strokeWidth={1.6}
              opacity={0.14}
            />
          </Parallax>
        );
      })}

      {/* light rays from the far door */}
      <Parallax cam={cam} depth={0.4} width={w} height={h}>
        {Array.from({length: 5}, (_, i) => {
          const spread = (i - 2) * 0.09;
          return (
            <path
              key={i}
              d={`M ${vpx - w * 0.06} ${vpy - h * 0.06} L ${vpx + w * 0.06} ${vpy - h * 0.06} L ${vpx + w * (0.3 + spread)} ${h} L ${vpx - w * (0.3 - spread)} ${h} Z`}
              fill="url(#pc-shaft)"
              opacity={0.09}
            />
          );
        })}
      </Parallax>

      {/* walker */}
      <Parallax cam={cam} depth={0.7} width={w} height={h}>
        <ContactShadow cx={vpx - w * 0.04} cy={h * 0.835} rx={w * 0.04} ry={h * 0.009} color={palette.ink} opacity={0.55} />
        <Puppet
          x={vpx - w * 0.04}
          groundY={h * 0.84}
          scale={0.58 + intensity * 0.06}
          palette={palette}
          pose="walk"
          time={time}
          seed={seed}
          tone="silhouette"
        />
      </Parallax>

      {/* foreground: hanging strips + plants */}
      <Parallax cam={cam} depth={1.1} width={w} height={h}>
        {Array.from({length: 10}, (_, i) => {
          const x = w * (0.01 + i * 0.11) + signed(i, seed) * 26;
          const len = h * (0.12 + hash(i, seed) * 0.2);
          const sway = Math.sin(time * 1.25 + i * 1.5) * (4 + pulse * 4);
          return (
            <path
              key={i}
              d={`M ${x} 0 L ${x + 15 + sway} 0 L ${x + 10 + sway} ${len} L ${x - 5} ${len} Z`}
              fill={palette.ink}
              opacity={0.94}
              filter="url(#pc-torn-fine)"
            />
          );
        })}
        <path
          d={tornPolygon([[-w * 0.05, h * 1.05], [-w * 0.05, h * 0.86], [w * 0.06, h * 0.8], [w * 0.11, h * 1.05]], 5, 34, seed + 12)}
          fill={palette.ink}
          filter="url(#pc-torn)"
        />
        <path
          d={tornPolygon([[w * 1.05, h * 1.05], [w * 1.05, h * 0.84], [w * 0.93, h * 0.8], [w * 0.9, h * 1.05]], 5, 34, seed + 13)}
          fill={palette.ink}
          filter="url(#pc-torn)"
        />
      </Parallax>

      <Motes time={time} count={26} width={w} height={h} color={palette.light} opacity={0.32} seed={seed + 4} speed={0.6} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 3. Window silhouette: interior, big light, one body against it.      */
/* ------------------------------------------------------------------ */

export const WindowSilhouette: React.FC<ShotProps> = ({
  time,
  cam,
  palette,
  stage,
  beats,
  intensity,
  seed,
}) => {
  const {w, h} = stage;
  const pulse = beatPulse(time, beats, 7);
  const winX = w * 0.62;
  const winTop = h * 0.09;
  const winW = w * 0.34;
  const winH = h * 0.64;
  const arc = winW / 2;
  const beam = 1 + pulse * 0.02 + intensity * 0.03;

  const windowPath = `M ${winX - winW / 2} ${winTop + winH}
    L ${winX - winW / 2} ${winTop + arc}
    A ${arc} ${arc} 0 0 1 ${winX + winW / 2} ${winTop + arc}
    L ${winX + winW / 2} ${winTop + winH} Z`;

  return (
    <>
      <defs>
        <linearGradient id={`wi-out-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyTop} />
          <stop offset=".42" stopColor={palette.skyBottom} />
          <stop offset=".7" stopColor={palette.glow} />
          <stop offset="1" stopColor={palette.haze} />
        </linearGradient>
        <linearGradient id={`wi-wall-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.inkSoft} />
          <stop offset="1" stopColor={palette.near} />
        </linearGradient>
        <clipPath id={`wi-clip-${seed}`}>
          <path d={windowPath} />
        </clipPath>
      </defs>

      <rect width={w} height={h} fill={`url(#wi-wall-${seed})`} />
      <rect width={w} height={h} fill={palette.ink} opacity={0.18} />

      {/* wallpaper: faint vertical strips */}
      <Parallax cam={cam} depth={0.06} width={w} height={h}>
        {Array.from({length: 14}, (_, i) => (
          <rect key={i} x={w * (0.02 + i * 0.075)} y={0} width={2} height={h} fill={palette.shade} opacity={0.06} />
        ))}
        <path d={`M 0 ${h * 0.08} L ${w} ${h * 0.08}`} stroke={palette.shade} strokeWidth={3} opacity={0.12} />
      </Parallax>

      {/* outside the window */}
      <Parallax cam={cam} depth={0.14} width={w} height={h}>
        <g clipPath={`url(#wi-clip-${seed})`}>
          <rect x={winX - winW} y={winTop - winW} width={winW * 2} height={winH + winW * 2} fill={`url(#wi-out-${seed})`} />
          <circle cx={winX + winW * 0.22} cy={winTop + winH * 0.55} r={winW * 0.13} fill={palette.paperWarm} opacity={0.96} filter="url(#pc-torn)" />
          <ellipse cx={winX + winW * 0.22} cy={winTop + winH * 0.55} rx={winW * 0.3} ry={winW * 0.2} fill={palette.glow} opacity={0.22} filter="url(#pc-haze)" />
          <path d={`M ${winX - winW} ${winTop + winH * 0.62} Q ${winX - winW * 0.32} ${winTop + winH * 0.54} ${winX + winW * 0.1} ${winTop + winH * 0.6} T ${winX + winW} ${winTop + winH * 0.56} L ${winX + winW} ${winTop + winH} L ${winX - winW} ${winTop + winH} Z`} fill={palette.far} opacity={0.82} filter="url(#pc-torn)" />
          <path d={`M ${winX - winW} ${winTop + winH * 0.68} Q ${winX - winW * 0.1} ${winTop + winH * 0.63} ${winX + winW * 0.5} ${winTop + winH * 0.67} T ${winX + winW} ${winTop + winH * 0.64} L ${winX + winW} ${winTop + winH} L ${winX - winW} ${winTop + winH} Z`} fill={palette.mid} opacity={0.92} filter="url(#pc-torn)" />
          <path d={`M ${winX - winW} ${winTop + winH * 0.74} Q ${winX} ${winTop + winH * 0.71} ${winX + winW} ${winTop + winH * 0.75} L ${winX + winW} ${winTop + winH} L ${winX - winW} ${winTop + winH} Z`} fill={palette.near} filter="url(#pc-torn)" />
          <path d={`M ${winX - winW} ${winTop + winH * 0.73} L ${winX + winW} ${winTop + winH * 0.72}`} stroke={palette.light} strokeWidth={2} opacity={0.3} />
          {Array.from({length: 6}, (_, i) => {
            const bx = winX - winW * 0.36 + i * winW * 0.14;
            const by = winTop + winH * (0.22 + (i % 3) * 0.035) + Math.sin(time + i) * 4;
            const flap = Math.sin(time * 2.6 + i) * 2.5;
            return <path key={i} d={`M ${bx - 7} ${by} q 7 ${-6 - flap} 7 0 q 0 ${-6 + flap} 7 0`} fill="none" stroke={palette.inkSoft} strokeWidth={2} opacity={0.5} />;
          })}
        </g>

        {/* frame */}
        <path d={windowPath} fill="none" stroke={palette.ink} strokeWidth={h * 0.026} filter="url(#pc-torn)" />
        <path d={windowPath} fill="none" stroke={palette.light} strokeWidth={2.6} opacity={0.35} />
        <path d={`M ${winX} ${winTop + arc} V ${winTop + winH}`} stroke={palette.ink} strokeWidth={h * 0.016} opacity={0.95} />
        <path d={`M ${winX - winW / 2} ${winTop + winH * 0.6} H ${winX + winW / 2}`} stroke={palette.ink} strokeWidth={h * 0.013} opacity={0.95} />
      </Parallax>

      {/* light beam + floor pool */}
      <Parallax cam={cam} depth={0.28} width={w} height={h}>
        <path
          d={`M ${winX - winW * 0.46} ${winTop + winH * 0.74}
              L ${winX + winW * 0.46} ${winTop + winH * 0.74}
              L ${winX + winW * 0.82 * beam} ${h * 0.97}
              L ${winX - winW * 0.78 * beam} ${h * 0.97} Z`}
          fill="url(#pc-shaft)"
          opacity={0.9}
        />
        <ellipse cx={winX} cy={h * 0.94} rx={winW * 0.5 * beam} ry={h * 0.045} fill={palette.glow} opacity={0.16} filter="url(#pc-haze)" />
        <rect x={0} y={h * 0.86} width={w} height={h * 0.16} fill={palette.ink} opacity={0.92} filter="url(#pc-torn)" />
      </Parallax>

      {/* potted plant: a dark foreground frame on the left */}
      <Parallax cam={cam} depth={0.74} width={w} height={h}>
        <g transform={`translate(${w * 0.13} ${h * 0.925})`}>
          <path
            d={`M -44 -64 L 44 -64 L 32 0 L -32 0 Z`}
            fill={palette.ink}
            filter="url(#pc-torn-shadow)"
          />
          <path d={`M -40 -64 L 40 -64`} stroke={palette.light} strokeWidth={2} opacity={0.22} />
          {Array.from({length: 5}, (_, i) => {
            const dx = (i - 2) * h * 0.035;
            const top = -h * (0.14 + hash(i, seed) * 0.13);
            const bend = Math.sin(time * 0.7 + i) * 3;
            return (
              <g key={i}>
                <path
                  d={`M 0 -58 C ${dx * 0.4 + bend} ${top * 0.45} ${dx * 0.9} ${top * 0.8} ${dx + bend} ${top}`}
                  fill="none"
                  stroke={palette.ink}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {[0.42, 0.66, 0.86].map((k, j) => {
                  const lx = dx * k + bend * k;
                  const ly = top * k;
                  return (
                    <ellipse
                      key={j}
                      cx={lx + (j % 2 === 0 ? 18 : -18)}
                      cy={ly}
                      rx={h * 0.036}
                      ry={h * 0.014}
                      fill={palette.near}
                      transform={`rotate(${j % 2 === 0 ? -24 : 24} ${lx} ${ly})`}
                      filter="url(#pc-torn-fine)"
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </Parallax>

      {/* the body */}
      <Parallax cam={cam} depth={0.62} width={w} height={h}>
        <ContactShadow cx={w * 0.47} cy={h * 0.865} rx={w * 0.045} ry={h * 0.009} color={palette.ink} opacity={0.55} />
        <Puppet
          x={w * 0.47}
          groundY={h * 0.865}
          scale={1.04 + intensity * 0.08}
          palette={palette}
          pose="reach"
          time={time}
          seed={seed}
          kind="figure"
          tone="silhouette"
        />
      </Parallax>

      {/* foreground table: cup, book, vase */}
      <Parallax cam={cam} depth={1.04} width={w} height={h}>
        <path
          d={tornPolygon(
            [
              [-w * 0.1, h * 0.94],
              [w * 0.18, h * 0.918],
              [w * 0.46, h * 0.93],
              [w * 0.74, h * 0.912],
              [w * 1.1, h * 0.936],
              [w * 1.1, h * 1.1],
              [-w * 0.1, h * 1.1],
            ],
            5,
            44,
            seed + 21,
          )}
          fill={palette.ink}
          filter="url(#pc-torn-shadow)"
        />
        <path
          d={`M ${w * 0.18} ${h * 0.918} L ${w * 0.46} ${h * 0.93} L ${w * 0.74} ${h * 0.912}`}
          fill="none"
          stroke={palette.light}
          strokeWidth={2.4}
          opacity={0.26}
        />
        {/* cup */}
        <g transform={`translate(${w * 0.8} ${h * 0.905}) scale(1.25)`}>
          <path d="M -26 -46 L 26 -46 L 18 -8 L -18 -8 Z" fill={palette.paper} filter="url(#pc-torn-fine)" />
          <path d="M -20 -8 L 20 -8 L 16 12 L -16 12 Z" fill={palette.paper} filter="url(#pc-torn-fine)" />
          <path d="M -30 12 L 30 12 L 34 20 L -34 20 Z" fill={palette.shade} />
          <path d="M -24 -40 Q 0 -46 24 -40" fill="none" stroke={palette.accent} strokeWidth={2} opacity={0.5} />
          <path d={`M 0 -46 q ${-6 - pulse * 4} -22 ${2 - pulse * 8} -42`} fill="none" stroke={palette.paperWarm} strokeWidth={4} opacity={0.18} />
        </g>
        {/* book */}
        <g transform={`translate(${w * 0.64} ${h * 0.93}) rotate(-4)`}>
          <rect x="-58" y="-10" width="116" height="18" fill={palette.paper} filter="url(#pc-torn-fine)" />
          <rect x="-58" y="-10" width="116" height="5" fill={palette.accent} opacity={0.5} />
        </g>
      </Parallax>

      <Motes time={time} count={30} width={w} height={h} color={palette.light} opacity={0.3} seed={seed + 6} speed={0.5} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 4. Iris: a circular opening into memory, concentric torn rings.      */
/* ------------------------------------------------------------------ */

export const Iris: React.FC<ShotProps> = ({
  time,
  cam,
  palette,
  stage,
  beats,
  intensity,
  seed,
}) => {
  const {w, h} = stage;
  const pulse = beatPulse(time, beats, 6);
  const cx = w * 0.5;
  const cy = h * 0.48;
  const base = h * 0.27;
  const open = 1 + pulse * 0.02 + intensity * 0.04;
  const rings = 5;

  return (
    <>
      <defs>
        <linearGradient id={`ir-sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyTop} />
          <stop offset=".55" stopColor={palette.skyBottom} />
          <stop offset="1" stopColor={palette.haze} />
        </linearGradient>
        <clipPath id={`ir-hole-${seed}`}>
          <circle cx={cx} cy={cy} r={base * 0.92 * open} />
        </clipPath>
        <radialGradient id={`ir-glow-${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={palette.light} stopOpacity=".55" />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={w} height={h} fill={palette.ink} />
      <circle cx={cx} cy={cy} r={base * 1.85} fill={`url(#ir-glow-${seed})`} opacity={0.55} />

      {/* rays */}
      <g transform={`translate(${cx} ${cy}) rotate(${time * 2.2})`}>
        {Array.from({length: 28}, (_, i) => {
          const a = (i / 28) * Math.PI * 2;
          const r0 = base * 1.14;
          const r1 = base * (1.46 + (i % 4) * 0.13);
          const spread = 0.05;
          return (
            <path
              key={i}
              d={`M ${Math.cos(a - spread) * r0} ${Math.sin(a - spread) * r0}
                  L ${Math.cos(a) * r1} ${Math.sin(a) * r1}
                  L ${Math.cos(a + spread) * r0} ${Math.sin(a + spread) * r0} Z`}
              fill={i % 3 === 0 ? palette.accent : palette.paper}
              opacity={0.13 + (i % 4) * 0.03}
            />
          );
        })}
      </g>

      {/* memory inside the iris: house, tree, two figures, sun */}
      <g clipPath={`url(#ir-hole-${seed})`}>
        <rect x={0} y={0} width={w} height={h} fill={`url(#ir-sky-${seed})`} />
        <circle cx={cx + base * 0.22} cy={cy - base * 0.2} r={base * 0.1} fill={palette.paperWarm} opacity={0.9} />
        <path d={`M ${cx - base} ${cy + base * 0.44} Q ${cx - base * 0.2} ${cy + base * 0.34} ${cx + base * 0.4} ${cy + base * 0.46} T ${cx + base} ${cy + base * 0.4} L ${cx + base} ${cy + base} L ${cx - base} ${cy + base} Z`} fill={palette.far} opacity={0.85} />
        <path d={`M ${cx - base} ${cy + base * 0.58} Q ${cx - base * 0.1} ${cy + base * 0.5} ${cx + base} ${cy + base * 0.6} L ${cx + base} ${cy + base} L ${cx - base} ${cy + base} Z`} fill={palette.near} />
        <g transform={`translate(${cx + base * 0.22} ${cy + base * 0.57}) scale(${base / 760})`}>
          <PaperHouse x={0} y={0} scale={0.9} palette={palette} />
        </g>
        <g transform={`translate(${cx - base * 0.42} ${cy + base * 0.6}) scale(${base / 900})`}>
          <PaperTree x={0} groundY={0} scale={0.95} palette={palette} seed={seed + 2} time={time} />
        </g>
        <g transform={`translate(${cx - base * 0.04} ${cy + base * 0.8}) scale(${base / 420})`}>
          <Puppet x={-70} groundY={0} scale={0.98} palette={palette} pose="idle" time={time} seed={seed} tone="silhouette" />
          <Puppet x={74} groundY={0} scale={1} facing={-1} palette={palette} pose="idle" time={time + 0.5} seed={seed + 2} tone="silhouette" />
        </g>
      </g>

      {/* concentric torn paper rings */}
      {[
        {rO: base * 1.72, rI: base * 1.44, fill: palette.near, seed: seed + 1},
        {rO: base * 1.4, rI: base * 1.16, fill: palette.mid, seed: seed + 2},
        {rO: base * 1.11, rI: base * 0.98, fill: palette.inkSoft, seed: seed + 3},
      ].map((ring, i) => {
        const d = tornRing(cx, cy, ring.rO, ring.rI, ring.seed, 10, 72);
        return (
          <g key={i}>
            <path d={d} fill={ring.fill} fillRule="evenodd" filter="url(#pc-torn-shadow)" opacity={0.98} />
            <path d={d} fill="none" stroke={i === 2 ? palette.light : palette.shade} strokeWidth={2.2} opacity={i === 2 ? 0.42 : 0.18} />
            <path
              d={tornRing(cx, cy, ring.rO + 4, ring.rO - 3, ring.seed + 9, 3, 72)}
              fill={palette.shade}
              fillRule="evenodd"
              opacity={0.16}
            />
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={base * 0.99 * open} fill="none" stroke={palette.light} strokeWidth={3} opacity={0.5} />

      {/* foreground torn corners */}
      <Parallax cam={cam} depth={1.14} width={w} height={h}>
        <path d={tornPolygon([[-40, -40], [w * 0.24, -40], [w * 0.18, h * 0.18], [-40, h * 0.22]], 6, 40, seed + 7)} fill={palette.ink} opacity={0.9} filter="url(#pc-torn)" />
        <path d={tornPolygon([[w + 40, h + 40], [w * 0.76, h + 40], [w * 0.84, h * 0.8], [w + 40, h * 0.68]], 6, 40, seed + 8)} fill={palette.ink} opacity={0.9} filter="url(#pc-torn)" />
      </Parallax>

      <Motes time={time} count={22} width={w} height={h} color={palette.light} opacity={0.24} seed={seed + 7} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 5. Object macro: a hand holding a paper flower, shallow depth.       */
/* ------------------------------------------------------------------ */

export const ObjectMacro: React.FC<ShotProps> = ({
  time,
  cam,
  palette,
  stage,
  beats,
  intensity,
  seed,
}) => {
  const {w, h} = stage;
  const pulse = beatPulse(time, beats, 8);
  const sway = Math.sin(time * 0.9) * 2.2;
  const cx = w * 0.4;
  const table = h * 0.78;

  const flower = (fx: number, fy: number, r: number, rot: number, color: string) => (
    <g transform={`translate(${fx} ${fy}) rotate(${rot + sway})`}>
      {Array.from({length: 5}, (_, i) => {
        const a = (Math.PI * 2 * i) / 5;
        const tip = r * 1.5;
        return (
          <path
            key={i}
            d={`M 0 0
                C ${Math.cos(a - 0.34) * r * 0.6} ${Math.sin(a - 0.34) * r * 0.6}
                  ${Math.cos(a - 0.2) * r * 1.15} ${Math.sin(a - 0.2) * r * 1.15}
                  ${Math.cos(a) * tip} ${Math.sin(a) * tip}
                C ${Math.cos(a + 0.2) * r * 1.15} ${Math.sin(a + 0.2) * r * 1.15}
                  ${Math.cos(a + 0.34) * r * 0.6} ${Math.sin(a + 0.34) * r * 0.6} 0 0 Z`}
            fill={color}
            filter="url(#pc-torn)"
          />
        );
      })}
      <circle r={r * 0.26} fill={palette.accent} />
      <circle r={r * 0.14} fill={palette.paperWarm} opacity={0.9} />
    </g>
  );

  return (
    <>
      <defs>
        <linearGradient id={`om-wall-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyTop} />
          <stop offset=".55" stopColor={palette.mid} />
          <stop offset="1" stopColor={palette.near} />
        </linearGradient>
        <radialGradient id={`om-lamp-${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={palette.light} stopOpacity=".85" />
          <stop offset=".55" stopColor={palette.glow} stopOpacity=".3" />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#om-wall-${seed})`} />

      <Parallax cam={cam} depth={0.1} width={w} height={h}>
        <circle cx={w * 0.78} cy={h * 0.24} r={h * 0.3} fill={`url(#om-lamp-${seed})`} />
        {Array.from({length: 14}, (_, i) => {
          const bx = w * (0.04 + hash(i, seed) * 0.92);
          const by = h * (0.03 + hash(i + 3, seed) * 0.5);
          const r = h * (0.012 + hash(i + 7, seed) * 0.035);
          return <circle key={i} cx={bx} cy={by} r={r} fill={palette.glow} opacity={0.08 + hash(i + 9, seed) * 0.1} filter="url(#pc-haze)" />;
        })}
        <path d={`M 0 ${h * 0.62} L ${w} ${h * 0.6}`} stroke={palette.shade} strokeWidth={3} opacity={0.12} />
      </Parallax>

      <Parallax cam={cam} depth={0.3} width={w} height={h}>
        <path d={`M ${w * 0.86} 0 L ${w * 1.04} 0 L ${w * 0.74} ${h * 0.8} L ${w * 0.42} ${h * 0.8} Z`} fill="url(#pc-shaft)" opacity={0.22} />
        <path
          d={tornPolygon(
            [
              [-w * 0.1, h * 1.1],
              [-w * 0.1, h * 0.79],
              [w * 0.2, h * 0.775],
              [w * 0.52, h * 0.79],
              [w * 0.8, h * 0.775],
              [w * 1.1, h * 0.79],
              [w * 1.1, h * 1.1],
            ],
            5,
            46,
            seed + 3,
          )}
          fill={palette.ink}
          filter="url(#pc-torn-shadow)"
        />
        <path d={`M ${w * 0.2} ${h * 0.775} L ${w * 0.52} ${h * 0.79} L ${w * 0.8} ${h * 0.775}`} fill="none" stroke={palette.light} strokeWidth={2.4} opacity={0.26} />
      </Parallax>

      <Parallax cam={cam} depth={0.72} width={w} height={h}>
        <g transform={`translate(${cx} ${table})`}>
          {([[-26, -h * 0.28, -10], [8, -h * 0.33, 6], [30, -h * 0.23, 16]] as number[][]).map(([sx, sy, rot], i) => (
            <g key={i}>
              <path
                d={`M 0 -62 C ${sx * 0.4} ${-62 + (sy + 62) * 0.45} ${sx * 0.9} ${-62 + (sy + 62) * 0.8} ${sx} ${sy}`}
                fill="none"
                stroke={palette.inkSoft}
                strokeWidth={4}
                strokeLinecap="round"
              />
              {flower(sx, sy, h * (0.038 + i * 0.004), rot, i === 1 ? palette.paperWarm : palette.paper)}
            </g>
          ))}
          <path
            d={`M -38 0 C -50 -30 -36 -58 -22 -66 L 22 -66 C 36 -58 50 -30 38 0 Z`}
            fill={palette.paper}
            filter="url(#pc-torn-shadow)"
          />
          <path d={`M -22 -66 L 22 -66 L 18 -76 L -18 -76 Z`} fill={palette.accent} opacity={0.85} filter="url(#pc-torn-fine)" />
          <path d={`M -50 -34 C -30 -26 30 -26 50 -34`} fill="none" stroke={palette.accent} strokeWidth={3} opacity={0.35} />
          <path d={`M -38 0 C -50 -30 -36 -58 -22 -66`} fill="none" stroke={palette.light} strokeWidth={2} opacity={0.3} />
        </g>
      </Parallax>

      <Parallax cam={cam} depth={0.86} width={w} height={h}>
        <g transform={`translate(${w * 0.7} ${h * 0.785}) rotate(-3)`}>
          <rect x="-80" y="-14" width="160" height="22" fill={palette.paper} filter="url(#pc-torn-fine)" />
          <rect x="-80" y="-14" width="160" height="6" fill={palette.accent} opacity={0.4} />
        </g>
        <g transform={`translate(${w * 0.84} ${h * 0.78})`}>
          <path d="M -26 -54 L 26 -54 L 18 -8 L -18 -8 Z" fill={palette.paper} filter="url(#pc-torn-fine)" />
          <path d="M -20 -8 L 20 -8 L 16 10 L -16 10 Z" fill={palette.paper} filter="url(#pc-torn-fine)" />
          <path d="M -28 10 L 28 10 L 32 18 L -32 18 Z" fill={palette.shade} />
          <path d={`M 0 -54 q ${-6 - pulse * 3} -22 ${2 - pulse * 7} -40`} fill="none" stroke={palette.paperWarm} strokeWidth={4} opacity={0.2} />
        </g>
      </Parallax>

      <Parallax cam={cam} depth={1.08} width={w} height={h}>
        <path d={`M ${-w * 0.1} ${h * 1.08} L ${-w * 0.1} ${h * 0.94} Q ${w * 0.4} ${h * 0.9} ${w * 1.1} ${h * 0.95} L ${w * 1.1} ${h * 1.08} Z`} fill={palette.ink} filter="url(#pc-torn)" />
      </Parallax>

      <Motes time={time} count={26} width={w} height={h} color={palette.light} opacity={0.34} seed={seed + 8} speed={0.7} />
    </>
  );
};

export const ARCHETYPES = {
  "wide-horizon": WideHorizon,
  corridor: Corridor,
  window: WindowSilhouette,
  iris: Iris,
  macro: ObjectMacro,
} as const;

export type ArchetypeId = keyof typeof ARCHETYPES;
