import type {AiShotSpec} from "./AiShot";

/**
 * Hand-authored shot list for the AI sample.
 *
 * This is intentionally a literal, readable table: the sample exists to judge
 * whether generated anchors carry the lyrics, so the mapping from lyric to
 * image sits in source you can read and change, not behind a heuristic.
 *
 * Later the director would emit this from the storyboard; for now every field
 * is evidence of a decision.
 */
export const AI_SHOTS: AiShotSpec[] = [
  {
    id: "01-wish-money",
    image: "ai/01-wish-money.jpg",
    // 心爱的女孩她已经很如愿了 / 我让她抱到钱数
    start: 0.0,
    duration: 3.11,
    camera: "push",
    intensity: 0.5,
    section: "intro",
  },
  {
    id: "02-wedding",
    image: "ai/02-wedding.jpg",
    // 今年我会举办场婚礼
    start: 3.11,
    duration: 0.98,
    camera: "craneUp",
    intensity: 0.72,
    section: "bridge",
  },
  {
    id: "03-stage-cry",
    image: "ai/03-stage-cry.jpg",
    // 也许我们一样在舞台上放声大哭
    start: 4.09,
    duration: 1.94,
    camera: "push",
    intensity: 0.8,
    section: "chorus",
  },
  {
    id: "04-old-house",
    image: "ai/04-old-house.jpg",
    // 以前的那混蛋心里面 / 如今也多了些很多人在他哪儿住
    start: 6.03,
    duration: 3.16,
    camera: "pull",
    intensity: 0.55,
    section: "bridge",
  },
];

/** Only the span this sample covers. */
export const AI_SAMPLE_END = 9.19;
