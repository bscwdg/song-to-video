import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {PaintDefs} from "./components/Paint";
import {SceneFigure} from "./scenes/SceneFigure";
import {SceneReveal} from "./scenes/SceneReveal";
import {SceneWorld} from "./scenes/SceneWorld";
import {DEMO_TIMELINE, secondsToFrames, type SceneProps} from "./timeline";

const REGISTRY: Record<string, React.FC<SceneProps>> = {
  "watercolor-world": SceneWorld,
  "character-beat": SceneFigure,
  "ink-reveal": SceneReveal,
};

export const PaintedFilm: React.FC = () => {
  const {meta, beats, scenes} = DEMO_TIMELINE;
  return (
    <AbsoluteFill style={{backgroundColor: "#f5ead5", overflow: "hidden"}}>
      <PaintDefs />
      {scenes.map((scene) => {
        const Component = REGISTRY[scene.component];
        if (!Component) {
          throw new Error(`Unknown scene component: ${scene.component}`);
        }
        const from = secondsToFrames(scene.start, meta.fps);
        const to = secondsToFrames(scene.end, meta.fps);
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={Math.max(1, to - from)}
            premountFor={12}
            name={`${scene.id} · ${scene.component}`}
          >
            <Component
              sceneStart={scene.start}
              sceneDuration={scene.end - scene.start}
              beats={beats}
              fps={meta.fps}
              width={meta.width}
              height={meta.height}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
