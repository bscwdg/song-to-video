import React from "react";
import {clamp} from "./geom";
import {parallax, type CameraState} from "./camera";

/**
 * Depth layer: applies parallax and atmospheric haze. Far layers are washed
 * toward the sky, near layers carry the contrast. This is what makes a stack
 * of paper shapes read as a space instead of a sticker sheet.
 */
export const Parallax: React.FC<{
  cam: CameraState;
  depth: number;
  width: number;
  height: number;
  hazeColor?: string;
  hazeAmount?: number;
  children: React.ReactNode;
}> = ({cam, depth, width, height, hazeColor, hazeAmount = 0, children}) => {
  const {transform} = parallax(cam, depth, width, height);
  return (
    <g transform={transform}>
      {children}
      {hazeColor && hazeAmount > 0 ? (
        <rect
          x={-width * 0.3}
          y={-height * 0.3}
          width={width * 1.6}
          height={height * 1.6}
          fill={hazeColor}
          opacity={clamp(hazeAmount)}
        />
      ) : null}
    </g>
  );
};

/** Soft contact shadow on the layer behind a subject. */
export const ContactShadow: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  opacity?: number;
}> = ({cx, cy, rx, ry, color, opacity = 0.32}) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} opacity={opacity} filter="url(#pc-haze)" />
);
