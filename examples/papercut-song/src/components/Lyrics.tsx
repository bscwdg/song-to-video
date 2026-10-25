import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {C, FONT_LYRIC, FONT_MARK} from "../theme";
import {LYRICS, clamp, easeOutCubic} from "../timeline";

export const Lyrics: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const active = LYRICS.find((line) => t >= line.start && t < line.end);

  if (!active) return null;

  const local = t - active.start;
  const open = easeOutCubic(clamp(local / 0.22));
  const close = clamp((active.end - t) / 0.1);
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
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: FONT_MARK,
          fontSize: 11,
          letterSpacing: "0.38em",
          color: C.moon,
          opacity: 0.35,
        }}
      >
        PAPER TIDE
      </div>
    </AbsoluteFill>
  );
};
