import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {BEATS, CUTS, FPS, MUSIC_END, secondsToFrames} from "../timeline";

type Cue = {
  t: number;
  file: string;
  volume: number;
};

const paperBeats = (start: number, end: number, file: string, volume: number) => {
  return BEATS.filter((t) => t >= start && t < end).map((t) => ({
    t: Number(t.toFixed(3)),
    file,
    volume,
  }));
};

const halfBeats = BEATS.slice(0, -1).map((beat, index) =>
  Number(((beat + BEATS[index + 1]) / 2).toFixed(3)),
);
const scene7HalfBeats = halfBeats.filter(
  (t) => t >= CUTS[6] && t < CUTS[7],
).slice(0, 14);

const CUES: Cue[] = [
  // 01 · departure: six paper swells, one boat pop, a lantern chime
  ...paperBeats(0.186, 2.7, "paper-rise.wav", 0.07),
  {t: 2.786, file: "water-plop.wav", volume: 0.1},
  {t: 2.995, file: "chime.wav", volume: 0.075},
  // cut ticks and the lonely half-beat star language
  {t: 3.646, file: "paper-swish.wav", volume: 0.08},
  {t: 4.063, file: "glint.wav", volume: 0.032},
  {t: 4.481, file: "glint.wav", volume: 0.025},
  {t: 4.899, file: "glint.wav", volume: 0.032},
  {t: 5.341, file: "glint.wav", volume: 0.025},
  // 03 · thought bubble
  {t: 5.759, file: "paper-pop.wav", volume: 0.12},
  {t: 6.2, file: "chime.wav", volume: 0.055},
  {t: 6.618, file: "shimmer.wav", volume: 0.03},
  // 04 · the big wave
  {t: 7.477, file: "paper-swish.wav", volume: 0.1},
  {t: 8.313, file: "paper-rise.wav", volume: 0.08},
  {t: 8.754, file: "water-plop.wav", volume: 0.13},
  {t: 8.85, file: "whale-call.wav", volume: 0.11},
  {t: 9.172, file: "shimmer.wav", volume: 0.065},
  {t: 10.031, file: "chime.wav", volume: 0.055},
  // 05 · crowd passes
  {t: 10.472, file: "paper-swish.wav", volume: 0.075},
  ...paperBeats(10.89, 13.7, "paper-rise.wav", 0.028),
  // 06 · curtain tear
  {t: 13.886, file: "paper-swish.wav", volume: 0.08},
  {t: 15.581, file: "curtain-split.wav", volume: 0.14},
  {t: 16.417, file: "paper-pop.wav", volume: 0.04},
  // 07 · lanterns, one every half beat
  {t: 17.276, file: "shimmer.wav", volume: 0.035},
  ...scene7HalfBeats.map((t, i) => ({
    t,
    file: i % 2 ? "glint.wav" : "chime.wav",
    volume: i % 2 ? 0.018 : 0.025,
  })),
  // 08 · push into the eye
  {t: 20.248, file: "glint.wav", volume: 0.08},
  {t: 21.107, file: "paper-swish.wav", volume: 0.05},
  {t: 21.548, file: "water-plop.wav", volume: 0.07},
  {t: 21.966, file: "shimmer.wav", volume: 0.03},
  // 09 · falling paper layers, final page
  {t: 22.384, file: "paper-swish.wav", volume: 0.075},
  ...paperBeats(22.802, 24.0, "page-fall.wav", 0.06),
  {t: 24.056, file: "chime.wav", volume: 0.04},
];

export const Soundtrack: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("audio/song.mp3")} volume={0.9} endAt={secondsToFrames(MUSIC_END)} />
      {CUES.map((cue, i) => {
        const from = Math.max(0, Math.round(cue.t * FPS));
        return (
          <Sequence
            key={`${cue.file}-${cue.t}-${i}`}
            from={from}
            durationInFrames={Math.round(1.8 * FPS)}
            premountFor={2}
          >
            <Audio src={staticFile(`sfx/${cue.file}`)} volume={cue.volume} />
          </Sequence>
        );
      })}
    </>
  );
};
