import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {clamp, easeInOutCubic, easeOutCubic} from "../timeline";
import {
  Boy,
  GrainOverlay,
  Lantern,
  PaperSpeckField,
  StarField,
  vignette,
} from "../components/Paper";

const HALF_BEAT = 0.209;

export const Scene07Gratitude: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const tilt = easeInOutCubic(clamp(t / 2.96));
  const cameraY = 64 - tilt * 170;
  const warmth = 0.86 + Math.sin(t * 1.7) * 0.04;
  const lanterns = Array.from({length: 16}, (_, i) => {
    const start = i * HALF_BEAT + 0.03;
    const p = easeOutCubic(clamp((t - start) / 1.85));
    const drift = Math.sin(t * 1.1 + i * 1.7) * (14 + (i % 4) * 4);
    const baseX = 55 + ((i * 319 + 57) % 1810);
    const baseY = 950 - ((i * 79) % 260);
    const depth = 0.33 + ((i * 7) % 9) * 0.055;
    const rise = 110 + p * (240 + (i % 6) * 62);
    return {
      x: baseX + drift,
      y: baseY - rise,
      scale: depth * (0.9 + p * 0.55),
      opacity: clamp(p * 1.6) * (0.52 + depth * 0.55),
      rot: Math.sin(t * 1.8 + i) * 5,
      delay: p,
    };
  });

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#3b2118"}}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #402534 0%, #82452f 20%, #c27436 45%, #df9b46 68%, #7d4c2d 81%, #2c201e 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 51% 43%, rgba(255,227,151,${warmth * 0.42}), transparent 34%),
            radial-gradient(circle at 14% 72%, rgba(240,143,64,${warmth * 0.2}), transparent 25%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(0 ${cameraY}) rotate(${-tilt * 0.9} 960 540)`}>
          <StarField time={t + 17.276} count={22} color="#ffe5b0" opacity={0.25} />
          {lanterns.map((l, i) => (
            <g key={i} opacity={l.opacity}>
              <Lantern
                x={l.x}
                y={l.y}
                scale={l.scale}
                glow={0.8 + beatGlow(i, t)}
                opacity={0.8 + l.delay * 0.2}
                rot={l.rot}
              />
              <ellipse cx={l.x} cy={l.y + 70 * l.scale} rx={60 * l.scale} ry={20 * l.scale} fill="#f7b85b" opacity=".1" filter="url(#soft-haze)" />
            </g>
          ))}

          <path
            d="M -80 826 C 250 788 448 825 673 846 C 940 870 1129 823 1364 826 C 1577 829 1780 860 2000 892 L 2000 1110 L -80 1110 Z"
            fill="#39261f"
            filter="url(#paper-cut)"
          />
          <path
            d="M -70 906 C 293 850 523 879 787 907 C 1095 941 1418 884 1988 886 L 1988 1110 L -70 1110 Z"
            fill="#1f1817"
            filter="url(#paper-cut)"
          />
          <path
            d="M -60 978 C 328 942 645 970 1030 991 C 1337 1008 1619 966 1975 947 L 1975 1110 L -60 1110 Z"
            fill="#120f11"
            filter="url(#paper-cut)"
          />
          <g transform={`translate(0 ${-cameraY * 0.14})`}>
            <Boy
              x={962}
              y={982}
              scale={1.25}
              facing={1}
              color="#110d0f"
              lantern
              lanternGlow={1.25}
            />
            <ellipse cx="985" cy="979" rx="118" ry="28" fill="#f9bf6e" opacity=".13" filter="url(#soft-haze)" />
          </g>
          <PaperSpeckField time={t + 17.276} count={50} color="#ffd287" opacity={0.4} direction={-1} />
        </g>
        <rect width="1920" height="1080" fill="#ffbd67" opacity=".025" />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(28,11,17,.18), transparent 36%, transparent 72%, rgba(18,9,7,.46))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.22} />
    </AbsoluteFill>
  );
};

const beatGlow = (i: number, t: number) => {
  const local = ((t / HALF_BEAT + i * 0.27) % 1 + 1) % 1;
  return Math.exp(-local * 9) * 1.4;
};
