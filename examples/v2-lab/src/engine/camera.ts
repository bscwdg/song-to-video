import {clamp, easeInOutCubic, hash, lerp, smoothstep} from "./geom";

export type CameraMove =
  | "static"
  | "push"
  | "pull"
  | "trackLeft"
  | "trackRight"
  | "craneUp"
  | "craneDown"
  | "handheld";

export type CameraState = {
  scale: number;
  x: number;
  y: number;
  rotate: number;
};

export type CameraOptions = {
  width: number;
  height: number;
  seed?: number;
  amount?: number;
};

const base: CameraState = {scale: 1, x: 0, y: 0, rotate: 0};

/**
 * Camera moves are intentionally not all "settled at the end". A pull-back
 * that resolves and a push that is still moving when we cut read differently.
 */
export const cameraAt = (
  move: CameraMove,
  progress: number,
  options: CameraOptions,
): CameraState => {
  const p = clamp(progress);
  const {width: w, height: h, seed = 1, amount = 1} = options;

  switch (move) {
    case "push": {
      const e = easeInOutCubic(p);
      return {scale: lerp(1, 1 + 0.075 * amount, e), x: 0, y: h * 0.004 * e, rotate: 0};
    }
    case "pull": {
      const e = easeInOutCubic(p);
      return {scale: lerp(1 + 0.1 * amount, 1, e), x: 0, y: -h * 0.004 * e, rotate: 0};
    }
    case "trackLeft": {
      const e = smoothstep(p);
      return {scale: 1 + 0.02 * amount, x: lerp(w * 0.035 * amount, -w * 0.035 * amount, e), y: 0, rotate: 0};
    }
    case "trackRight": {
      const e = smoothstep(p);
      return {scale: 1 + 0.02 * amount, x: lerp(-w * 0.035 * amount, w * 0.035 * amount, e), y: 0, rotate: 0};
    }
    case "craneUp": {
      const e = easeInOutCubic(p);
      return {scale: 1 + 0.03 * amount, x: 0, y: lerp(h * 0.03 * amount, -h * 0.02 * amount, e), rotate: 0};
    }
    case "craneDown": {
      const e = easeInOutCubic(p);
      return {scale: 1 + 0.03 * amount, x: 0, y: lerp(-h * 0.02 * amount, h * 0.03 * amount, e), rotate: 0};
    }
    case "handheld": {
      const t = p * 8;
      return {
        scale: 1 + 0.012 * amount,
        x: (Math.sin(t * 1.7 + seed) + Math.sin(t * 0.63 + seed * 2)) * w * 0.0022 * amount,
        y: (Math.cos(t * 1.31 + seed) + Math.sin(t * 0.77 + seed * 3)) * h * 0.0022 * amount,
        rotate: Math.sin(t * 0.41 + seed) * 0.12 * amount,
      };
    }
    case "static":
    default:
      return {...base};
  }
};

/**
 * Parallax: far layers barely move, near layers follow the camera almost fully.
 * depth 0 =背景, 1 = 前景.
 */
export const parallax = (
  cam: CameraState,
  depth: number,
  width: number,
  height: number,
): {transform: string; scale: number} => {
  const d = clamp(depth);
  const follow = 0.18 + d * 1.05;
  const scale = 1 + (cam.scale - 1) * (0.25 + d * 0.95);
  const tx = cam.x * follow;
  const ty = cam.y * follow;
  const cx = width / 2;
  const cy = height / 2;
  return {
    scale,
    transform: `translate(${cx + tx} ${cy + ty}) rotate(${cam.rotate * d}) scale(${scale}) translate(${-cx} ${-cy})`,
  };
};

/** Beat pulse: sharp attack, exponential release, 0..1. */
export const beatPulse = (time: number, beats: number[], sharpness = 7): number => {
  let last = -Infinity;
  for (let i = 0; i < beats.length; i += 1) {
    if (beats[i] <= time + 1e-7) last = beats[i];
    else break;
  }
  if (!Number.isFinite(last)) return 0;
  const dt = time - last;
  return Math.exp(-dt * sharpness);
};

/** Deterministic 0/1 flicker for lights, embers and window panes. */
export const flicker = (time: number, seed = 1) => {
  const v = hash(Math.floor(time * 18) + seed * 13, seed);
  return 0.82 + v * 0.18;
};
