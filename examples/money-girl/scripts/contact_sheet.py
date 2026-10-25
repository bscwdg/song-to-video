#!/usr/bin/env python3
"""Build an exact one-frame-per-scene contact sheet from timing.json."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("--timing", type=Path, default=Path("timing.json"))
    parser.add_argument("--out", type=Path, default=Path("out/contact-sheet.jpg"))
    parser.add_argument("--cols", type=int, default=3)
    parser.add_argument("--width", type=int, default=640)
    args = parser.parse_args()

    timing = json.loads(args.timing.read_text(encoding="utf-8"))
    scenes = timing.get("scenes", [])
    if not scenes:
        raise SystemExit("timing.json has no scenes")
    if args.cols <= 0:
        raise SystemExit("--cols must be > 0")
    if args.width <= 0:
        raise SystemExit("--width must be > 0")
    fps = int(timing.get("fps", 30))
    if fps <= 0:
        raise SystemExit("timing.json fps must be > 0")
    frames = [
        max(0, round(((float(scene["start"]) + float(scene["end"])) / 2) * fps))
        for scene in scenes
    ]
    rows = (len(frames) + args.cols - 1) // args.cols
    expression = "+".join(f"eq(n,{frame})" for frame in frames)
    args.out.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(args.video),
        "-vf",
        f"select='{expression}',scale={args.width}:-1,tile={args.cols}x{rows}",
        "-frames:v",
        "1",
        str(args.out),
    ]
    subprocess.run(cmd, check=True)
    print(args.out)


if __name__ == "__main__":
    main()
