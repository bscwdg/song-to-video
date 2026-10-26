import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from "remotion";
import {AiShot} from "./AiShot";
import {PaperDefs} from "../engine/paper";
import {Subtitles, type LyricRow} from "../engine/Subtitles";
import type {BeatMark} from "../engine/camera";
import {AI_SHOTS} from "./aiShots";

/**
 * The AI sample: four generated anchors cut on measured beats.
 *
 * This is a separate composition on purpose. It shares the audio analysis,
 * the lyric timing and the subtitle engine with the procedural film, but the
 * pictures come from Seedream. Keeping it separate means the existing film is
 * still renderable while this approach is being judged — if the sample fails,
 * nothing has to be rolled back.
 */
export const AiSample: React.FC<{
  marks: BeatMark[];
  lyrics: LyricRow[];
  audio?: string | null;
}> = ({marks, lyrics, audio}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: "#0d0709", overflow: "hidden"}}>
      <PaperDefs />
      {audio ? <Audio src={staticFile(audio)} volume={0.92} /> : null}
      {AI_SHOTS.map((shot) => (
        <Sequence
          key={shot.id}
          from={Math.round(shot.start * fps)}
          durationInFrames={Math.max(1, Math.round(shot.duration * fps))}
          premountFor={8}
          name={`${shot.id} · ${shot.section ?? ""}`}
        >
          <AiShot shot={shot} marks={marks} />
        </Sequence>
      ))}
      {lyrics.length > 0 ? <Subtitles lyrics={lyrics} /> : null}
    </AbsoluteFill>
  );
};
