import type {PaperCutTimeline} from "../timeline";

/**
 * DEMO DATA ONLY.
 * Replace this file with:
 *
 *   python scripts/analyze_track.py song.mp3 --cuts 1.8 \
 *     --scene-components world,split --out timing.json \
 *     --emit-ts src/generated/timeline.generated.ts
 *
 * `audio: null` lets the starter render before the user supplies a song.
 */
export const TIMELINE = {
  meta: {
    title: "Paper-cut MV starter",
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 6,
    musicBodyEnd: 6,
    audio: null,
    bgmVolume: 0.9,
    bpm: 120,
  },
  beats: [
    0.24, 0.74, 1.24, 1.74, 2.24, 2.74,
    3.24, 3.74, 4.24, 4.74, 5.24, 5.74,
  ],
  scenes: [
    {id: "01-world", name: "World", start: 0, end: 3, component: "world"},
    {id: "02-split", name: "Split", start: 3, end: 6, component: "split"},
  ],
  lyrics: [],
  cues: [],
} satisfies PaperCutTimeline;
