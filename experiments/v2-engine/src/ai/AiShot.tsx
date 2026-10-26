import React from "react";
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {beatPulse, barPulse, type BeatMark, type CameraMove} from "../engine/camera";
import {cameraAt} from "../engine/camera";
import {clamp} from "../engine/geom";
import {FilmGrain, PaperTexture, Vignette} from "../engine/paper";

/**
 * An AI-anchored shot.
 *
 * The picture comes from a generated image; the motion comes from the measured
 * beat. This is deliberately *not* a generic Ken Burns slide: the image scale
 * answers the accent, so a kick pushes the frame and a dead beat only breathes.
 *
 * There is no real depth here yet — a single flat image cannot parallax against
 * itself. Layer decomposition (front/mid/back) is the next step; until then a
 * slow push plus a travelling light sweep has to carry the shot.
 */

export type AiShotSpec = {
  id: string;
  /** path under public/, e.g. "ai/01-wish-money.jpg" */
  image: string;
  /** absolute seconds on the song timeline */
  start: number;
  duration: number;
  camera?: CameraMove;
  intensity?: number;
  /** which section this shot belongs to, for future per-section treatment */
  section?: string;
};

export const AiShot: React.FC<{
  shot: AiShotSpec;
  marks: BeatMark[];
  accent?: string;
}> = ({shot, marks, accent = "#ffd9a0"}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = shot.start + frame / fps;
  const total = Math.max(1, Math.round(shot.duration * fps));
  const p = clamp(frame / total);

  const hit = beatPulse(time, marks, 6, {floor: 0.2});
  const bar = barPulse(time, marks, 2);
  const intensity = shot.intensity ?? 0.6;

  // Base camera move, then an accent-driven push on top of it.
  const cam = cameraAt(shot.camera ?? "push", p, {
    width,
    height,
    seed: 7,
    amount: 0.5 + intensity * 0.6,
  });

  // 0.4%..2.2%: visible as a breath, small enough not to look like a zoom.
  const accentScale = 1 + (0.004 + 0.018 * hit.value) * (0.6 + intensity * 0.8);
  const barScale = 1 + 0.006 * bar.value;

  // A light band sweeping across the frame once per bar.
  const sweepX = -0.35 + ((time * 0.55) % 1) * 1.7;

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#0d0709"}}>
      <AbsoluteFill
        style={{
          transform: `scale(${cam.scale * accentScale * barScale}) translate(${
            (cam.x / Math.max(width, 1)) * 100
          }%, ${(cam.y / Math.max(height, 1)) * 100}%)`,
          transformOrigin: "50% 52%",
        }}
      >
        <Img
          src={staticFile(shot.image)}
          style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}}
        />
        {/* The sweep gives the flat image a sense of a moving light source, and
            it re-reads once per bar so a long hold still changes. */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(105deg, transparent ${
              (sweepX - 0.18) * 100
            }%, ${accent} ${sweepX * 100}%, transparent ${
              (sweepX + 0.18) * 100
            }%)`,
            opacity: 0.05 + 0.1 * bar.value + 0.06 * hit.value,
            mixBlendMode: "screen",
          }}
        />
      </AbsoluteFill>

      {/* Paper texture + grain keep the generated still in the same medium as
          the rest of the film instead of reading as a photograph. */}
      <PaperTexture opacity={0.3} />
      <FilmGrain opacity={0.2} />
      <Vignette opacity={0.7} />
    </AbsoluteFill>
  );
};
