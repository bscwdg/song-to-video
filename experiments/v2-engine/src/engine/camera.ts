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

/* ------------------------------------------------------------------ */
/* Measured rhythm                                                      */
/* ------------------------------------------------------------------ */

/**
 * One measured beat, as produced by song_facts.py.
 *
 * `strength` is the part v1 was missing: it says how hard this beat actually
 * hits (kick + transient + loudness, normalised across the song). Without it
 * every beat drove the identical exponential decay and the picture stopped
 * responding to the music even though it stayed on the grid.
 */
export type BeatMark = {
  /** absolute seconds on the song timeline */
  t: number;
  /** 0..1 measured accent */
  strength: number;
  /** 0..1 low-band energy of this beat */
  low: number;
  /** 0..1 spectral flux (transient sharpness) of this beat */
  flux: number;
  /** true on a bar line */
  downbeat: boolean;
  /** position inside the bar, 0 = downbeat */
  beatInBar: number;
  /** section label this beat belongs to (intro/verse/chorus/bridge/outro) */
  section?: string;
  /** 0..1 energy of that section */
  sectionEnergy?: number;
};

/** The rhythm state at one instant. Consumed by every archetype. */
export type BeatHit = {
  /** 0..1 envelope; amplitude is already scaled by measured strength */
  value: number;
  /** 0..1 strength of the beat that produced this envelope */
  strength: number;
  /** seconds since that beat */
  since: number;
  /** whether that beat was a bar line */
  downbeat: boolean;
  /** position in bar of that beat */
  beatInBar: number;
  /** the raw mark, for callers that need low/flux */
  mark: BeatMark | null;
};

export const NO_HIT: BeatHit = {
  value: 0,
  strength: 0,
  since: Number.POSITIVE_INFINITY,
  downbeat: false,
  beatInBar: 0,
  mark: null,
};

/** Rebuild marks from a plain beat list (lab / hand-written shots). */
export const marksFromBeats = (beats: number[], meter = 4): BeatMark[] =>
  beats.map((t, index) => ({
    t,
    strength: index % meter === 0 ? 0.72 : 0.4,
    low: 0.5,
    flux: 0.4,
    downbeat: index % meter === 0,
    beatInBar: index % meter,
  }));

export type PulseOptions = {
  /** envelope value on the weakest possible beat; keeps dead beats visible */
  floor?: number;
  /** only bar lines drive this envelope (use for slow, structural motion) */
  downbeatsOnly?: boolean;
};

/**
 * Strength-weighted beat envelope.
 *
 * A hard beat gets a larger amplitude and a slower release, so it reads as a
 * lift. A weak beat still moves, but only breathes. `floor` exists because
 * SKILL.md requires a visible change on every beat — silence is not an option,
 * it is a QA failure.
 */
export const beatPulse = (
  time: number,
  marks: BeatMark[],
  sharpness = 7,
  options: PulseOptions = {},
): BeatHit => {
  const floor = clamp(options.floor ?? 0.18);
  let found: BeatMark | null = null;
  for (let i = marks.length - 1; i >= 0; i -= 1) {
    const mark = marks[i];
    if (mark.t > time + 1e-7) continue;
    if (options.downbeatsOnly && !mark.downbeat) continue;
    found = mark;
    break;
  }
  if (!found) return {...NO_HIT};

  const since = Math.max(0, time - found.t);
  const strength = clamp(found.strength);
  // Strong beats ring longer: k shrinks as strength grows.
  const k = sharpness * (1.35 - strength * 0.6);
  const amp = floor + (1 - floor) * strength;
  return {
    value: amp * Math.exp(-since * k),
    strength,
    since,
    downbeat: found.downbeat,
    beatInBar: found.beatInBar,
    mark: found,
  };
};

/** Deterministic 0/1 flicker for lights, embers and window panes. */
export const flicker = (time: number, seed = 1) => {
  const v = hash(Math.floor(time * 18) + seed * 13, seed);
  return 0.82 + v * 0.18;
};

/**
 * Bar pulse: the slow layer. Bar lines decide when the stage itself changes
 * (a layer lifts, a door opens, the sun climbs), so the film has two rhythms
 * instead of one uniform tick.
 */
export const barPulse = (time: number, marks: BeatMark[], sharpness = 1.8): BeatHit =>
  beatPulse(time, marks, sharpness, {floor: 0.05, downbeatsOnly: true});
