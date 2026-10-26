import {Composition} from "remotion";
import {V2Lab} from "./lab/Lab";
import {V2Song} from "./lab/Generated";
import {V2SongPortrait} from "./lab/Generated";
import {AiSample} from "./ai/AiSample";
import {AUDIO, LYRICS, MARKS} from "./generated/shots.generated";
import {AI_SAMPLE_END} from "./ai/aiShots";
import {SONG_META} from "./generated/shots.generated";

export const RemotionRoot: React.FC = () => {
  const frames = Math.round(SONG_META.duration * SONG_META.fps);
  const fps = SONG_META.fps;
  return (
    <>
      <Composition
        id="V2Lab"
        component={V2Lab}
        durationInFrames={25 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="V2Song"
        component={V2Song}
        durationInFrames={frames}
        fps={fps}
        width={SONG_META.width}
        height={SONG_META.height}
      />
      {/*
        The same shots, the same beats, a portrait frame. Object sizes come from
        the minor dimension and horizontal offsets shrink, so this is a re-lay
        rather than a crop of the landscape film.
      */}
      <Composition
        id="V2SongPortrait"
        component={V2SongPortrait}
        durationInFrames={frames}
        fps={fps}
        width={1080}
        height={1920}
      />
      {/*
        The Seedream-anchored sample. A separate composition so the procedural
        film stays renderable while this approach is being judged.
      */}
      <Composition
        id="AiSample"
        component={AiSample}
        durationInFrames={Math.round(AI_SAMPLE_END * fps)}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{
          marks: MARKS,
          lyrics: LYRICS,
          audio: AUDIO,
        }}
      />
    </>
  );
};
