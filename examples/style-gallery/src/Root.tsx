import React from "react";
import {Composition} from "remotion";
import {StyleGallery} from "./StyleGallery";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="StyleGallery"
    component={StyleGallery}
    durationInFrames={600}
    fps={30}
    width={1920}
    height={1080}
  />
);
