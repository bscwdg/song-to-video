import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {clamp, easeInOutCubic, easeOutCubic} from "../timeline";
import {
  GrainOverlay,
  Moon,
  OrigamiBoat,
  PaperSpeckField,
  StarField,
  Whale,
  vignette,
} from "../components/Paper";

const waveWall = (color: string, dx: number, scaleY: number, opacity: number) => (
  <path
    transform={`translate(${dx} 0) translate(0 540) scale(1 ${scaleY}) translate(0 -540)`}
    d="M -20 1030
       C 80 862 118 680 168 552
       C 224 407 296 300 434 240
       C 560 186 682 215 746 310
       C 800 390 757 468 673 504
       C 590 539 523 585 508 670
       C 486 790 502 918 538 1060
       Z"
    fill={color}
    opacity={opacity}
    filter="url(#paper-cut)"
  />
);

export const Scene04Courage: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const climb = easeInOutCubic(clamp((t - 0.65) / 1.35));
  const whaleLift = clamp((t - 1.18) / 0.62);
  const whaleFall = clamp((t - 2.22) / 0.7);
  const moonOut = easeOutCubic(clamp((t - 1.7) / 0.65));
  const flash = Math.max(0, 1 - Math.abs(t - 2.12) / 0.12);
  const boatX = 678 + climb * 206;
  const boatY = 765 - climb * 334 + Math.sin(t * 4.2) * 5;
  const boatTilt = -18 + climb * 13;
  const camera = 1.04 + easeOutCubic(clamp(t / 3.42)) * 0.035;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#06141e"}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 76% 27%, rgba(46,89,102,${0.48 + moonOut * 0.24}) 0%, #112e3d 27%, #071723 67%, #040d14 100%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(960 540) scale(${camera}) translate(-960 -540) rotate(-1.5 960 540)`}>
          <StarField time={t + 7.477} count={48} opacity={0.65} />
          <g opacity={0.28 + moonOut * 0.72}>
            <Moon x={1525} y={252} radius={146} glow={0.7 + moonOut} rotation={11} />
          </g>

          {waveWall("#0c2937", -86, 0.94, 0.92)}
          {waveWall("#123747", -32, 0.86, 0.96)}
          <g transform={`translate(0 ${-climb * 58})`}>
            {waveWall("#194754", 18, 0.74, 1)}
            <path
              d="M 420 302 C 512 245 621 246 706 320 C 765 373 748 447 679 491 C 606 538 552 592 537 674"
              fill="none"
              stroke={C.foam}
              strokeWidth="13"
              opacity=".38"
              filter="url(#paper-cut)"
            />
            <path
              d="M 474 307 C 559 272 628 288 678 342"
              fill="none"
              stroke={C.moon}
              strokeWidth="5"
              opacity=".28"
            />
          </g>

          <g
            opacity={1 - whaleFall * 0.86}
            transform={`translate(0 ${(1 - easeOutCubic(whaleLift)) * 380 + whaleFall * 210}) rotate(${-20 + whaleLift * 11 + whaleFall * 24} 1318 430)`}
          >
            <Whale
              x={1290}
              y={365}
              scale={1.13}
              rotation={-7}
              color="#0b222c"
              accent={C.foam}
              opacity={0.97}
            />
            <path
              d="M 1100 326 C 1193 291 1332 305 1436 358"
              fill="none"
              stroke={C.foam}
              strokeWidth="2"
              opacity=".2"
            />
          </g>

          <path
            d="M 0 870 C 286 828 496 848 688 890 C 895 935 1156 923 1422 878 C 1576 852 1764 858 1920 890 L 1920 1090 L 0 1090 Z"
            fill="#0a202c"
            filter="url(#paper-cut)"
          />
          <g transform={`translate(${boatX} ${boatY}) rotate(${boatTilt})`}>
            <OrigamiBoat
              x={0}
              y={0}
              scale={0.54}
              color="#07151d"
              accent={C.moon}
              boy
              lanternGlow={1 + flash * 2}
            />
          </g>

          {Array.from({length: 18}, (_, i) => {
            const p = clamp((t - 1.12 - (i % 7) * 0.09) / 1.15);
            const x = 480 + ((i * 93) % 630) + p * (100 + (i % 5) * 33);
            const y = 560 - p * (150 + (i % 6) * 28) + p * p * 210;
            const s = 4 + (i % 4) * 2;
            return (
              <path
                key={i}
                d={`M ${x} ${y} l ${s * 1.7} ${s * 0.6} l ${-s * 0.7} ${s} l ${-s * 1.6} ${-s * 0.4} Z`}
                fill={C.foam}
                opacity={0.14 + p * 0.42}
                transform={`rotate(${i * 31} ${x} ${y})`}
              />
            );
          })}
          <PaperSpeckField time={t + 7.477} count={34} opacity={0.31} direction={-1} />
        </g>
        <rect width="1920" height="1080" fill="#d9efe6" opacity={flash * 0.12} />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(1,5,9,.18), transparent 34%, transparent 62%, rgba(1,6,10,.5))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.25} />
    </AbsoluteFill>
  );
};
