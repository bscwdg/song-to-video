import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, easeOutCubic} from "./utils";

export const InkWashPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const reveal = easeOutCubic(clamp(time / 1.4));
  const mist = Math.sin(time * 0.7) * 40;

  return (
    <AbsoluteFill style={{backgroundColor: "#f2eadb", overflow: "hidden"}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <filter id="ink-edge" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.025" numOctaves="3" seed="18" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" />
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <linearGradient id="paper-wash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff8ea" />
            <stop offset="1" stopColor="#d8cbb5" />
          </linearGradient>
          <linearGradient id="ink-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c2524" stopOpacity=".9" />
            <stop offset="1" stopColor="#1c2524" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#paper-wash)" />
        <g opacity={reveal} filter="url(#ink-edge)">
          <path d={`M -120 ${730 + mist * 0.2} C 220 570 430 630 660 660 C 900 692 1080 480 1290 560 C 1510 646 1740 520 2040 600 L 2040 1080 L -120 1080 Z`} fill="url(#ink-fade)" opacity=".42" />
          <path d={`M -100 ${850 - mist * 0.1} C 260 730 510 790 760 820 C 1010 850 1220 700 1450 760 C 1660 816 1830 780 2020 720 L 2020 1080 L -100 1080 Z`} fill="#1c2524" opacity=".58" />
          <path d="M -40 930 C 320 850 590 912 830 930 C 1100 950 1350 860 1570 900 C 1740 930 1880 912 1980 870" fill="none" stroke="#1c2524" strokeWidth="18" opacity=".36" />
        </g>
        <g opacity={reveal}>
          <rect x={1160} y={170} width={340} height={3} fill="#b44936" opacity=".75" />
          <rect x={1160} y={196} width={210} height={2} fill="#b44936" opacity=".48" />
          <text x="1200" y="175" fontFamily="'Noto Serif SC', STSong, serif" fontSize="92" fill="#1c2524" style={{writingMode: "vertical-rl"}}>山高水长</text>
          <text x="1310" y="250" fontFamily="'Noto Serif SC', STSong, serif" fontSize="22" fill="#6b7f77" letterSpacing="4">LEAVE SILENCE</text>
          <rect x={1515} y={790} width={92} height={92} fill="#b44936" opacity=".82" />
          <text x="1542" y="850" fontFamily="'Noto Serif SC', STSong, serif" fontSize="28" fill="#f2eadb">留白</text>
        </g>
        <text x="92" y="980" fontFamily="JetBrains Mono, Consolas, monospace" fontSize="18" letterSpacing="3" fill="#6b7f77" opacity=".8">INK WASH / 03</text>
      </svg>
      <AbsoluteFill style={{boxShadow: "inset 0 0 180px rgba(90,65,40,.18)", pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};
