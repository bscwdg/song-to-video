import React from "react";
import {add, clamp, dir, mul, perp, rad, signed, tornPolygon, type Point} from "./geom";
import type {Palette} from "./palette";

/**
 * A jointed paper puppet.
 *
 * The v1 figures were one static group with a rotating bouquet. This rig has
 * hip / shoulder / knee / elbow pivots, a pose library and secondary cloth
 * motion, so a shot can actually act instead of sliding a cutout around.
 */

export const PUPPET = {
  thigh: 88,
  shin: 84,
  torso: 118,
  neck: 10,
  headR: 29,
  upperArm: 60,
  forearm: 56,
  hipHalf: 26,
  shoulderHalf: 34,
  thighW: 27,
  shinW: 21,
  armW: 19,
  foreW: 16,
};

export type PoseKind =
  | "idle"
  | "walk"
  | "run"
  | "reach"
  | "embrace"
  | "bow"
  | "lookUp"
  | "sit";

export type Pose = {
  lean: number;
  head: number;
  armBack: [number, number];
  armFront: [number, number];
  legBack: [number, number];
  legFront: [number, number];
  bob: number;
  cloth: number;
};

const still = (over: Partial<Pose> = {}): Pose => ({
  lean: 1,
  head: -1,
  armBack: [7, 4],
  armFront: [-5, 10],
  legBack: [-3, 2],
  legFront: [3, -1],
  bob: 0,
  cloth: 0,
  ...over,
});

export const poseAt = (kind: PoseKind, time: number, seed = 1): Pose => {
  const breathe = Math.sin(time * 1.15 + seed) * 1.4;

  switch (kind) {
    case "walk": {
      const phase = time * 1.85 + seed * 0.1;
      const swing = Math.sin(phase * Math.PI * 2);
      const lift = Math.max(0, Math.sin(phase * Math.PI * 2 + Math.PI * 0.5));
      return still({
        lean: 4,
        head: -1,
        armBack: [16 * swing, 6],
        armFront: [-16 * swing, 10],
        legBack: [-19 * swing, -8 * swing - 4],
        legFront: [19 * swing, 8 * swing - 4],
        bob: lift * 4,
        cloth: swing * 5,
      });
    }
    case "run": {
      const phase = time * 2.6 + seed * 0.1;
      const swing = Math.sin(phase * Math.PI * 2);
      return still({
        lean: 12,
        head: -4,
        armBack: [38 * swing, 18],
        armFront: [-38 * swing, 22],
        legBack: [-34 * swing, -20 * swing - 10],
        legFront: [34 * swing, 20 * swing - 10],
        bob: Math.max(0, Math.cos(phase * Math.PI * 2)) * 8,
        cloth: swing * 10,
      });
    }
    case "reach":
      return still({lean: 5, head: -7, armFront: [102, 6], armBack: [-8, 6], bob: breathe * 0.4});
    case "embrace":
      return still({lean: 3, head: 3, armFront: [84, 38], armBack: [72, 30], bob: breathe * 0.4});
    case "bow":
      return still({lean: 24, head: 10, armFront: [16, 24], armBack: [12, 18], bob: -2});
    case "lookUp":
      return still({lean: -3, head: -15, armFront: [3, 8], armBack: [5, 2], bob: breathe * 0.3});
    case "sit":
      return still({
        lean: -6,
        head: 2,
        armFront: [24, 22],
        armBack: [20, 16],
        legBack: [-58, 76],
        legFront: [-52, 70],
        bob: -54,
        cloth: -4,
      });
    case "idle":
    default:
      return still({
        lean: 1 + breathe * 0.35,
        head: -1 + Math.sin(time * 1.7 + seed) * 1.2,
        armBack: [7, 4 + breathe * 0.4],
        armFront: [-5, 10 + breathe * 0.4],
        bob: breathe * 0.35,
        cloth: Math.sin(time * 1.1 + seed) * 1.6,
      });
  }
};

const limbPath = (a: Point, b: Point, w0: number, w1: number): string => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return `M ${(a[0] + nx * w0 * 0.5).toFixed(1)} ${(a[1] + ny * w0 * 0.5).toFixed(1)}
    L ${(b[0] + nx * w1 * 0.5).toFixed(1)} ${(b[1] + ny * w1 * 0.5).toFixed(1)}
    L ${(b[0] - nx * w1 * 0.5).toFixed(1)} ${(b[1] - ny * w1 * 0.5).toFixed(1)}
    L ${(a[0] - nx * w0 * 0.5).toFixed(1)} ${(a[1] - ny * w0 * 0.5).toFixed(1)} Z`;
};

