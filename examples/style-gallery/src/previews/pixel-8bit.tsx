import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, easeOutCubic} from "./utils";

export const Pixel8BitPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const scroll = (time * 70) % 320;
  const jump = Math.max(0, Math.sin(clamp((time - 0.6) / 1.2) * Math.PI)) * 46;
  const coin = Math.floor(time * 4) % 2 === 0;
  const score = Math.floor(time * 8);

  return (
    <AbsoluteFill style={{backgroundColor: "#0a0f1c", overflow: "hidden"}}>
      <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" style={{position: "absolute", inset: 0}}>
        <rect width="320" height="180" fill="#1f3a5f" />
        <rect y="24" width="320" height="84" fill="#4aa3df" opacity=".55" />
        <rect x="230" y="24" width="30" height="30" fill="#f2c14e" />
        <rect x="236" y="30" width="18" height="18" fill="#ffe08a" />
        <rect x="0" y="108" width="320" height="72" fill="#0a0f1c" />
        {Array.from({length: 18}, (_, index) => (
          <g key={index}>
            <rect x={((index * 48 - scroll + 320) % 320)} y={122 + (index % 3) * 7} width="16" height="8" fill="#4aa3df" opacity=".7" />
            <rect x={((index * 48 - scroll + 320) % 320) + 7} y={114 + (index % 3) * 7} width="4" height="14" fill="#6b7f77" />
          </g>
        ))}
        <rect x="0" y="142" width="320" height="4" fill="#f25f5c" />
        <g transform="translate(142 120)">
          <rect x="0" y="0" width="12" height="16" fill="#f2c14e" />
          <rect x="3" y="-8" width="6" height="8" fill="#f25f5c" />
          <rect x="-4" y="-17" width="20" height="4" fill="#f1ead9" opacity=".85" />
        </g>
        <g transform={`translate(166 ${110 - jump})`}>
          <rect width="12" height="12" fill="#f2c14e" />
          <rect x="3" y="3" width="6" height="6" fill="#fff3bf" />
        </g>
        <g transform="translate(230 72)">
          <rect width="28" height="24" fill="#0a0f1c" opacity=".72" />
          <text x="5" y="12" fontFamily="Courier New, monospace" fontSize="8" fill="#f1ead9">SCORE</text>
          <text x="5" y="22" fontFamily="Courier New, monospace" fontSize="9" fill="#f2c14e">{String(score).padStart(4, "0")}</text>
        </g>
        <g opacity={0.18}>
          {Array.from({length: 80}, (_, index) => (
            <rect key={index} x={0} y={index * 2.25} width="320" height="1" fill="#000" />
          ))}
        </g>
      </svg>
      <div style={{position: "absolute", left: 64, top: 54, fontFamily: "Courier New, monospace", fontSize: 18, color: "#f1ead9", letterSpacing: 3}}>
        PLAYER 01 · STAGE 01
      </div>
      <div style={{position: "absolute", right: 64, bottom: 52, fontFamily: "Courier New, monospace", fontSize: 16, color: "#f2c14e", letterSpacing: 2}}>
        {coin ? "COIN +1" : "HOLD"}
      </div>
    </AbsoluteFill>
  );
};
