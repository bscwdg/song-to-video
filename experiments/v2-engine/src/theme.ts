import {loadFont} from "@remotion/google-fonts/NotoSerifSC";

export const C = {
  ink: "#10202a",
  inkSoft: "#1a303b",
  night: "#071823",
  night2: "#0b2938",
  night3: "#123b4b",
  sea: "#174654",
  seaLight: "#2d6771",
  foam: "#b9d4c9",
  moon: "#f3dfab",
  moonDeep: "#e5c777",
  cream: "#f5ead0",
  paper: "#f0dfbd",
  paperWarm: "#f6e4bc",
  gold: "#e9b85f",
  amber: "#d4863d",
  coral: "#d1766d",
  rose: "#c26376",
  roseDeep: "#783c5a",
  plum: "#522d48",
  blush: "#e7a09f",
  lantern: "#ffc86e",
  ember: "#ef7e43",
  teal: "#76a99e",
  mist: "#a9c3bf",
  shadow: "#061016",
  white: "#fff8e7",
} as const;

const serif = loadFont("normal", {
  weights: ["400"],
  subsets: ["chinese-simplified"],
  ignoreTooManyRequestsWarning: true,
});

export const FONT_LYRIC = `"${serif.fontFamily}", "STKaiti", "KaiTi", serif`;
export const FONT_MARK = FONT_LYRIC;

export const PAPER_SHADOW = "0 18px 34px rgba(4, 12, 18, 0.32)";
