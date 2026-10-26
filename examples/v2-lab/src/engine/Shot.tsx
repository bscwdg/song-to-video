import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ARCHETYPES, type ArchetypeId, type ShotProps} from "./archetypes";
import {cameraAt, type CameraMove} from "./camera";
import {clamp} from "./geom";
import {PALETTES, type Palette} from "./palette";
import {makeStage} from "./stage";
import {PaperDefs, PaperTexture, Vignette, FilmGrain} from "./paper";
import {Subtitles, type LyricRow} from "./Subtitles";

export type ShotSpec = {
  id: string;
  archetype: ArchetypeId;
  /** absolute seconds on the song timeline */
  start: number;
  duration: number;
  palette: keyof typeof PALETTES;
  camera: CameraMove;
  intensity?: number;
  seed?: number;
};

export const Shot: React.FC<{shot: ShotSpec; beats: number[]}> = ({shot, beats}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const stage = makeStage(width, height);
  const time = shot.start + frame / fps;
  const total = Math.max(1, Math.round(shot.duration * fps));
  const p = clamp(frame / total);
  const palette: Palette = PALETTES[shot.palette] ?? PALETTES.dusk;
  const cam = cameraAt(shot.camera, p, {
    width,
    height,
    seed: shot.seed ?? 1,
    amount: 0.6 + (shot.intensity ?? 0.5) * 0.8,
  });
  const Archetype = ARCHETYPES[shot.archetype];

  const props: ShotProps = {
    start: shot.start,
    duration: shot.duration,
    time,
    p,
    cam,
    palette,
    stage,
    beats,
    intensity: shot.intensity ?? 0.5,
    seed: shot.seed ?? 1,
  };

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: palette.ink}}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{position: "absolute", inset: 0}}
      >
        <Archetype {...props} />
      </svg>
      <PaperTexture opacity={0.42} />
      <FilmGrain opacity={0.22} />
      <Vignette opacity={0.75} />
    </AbsoluteFill>
  );
};

export const Film: React.FC<{
  shots: ShotSpec[];
  beats: number[];
  lyrics?: LyricRow[];
  audio?: string | null;
}> = ({shots, beats, lyrics, audio}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: "#071017", overflow: "hidden"}}>
      <PaperDefs />
      {audio ? <Audio src={staticFile(audio)} volume={0.92} /> : null}
      {shots.map((shot) => {
        const from = Math.round(shot.start * fps);
        const duration = Math.max(1, Math.round(shot.duration * fps));
        return (
          <Sequence
            key={shot.id}
            from={from}
            durationInFrames={duration}
            premountFor={8}
            name={`${shot.id} · ${shot.archetype}`}
          >
            <Shot shot={shot} beats={beats} />
          </Sequence>
        );
      })}
      {lyrics && lyrics.length > 0 ? <Subtitles lyrics={lyrics} /> : null}
    </AbsoluteFill>
  );
};
