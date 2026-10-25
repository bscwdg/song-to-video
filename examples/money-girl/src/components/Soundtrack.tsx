import React from "react";
import {Audio, Sequence, staticFile} from "remotion";
import {
  secondsToFrames,
  type PaperCutTimeline,
} from "../timeline";

/**
 * The generated timeline owns BGM and cue data.
 * Keep all cues absolute so they stay aligned across scene reordering.
 */
export const Soundtrack: React.FC<{timeline: PaperCutTimeline}> = ({timeline}) => {
  const {meta, cues} = timeline;

  return (
    <>
      {meta.audio ? (
        <Audio
          src={staticFile(meta.audio)}
          volume={meta.bgmVolume}
          endAt={secondsToFrames(meta.duration, meta.fps)}
        />
      ) : null}
      {cues.map((cue, index) => {
        const from = Math.max(0, secondsToFrames(cue.t, meta.fps));
        const duration = Math.max(
          1,
          secondsToFrames(cue.durationSeconds ?? 1.8, meta.fps),
        );
        return (
          <Sequence
            key={`${cue.file}-${cue.t}-${index}`}
            from={from}
            durationInFrames={duration}
            premountFor={2}
          >
            <Audio src={staticFile(`sfx/${cue.file}`)} volume={cue.volume} />
          </Sequence>
        );
      })}
    </>
  );
};
