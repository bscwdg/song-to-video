import {useVideoConfig} from "remotion";

/**
 * Normalised stage.
 *
 * x/y accept 0..1 fractions of the frame.
 * s() accepts sizes in "1080-height units": 1080-relative pixels, so a size
 * keeps its optical weight across 720p, 1080p and 4K.
 *
 * `m` is the minor dimension. **Object sizes must use `m`, not `w`.** A window
 * that is `0.34 * width` is a reasonable window at 16:9 and a window wider than
 * the frame at 9:16. `w` is only correct for horizontal *positions*.
 */
export type Stage = {
  w: number;
  h: number;
  /** height-based unit, for type sizes and skin details */
  u: number;
  /** minor dimension: the scale reference for objects in either aspect */
  m: number;
  /** true when the frame is taller than it is wide */
  portrait: boolean;
  /** aspect ratio w/h */
  aspect: number;
  x: (v: number) => number;
  y: (v: number) => number;
  s: (v: number) => number;
  /** size relative to the minor dimension */
  sz: (v: number) => number;
  /** horizontal spread around the centre, narrowed in portrait */
  spread: number;
  cx: number;
  cy: number;
  safe: {left: number; right: number; top: number; bottom: number};
};

export const makeStage = (w: number, h: number): Stage => {
  const u = h / 1080;
  const m = Math.min(w, h);
  const aspect = w / h;
  const portrait = aspect < 1;
  return {
    w,
    h,
    u,
    m,
    portrait,
    aspect,
    x: (v) => v * w,
    y: (v) => v * h,
    s: (v) => v * u,
    sz: (v) => v * m,
    // In portrait a subject has far less horizontal room, so compositions that
    // relied on a wide lateral offset collapse into the centre.
    spread: portrait ? 0.62 : 1,
    cx: w / 2,
    cy: h / 2,
    safe: {
      left: w * (portrait ? 0.08 : 0.06),
      right: w * (portrait ? 0.08 : 0.06),
      top: h * (portrait ? 0.09 : 0.07),
      bottom: h * (portrait ? 0.2 : 0.14),
    },
  };
};

/** Where a composition slot lands horizontally, respecting portrait narrowness. */
export const slotX = (stage: Stage, focus: number): number =>
  stage.cx + (focus - 0.5) * stage.w * stage.spread;

/** Where a composition slot lands vertically. */
export const slotY = (stage: Stage, horizon: number): number =>
  stage.h * horizon;

export const useStage = (): Stage => {
  const {width, height} = useVideoConfig();
  return makeStage(width, height);
};
