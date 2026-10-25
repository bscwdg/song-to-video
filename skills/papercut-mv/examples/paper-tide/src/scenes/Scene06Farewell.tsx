import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {CUTS, clamp, easeInOutCubic, easeOutCubic} from "../timeline";
import {Boy, Girl, GrainOverlay, Moon, OrigamiBoat, PaperSpeckField, vignette} from "../components/Paper";

const tornRightEdge = (x: number, top: number, bottom: number) => {
  const pts: string[] = [`M ${x} ${top}`];
  for (let i = 1; i <= 10; i++) {
    const y = top + ((bottom - top) * i) / 10;
    pts.push(`L ${x + Math.sin(i * 2.13) * 12 + (i % 3) * 4} ${y}`);
  }
  return pts.join(" ");
};

const tornLeftEdge = (x: number, top: number, bottom: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const y = top + ((bottom - top) * i) / 10;
    pts.push(`${i === 0 ? "M" : "L"} ${x + Math.cos(i * 2.4) * 13 - (i % 2) * 5} ${y}`);
  }
  return pts.join(" ");
};

export const Scene06Farewell: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const split = easeInOutCubic(clamp((t - 1.52) / 1.2));
  const curtainGap = 20 + split * 520;
  const waveShock = Math.sin(clamp((t - 1.52) / 0.75) * Math.PI) * (t > 1.5 ? 1 : 0);
  const girlWave = Math.sin(t * 4.4) * 9;
  const boatSway = Math.sin(t * 2.5) * 4;
  const leftEdge = 960 - curtainGap / 2;
  const rightEdge = 960 + curtainGap / 2;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#4b2f48"}}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #4b3a5a 0%, #985e73 31%, #d18a86 57%, #2d3648 57.5%, #162735 100%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <clipPath id="left-paper">
            <path d={`M 0 0 H ${leftEdge} ${tornRightEdge(leftEdge, 0, 1080).replace("M", "L")} L 0 1080 Z`} />
          </clipPath>
          <clipPath id="right-paper">
            <path
              d={`${tornLeftEdge(rightEdge, 0, 1080)} L 1920 1080 L 1920 0 Z`}
            />
          </clipPath>
        </defs>

        <g opacity={0.62 + (1 - split) * 0.2}>
          <Moon x={960} y={222} radius={122} glow={0.9} rotation={-3} />
          <path
            d="M -60 655 C 310 625 635 646 969 667 C 1263 685 1587 650 1980 619"
            fill="none"
            stroke={C.cream}
            strokeWidth="3"
            opacity=".2"
          />
          <path
            d="M -50 727 C 289 698 558 716 909 741 C 1224 763 1532 740 1972 695"
            fill="none"
            stroke={C.cream}
            strokeWidth="2"
            opacity=".14"
          />
        </g>

        <g transform={`translate(${-curtainGap * 0.33} 0)`}>
        <g clipPath="url(#left-paper)">
          <path
            d={`M 0 0 H ${leftEdge + 30} L ${leftEdge + 10} 690 L ${leftEdge - 8} 1080 H 0 Z`}
            fill="#6d3d4f"
            opacity=".1"
          />
          <path
            d="M -40 709 C 256 659 506 691 760 709 C 856 716 937 716 1015 710 L 1015 850 L -40 850 Z"
            fill="#24202d"
            filter="url(#paper-cut)"
          />
          <path
            d="M -40 742 C 295 707 572 738 881 754 L 881 1080 L -40 1080 Z"
            fill="#171621"
            filter="url(#paper-cut)"
          />
          <path d="M 565 702 V 563 M 591 702 V 563" stroke="#1e1924" strokeWidth="12" />
          <path d="M 537 563 H 621 L 605 594 H 555 Z" fill="#1c1722" filter="url(#paper-cut)" />
          <g transform={`translate(${girlWave} 0)`}>
            <Girl
              x={640}
              y={747}
              scale={1.34}
              facing={-1}
              color="#15141b"
              waving
            />
          </g>
          <path
            d="M 565 824 C 617 829 655 844 681 872"
            fill="none"
            stroke="#e7b28b"
            strokeWidth="2"
            opacity=".18"
          />
        </g>
        </g>

        <g transform={`translate(${curtainGap * 0.33} 0)`}>
        <g clipPath="url(#right-paper)">
          <path
            d={`M ${rightEdge - 30} 0 H 1920 V 1080 H ${rightEdge} L ${rightEdge - 15} 690 Z`}
            fill="#6d3d4f"
            opacity=".1"
          />
          <path
            d="M 818 928 C 1009 914 1245 932 1456 963 C 1626 987 1781 983 1980 948 L 1980 1090 L 818 1090 Z"
            fill="#15141c"
            filter="url(#paper-cut)"
          />
          <path
            d="M 862 753 C 1110 719 1352 744 1588 784 L 1588 894 C 1305 858 1055 856 862 880 Z"
            fill="#211c28"
            filter="url(#paper-cut)"
          />
          <g transform={`translate(0 ${boatSway})`}>
            <OrigamiBoat
              x={1240}
              y={812}
              scale={0.62}
              color="#0e1118"
              accent="#e3c999"
              boy
              lanternGlow={1.1}
            />
          </g>
          {Array.from({length: 7}, (_, i) => (
            <path
              key={i}
              d={`M ${900 + i * 130} 917 Q ${956 + i * 130} 891 ${1010 + i * 130} 915`}
              fill="none"
              stroke="#52616b"
              strokeWidth="4"
              opacity=".25"
            />
          ))}
        </g>
        </g>

        <g opacity={0.22 + waveShock * 0.4} transform={`translate(${960} ${540}) scale(${1 + split * 0.4}) translate(${-960} ${-540})`}>
          <path
            d={`M ${leftEdge} 0 C ${leftEdge - 24} 246 ${leftEdge + 29} 465 ${leftEdge - 4} 706 C ${leftEdge + 23} 883 ${leftEdge - 17} 998 ${leftEdge + 2} 1080`}
            fill="none"
            stroke="#f4cb9a"
            strokeWidth="3"
          />
          <path
            d={`M ${rightEdge} 0 C ${rightEdge + 22} 243 ${rightEdge - 27} 482 ${rightEdge + 2} 714 C ${rightEdge - 25} 892 ${rightEdge + 19} 1002 ${rightEdge} 1080`}
            fill="none"
            stroke="#f4cb9a"
            strokeWidth="3"
          />
        </g>
        <PaperSpeckField time={t + CUTS[5]} count={28} color="#f6d2ab" opacity={0.2} direction={-1} />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(28,13,27,.18), transparent 42%, rgba(18,11,21,.38))",
        }}
      />
      <AbsoluteFill style={vignette} />
      <GrainOverlay opacity={0.24} />
    </AbsoluteFill>
  );
};
