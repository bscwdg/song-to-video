import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {beatPhase, clamp, easeOutCubic} from "./utils";

export const KineticReelPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const beat = beatPhase(time, 120);
  const line1 = easeOutCubic(clamp((time - 0.15) / 0.35));
  const line2 = easeOutCubic(clamp((time - 0.7) / 0.35));
  const line3 = easeOutCubic(clamp((time - 1.25) / 0.35));
  const sweep = easeOutCubic(clamp((time - 2.0) / 0.8));
  const disc = 60 + sweep * 620;

  return (
    <AbsoluteFill style={{backgroundColor: "#0b0b0c", overflow: "hidden", color: "#f1ead9"}}>
      <AbsoluteFill style={{background: "linear-gradient(118deg, rgba(199,255,61,.08), transparent 38%, rgba(255,107,74,.06))"}} />
      <div style={{position: "absolute", inset: 0, opacity: 0.22, backgroundImage: "linear-gradient(rgba(241,234,217,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(241,234,217,.18) 1px, transparent 1px)", backgroundSize: "120px 120px", transform: `translateY(${-time * 18}px)`}} />
      <div style={{position: "absolute", left: 72, top: 56, fontFamily: "JetBrains Mono, Consolas, monospace", fontSize: 18, letterSpacing: 3, color: "#c7ff3d"}}>
        KINETIC REEL / 02
      </div>
      <div style={{position: "absolute", right: 72, top: 56, fontFamily: "JetBrains Mono, Consolas, monospace", fontSize: 16, letterSpacing: 2, color: "#f1ead9", opacity: 0.68}}>
        BPM 120 · 04 SEC
      </div>
      <div style={{position: "absolute", left: 110, top: 250, width: 1500}}>
        <div style={{fontFamily: "Arial Black, Impact, sans-serif", fontSize: 192, lineHeight: 0.84, letterSpacing: "-8px", transform: `translateX(${(1 - line1) * -180}px)`, opacity: line1}}>
          MAKE
        </div>
        <div style={{fontFamily: "Arial Black, Impact, sans-serif", fontSize: 192, lineHeight: 0.84, letterSpacing: "-8px", transform: `translateX(${(1 - line2) * 180}px)`, opacity: line2, color: "#c7ff3d"}}>
          IT
        </div>
        <div style={{fontFamily: "Arial Black, Impact, sans-serif", fontSize: 192, lineHeight: 0.84, letterSpacing: "-8px", transform: `scale(${0.92 + line3 * 0.08})`, opacity: line3}}>
          MOVE
        </div>
      </div>
      <div style={{position: "absolute", right: 170, bottom: 150, width: disc, height: disc, borderRadius: "50%", background: "#c7ff3d", opacity: 0.92, transform: "translate(50%, 50%)", mixBlendMode: "screen"}} />
      <div style={{position: "absolute", left: 112, bottom: 96, fontFamily: "JetBrains Mono, Consolas, monospace", fontSize: 18, letterSpacing: 3, color: "#f1ead9"}}>
        TYPE IS THE HERO<br />SHAPE CONTINUITY / HARD CUT ON BEAT
      </div>
      <div style={{position: "absolute", right: 86, bottom: 92, fontFamily: "JetBrains Mono, Consolas, monospace", fontSize: 24, color: "#c7ff3d"}}>
        {(beat * 100).toFixed(0).padStart(3, "0")} / 100
      </div>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: "linear-gradient(90deg, #ff6b4a, #c7ff3d, #f1ead9)", transform: `scaleX(${0.3 + beat * 0.7})`, transformOrigin: "left"}} />
    </AbsoluteFill>
  );
};
