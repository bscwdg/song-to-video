export type SceneProps = {
  sceneStart: number;
  sceneDuration: number;
  beats: number[];
  fps: number;
  width: number;
  height: number;
};

export type SceneSpec = {
  id: string;
  start: number;
  end: number;
  component: string;
};

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export const easeOutCubic = (value: number) =>
  1 - Math.pow(1 - clamp(value), 3);

export const easeInOutCubic = (value: number) => {
  const x = clamp(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const beatPhase = (time: number, bpm = 120) => {
  const interval = 60 / bpm;
  const raw = time / interval;
  return raw - Math.floor(raw);
};

export const secondsToFrames = (seconds: number, fps: number) =>
  Math.round(seconds * fps);

const BEATS = Array.from({length: 24}, (_, index) =>
  Number((0.25 + index * 0.5).toFixed(4)),
);

export const DEMO_TIMELINE = {
  meta: {
    title: "Painted animation starter",
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 12,
  },
  beats: BEATS,
  scenes: [
    {id: "01-world", start: 0, end: 5, component: "watercolor-world"},
    {id: "02-figure", start: 5, end: 9, component: "character-beat"},
    {id: "03-reveal", start: 9, end: 12, component: "ink-reveal"},
  ] satisfies SceneSpec[],
};
