#!/usr/bin/env python3
"""Parameterized delivery checks for paper-cut MV renders."""

from __future__ import annotations

import argparse
import json
import subprocess
from fractions import Fraction
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
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("--timing", type=Path)
    parser.add_argument("--expect-duration", type=float)
    parser.add_argument("--width", type=int)
    parser.add_argument("--height", type=int)
    parser.add_argument("--fps", type=float)
    parser.add_argument("--video-codec", default="h264")
    parser.add_argument("--audio-codec", default="aac")
    parser.add_argument("--tolerance-ms", type=float, default=120)
    args = parser.parse_args()

    expected_duration = None
    expected_width = 1920
    expected_height = 1080
    expected_fps = 30.0
    if args.timing:
        timing = json.loads(args.timing.read_text(encoding="utf-8"))
        expected_duration = timing.get("musical_body_end")
        expected_width = timing.get("target_width", expected_width)
        expected_height = timing.get("target_height", expected_height)
        expected_fps = timing.get("fps", expected_fps)
    # Explicit CLI values intentionally override timing.json.
    if args.expect_duration is not None:
        expected_duration = args.expect_duration
    if args.width is not None:
        expected_width = args.width
    if args.height is not None:
        expected_height = args.height
    if args.fps is not None:
        expected_fps = args.fps

    data = probe(args.video)
    streams = data["streams"]
    video = next((s for s in streams if s["codec_type"] == "video"), None)
    audio = next((s for s in streams if s["codec_type"] == "audio"), None)
    duration = float(data["format"]["duration"])
    failures: list[str] = []

    if video is None:
        failures.append("missing video stream")
    else:
        if video["width"] != expected_width or video["height"] != expected_height:
            failures.append(
                f"resolution {video['width']}x{video['height']} "
                f"!= {expected_width}x{expected_height}"
            )
        if video.get("codec_name") != args.video_codec:
            failures.append(
                f"video codec {video.get('codec_name')} != {args.video_codec}"
            )
        actual_fps_raw = video.get("r_frame_rate", "0/1")
        try:
            actual_fps = float(Fraction(actual_fps_raw))
        except (ValueError, ZeroDivisionError):
            actual_fps = 0.0
        if abs(actual_fps - expected_fps) > 0.02:
            failures.append(
                f"frame rate {actual_fps_raw} ({actual_fps:.3f}) "
                f"!= {expected_fps:.3f}fps"
            )
    if audio is None:
        failures.append("missing audio stream")
    elif audio.get("codec_name") != args.audio_codec:
        failures.append(
            f"audio codec {audio.get('codec_name')} != {args.audio_codec}"
        )
    if expected_duration is None:
        failures.append("no expected duration; pass --timing or --expect-duration")
    elif abs(duration - expected_duration) * 1000 > args.tolerance_ms:
        failures.append(
            f"duration {duration:.3f}s is not within {args.tolerance_ms:.0f}ms "
            f"of {expected_duration:.3f}s"
        )

    print(json.dumps(data, ensure_ascii=False, indent=2))
    if failures:
        print("\nFAIL")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print(
        "\nPASS · codecs, streams, resolution, frame rate and duration are valid"
    )


if __name__ == "__main__":
    main()
