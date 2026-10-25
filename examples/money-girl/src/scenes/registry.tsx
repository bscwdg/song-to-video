import type React from "react";
import type {SceneProps} from "../timeline";
import {
  SceneFarewell,
  SceneHandsMacro,
  SceneHouseCross,
  SceneMoneyRise,
  SceneRoomFill,
  SceneStageTears,
  SceneStageTop,
  SceneTableProfile,
  SceneToast,
} from "./MoneyScenes";

export const SCENE_REGISTRY: Record<string, React.FC<SceneProps>> = {
  "money-rise": SceneMoneyRise,
  "stage-tears": SceneStageTears,
  "room-fill": SceneRoomFill,
  "toast": SceneToast,
  "hands-macro": SceneHandsMacro,
  "stage-top": SceneStageTop,
  "house-cross": SceneHouseCross,
  "table-profile": SceneTableProfile,
  "farewell": SceneFarewell,
};
