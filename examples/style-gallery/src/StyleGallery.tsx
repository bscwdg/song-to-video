import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {FlatExplainerPreview} from "./previews/flat-explainer";
import {InkWashPreview} from "./previews/ink-wash";
import {KineticReelPreview} from "./previews/kinetic-reel";
import {PaintedAnimationPreview} from "./previews/painted-animation";
import {Pixel8BitPreview} from "./previews/pixel-8bit";

const previews = [
  {id: "painted-animation", Component: PaintedAnimationPreview},
  {id: "kinetic-reel", Component: KineticReelPreview},
  {id: "ink-wash", Component: InkWashPreview},
  {id: "flat-explainer", Component: FlatExplainerPreview},
  {id: "pixel-8bit", Component: Pixel8BitPreview},
];

export const StyleGallery: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: "#07090d"}}>
    {previews.map(({id, Component}, index) => (
      <Sequence
        key={id}
        from={index * 120}
        durationInFrames={120}
        premountFor={12}
        name={id}
      >
        <Component />
      </Sequence>
    ))}
  </AbsoluteFill>
);
