import {Composition} from "remotion";
import {V2Lab} from "./lab/Lab";
import {V2Song} from "./lab/Generated";
import {SONG_META} from "./generated/shots.generated";

export const RemotionRoot: React.FC = () => {
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
        durationInFrames={Math.round(SONG_META.duration * SONG_META.fps)}
        fps={SONG_META.fps}
        width={SONG_META.width}
        height={SONG_META.height}
      />
    </>
  );
};
