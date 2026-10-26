import React, {useMemo} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ARCHETYPES, type ArchetypeId, type ShotProps} from "./archetypes";
import {cameraAt, marksFromBeats, type BeatMark, type CameraMove} from "./camera";
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
  /** what this shot is about — varies per song, unlike the archetype skeleton */
  subject?: string;
  /** the visual metaphor, chosen from the section label */
  metaphor?: string;
  /** normalised composition slots, so 9:16 re-lays instead of rescaling */
  composition?: {focus: number; horizon: number; density: number};
};

export type SfxCue = {t: number; file: string; volume: number};

export const Shot: React.FC<{shot: ShotSpec; marks: BeatMark[]; meter?: number}> = ({
  shot,
  marks,
  meter = 4,
}) => {
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
    marks,
    meter,
    intensity: shot.intensity ?? 0.5,
    seed: shot.seed ?? 1,
    subject: shot.subject ?? "",
    metaphor: shot.metaphor ?? "",
    composition: shot.composition ?? {focus: 0.5, horizon: 0.68, density: 0.5},
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
  /** measured per-beat accents from song_facts.py; falls back to a flat grid */
  marks?: BeatMark[];
  meter?: number;
  /** diegetic paper sounds, timed to shot starts */
  sfx?: SfxCue[];
  lyrics?: LyricRow[];
  audio?: string | null;
}> = ({shots, beats, marks, meter = 4, sfx, lyrics, audio}) => {
  const {fps} = useVideoConfig();
  // One mark table for the whole film, built once.
  const beatMarks = useMemo(
    () => (marks && marks.length > 0 ? marks : marksFromBeats(beats, meter)),
    [marks, beats, meter],
  );
  return (
    <AbsoluteFill style={{backgroundColor: "#071017", overflow: "hidden"}}>
      <PaperDefs />
      {audio ? <Audio src={staticFile(audio)} volume={0.92} /> : null}
      {sfx?.map((cue, index) => (
        <Sequence
          key={`sfx-${index}`}
          from={Math.max(0, Math.round(cue.t * fps))}
          durationInFrames={Math.round(2 * fps)}
          name={`sfx · ${cue.file}`}
        >
          <Audio src={staticFile(`sfx/${cue.file}`)} volume={cue.volume} />
        </Sequence>
      ))}
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
            <Shot shot={shot} marks={beatMarks} meter={meter} />
          </Sequence>
        );
      })}
      {lyrics && lyrics.length > 0 ? <Subtitles lyrics={lyrics} /> : null}
    </AbsoluteFill>
  );
};
