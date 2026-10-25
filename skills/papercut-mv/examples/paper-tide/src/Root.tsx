import {Composition} from "remotion";
import {PaperCutMV} from "./PaperCutMV";
import {DURATION_FRAMES, FPS, HEIGHT, WIDTH} from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PaperCutMV"
      component={PaperCutMV}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
