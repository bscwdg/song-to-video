export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BPM = 143.5546875;
export const BEAT_SECONDS = 60 / BPM;
export const BEAT_OFFSET = 0.186;
export const MUSIC_END = 24.056;
export const DURATION_FRAMES = Math.round(MUSIC_END * FPS);

/** Cuts snapped to the closest detected beat in the supplied track. */
export const CUTS = [0, 3.646, 5.759, 7.477, 10.472, 13.886, 17.276, 20.248, 22.384, 24.056] as const;

export const CUT_FRAMES = CUTS.map((t) => Math.round(t * FPS));

export const BEATS = [
  0.186, 0.65, 1.091, 1.509, 1.927, 2.345, 2.786, 3.204, 3.646, 4.063,
  4.481, 4.899, 5.341, 5.759, 6.2, 6.618, 7.059, 7.477, 7.895, 8.313,
  8.754, 9.172, 9.613, 10.031, 10.472, 10.89, 11.331, 11.749, 12.167,
  12.585, 13.026, 13.444, 13.886, 14.303, 14.721, 15.139, 15.581, 15.999,
  16.417, 16.858, 17.276, 17.694, 18.135, 18.553, 18.994, 19.412, 19.83,
  20.248, 20.689, 21.107, 21.548, 21.966, 22.384, 22.802, 23.243, 23.661,
  24.056,
] as const;

export const SCENES = [
  {name: "启航", start: CUTS[0], end: CUTS[1]},
  {name: "孤夜", start: CUTS[1], end: CUTS[2]},
  {name: "想着你", start: CUTS[2], end: CUTS[3]},
  {name: "不惶恐", start: CUTS[3], end: CUTS[4]},
  {name: "人来人往", start: CUTS[4], end: CUTS[5]},
  {name: "离开", start: CUTS[5], end: CUTS[6]},
  {name: "感谢", start: CUTS[6], end: CUTS[7]},
  {name: "你眼中", start: CUTS[7], end: CUTS[8]},
  {name: "尾声", start: CUTS[8], end: CUTS[9]},
] as const;

export type Lyric = {
  start: number;
  end: number;
  text: string;
};

export const LYRICS: Lyric[] = [
  {start: 0.186, end: 2.786, text: "我曾经走过多么遥远的路"},
  {start: 2.786, end: 3.646, text: "跨越过多少海洋去看你"},
  {start: 3.646, end: 5.759, text: "孤单的黑夜途中"},
  {start: 5.759, end: 7.477, text: "只要想着你"},
  {start: 7.477, end: 10.472, text: "就不会惶恐"},
  {start: 10.472, end: 13.886, text: "时光的岸上人来了又走"},
  {start: 13.886, end: 17.276, text: "离开时你不用说我都懂"},
  {start: 17.276, end: 20.248, text: "感谢你曾让我"},
  {start: 20.248, end: 22.384, text: "留在你眼中"},
];

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export const easeInOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const progress = (time: number, start: number, duration: number) =>
  clamp((time - start) / Math.max(duration, 0.001));

export const beatPhase = (time: number) => {
  const raw = (time - BEAT_OFFSET) / BEAT_SECONDS;
  return raw - Math.floor(raw);
};

export const beatIndex = (time: number) =>
  Math.floor((time - BEAT_OFFSET) / BEAT_SECONDS);

export const beatPulse = (time: number, sharpness = 8) =>
  Math.exp(-beatPhase(time) * sharpness);

export const beatTime = (index: number) => BEAT_OFFSET + index * BEAT_SECONDS;

/** Local beat index for a scene that starts on a beat. */
export const localBeatIndex = (time: number, sceneStart: number) =>
  Math.floor((time + sceneStart - BEAT_OFFSET) / BEAT_SECONDS);

export const localBeatProgress = (time: number, sceneStart: number) => {
  const raw = (time + sceneStart - BEAT_OFFSET) / BEAT_SECONDS;
  return raw - Math.floor(raw);
};

export const secondsToFrames = (seconds: number) => Math.round(seconds * FPS);
