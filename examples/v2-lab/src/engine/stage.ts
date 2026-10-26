import {useVideoConfig} from "remotion";

/**
 * Normalised stage.
 *
 * x/y accept 0..1 fractions of the frame.
 * s() accepts sizes in "1080-height units": 1080-relative pixels, so a size
 * keeps its optical weight across 720p, 1080p and 4K. Aspect changes height,
 * not width, so the same unit works for 9:16 too — archetypes recompose.
 */
export type Stage = {
  w: number;
  h: number;
  u: number;
  x: (v: number) => number;
  y: (v: number) => number;
  s: (v: number) => number;
  cx: number;
  cy: number;
  aspect: number;
  safe: {left: number; right: number; top: number; bottom: number};
};

export const makeStage = (w: number, h: number): Stage => {
  const u = h / 1080;
  return {
    w,
    h,
    u,
    x: (v) => v * w,
    y: (v) => v * h,
    s: (v) => v * u,
    cx: w / 2,
    cy: h / 2,
    aspect: w / h,
    safe: {
      left: w * 0.06,
      right: w * 0.06,
      top: h * 0.07,
      bottom: h * 0.14,
    },
  };
};

export const useStage = (): Stage => {
  const {width, height} = useVideoConfig();
  return makeStage(width, height);
};
