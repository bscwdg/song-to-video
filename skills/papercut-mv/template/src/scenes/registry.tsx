import type React from "react";
import type {SceneProps} from "../timeline";
import {SceneSplit} from "./SceneSplit";
import {SceneWorld} from "./SceneWorld";

export const SCENE_REGISTRY: Record<string, React.FC<SceneProps>> = {
  world: SceneWorld,
  split: SceneSplit,
};
