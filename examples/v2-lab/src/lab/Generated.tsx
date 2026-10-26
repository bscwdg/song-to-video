import React from "react";
import {Film} from "../engine/Shot";
import {AUDIO, BEATS, LYRICS, SHOTS} from "../generated/shots.generated";

/**
 * The one-click film. `shots.generated.ts` is produced by:
 *
 *   python skills/papercut-mv/scripts/song_facts.py <song> --lrc <lrc> --out song.json
 *   python skills/papercut-mv/scripts/direct.py song.json \
 *     --out shots.json --storyboard STORYBOARD.md \
 *     --emit-ts src/generated/shots.generated.ts
 */
export const V2Song: React.FC = () => (
  <Film shots={SHOTS} beats={BEATS} lyrics={LYRICS} audio={AUDIO} />
);
