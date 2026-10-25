import {Composition} from "remotion";
import {PaperCutMV} from "./PaperCutMV";
import {TIMELINE} from "./generated/timeline.generated";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PaperCutMV"
      component={PaperCutMV}
      durationInFrames={Math.round(TIMELINE.meta.duration * TIMELINE.meta.fps)}
      fps={TIMELINE.meta.fps}
      width={TIMELINE.meta.width}
      height={TIMELINE.meta.height}
    />
  );
};
