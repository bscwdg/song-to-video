import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, easeOutCubic} from "./utils";

const C = {
  paper: "#f5ead5",
  coral: "#d9765f",
  blue: "#5c8f9b",
  yellow: "#d9a441",
  ink: "#20252a",
};

export const PaintedAnimationPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const bloom = easeOutCubic(clamp(time / 1.1));
  const walk = clamp((time - 0.6) / 2.4);
  const bob = Math.sin(time * 7) * 3;

  return (
    <AbsoluteFill style={{backgroundColor: C.paper, overflow: "hidden"}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <filter id="paint-bleed" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="8" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="28" />
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="ink-boil" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="2" seed="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
          <filter id="paper-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="12" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.18" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="1920" height="1080" fill={C.paper} />
        <rect width="1920" height="1080" fill={C.paper} filter="url(#paper-grain)" opacity=".5" />
        <g opacity={0.65 * bloom}>
          <ellipse cx={520 + time * 24} cy={360} rx={310} ry={210} fill={C.blue} opacity=".34" filter="url(#paint-bleed)" />
          <ellipse cx={1280 - time * 18} cy={280} rx={350} ry={220} fill={C.coral} opacity=".28" filter="url(#paint-bleed)" />
          <ellipse cx={980} cy={650} rx={470} ry={250} fill={C.yellow} opacity=".22" filter="url(#paint-bleed)" />
        </g>
        <g opacity={bloom} filter="url(#ink-boil)">
          <path d="M -80 760 C 210 590 430 640 690 720 C 960 806 1170 590 1450 660 C 1660 714 1810 680 2000 610 L 2000 1080 L -80 1080 Z" fill={C.ink} opacity=".16" />
          <path d="M -80 840 C 290 720 560 790 820 820 C 1110 854 1330 730 1570 790 C 1730 830 1850 810 2000 760 L 2000 1080 L -80 1080 Z" fill={C.ink} opacity=".2" />
        </g>
        <g
          transform={`translate(${720 + walk * 500} ${900 + bob})`}
          filter="url(#ink-boil)"
          opacity={0.92}
        >
          <circle cx="0" cy="-105" r="27" fill={C.coral} />
          <path d="M -31 -83 C -9 -96 22 -92 34 -70 L 38 35 L 15 38 L 4 -18 L -8 38 L -32 34 Z" fill={C.blue} />
          <path d="M 27 -62 C 49 -54 60 -37 63 -18" fill="none" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
          <path d="M -18 34 L -38 105 M 15 35 L 30 106" stroke={C.ink} strokeWidth="9" strokeLinecap="round" />
          <path d="M -4 12 C 18 18 38 12 52 0" fill="none" stroke={C.yellow} strokeWidth="8" strokeLinecap="round" />
        </g>
        <g fontFamily="Georgia, serif" fill={C.ink} opacity={bloom}>
          <text x="92" y="118" fontSize="24" letterSpacing="4" fill={C.coral}>PAINTED ANIMATION</text>
          <text x="92" y="166" fontSize="52" fontStyle="italic">a world still drying</text>
        </g>
      </svg>
      <AbsoluteFill style={{boxShadow: "inset 0 0 170px rgba(74,48,35,.25)", pointerEvents: "none"}} />
    </AbsoluteFill>
  );
};
