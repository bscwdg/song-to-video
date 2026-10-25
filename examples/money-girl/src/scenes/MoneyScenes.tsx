import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C} from "../theme";
import {
  beatPulseAt,
  clamp,
  easeInOutCubic,
  easeOutCubic,
  type SceneProps,
} from "../timeline";
import {
  GrainOverlay,
  PaperSpeckField,
  vignette,
} from "../components/Paper";
import {
  Banknote,
  beatsInScene,
  beatEntry,
  Coin,
  Cup,
  Doorway,
  House,
  PaperBokeh,
  PaperFigure,
  PaperFlower,
  PaperTearStrip,
  WeddingArch,
} from "../components/Story";

const cameraLayer = (scale: number, x = 960, y = 540) => ({
  transform: `translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`,
});

const grain = <GrainOverlay opacity={0.18} />;

const FigureShadow: React.FC<{x: number; y: number; width: number}> = ({
  x,
  y,
  width,
}) => (
  <ellipse cx={x} cy={y} rx={width} ry={width * 0.1} fill={C.shadow} opacity=".28" />
);

const Hand: React.FC<{
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  color?: string;
  rotation?: number;
}> = ({x, y, scale = 1, facing = 1, color = C.skin, rotation = 0}) => (
  <g
    transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale * facing} ${scale})`}
    filter="url(#paper-shadow-close)"
  >
    <path
      d="M -8 0 C 18 -13 58 -8 78 14 L 94 72 C 57 92 2 88 -35 66 L -42 25 Z"
      fill={color}
      filter="url(#paper-cut)"
    />
    <path d="M 23 5 C 36 -35 48 -53 60 -48 C 71 -42 60 -10 52 13" fill={color} filter="url(#paper-cut)" />
    <path d="M 43 7 C 59 -25 70 -33 80 -24 C 88 -15 70 9 61 25" fill={color} filter="url(#paper-cut)" />
    <path d="M 61 17 C 79 -4 92 -5 97 5 C 102 16 83 31 71 41" fill={color} filter="url(#paper-cut)" />
    <path d="M 9 37 C 16 75 12 101 2 116 L -30 103 C -23 77 -24 59 -31 44 Z" fill={color} filter="url(#paper-cut)" />
    <path d="M -2 7 C 19 21 45 32 71 37" fill="none" stroke={C.cream} strokeWidth="3" opacity=".28" />
  </g>
);

export const SceneMoneyRise: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const push = 1.02 + easeInOutCubic(clamp(local / sceneDuration)) * 0.07;
  const pulse = beatPulseAt(time, beats, 7);

  return (
    <AbsoluteFill style={{backgroundColor: C.wine, overflow: "hidden"}}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 24%, #e6b28d 0%, #c8796d 28%, #7e3b49 62%, #361c2a 100%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <linearGradient id="money-shaft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6d4" stopOpacity=".56" />
            <stop offset="1" stopColor="#fff6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g style={cameraLayer(push)}>
          <path d="M 700 0 L 860 0 L 1150 840 L 480 840 Z" fill="url(#money-shaft)" />
          <path d="M 1220 0 L 1340 0 L 1510 820 L 1060 820 Z" fill="url(#money-shaft)" opacity=".48" />
          {Array.from({length: 24}, (_, index) => {
            const x = 90 + ((index * 173) % 1740);
            const start = sceneBeats[index % Math.max(sceneBeats.length, 1)] ?? sceneStart;
            const delayed = start + Math.floor(index / Math.max(sceneBeats.length, 1)) * 0.14;
            const entry = easeOutCubic(clamp((time - delayed) / 0.9));
            const y = -150 + entry * (500 + (index % 6) * 34);
            return (
              <Banknote
                key={index}
                x={x}
                y={y}
                width={95 + (index % 4) * 24}
                rotation={-25 + (index % 7) * 9 + Math.sin(time * 2 + index) * 7}
                opacity={0.35 + entry * 0.65}
                color={index % 3 === 0 ? "#e0b56a" : "#d4c190"}
              />
            );
          })}
          <Coin
            x={300}
            y={300}
            radius={92}
            rotation={time * 12}
            opacity={0.18 + pulse * 0.08}
          />
          <Coin x={1640} y={235} radius={62} rotation={-time * 16} opacity={0.16} />
          <WeddingArch x={960} y={900} scale={1.12} color="#f2ddbd" accent={C.rose} />
          <FigureShadow x={875} y={912} width={90} />
          <FigureShadow x={1065} y={912} width={90} />
          <PaperFigure x={875} y={910} scale={1.12} kind="bride" color={C.redDeep} accent={C.gold} arm={pulse} />
          <PaperFigure x={1065} y={910} scale={1.18} kind="groom" color={C.ink} facing={-1} />
          <PaperFlower x={815} y={805} radius={14} color={C.blush} rotation={time * 18} />
          <PaperFlower x={1115} y={805} radius={12} color={C.goldPale} rotation={-time * 20} />
          <PaperSpeckField time={time} count={36} color={C.goldPale} opacity={0.25} direction={1} />
        </g>
      </svg>
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(40,8,18,.05), transparent 48%, rgba(31,8,17,.3))"}} />
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneStageTears: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const push = 1.02 + easeInOutCubic(clamp(local / sceneDuration)) * 0.06;
  const pulse = beatPulseAt(time, beats, 6);

  return (
    <AbsoluteFill style={{backgroundColor: C.redDeep, overflow: "hidden"}}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 16%, #f4c58d 0%, #b7584c 28%, #722b35 57%, #301722 100%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g style={cameraLayer(push)}>
          <path d="M 590 0 L 780 0 L 930 720 L 500 720 Z" fill="#fff0c4" opacity=".17" />
          <path d="M 1170 0 L 1340 0 L 1440 720 L 1030 720 Z" fill="#fff0c4" opacity=".14" />
          <path
            d="M -50 0 L 370 0 C 315 235 345 490 450 760 L 250 830 C 150 540 90 246 -50 0 Z"
            fill="#8f2e35"
            filter="url(#paper-cut)"
          />
          <path
            d="M 1970 0 L 1550 0 C 1600 250 1570 496 1460 760 L 1660 830 C 1772 540 1830 246 1970 0 Z"
            fill="#8f2e35"
            filter="url(#paper-cut)"
          />
          {Array.from({length: 9}, (_, index) => (
            <path
              key={index}
              d={`M ${index % 2 === 0 ? 80 + index * 33 : 1900 - index * 33} 80
                  C ${index % 2 === 0 ? 260 - index * 7 : 1660 + index * 7} 270
                    ${index % 2 === 0 ? 380 - index * 8 : 1540 + index * 8} 520
                    ${index % 2 === 0 ? 440 - index * 5 : 1480 + index * 5} 790`}
              fill="none"
              stroke={index % 2 === 0 ? "#c65c4d" : "#c65c4d"}
              strokeWidth="12"
              opacity=".24"
            />
          ))}
          <path d="M 320 760 L 1600 760 L 1730 890 L 180 890 Z" fill={C.wine} filter="url(#paper-shadow)" />
          <path d="M 340 752 L 1580 752 L 1600 786 L 320 786 Z" fill={C.goldPale} opacity=".58" />
          <FigureShadow x={865} y={790} width={95} />
          <FigureShadow x={1060} y={790} width={95} />
          <PaperFigure x={865} y={786} scale={1.02} kind="bride" color={C.redDeep} arm={pulse} />
          <PaperFigure x={1060} y={786} scale={1.08} kind="groom" color={C.ink} facing={-1} />
          {Array.from({length: 12}, (_, index) => {
            const start = sceneBeats[index % Math.max(sceneBeats.length, 1)] ?? sceneStart;
            const drop = ((time - start) * (280 + (index % 4) * 22)) % 410;
            const x = index % 2 === 0 ? 830 + (index % 4) * 12 : 1090 + (index % 5) * 11;
            const y = 585 + drop;
            return (
              <PaperTearStrip
                key={index}
                x={x}
                y={y}
                width={7 + (index % 3) * 3}
                height={70 + (index % 4) * 22}
                opacity={clamp((time - start) / 0.2 + 0.15) * 0.55}
                rotation={-5 + (index % 4) * 7}
              />
            );
          })}
          {Array.from({length: 14}, (_, index) => (
            <PaperFigure
              key={index}
              x={230 + index * 110}
              y={1050 + (index % 3) * 12}
              scale={0.55 + (index % 4) * 0.05}
              kind="guest"
              color={C.ink}
              opacity={0.58}
            />
          ))}
          <PaperSpeckField time={time} count={26} color={C.goldPale} opacity={0.22} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneRoomFill: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const drift = easeInOutCubic(clamp(local / sceneDuration)) * 34;
  const people = Array.from({length: 15}, (_, index) => {
    const start = sceneBeats[index % Math.max(sceneBeats.length, 1)] ?? sceneStart;
    const entry = beatEntry(time, start, 0.26);
    const positions = [
      [720, 890], [860, 855], [1040, 900], [1190, 855], [1320, 900],
      [760, 760], [930, 790], [1110, 770], [1270, 805], [1430, 830],
      [620, 960], [980, 975], [1200, 965], [1380, 955], [1510, 925],
    ];
    return {entry, x: positions[index][0], y: positions[index][1], scale: 0.46 + (index % 3) * 0.06};
  });

  return (
    <AbsoluteFill style={{backgroundColor: "#241a25", overflow: "hidden"}}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, #1c1923 0%, #3c2a31 30%, #8d5847 62%, #281c24 100%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <linearGradient id="room-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd68a" stopOpacity=".55" />
            <stop offset="1" stopColor="#ffd68a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${-drift} 0)`}>
          <path d="M 150 0 H 1770 V 900 H 150 Z" fill="#3b262b" opacity=".48" />
          <path d="M 150 900 H 1770 V 1080 H 150 Z" fill="#17151d" filter="url(#paper-cut)" />
          <path d="M 250 0 V 900 M 600 0 V 900 M 1320 0 V 900 M 1640 0 V 900" stroke="#a36b58" strokeWidth="24" opacity=".25" filter="url(#paper-cut)" />
          <path d="M 850 0 L 1030 0 L 1180 900 L 740 900 Z" fill="url(#room-light)" />
          <path d="M 1470 520 L 1720 520 L 1720 900 L 1470 900 Z" fill="#0e1119" filter="url(#paper-cut)" />
          <path d="M 1500 555 L 1690 555 L 1690 900 L 1500 900 Z" fill={C.amber} opacity=".24" />
          <path
            d="M 300 220 C 370 180 560 184 620 230 C 624 302 612 380 630 452 L 292 452 C 312 376 302 300 300 220 Z"
            fill="#b17960"
            opacity=".42"
            filter="url(#paper-cut)"
          />
          <ellipse cx="438" cy="825" rx="190" ry="250" fill={C.goldPale} opacity=".075" filter="url(#soft-haze)" />
          <path d="M 320 250 H 610 M 320 320 H 610 M 320 390 H 610" stroke="#603b38" strokeWidth="9" opacity=".45" />
          <path d="M 1080 130 V 280" stroke={C.ink} strokeWidth="8" />
          <path d="M 1028 276 H 1132 L 1170 372 H 990 Z" fill={C.goldPale} filter="url(#paper-shadow)" />
          <path d="M 1004 360 L 1156 360 L 1170 372 H 990 Z" fill={C.gold} opacity=".68" />
          {Array.from({length: 10}, (_, index) => (
            <Banknote
              key={index}
              x={520 + (index % 5) * 110}
              y={936 + (index % 2) * 38}
              width={82}
              rotation={-16 + index * 7}
              opacity={0.52}
            />
          ))}
          {people.map((person, index) => (
            <PaperFigure
              key={index}
              x={person.x}
              y={person.y}
              scale={person.scale * (0.8 + person.entry * 0.2)}
              kind="guest"
              color={index % 4 === 0 ? C.redDeep : C.inkSoft}
              opacity={person.entry * 0.9}
            />
          ))}
          <FigureShadow x={430} y={980} width={130} />
          <PaperFigure x={430} y={980} scale={1.82} kind="old" color="#263e4c" facing={1} />
          <PaperSpeckField time={time} count={20} color="#f6d9b2" opacity={0.16} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill style={{background: "linear-gradient(90deg, rgba(4,6,10,.34), transparent 38%, transparent 67%, rgba(3,4,8,.36))"}} />
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneToast: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const pan = easeInOutCubic(clamp(local / sceneDuration)) * 90;
  const pulse = beatPulseAt(time, beats, 7);

  return (
    <AbsoluteFill style={{backgroundColor: "#24372f", overflow: "hidden"}}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #18392f 0%, #315846 44%, #7d513e 44.2%, #271a1c 100%)",
        }}
      />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(${-pan + 30} 0)`}>
          <circle cx="1550" cy="210" r="130" fill={C.goldPale} opacity=".18" filter="url(#soft-haze)" />
          <path d="M 0 568 C 350 522 760 536 1110 558 C 1390 574 1650 552 1920 522 L 1920 696 L 0 696 Z" fill="#b96e54" filter="url(#paper-cut)" />
          <path d="M 0 690 C 380 650 770 670 1120 690 C 1420 706 1690 678 1920 652 L 1920 820 L 0 820 Z" fill="#3a2421" filter="url(#paper-cut)" />
          <path d="M 80 746 H 1830" stroke={C.gold} strokeWidth="5" opacity=".28" />
          {[420, 650, 880, 1110].map((x, index) => (
            <g key={x}>
              <path d={`M ${x - 82} 558 H ${x + 82} V 620 H ${x - 82} Z`} fill={C.wine} filter="url(#paper-cut)" />
              <PaperFigure
                x={x}
                y={625}
                scale={0.82}
                kind="parent"
                color={index % 2 === 0 ? C.redDeep : C.jadeDeep}
                facing={index < 2 ? 1 : -1}
              />
            </g>
          ))}
          <PaperFigure x={1370} y={700} scale={0.97} kind="bride" color={C.redDeep} arm={pulse} />
          <PaperFigure x={1570} y={700} scale={1.02} kind="groom" color={C.ink} facing={-1} arm={pulse} />
          {[420, 650, 880, 1110, 1370, 1570].map((x, index) => {
            const start = sceneBeats[index % Math.max(sceneBeats.length, 1)] ?? sceneStart;
            const lift = easeOutCubic(clamp((time - start) / 0.4)) * (18 + (index % 3) * 6);
            return (
              <g key={x} transform={`translate(0 ${-lift})`}>
                <Cup
                  x={x + (index < 4 ? 0 : -2)}
                  y={index < 4 ? 704 : 742}
                  scale={index < 4 ? 0.72 : 0.8}
                  color={C.cream}
                  accent={index % 2 === 0 ? C.gold : C.rose}
                  rotation={index % 2 === 0 ? -4 : 4}
                />
              </g>
            );
          })}
          <path d="M 70 846 C 480 806 900 842 1330 862 C 1540 872 1740 860 1880 834" fill="none" stroke={C.goldPale} strokeWidth="4" opacity=".3" />
          <PaperSpeckField time={time} count={28} color={C.goldPale} opacity={0.21} direction={1} />
        </g>
      </svg>
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneHandsMacro: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const push = 1.02 + easeInOutCubic(clamp(local / sceneDuration)) * 0.08;
  const open = easeOutCubic(clamp(local / 1.1));

  return (
    <AbsoluteFill style={{backgroundColor: "#3c231d", overflow: "hidden"}}>
      <AbsoluteFill style={{background: "radial-gradient(circle at 62% 42%, #c58b62 0%, #805443 31%, #2e2021 76%, #151319 100%)"}} />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g style={cameraLayer(push, 980, 560)}>
          <PaperBokeh time={time} count={30} color={C.goldPale} opacity={0.42} />
          <circle cx="1000" cy="520" r="300" fill="#ffe7ab" opacity=".08" filter="url(#soft-haze)" />
          <g transform="translate(980 560)">
            {Array.from({length: 11}, (_, index) => {
              const spread = 12 + open * 56;
              const rotation = -70 + index * spread * 0.26;
              const start = sceneBeats[index % Math.max(sceneBeats.length, 1)] ?? sceneStart;
              const entry = beatEntry(time, start, 0.18);
              return (
                <g
                  key={index}
                  transform={`rotate(${rotation}) translate(0 -145) scale(${0.78 + index * 0.015})`}
                  opacity={0.28 + entry * 0.72}
                >
                  <Banknote
                    x={0}
                    y={0}
                    width={178}
                    rotation={0}
                    color={index % 2 === 0 ? "#e3bd71" : "#d9c38e"}
                    accent="#654228"
                  />
                </g>
              );
            })}
            <g transform="rotate(9)">
              <path d="M -44 -4 L 44 -4 L 33 25 L -35 25 Z" fill={C.roseDeep} filter="url(#paper-shadow-close)" />
              <path d="M -22 -4 L 0 -24 L 23 -4 Z" fill={C.goldPale} filter="url(#paper-cut)" />
              <circle cx="0" cy="2" r="8" fill={C.cream} />
            </g>
          </g>
          <Hand x={760} y={575} scale={1.48} facing={1} color={C.skin} rotation={9} />
          <Hand x={1220} y={590} scale={1.4} facing={-1} color="#d9a183" rotation={-8} />
          <path d="M 860 739 C 950 769 1070 769 1160 738" fill="none" stroke={C.goldPale} strokeWidth="5" opacity=".24" />
          <PaperSpeckField time={time} count={22} color={C.goldPale} opacity={0.3} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(30,12,12,.12), transparent 45%, rgba(20,8,12,.3))"}} />
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneStageTop: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const elapsedBeats = Math.max(0, sceneBeats.filter((beat) => beat <= time).length - 1);
  const stepRotation = elapsedBeats * 5.2;
  const pulse = beatPulseAt(time, beats, 6);

  return (
    <AbsoluteFill style={{backgroundColor: "#381b24", overflow: "hidden"}}>
      <AbsoluteFill style={{background: "radial-gradient(circle at 50% 50%, #d8a260 0%, #9d5647 26%, #4c2430 60%, #1a1520 100%)"}} />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(960 520) rotate(${stepRotation}) translate(-960 -520)`}>
          <circle cx="960" cy="520" r="390" fill="#7c3a3b" opacity=".78" filter="url(#paper-shadow)" />
          <circle cx="960" cy="520" r="350" fill="#c3875f" opacity=".82" filter="url(#paper-cut)" />
          <circle cx="960" cy="520" r="330" fill="none" stroke={C.goldPale} strokeWidth="10" opacity=".55" />
          <circle cx="960" cy="520" r="270" fill="none" stroke={C.cream} strokeWidth="4" opacity=".25" />
          <circle cx="960" cy="520" r="210" fill="#7d3a3d" opacity=".6" />
          {Array.from({length: 24}, (_, index) => {
            const angle = (Math.PI * 2 * index) / 24;
            const radius = 468 + (index % 3) * 18;
            const x = 960 + Math.cos(angle) * radius;
            const y = 520 + Math.sin(angle) * radius;
            return (
              <PaperFigure
                key={index}
                x={x}
                y={y}
                scale={0.34 + (index % 3) * 0.035}
                kind="guest"
                color={index % 4 === 0 ? C.redDeep : C.ink}
                facing={index % 2 === 0 ? 1 : -1}
                opacity={0.7}
              />
            );
          })}
          {Array.from({length: 12}, (_, index) => {
            const angle = (Math.PI * 2 * index) / 12 + time * 0.17;
            const radius = 150;
            return (
              <Banknote
                key={index}
                x={960 + Math.cos(angle) * radius}
                y={520 + Math.sin(angle) * radius}
                width={64}
                rotation={(angle * 180) / Math.PI + 90 + index * 13}
                opacity={0.6}
              />
            );
          })}
          <g transform="translate(960 520)">
            <circle r="82" fill={C.cream} opacity=".25" filter="url(#soft-haze)" />
            <PaperFigure x={-28} y={26} scale={0.52} kind="bride" color={C.redDeep} arm={pulse} />
            <PaperFigure x={30} y={30} scale={0.54} kind="groom" color={C.ink} facing={-1} />
          </g>
          <path d="M 960 60 V 980 M 500 520 H 1420" stroke={C.goldPale} strokeWidth="3" opacity=".12" />
          <PaperSpeckField time={time} count={34} color={C.goldPale} opacity={0.22} direction={1} />
        </g>
      </svg>
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneHouseCross: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const lit = 1 + Math.max(0, sceneBeats.filter((beat) => beat <= time).length - 1);
  const crane = 40 - easeInOutCubic(clamp(local / sceneDuration)) * 48;
  const pulse = beatPulseAt(time, beats, 7);

  return (
    <AbsoluteFill style={{backgroundColor: "#152c31", overflow: "hidden"}}>
      <AbsoluteFill style={{background: "linear-gradient(180deg, #1a3f43 0%, #5e7568 48%, #c28d67 68%, #2c2424 100%)"}} />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <g transform={`translate(0 ${crane})`}>
          <circle cx="1580" cy="180" r="92" fill={C.goldPale} opacity=".26" filter="url(#soft-haze)" />
          <path d="M 0 832 C 320 790 690 814 980 834 C 1320 858 1660 816 1920 790 L 1920 1080 L 0 1080 Z" fill="#1d2524" filter="url(#paper-cut)" />
          {[120, 300, 1650, 1810].map((x, index) => (
            <g key={x} transform={`translate(${x} 812) scale(${0.8 + (index % 2) * 0.2})`}>
              <path d="M 0 0 L 18 -150 L 38 0 Z" fill={C.inkSoft} filter="url(#paper-cut)" />
              <circle cx="18" cy="-110" r="45" fill={C.jadeDeep} filter="url(#paper-cut)" />
            </g>
          ))}
          <House x={960} y={845} scale={1.04} lit={lit} progress={1} color={C.paper} accent={C.goldPale} />
          {[
            [675, 948, 0.3],
            [740, 965, 0.35],
            [810, 950, 0.31],
            [1115, 960, 0.34],
            [1190, 947, 0.3],
            [1260, 968, 0.36],
            [1390, 952, 0.31],
          ].map(([x, y, scale], index) => (
            <PaperFigure
              key={`${x}-${index}`}
              x={x}
              y={y}
              scale={scale}
              kind="guest"
              color={index % 2 === 0 ? C.inkSoft : C.redDeep}
              opacity={0.72}
            />
          ))}
          <path d="M 960 845 L 960 945" stroke={C.goldPale} strokeWidth="2" opacity=".2" />
          <path d="M 450 876 H 1470" stroke={C.goldPale} strokeWidth="7" opacity=".28" />
          {Array.from({length: 11}, (_, index) => {
            const angle = Math.PI * (0.08 + index * 0.085);
            const x = 960 + Math.cos(angle) * 630;
            const y = 840 - Math.sin(angle) * 130;
            return (
              <PaperFlower
                key={index}
                x={x}
                y={y}
                radius={10 + (index % 3) * 5}
                color={index % 2 === 0 ? C.rose : C.blush}
                rotation={time * (12 + index)}
              />
            );
          })}
          <circle cx="960" cy="940" r={120 + pulse * 20} fill="none" stroke={C.goldPale} strokeWidth="3" opacity=".12" />
          <PaperSpeckField time={time} count={32} color={C.goldPale} opacity={0.2} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(7,17,20,.06), transparent 44%, rgba(9,12,14,.28))"}} />
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneTableProfile: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const dolly = 1.02 + easeInOutCubic(clamp(local / sceneDuration)) * 0.05;
  const clink = beatPulseAt(time, beats, 9);

  return (
    <AbsoluteFill style={{backgroundColor: "#24151e", overflow: "hidden"}}>
      <AbsoluteFill style={{background: "linear-gradient(180deg, #351d2d 0%, #6e3b3a 38%, #3b2426 62%, #151218 100%)"}} />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <linearGradient id="toast-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe8b0" stopOpacity=".5" />
            <stop offset="1" stopColor="#ffe8b0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g style={cameraLayer(dolly, 1020, 620)}>
          <path d="M 760 0 L 930 0 L 1230 860 L 560 860 Z" fill="url(#toast-beam)" />
          {[1450, 1240, 1030, 820].map((x, index) => (
            <g key={x} opacity={0.34 + index * 0.07}>
              <path d={`M ${x - 75} 548 H ${x + 75} V 700 H ${x - 75} Z`} fill={C.wine} filter="url(#paper-cut)" />
              <PaperFigure
                x={x}
                y={680}
                scale={0.72}
                kind="parent"
                color={index % 2 === 0 ? C.redDeep : C.inkSoft}
                facing={-1}
              />
            </g>
          ))}
          <path d="M -100 865 C 360 800 900 805 1500 850 L 1950 900 L 1950 1110 L -100 1110 Z" fill="#1b1519" filter="url(#paper-shadow)" />
          <path d="M -100 840 C 400 790 940 800 1500 842 L 1920 890" fill="none" stroke={C.goldPale} strokeWidth="5" opacity=".24" />
          {[
            {x: 460, color: C.gold},
            {x: 820, color: C.rose},
            {x: 1180, color: C.gold},
            {x: 1540, color: C.rose},
          ].map((cup, index) => {
            const start = sceneBeats[index % Math.max(sceneBeats.length, 1)] ?? sceneStart;
            const lift = easeOutCubic(clamp((time - start) / 0.38)) * 30;
            return (
              <g key={cup.x} transform={`translate(0 ${-lift})`}>
                <Cup x={cup.x} y={760} scale={1.18} color={C.cream} accent={cup.color} rotation={index % 2 === 0 ? -5 : 5} />
                <ellipse cx={cup.x + 115} cy={727} rx={56} ry={18} fill={C.skin} opacity=".8" transform={`rotate(${index % 2 === 0 ? -10 : 10} ${cup.x + 115} 727)`} />
                <path
                  d={`M ${cup.x} ${682} c ${-22 - index * 4} -35 ${24 + index * 6} -58 ${-3 - index * 3} -90`}
                  fill="none"
                  stroke={C.cream}
                  strokeWidth="4"
                  opacity=".2"
                />
              </g>
            );
          })}
          <path d="M 570 714 H 690 M 890 714 H 1010 M 1210 714 H 1330" stroke={C.goldPale} strokeWidth="5" opacity={0.16 + clink * 0.25} />
          <PaperSpeckField time={time} count={22} color={C.goldPale} opacity={0.2} direction={1} />
        </g>
      </svg>
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};

