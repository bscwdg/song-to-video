/**
 * A palette is a small, opinionated colour script — not a free colour picker.
 * Four darks, one paper, one light, one accent keeps paper-cut footage coherent
 * across shots instead of turning every scene into a different film.
 */
export type Palette = {
  name: string;
  skyTop: string;
  skyBottom: string;
  far: string;
  mid: string;
  near: string;
  paper: string;
  paperWarm: string;
  shade: string;
  ink: string;
  inkSoft: string;
  accent: string;
  light: string;
  glow: string;
  haze: string;
};

export const PALETTES: Record<string, Palette> = {
  dusk: {
    name: "dusk",
    skyTop: "#081d2b",
    skyBottom: "#d97b5e",
    far: "#3b5360",
    mid: "#243b48",
    near: "#0e2029",
    paper: "#f5e3c2",
    paperWarm: "#fff0d2",
    shade: "#bd9270",
    ink: "#081820",
    inkSoft: "#16303b",
    accent: "#f2b45f",
    light: "#ffe8ae",
    glow: "#ffc172",
    haze: "#c97a60",
  },
  ember: {
    name: "ember",
    skyTop: "#2a1218",
    skyBottom: "#d1734f",
    far: "#6b3236",
    mid: "#4a1f2b",
    near: "#2a1119",
    paper: "#f6e2bd",
    paperWarm: "#ffeccb",
    shade: "#c08a63",
    ink: "#1a0c12",
    inkSoft: "#331720",
    accent: "#f0b069",
    light: "#ffd9a0",
    glow: "#ff9d5c",
    haze: "#9d4a3d",
  },
  jade: {
    name: "jade",
    skyTop: "#0e2b28",
    skyBottom: "#7fa892",
    far: "#2f5850",
    mid: "#1d403b",
    near: "#0f2a27",
    paper: "#f0e6cc",
    paperWarm: "#fbf3dc",
    shade: "#a9b08e",
    ink: "#0a1c1b",
    inkSoft: "#17302d",
    accent: "#e3b866",
    light: "#f6e7b8",
    glow: "#c9d88f",
    haze: "#6f9584",
  },
  wine: {
    name: "wine",
    skyTop: "#1c0f16",
    skyBottom: "#8c3a44",
    far: "#55222f",
    mid: "#39151f",
    near: "#1d0b12",
    paper: "#f3ddc0",
    paperWarm: "#fcebcf",
    shade: "#c09577",
    ink: "#150910",
    inkSoft: "#2b1119",
    accent: "#e8b167",
    light: "#ffdfae",
    glow: "#e88a63",
    haze: "#87404a",
  },
  night: {
    name: "night",
    skyTop: "#071723",
    skyBottom: "#2f5a68",
    far: "#1d3d4c",
    mid: "#122c39",
    near: "#081c26",
    paper: "#eee3c8",
    paperWarm: "#fbf1d8",
    shade: "#9aa9a2",
    ink: "#04121b",
    inkSoft: "#0e2633",
    accent: "#e6c273",
    light: "#f8e6b6",
    glow: "#9fc7c0",
    haze: "#457080",
  },
  dawn: {
    name: "dawn",
    skyTop: "#264551",
    skyBottom: "#e3b489",
    far: "#6b7f7c",
    mid: "#48615f",
    near: "#273b3c",
    paper: "#f7e8cb",
    paperWarm: "#fff3da",
    shade: "#c2997a",
    ink: "#132429",
    inkSoft: "#243c40",
    accent: "#e4a95f",
    light: "#fff0c4",
    glow: "#ffc98c",
    haze: "#c79c7d",
  },
};

export const PALETTE_ORDER = ["dusk", "jade", "ember", "night", "dawn", "wine"];

export const paletteByIndex = (index: number): Palette =>
  PALETTES[PALETTE_ORDER[((index % PALETTE_ORDER.length) + PALETTE_ORDER.length) % PALETTE_ORDER.length]];
