export type SoundCue = {
  t: number;
  file: string;
  volume: number;
  durationSeconds?: number;
};

export type LyricLine = {
  start: number;
  end: number;
  text: string;
  nearestBeat?: number;
  beatIndex?: number;
  beatDeltaMs?: number;
};

export type SceneSpec = {
  id: string;
  name: string;
  start: number;
  end: number;
  component: string;
};

export type PaperCutTimeline = {
  meta: {
    title: string;
    width: number;
    height: number;
    fps: number;
    duration: number;
    musicBodyEnd: number;
    audio: string | null;
    bgmVolume: number;
    bpm: number;
  };
  beats: number[];
  scenes: SceneSpec[];
  lyrics: LyricLine[];
  cues: SoundCue[];
};

export type SceneProps = {
  sceneStart: number;
  sceneDuration: number;
  beats: number[];
  fps: number;
  width: number;
  height: number;
};

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

/** Index of the last measured beat at or before `time`; -1 before the first beat. */
export const beatIndexAt = (time: number, beats: number[]) => {
  let lo = 0;
  let hi = beats.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (beats[mid] <= time + 1e-7) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
};

export const beatAt = (index: number, beats: number[]) => {
  if (beats.length === 0) return 0;
  return beats[Math.round(clamp(index, 0, beats.length - 1))];
};

export const beatIntervalAt = (index: number, beats: number[], fallbackBpm = 120) => {
  if (beats.length >= 2) {
    const safe = Math.round(clamp(index, 0, beats.length - 2));
    return beats[safe + 1] - beats[safe];
  }
  return 60 / fallbackBpm;
};

export const beatPhaseAt = (time: number, beats: number[], fallbackBpm = 120) => {
  if (beats.length === 0) {
    const interval = 60 / fallbackBpm;
    const raw = time / interval;
    return raw - Math.floor(raw);
  }
  const index = beatIndexAt(time, beats);
  if (index < 0) return 0;
  const start = beats[index];
  const end = index + 1 < beats.length
    ? beats[index + 1]
    : start + beatIntervalAt(index - 1, beats, fallbackBpm);
  return clamp((time - start) / Math.max(end - start, 0.001));
};

export const beatPulseAt = (
  time: number,
  beats: number[],
  sharpness = 8,
  fallbackBpm = 120,
) => Math.exp(-beatPhaseAt(time, beats, fallbackBpm) * sharpness);

export const halfBeatPhaseAt = (time: number, beats: number[], fallbackBpm = 120) => {
  const phase = beatPhaseAt(time, beats, fallbackBpm);
  return phase < 0.5 ? phase * 2 : (phase - 0.5) * 2;
};

export const localBeatIndex = (absoluteTime: number, sceneStart: number, beats: number[]) => {
  const absolute = beatIndexAt(absoluteTime, beats);
  const firstInScene = Math.max(0, beatIndexAt(sceneStart - 1e-6, beats) + 1);
  return Math.max(0, absolute - firstInScene);
};

export const localBeatProgress = (
  absoluteTime: number,
  sceneStart: number,
  beats: number[],
  fallbackBpm = 120,
) => {
  const absoluteIndex = beatIndexAt(absoluteTime, beats);
  const firstInScene = Math.max(0, beatIndexAt(sceneStart - 1e-6, beats) + 1);
  const localIndex = absoluteIndex - firstInScene;
  if (localIndex < 0) return 0;
  const start = beatAt(firstInScene + localIndex, beats);
  const end = firstInScene + localIndex + 1 < beats.length
    ? beats[firstInScene + localIndex + 1]
    : start + beatIntervalAt(firstInScene + localIndex - 1, beats, fallbackBpm);
  return clamp((absoluteTime - start) / Math.max(end - start, 0.001));
};

export const lyricAt = (time: number, lyrics: LyricLine[]) =>
  lyrics.find((line) => time >= line.start && time < line.end) ?? null;

export const secondsToFrames = (seconds: number, fps: number) =>
  Math.round(seconds * fps);
