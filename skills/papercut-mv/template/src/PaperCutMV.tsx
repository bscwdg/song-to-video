import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {C} from "./theme";
import {TIMELINE} from "./generated/timeline.generated";
import {PaperDefs} from "./components/Paper";
import {Lyrics} from "./components/Lyrics";
import {Soundtrack} from "./components/Soundtrack";
import {SCENE_REGISTRY} from "./scenes/registry";
import {secondsToFrames} from "./timeline";

export const PaperCutMV: React.FC = () => {
  const {meta, beats, scenes, lyrics} = TIMELINE;

  return (
    <AbsoluteFill style={{backgroundColor: C.night, overflow: "hidden"}}>
      <PaperDefs />
      {scenes.map((scene) => {
        const Scene = SCENE_REGISTRY[scene.component];
        if (!Scene) {
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
            name={`${scene.id} · ${scene.name}`}
          >
            <Scene
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
      <Lyrics lyrics={lyrics} />
      <Soundtrack timeline={TIMELINE} />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          boxShadow: "inset 0 0 110px rgba(0, 4, 8, .28)",
        }}
      />
    </AbsoluteFill>
  );
};
