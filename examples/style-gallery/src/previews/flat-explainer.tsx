import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, easeOutCubic} from "./utils";

export const FlatExplainerPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const orbit = time * 1.2;
  const label1 = easeOutCubic(clamp((time - 0.35) / 0.3));
  const label2 = easeOutCubic(clamp((time - 1.0) / 0.3));
  const label3 = easeOutCubic(clamp((time - 1.7) / 0.3));
  const x = 960 + Math.cos(orbit) * 430;
  const y = 540 + Math.sin(orbit) * 220;

  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 46% 42%, #18366b 0%, #081a3f 52%, #04091a 100%)", overflow: "hidden"}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <ellipse cx="960" cy="540" rx="520" ry="280" fill="none" stroke="#eaf4ff" strokeWidth="2" strokeDasharray="8 18" opacity=".18" transform="rotate(-10 960 540)" />
        <g opacity={0.28}>
          {Array.from({length: 34}, (_, index) => (
            <circle key={index} cx={130 + (index * 271) % 1680} cy={80 + (index * 137) % 760} r={1.5 + (index % 3)} fill="#eaf4ff" />
          ))}
        </g>
        <circle cx="960" cy="540" r="210" fill="#ffd24a" opacity=".08" />
        <circle cx="960" cy="540" r="164" fill="#ffd24a" />
        <circle cx="960" cy="540" r="136" fill="#ff9a2e" />
        <circle cx="960" cy="540" r="94" fill="#ffd24a" />
        {Array.from({length: 12}, (_, index) => {
          const angle = (Math.PI * 2 * index) / 12 + time * 0.2;
          return (
            <path
              key={index}
              d={`M ${960 + Math.cos(angle) * 190} ${540 + Math.sin(angle) * 190} L ${960 + Math.cos(angle) * 250} ${540 + Math.sin(angle) * 250}`}
              stroke="#ff9a2e"
              strokeWidth="6"
              strokeLinecap="round"
              opacity=".55"
            />
          );
        })}
        <circle cx={x} cy={y} r="48" fill="#2f6fd0" />
        <path d={`M ${x - 22} ${y - 9} C ${x - 8} ${y - 26} ${x + 20} ${y - 22} ${x + 25} ${y - 2} C ${x + 7} ${y + 5} ${x - 7} ${y + 12} ${x - 22} ${y - 9} Z`} fill="#3fae63" />
        <path d="M 960 540 C 960 360 1320 340 1390 540" fill="none" stroke="#eaf4ff" strokeWidth="3" opacity=".16" />
        <g opacity={label1} transform={`translate(${520} ${250})`}>
          <rect width="330" height="72" rx="36" fill="#eaf4ff" opacity=".94" />
          <text x="32" y="46" fontFamily="Arial, sans-serif" fontSize="26" fill="#081a3f">关系 / 因果 / 时间</text>
        </g>
        <g opacity={label2} transform={`translate(${1240} ${700})`}>
          <rect width="300" height="72" rx="36" fill="#ffd24a" opacity=".96" />
          <text x="30" y="46" fontFamily="Arial, sans-serif" fontSize="26" fill="#081a3f">沿着轨道发生</text>
        </g>
        <g opacity={label3} transform={`translate(${110} ${780})`}>
          <text fontFamily="Arial Black, sans-serif" fontSize="64" fill="#eaf4ff">EVERYTHING</text>
          <text y="74" fontFamily="Arial Black, sans-serif" fontSize="64" fill="#ffd24a">CONNECTS</text>
        </g>
      </svg>
      <AbsoluteFill style={{boxShadow: "inset 0 0 170px rgba(2,10,27,.5)", pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};
