import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C, FONT_LYRIC} from "../theme";
import {clamp, easeOutCubic, lyricAt, type LyricLine} from "../timeline";

export const Lyrics: React.FC<{lyrics: LyricLine[]}> = ({lyrics}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const active = lyricAt(time, lyrics);

  if (!active) return null;

  const open = easeOutCubic(clamp((time - active.start) / 0.22));
  const close = clamp((active.end - time) / 0.1);
  const opacity = Math.min(open, close);
  const y = (1 - open) * 18;

  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 58,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "10px 50px 15px",
            clipPath:
              "polygon(0 15%, 2.2% 4%, 16% 7%, 31% 1%, 54% 4%, 72% 0, 89% 5%, 98% 2%, 100% 22%, 99.1% 84%, 86% 94%, 67% 90%, 47% 98%, 29% 93%, 10% 100%, 1.5% 86%)",
            background:
              "linear-gradient(90deg, rgba(6,15,20,.02), rgba(6,15,20,.55) 17%, rgba(6,15,20,.55) 83%, rgba(6,15,20,.02))",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "7%",
              right: "7%",
              bottom: 7,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${C.moon}, transparent)`,
              opacity: 0.38,
            }}
          />
          <div
            style={{
              fontFamily: FONT_LYRIC,
              fontSize: 54,
              lineHeight: 1.25,
              letterSpacing: "0.12em",
              color: C.white,
              textAlign: "center",
              whiteSpace: "nowrap",
              textShadow:
                "0 2px 0 rgba(20,10,8,.44), 0 0 20px rgba(4,10,14,.66), 0 6px 28px rgba(3,8,12,.48)",
            }}
          >
            {active.text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
