#!/usr/bin/env python3
"""Basic delivery checks for the paper-cut MV."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def probe(path: Path) -> dict:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,nb_frames",
        "-of",
        "json",
        str(path),
    ]
    return json.loads(subprocess.run(cmd, capture_output=True, check=True, text=True).stdout)


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "out/papercut-mv.mp4")
    data = probe(path)
    streams = data["streams"]
    video = next(s for s in streams if s["codec_type"] == "video")
    audio = next(s for s in streams if s["codec_type"] == "audio")
    duration = float(data["format"]["duration"])
    failures: list[str] = []

    if video["width"] != 1920 or video["height"] != 1080:
        failures.append(f"resolution {video['width']}x{video['height']} != 1920x1080")
    if video.get("r_frame_rate") != "30/1":
        failures.append(f"frame rate {video.get('r_frame_rate')} != 30/1")
    if abs(duration - 24.056) > 0.08:
        failures.append(f"duration {duration:.3f}s is not within 80ms of 24.056s")
    if not audio:
        failures.append("missing audio stream")

    print(json.dumps(data, ensure_ascii=False, indent=2))
    if failures:
        print("\nFAIL")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print("\nPASS · resolution, frame rate, duration and audio stream are valid")


if __name__ == "__main__":
    main()
