import type {BeatMark} from "../engine/camera";
import {beatPulse, barPulse} from "../engine/camera";

/**
 * Motion envelopes for image-anchored shots.
 *
 * A raw beat pulse is an impulse: it jumps to full value in a single frame and
 * decays exponentially. Adding that straight onto a transform produces a
 * visible jerk on every beat — measured on the sample, the frame-to-frame
 * difference spiked to ~4x the surrounding value and then collapsed to almost
 * nothing, which is exactly what reads as "stiff".
 *
 * The fix is to separate *where the beat is* from *how the picture answers it*.
 * The beat still lands on the measured time; the response is a one-pole filter
 * with an attack and a release constant. The result is a swell instead of a
 * tick, and it stays a pure function of the frame number.
 */

export type EnvelopeOptions = {
  /** seconds to rise: long enough to avoid a velocity jump */
  attack?: number;
  /** seconds to fall: long enough to overlap the next beat */
  release?: number;
  /** sharpness of the raw beat target before smoothing */
  sharpness?: number;
  /** sharpness of the raw bar target before smoothing */
  barSharpness?: number;
};

export type MotionEnvelope = {
  /** smoothed per-beat response, 0..1, indexed by local frame */
  accent: number[];
  /** smoothed per-bar response, 0..1 */
  bar: number[];
};

/**
 * Precompute the response for one shot.
 *
 * `start` is absolute song time and `frames` is the shot length, so the arrays
 * are only valid for this shot. Deterministic: same inputs, same array.
 */
export const buildEnvelope = (
  marks: BeatMark[],
  start: number,
  frames: number,
  fps: number,
  options: EnvelopeOptions = {},
): MotionEnvelope => {
  const attack = Math.max(1e-3, options.attack ?? 0.13);
  const release = Math.max(1e-3, options.release ?? 0.46);
  const sharpness = options.sharpness ?? 7;
  const barSharpness = options.barSharpness ?? 1.7;

  const dt = 1 / fps;
  // One-pole coefficients: fraction of the gap closed per frame.
  const kAttack = 1 - Math.exp(-dt / attack);
  const kRelease = 1 - Math.exp(-dt / release);

  const accent: number[] = new Array(frames);
  const bar: number[] = new Array(frames);

  let a = 0;
  let b = 0;
  for (let i = 0; i < frames; i += 1) {
    const t = start + i / fps;

    const targetA = beatPulse(t, marks, sharpness, {floor: 0}).value;
    // Rise slower than we fall? No — rise gently, fall gently. Both are finite,
    // which is the whole point: no discontinuity in velocity.
    a += (targetA - a) * (targetA > a ? kAttack : kRelease);
    accent[i] = a;

    const targetB = barPulse(t, marks, barSharpness).value;
    b += (targetB - b) * (targetB > b ? kAttack : kRelease * 1.4);
    bar[i] = b;
  }
  return {accent, bar};
};

/** Value of an envelope at a local frame, clamped to the array. */
export const sampleEnvelope = (values: number[], frame: number): number => {
  if (values.length === 0) return 0;
  const i = Math.max(0, Math.min(values.length - 1, Math.round(frame)));
  return values[i];
};

/**
 * A single, non-repeating light pass across the shot.
 *
 * The first version used `(time * k) % 1`, which teleports the band from the
 * right edge back to the left every cycle — the largest single-frame change
 * inside a shot. One pass, faded at both ends, removes the jump and still adds
 * the feeling of a moving light source.
 */
export const lightPass = (
  progress: number,
  frames: number,
  fps: number,
): {x: number; opacity: number} => {
  const p = Math.max(0, Math.min(1, progress));
  const x = -0.42 + p * 1.84;
  // Fade in over the first ~0.5s and out over the last ~0.5s so the band never
  // appears or disappears abruptly.
  const fade = Math.min(1, (p * frames) / Math.max(1, fps * 0.5));
  const tail = Math.min(1, ((1 - p) * frames) / Math.max(1, fps * 0.5));
  return {x, opacity: Math.max(0, Math.min(fade, tail))};
};
