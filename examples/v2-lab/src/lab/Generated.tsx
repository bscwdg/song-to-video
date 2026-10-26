import React from "react";
import {Film} from "../engine/Shot";
import {AUDIO, BEATS, LYRICS, MARKS, METER, SFX, SHOTS} from "../generated/shots.generated";

/**
 * The one-click film. `shots.generated.ts` is produced by:
 *
 *   python skills/papercut-mv/scripts/song_facts.py <song> --lrc <lrc> --out song.json
 *   python skills/papercut-mv/scripts/direct.py song.json \
 *     --out shots.json --storyboard STORYBOARD.md \
 *     --emit-ts src/generated/shots.generated.ts
 *
 * MARKS carries the measured per-beat accents, so the archetypes lift harder on
 * a kick than on an empty beat instead of ticking uniformly. SFX carries the
 * diegetic paper cues that used to sit unused in shots.json.
 */
export const V2Song: React.FC = () => (
  <Film
    shots={SHOTS}
    beats={BEATS}
    marks={MARKS}
    meter={METER}
    sfx={SFX}
    lyrics={LYRICS}
    audio={AUDIO}
  />
);

/**
 * Same edit, portrait frame. The engine reads the frame, so object sizes come
 * from the minor dimension and lateral offsets shrink — this is a re-lay, not a
 * crop of the landscape render.
 */
export const V2SongPortrait: React.FC = () => <V2Song />;