export const SceneFarewell: React.FC<SceneProps> = ({
  sceneStart,
  sceneDuration,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame / fps;
  const time = sceneStart + local;
  const sceneBeats = beatsInScene(sceneStart, sceneDuration, beats);
  const wheel = Math.min(34, local * 5);
  const goodbye = beats[beats.length - 5] ?? sceneStart + sceneDuration - 1.5;
  const exit = easeInOutCubic(clamp((time - goodbye) / 1.15));
  const pulse = beatPulseAt(time, beats, 8);

  return (
    <AbsoluteFill style={{backgroundColor: "#0b1220", overflow: "hidden"}}>
      <AbsoluteFill style={{background: "linear-gradient(180deg, #171e32 0%, #61445c 39%, #cc9b76 70%, #261a24 100%)"}} />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <defs>
          <clipPath id="farewell-day">
            <path d="M 960 540 m -390 0 a 390 390 0 0 1 780 0 z" />
          </clipPath>
          <clipPath id="farewell-night">
            <path d="M 960 540 m -390 0 a 390 390 0 0 0 780 0 z" />
          </clipPath>
        </defs>
        <g transform={`translate(960 540) rotate(${wheel}) translate(-960 -540)`}>
          <circle cx="960" cy="540" r="390" fill="#f3d39f" opacity=".26" filter="url(#soft-haze)" />
          <g clipPath="url(#farewell-day)">
            <circle cx="960" cy="540" r="360" fill="#e8c893" opacity=".42" filter="url(#paper-cut)" />
            <circle cx="1160" cy="300" r="120" fill="#f7e6ba" opacity=".62" />
          </g>
          <g clipPath="url(#farewell-night)">
            <circle cx="960" cy="540" r="360" fill="#17263b" opacity=".78" filter="url(#paper-cut)" />
            {Array.from({length: 18}, (_, index) => (
              <circle
                key={index}
                cx={780 + ((index * 137) % 360)}
                cy={220 + ((index * 97) % 280)}
                r={2 + (index % 3) * 1.4}
                fill={C.cream}
                opacity={0.35 + (index % 4) * 0.12}
              />
            ))}
          </g>
          <circle cx="960" cy="540" r="360" fill="none" stroke={C.goldPale} strokeWidth="8" opacity=".5" />
          <circle cx="960" cy="540" r="272" fill="none" stroke={C.cream} strokeWidth="3" opacity=".3" />
          {Array.from({length: 18}, (_, index) => {
            const angle = (Math.PI * 2 * index) / 18;
            const radius = 446;
            return (
              <g
                key={index}
                transform={`translate(${960 + Math.cos(angle) * radius} ${540 + Math.sin(angle) * radius}) rotate(${(angle * 180) / Math.PI + 90})`}
              >
                <Banknote
                  x={0}
                  y={0}
                  width={70}
                  rotation={index % 2 === 0 ? -6 : 7}
                  color={index % 3 === 0 ? "#e4bd76" : "#d8c695"}
                  opacity={0.62}
                />
              </g>
            );
          })}
        </g>
        <g transform="translate(0 0)">
          <Doorway x={1420} y={840} scale={1.02} open={0.3 + exit * 0.7} />
          <FigureShadow x={1280} y={884} width={80} />
          <PaperFigure
            x={1280 + exit * 126}
            y={882}
            scale={1.12}
            kind="old"
            color={C.ink}
            opacity={0.88 - exit * 0.7}
            facing={1}
          />
          <PaperFigure x={910} y={900} scale={1.2} kind="bride" color={C.redDeep} arm={pulse} />
          <PaperFigure x={1040} y={902} scale={1.22} kind="groom" color={C.ink} facing={-1} />
          {Array.from({length: 8}, (_, index) => {
            const start = sceneBeats[(index + 3) % Math.max(sceneBeats.length, 1)] ?? sceneStart;
            const rise = easeOutCubic(clamp((time - start) / 0.5));
            return (
              <Banknote
                key={index}
                x={760 + index * 44}
                y={852 - rise * (50 + (index % 4) * 30)}
                width={58}
                rotation={-16 + index * 5 + Math.sin(time + index) * 8}
                opacity={rise * 0.7}
              />
            );
          })}
          <PaperTearStrip x={1210} y={620} width={18} height={240} color={C.cream} opacity={exit * 0.72} rotation={-8} />
          <PaperBokeh time={time} count={22} color={C.goldPale} opacity={0.24} />
          <PaperSpeckField time={time} count={38} color={C.goldPale} opacity={0.28} direction={-1} />
        </g>
      </svg>
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(8,12,22,.08), transparent 46%, rgba(9,8,14,.36))"}} />
      <AbsoluteFill style={vignette} />
      {grain}
    </AbsoluteFill>
  );
};
