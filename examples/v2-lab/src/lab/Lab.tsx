import React from "react";
import {Film, type ShotSpec} from "../engine/Shot";

/**
 * Visual lab: five archetypes, five camera moves, one palette script.
 * Replace SHOTS with shots.json from the director to make a real film.
 */

const beats = Array.from({length: 64}, (_, i) => 0.18 + i * 0.5);

export const SHOTS: ShotSpec[] = [
  {
    id: "01-wide",
    archetype: "wide-horizon",
    start: 0,
    duration: 5,
    palette: "dusk",
    camera: "push",
    intensity: 0.4,
    seed: 11,
  },
  {
    id: "02-corridor",
    archetype: "corridor",
    start: 5,
    duration: 5,
    palette: "ember",
    camera: "trackRight",
    intensity: 0.6,
    seed: 23,
  },
  {
    id: "03-window",
    archetype: "window",
    start: 10,
    duration: 5,
    palette: "dawn",
    camera: "handheld",
    intensity: 0.5,
    seed: 37,
  },
  {
    id: "04-iris",
    archetype: "iris",
    start: 15,
    duration: 5,
    palette: "night",
    camera: "pull",
    intensity: 0.7,
    seed: 41,
  },
  {
    id: "05-macro",
    archetype: "macro",
    start: 20,
    duration: 5,
    palette: "wine",
    camera: "craneUp",
    intensity: 0.8,
    seed: 53,
  },
];

export const V2Lab: React.FC = () => <Film shots={SHOTS} beats={beats} />;
