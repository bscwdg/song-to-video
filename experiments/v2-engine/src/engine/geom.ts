export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export const easeInOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Deterministic 0..1 noise. Every random-looking value uses this. */
export const hash = (i: number, seed = 1) => {
  const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export const signed = (i: number, seed = 1) => hash(i, seed) * 2 - 1;

export const rad = (deg: number) => (deg * Math.PI) / 180;

export type Point = [number, number];

export const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
export const mul = (a: Point, k: number): Point => [a[0] * k, a[1] * k];
export const dir = (deg: number): Point => [Math.sin(rad(deg)), Math.cos(rad(deg))];
export const perp = (deg: number): Point => [Math.cos(rad(deg)), -Math.sin(rad(deg))];

/** Create a wobbly paper edge along a straight segment. */
export const tornSegment = (
  a: Point,
  b: Point,
  normal: Point,
  amp: number,
  step: number,
  seed: number,
  offset: number,
): Point[] => {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const count = Math.max(2, Math.round(length / step));
  const points: Point[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const jitter =
      (hash(i + offset, seed) * 2 - 1) * amp +
      (hash(i * 3 + offset, seed + 9) * 2 - 1) * amp * 0.35;
    points.push([
      a[0] + (b[0] - a[0]) * t + normal[0] * jitter,
      a[1] + (b[1] - a[1]) * t + normal[1] * jitter,
    ]);
  }
  return points;
};

export const toPath = (points: Point[], close = true) =>
  `${points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")}${close ? " Z" : ""}`;

/** Torn rectangle outline, in absolute pixels. */
export const tornRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  amp = 5,
  step = 34,
  seed = 1,
): string => {
  const corner: Point = [x, y];
  const corners: Point[] = [
    corner,
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const normals: Point[] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const points: Point[] = [];
  for (let i = 0; i < 4; i += 1) {
    points.push(
      ...tornSegment(
        corners[i],
        corners[(i + 1) % 4],
        normals[i],
        amp,
        step,
        seed,
        i * 37,
      ),
    );
  }
  return toPath(points);
};

/** Torn polygon: takes a point list and jitters every edge outward. */
export const tornPolygon = (
  points: Point[],
  amp = 5,
  step = 30,
  seed = 1,
): string => {
  const out: Point[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const normal: Point = [dy / len, -dx / len];
    out.push(...tornSegment(a, b, normal, amp, step, seed, i * 23));
  }
  return toPath(out);
};

/** A hill / ridge band that always closes to the bottom of the frame. */
export const ridgePath = (
  width: number,
  height: number,
  baseY: number,
  amp: number,
  seed: number,
  steps = 14,
): string => {
  const points: Point[] = [[-80, height + 40]];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = -80 + t * (width + 160);
    const y =
      baseY +
      Math.sin(t * Math.PI * 2.1 + seed) * amp +
      (hash(i, seed) - 0.5) * amp * 1.4;
    points.push([x, y]);
  }
  points.push([width + 80, height + 40]);
  return toPath(points);
};

/** Ridges with a genuinely torn edge, not just a filter wobble. */
export const tornRidge = (
  width: number,
  height: number,
  baseY: number,
  amp: number,
  seed: number,
  steps = 18,
  edgeAmp = 5,
): string => {
  const points: Point[] = [[-120, height + 60]];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = -120 + t * (width + 240);
    const y =
      baseY +
      Math.sin(t * Math.PI * 2.2 + seed) * amp +
      (hash(i, seed) - 0.5) * amp * 1.1;
    points.push([x, y]);
  }
  points.push([width + 120, height + 60]);
  return tornPolygon(points, edgeAmp, 42, seed + 3);
};

/** Torn annular ring: outer and inner edges both deckled. */
export const tornRing = (
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  seed: number,
  amp = 9,
  steps = 72,
): string => {
  const walk = (radius: number, salt: number): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i < steps; i += 1) {
      const a = (i / steps) * Math.PI * 2;
      const r =
        radius +
        (hash(i + salt, seed) * 2 - 1) * amp +
        (hash(i * 3 + salt, seed + 17) * 2 - 1) * amp * 0.4;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  };
  const outer = walk(rOuter, 1);
  const inner = walk(rInner, 41);
  return `${toPath(outer)} ${toPath(inner)}`;
};
