import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {C} from "./theme";
import {CUT_FRAMES, DURATION_FRAMES, SCENES} from "./timeline";
import {PaperDefs} from "./components/Paper";
import {Lyrics} from "./components/Lyrics";
import {Soundtrack} from "./components/Soundtrack";
import {Scene01Departure} from "./scenes/Scene01Departure";
import {Scene02LonelyNight} from "./scenes/Scene02LonelyNight";
import {Scene03Longing} from "./scenes/Scene03Longing";
import {Scene04Courage} from "./scenes/Scene04Courage";
import {Scene05Crowd} from "./scenes/Scene05Crowd";
import {Scene06Farewell} from "./scenes/Scene06Farewell";
import {Scene07Gratitude} from "./scenes/Scene07Gratitude";
import {Scene08Eyes} from "./scenes/Scene08Eyes";
import {Scene09Finale} from "./scenes/Scene09Finale";

const SCENE_COMPONENTS = [
  Scene01Departure,
  Scene02LonelyNight,
  Scene03Longing,
  Scene04Courage,
  Scene05Crowd,
  Scene06Farewell,
  Scene07Gratitude,
  Scene08Eyes,
  Scene09Finale,
] as const;

export const PaperCutMV: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: C.night, overflow: "hidden"}}>
      <PaperDefs />
      {SCENES.map((scene, index) => {
        const Scene = SCENE_COMPONENTS[index];
        const from = CUT_FRAMES[index];
        const next = index === SCENES.length - 1 ? DURATION_FRAMES : CUT_FRAMES[index + 1];
        return (
          <Sequence
            key={scene.name}
            from={from}
            durationInFrames={next - from}
            premountFor={12}
            name={`${String(index + 1).padStart(2, "0")} · ${scene.name}`}
          >
            <Scene />
          </Sequence>
        );
      })}
      <Lyrics />
      <Soundtrack />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          boxShadow: "inset 0 0 110px rgba(0, 4, 8, .28)",
        }}
      />
    </AbsoluteFill>
  );
};