const Limb: React.FC<{
  a: Point;
  b: Point;
  w0: number;
  w1: number;
  fill: string;
  rim: string;
  rimOpacity?: number;
  seed: number;
  silhouette?: boolean;
}> = ({a, b, w0, w1, fill, rim, rimOpacity = 0.2, seed, silhouette = false}) => {
  const d = limbPath(a, b, w0, w1);
  return (
    <g>
      <path d={d} fill={fill} filter="url(#pc-torn-fine)" />
      {silhouette ? null : (
        <>
          <path d={d} fill="none" stroke={rim} strokeWidth={1.6} opacity={rimOpacity} />
          <path d={d} fill="url(#pc-sheen)" opacity={0.4} />
        </>
      )}
      <circle cx={a[0]} cy={a[1]} r={w0 * 0.36} fill={fill} opacity={0.96} />
      <circle
        cx={b[0]}
        cy={b[1]}
        r={w1 * 0.34}
        fill={fill}
        stroke={silhouette ? undefined : rim}
        strokeWidth={1}
        strokeOpacity={rimOpacity * 0.8}
      />
    </g>
  );
};

export const Puppet: React.FC<{
  x: number;
  groundY: number;
  scale?: number;
  facing?: 1 | -1;
  palette: Palette;
  pose?: PoseKind;
  time?: number;
  seed?: number;
  kind?: "figure" | "bride" | "child";
  tone?: "silhouette" | "paper";
  opacity?: number;
  clothLength?: number;
}> = ({
  x,
  groundY,
  scale = 1,
  facing = 1,
  palette,
  pose = "idle",
  time = 0,
  seed = 1,
  kind = "figure",
  tone = "silhouette",
  opacity = 1,
  clothLength,
}) => {
  const p = poseAt(pose, time, seed);
  const hipHeight = (PUPPET.thigh + PUPPET.shin) * 0.93;
  const hip: Point = [0, -hipHeight - p.bob];
  const torsoAng = 180 - p.lean;
  const shoulderCenter = add(hip, mul(dir(torsoAng), PUPPET.torso));
  const hipAxis = perp(torsoAng);
  const shoulderAxis = perp(torsoAng);

  const hipBack = add(hip, mul(hipAxis, -PUPPET.hipHalf));
  const hipFront = add(hip, mul(hipAxis, PUPPET.hipHalf));
  const shBack = add(shoulderCenter, mul(shoulderAxis, -PUPPET.shoulderHalf));
  const shFront = add(shoulderCenter, mul(shoulderAxis, PUPPET.shoulderHalf));

  const kneeBack = add(hipBack, mul(dir(p.legBack[0]), PUPPET.thigh));
  const ankleBack = add(kneeBack, mul(dir(p.legBack[1]), PUPPET.shin));
  const kneeFront = add(hipFront, mul(dir(p.legFront[0]), PUPPET.thigh));
  const ankleFront = add(kneeFront, mul(dir(p.legFront[1]), PUPPET.shin));

  const elbowBack = add(shBack, mul(dir(p.armBack[0]), PUPPET.upperArm));
  const handBack = add(elbowBack, mul(dir(p.armBack[1]), PUPPET.forearm));
  const elbowFront = add(shFront, mul(dir(p.armFront[0]), PUPPET.upperArm));
  const handFront = add(elbowFront, mul(dir(p.armFront[1]), PUPPET.forearm));

  const headAng = torsoAng - p.head;
  const neckTop = add(shoulderCenter, mul(dir(headAng), PUPPET.neck + PUPPET.headR * 0.82));
  const headCenter = add(shoulderCenter, mul(dir(headAng), PUPPET.neck + PUPPET.headR));

  const main = tone === "paper" ? palette.paper : palette.ink;
  const back = tone === "paper" ? palette.shade : palette.inkSoft;
  const rim = tone === "paper" ? palette.light : palette.inkSoft;
  const LimbPart: React.FC<React.ComponentProps<typeof Limb>> = (props) => (
    <Limb {...props} silhouette={tone !== "paper"} />
  );

  const dressLen = clothLength ?? (kind === "bride" ? PUPPET.thigh + PUPPET.shin - 6 : PUPPET.torso * 1.12);
  const hemL: Point = [-30 - dressLen * 0.3 + p.cloth, dressLen * 0.96];
  const hemR: Point = [34 + dressLen * 0.36 + p.cloth, dressLen * 0.94];
  const hemM: Point = [2 + p.cloth * 1.4, dressLen * 1.04];
  const clothPoints: Point[] = [
    hipBack,
    hipFront,
    [hipFront[0] + 18, hipFront[1] + dressLen * 0.45],
    hemR,
    hemM,
    hemL,
    [hipBack[0] - 18, hipBack[1] + dressLen * 0.45],
  ];

  const hairSway = Math.sin(time * 1.4 + seed) * 3;

  return (
    <g
      transform={`translate(${x} ${groundY}) scale(${scale * facing} ${scale})`}
      opacity={opacity}
    >
      {/* back layer: far arm + far leg + hair behind the head */}
      <LimbPart
        a={shBack}
        b={elbowBack}
        w0={PUPPET.armW * 0.82}
        w1={PUPPET.foreW * 0.8}
        fill={back}
        rim={rim}
        rimOpacity={0.12}
        seed={seed}
      />
      <LimbPart
        a={elbowBack}
        b={handBack}
        w0={PUPPET.foreW * 0.8}
        w1={PUPPET.foreW * 0.55}
        fill={back}
        rim={rim}
        rimOpacity={0.12}
        seed={seed + 1}
      />
      <LimbPart
        a={hipBack}
        b={kneeBack}
        w0={PUPPET.thighW * 0.86}
        w1={PUPPET.shinW * 0.9}
        fill={back}
        rim={rim}
        rimOpacity={0.12}
        seed={seed + 2}
      />
      <LimbPart
        a={kneeBack}
        b={ankleBack}
        w0={PUPPET.shinW * 0.9}
        w1={PUPPET.shinW * 0.58}
        fill={back}
        rim={rim}
        rimOpacity={0.12}
        seed={seed + 3}
      />

      {kind === "bride" ? (
        <path
          d={`M ${headCenter[0] - 26} ${headCenter[1] - 8}
              C ${headCenter[0] - 44 + hairSway} ${headCenter[1] + 40}
                ${headCenter[0] - 40 + hairSway} ${shoulderCenter[1] + 38}
                ${shoulderCenter[0] - 26} ${shoulderCenter[1] + 52}
              L ${shoulderCenter[0] + 10} ${shoulderCenter[1] + 50}
              C ${headCenter[0] + 18} ${headCenter[1] + 18}
                ${headCenter[0] + 24} ${headCenter[1]} ${headCenter[0] + 22} ${headCenter[1] - 6} Z`}
          fill={back}
          filter="url(#pc-torn-fine)"
          opacity={0.9}
        />
      ) : null}

      {/* torso */}
      <path
        d={tornPolygon([hipBack, shBack, [shBack[0] + 10, shBack[1] - 8], [shFront[0] - 6, shFront[1] - 6], shFront, hipFront], 1.6, 24, seed + 4)}
        fill={main}
        filter="url(#pc-torn-fine)"
      />
      <path
        d={limbPath(hipBack, shBack, PUPPET.hipHalf * 1.8, PUPPET.shoulderHalf * 1.7)}
        fill="none"
        stroke={rim}
        strokeWidth={1.8}
        opacity={0.16}
      />

      {/* cloth: dress / coat */}
      <path
        d={tornPolygon(clothPoints, 2.4, 26, seed + 5)}
        fill={kind === "bride" ? palette.paper : main}
        filter="url(#pc-torn-fine)"
        opacity={kind === "bride" ? 0.96 : 0.98}
      />
      <path
        d={`M ${hemL[0]} ${hemL[1]} Q ${hemM[0]} ${hemM[1] + 8} ${hemR[0]} ${hemR[1]}`}
        fill="none"
        stroke={rim}
        strokeWidth={2}
        opacity={0.22}
      />

      {/* front leg + arm */}
      <LimbPart
        a={hipFront}
        b={kneeFront}
        w0={PUPPET.thighW}
        w1={PUPPET.shinW}
        fill={main}
        rim={rim}
        rimOpacity={0.2}
        seed={seed + 6}
      />
      <LimbPart
        a={kneeFront}
        b={ankleFront}
        w0={PUPPET.shinW}
        w1={PUPPET.shinW * 0.58}
        fill={main}
        rim={rim}
        rimOpacity={0.2}
        seed={seed + 7}
      />
      <path
        d={limbPath(ankleFront, add(ankleFront, [14, 2]), 12, 8)}
        fill={main}
        filter="url(#pc-torn-fine)"
      />

      {/* head */}
      <circle
        cx={headCenter[0]}
        cy={headCenter[1]}
        r={PUPPET.headR}
        fill={main}
        filter="url(#pc-torn-fine)"
      />
      <path
        d={`M ${headCenter[0] + PUPPET.headR * 0.62} ${headCenter[1] - 8}
            Q ${headCenter[0] + PUPPET.headR * 1.02} ${headCenter[1] - 1}
              ${headCenter[0] + PUPPET.headR * 0.66} ${headCenter[1] + 9}`}
        fill={main}
      />
      <path
        d={`M ${headCenter[0] - PUPPET.headR + 2} ${headCenter[1] - 8}
            C ${headCenter[0] - 8} ${headCenter[1] - PUPPET.headR - 8}
              ${headCenter[0] + 12} ${headCenter[1] - PUPPET.headR - 6}
              ${headCenter[0] + PUPPET.headR - 2} ${headCenter[1] - 6}
            L ${headCenter[0] + PUPPET.headR - 4} ${headCenter[1] - 2}
            C ${headCenter[0] + 10} ${headCenter[1] - PUPPET.headR + 4}
              ${headCenter[0] - 10} ${headCenter[1] - PUPPET.headR + 4}
              ${headCenter[0] - PUPPET.headR + 2} ${headCenter[1] - 4} Z`}
        fill={kind === "bride" ? palette.shade : palette.inkSoft}
        opacity={tone === "paper" ? 0.55 : 0.85}
      />
      <path
        d={`M ${headCenter[0] + PUPPET.headR * 0.9} ${headCenter[1] - 4} A ${PUPPET.headR} ${PUPPET.headR} 0 0 1 ${headCenter[0] + PUPPET.headR * 0.8} ${headCenter[1] + 14}`}
        fill="none"
        stroke={rim}
        strokeWidth={2}
        opacity={0.2}
      />

      <LimbPart
        a={shFront}
        b={elbowFront}
        w0={PUPPET.armW}
        w1={PUPPET.foreW}
        fill={main}
        rim={rim}
        rimOpacity={0.22}
        seed={seed + 8}
      />
      <LimbPart
        a={elbowFront}
        b={handFront}
        w0={PUPPET.foreW}
        w1={PUPPET.foreW * 0.55}
        fill={main}
        rim={rim}
        rimOpacity={0.22}
        seed={seed + 9}
      />
      <circle
        cx={handFront[0]}
        cy={handFront[1]}
        r={7.5}
        fill={main}
        stroke={rim}
        strokeWidth={1.2}
        strokeOpacity={0.2}
      />

      {kind === "bride" ? (
        <path
          d={`M ${headCenter[0] - 8} ${headCenter[1] - PUPPET.headR - 2}
              C ${headCenter[0] - 30 + hairSway} ${headCenter[1] - 40 - hairSway}
                ${headCenter[0] - 54 + hairSway} ${headCenter[1] + 30}
                ${headCenter[0] - 48 + hairSway} ${shoulderCenter[1] + 74}
              L ${headCenter[0] - 20} ${shoulderCenter[1] + 62}
              C ${headCenter[0] - 26} ${headCenter[1] + 8}
                ${headCenter[0] - 8} ${headCenter[1] - 18} ${headCenter[0] + 10} ${headCenter[1] - PUPPET.headR + 2} Z`}
          fill={palette.paper}
          opacity={0.34}
          filter="url(#pc-torn-fine)"
        />
      ) : null}
    </g>
  );
};

