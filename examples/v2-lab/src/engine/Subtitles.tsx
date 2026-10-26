import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {FONT_LYRIC} from "../theme";
import {clamp} from "../engine/geom";

export type LyricRow = {
  start: number;
  end: number;
  text: string;
  gapAfter?: number;
};

/**
 * v1 held a line until the next LRC timestamp (6s in one case) and forced
 * nowrap at 54px. This version bounds display time in song_facts.py, wraps,
 * scales for long lines and keeps a bottom safe area.
 */
export const Subtitles: React.FC<{lyrics: LyricRow[]}> = ({lyrics}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = frame / fps;
  const line = lyrics.find((row) => time >= row.start && time < row.end);
  if (!line) return null;

  const fadeIn = clamp((time - line.start) / 0.2);
  const fadeOut = clamp((line.end - time) / 0.24);
  const opacity = Math.min(fadeIn, fadeOut);
  const length = line.text.length;
  const fontSize = length > 20 ? height * 0.038 : length > 14 ? height * 0.044 : height * 0.052;
  const maxWidth = width * 0.76;

  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: height * 0.1,
          display: "flex",
          justifyContent: "center",
          opacity,
          transform: `translateY(${(1 - fadeIn) * height * 0.02}px)`,
        }}
      >
        <div
          style={{
            position: "relative",
            maxWidth,
            padding: `${height * 0.012}px ${width * 0.028}px ${height * 0.016}px`,
            background:
              "linear-gradient(90deg, rgba(4,11,15,0), rgba(4,11,15,.58) 14%, rgba(4,11,15,.58) 86%, rgba(4,11,15,0))",
            clipPath:
              "polygon(0 12%, 3% 2%, 18% 5%, 34% 0, 51% 4%, 68% 1%, 84% 5%, 97% 2%, 100% 18%, 99% 86%, 88% 96%, 70% 92%, 52% 99%, 34% 94%, 16% 98%, 2% 90%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              bottom: 5,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,232,174,.55), transparent)",
            }}
          />
          <div
            style={{
              fontFamily: FONT_LYRIC,
              fontSize,
              lineHeight: 1.34,
              letterSpacing: "0.1em",
              color: "#fff8e7",
              textAlign: "center",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              textShadow: "0 2px 0 rgba(10,8,6,.5), 0 0 18px rgba(3,8,10,.6)",
            }}
          >
            {line.text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
