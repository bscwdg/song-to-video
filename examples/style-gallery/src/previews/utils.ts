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