/** Two figures sharing a frame, with correct back/front order. */
export const Couple: React.FC<{
  x: number;
  groundY: number;
  scale?: number;
  palette: Palette;
  time?: number;
  poseA?: PoseKind;
  poseB?: PoseKind;
  gap?: number;
  opacity?: number;
}> = ({x, groundY, scale = 1, palette, time = 0, poseA = "idle", poseB = "idle", gap = 46, opacity = 1}) => (
  <g opacity={opacity}>
    <Puppet
      x={x - gap * scale}
      groundY={groundY + 2}
      scale={scale}
      palette={palette}
      pose={poseA}
      time={time}
      seed={2}
      kind="bride"
    />
    <Puppet
      x={x + gap * scale}
      groundY={groundY}
      scale={scale * 1.02}
      facing={-1}
      palette={palette}
      pose={poseB}
      time={time + 0.4}
      seed={5}
    />
  </g>
);

/** Tiny crowd silhouette: one cheap path per person, no joints. */
export const CrowdFigure: React.FC<{
  x: number;
  groundY: number;
  scale?: number;
  color: string;
  opacity?: number;
  sway?: number;
}> = ({x, groundY, scale = 1, color, opacity = 0.7, sway = 0}) => (
  <g transform={`translate(${x} ${groundY}) scale(${scale}) rotate(${sway} 0 -80)`} opacity={opacity}>
    <circle cx="0" cy="-118" r="17" fill={color} />
    <path d="M -22 -104 C -8 -114 9 -114 22 -103 L 26 0 L 8 2 L 3 -44 L -3 2 L -21 0 Z" fill={color} />
  </g>
);

