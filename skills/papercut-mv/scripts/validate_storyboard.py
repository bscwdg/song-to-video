#!/usr/bin/env python3
"""Validate the lyric-driven storyboard contract before any scene code is written.

Example:
  python scripts/validate_storyboard.py storyboard.json
  python scripts/validate_storyboard.py storyboard.json --strict
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


SCENE_KEYS = ("archetype", "subject", "camera", "palette", "motion", "transition")


def _number(value: Any, label: str, errors: list[str]) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        errors.append(f"{label} must be a number")
        return None
    return float(value)


def _text(value: Any, label: str, errors: list[str]) -> str | None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")
        return None
    return value.strip()


def validate_storyboard(
    payload: Any,
    *,
    tolerance: float = 0.25,
) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) for a storyboard payload."""
    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(payload, dict):
        return (["storyboard root must be an object"], warnings)

    if payload.get("version") != 1:
        errors.append("version must be 1")

    _text(payload.get("title"), "title", errors)
    fps = _number(payload.get("fps"), "fps", errors)
    duration = _number(payload.get("duration"), "duration", errors)
    if fps is not None and fps <= 0:
        errors.append("fps must be > 0")
    if duration is not None and duration <= 0:
        errors.append("duration must be > 0")

    segment = payload.get("segment")
    if segment is not None:
        if not isinstance(segment, dict):
            errors.append("segment must be an object")
        else:
            segment_start = _number(segment.get("start"), "segment.start", errors)
            segment_end = _number(segment.get("end"), "segment.end", errors)
            if segment_start is not None and segment_end is not None:
                if segment_start < 0:
                    errors.append("segment.start must be >= 0")
                if segment_end <= segment_start:
                    errors.append("segment.end must be > segment.start")

    shots = payload.get("shots")
    if not isinstance(shots, list) or not shots:
        return (errors + ["shots must be a non-empty array"], warnings)

    seen_ids: set[str] = set()
    archetypes: list[str] = []
    palettes: list[str] = []
    shot_durations: list[float] = []
    expected_start = 0.0
    lyric_count = 0

    for index, shot in enumerate(shots):
        label = f"shots[{index}]"
        if not isinstance(shot, dict):
            errors.append(f"{label} must be an object")
            continue

        shot_id = _text(shot.get("id"), f"{label}.id", errors)
        if shot_id is not None:
            if shot_id in seen_ids:
                errors.append(f"{label}.id duplicates {shot_id!r}")
            seen_ids.add(shot_id)

        start = _number(shot.get("start"), f"{label}.start", errors)
        end = _number(shot.get("end"), f"{label}.end", errors)
        if start is not None and end is not None:
            if start < 0:
                errors.append(f"{label}.start must be >= 0")
            if end <= start:
                errors.append(f"{label}.end must be > start")
            else:
                shot_durations.append(end - start)
            if abs(start - expected_start) > 1e-3:
                errors.append(
                    f"{label}.start={start:.3f} does not continue from "
                    f"{expected_start:.3f}"
                )
            expected_start = end

        _text(shot.get("intent"), f"{label}.intent", errors)
        _text(shot.get("metaphor"), f"{label}.metaphor", errors)

        scene = shot.get("scene")
        if not isinstance(scene, dict):
            errors.append(f"{label}.scene must be an object")
        else:
            for key in SCENE_KEYS:
                if key not in scene:
                    errors.append(f"{label}.scene.{key} is required")
            _text(scene.get("archetype"), f"{label}.scene.archetype", errors)
            _text(scene.get("camera"), f"{label}.scene.camera", errors)
            _text(scene.get("palette"), f"{label}.scene.palette", errors)
            _text(scene.get("motion"), f"{label}.scene.motion", errors)
            _text(scene.get("transition"), f"{label}.scene.transition", errors)
            subjects = scene.get("subject")
            if not isinstance(subjects, list) or not subjects:
                errors.append(f"{label}.scene.subject must be a non-empty array")
            else:
                for subject_index, subject in enumerate(subjects):
                    _text(subject, f"{label}.scene.subject[{subject_index}]", errors)
            if isinstance(scene.get("archetype"), str):
                archetypes.append(scene["archetype"])
            if isinstance(scene.get("palette"), str):
                palettes.append(scene["palette"])

        cut = shot.get("cut")
        if cut is not None:
            if not isinstance(cut, dict):
                errors.append(f"{label}.cut must be an object")
            else:
                snapped = _number(cut.get("snapped"), f"{label}.cut.snapped", errors)
                if snapped is not None and start is not None and end is not None:
                    if not (start <= snapped <= end):
                        errors.append(f"{label}.cut.snapped must be inside the shot")

        lyrics = shot.get("lyrics")
        if not isinstance(lyrics, list):
            errors.append(f"{label}.lyrics must be an array")
            continue
        for lyric_index, lyric in enumerate(lyrics):
            lyric_label = f"{label}.lyrics[{lyric_index}]"
            if not isinstance(lyric, dict):
                errors.append(f"{lyric_label} must be an object")
                continue
            lyric_count += 1
            _text(lyric.get("text"), f"{lyric_label}.text", errors)
            lyric_start = _number(lyric.get("start"), f"{lyric_label}.start", errors)
            lyric_end = _number(lyric.get("end"), f"{lyric_label}.end", errors)
            if lyric_start is not None and lyric_end is not None:
                if lyric_end <= lyric_start:
                    errors.append(f"{lyric_label}.end must be > start")
                if start is not None and lyric_start < start - tolerance:
                    errors.append(
                        f"{lyric_label}.start is before the shot by more than "
                        f"{tolerance:.2f}s"
                    )
                if end is not None and lyric_end > end + tolerance:
                    errors.append(
                        f"{lyric_label}.end is after the shot by more than "
                        f"{tolerance:.2f}s"
                    )

    if duration is not None and abs(expected_start - duration) > 1e-3:
        errors.append(
            f"last shot ends at {expected_start:.3f}s, duration is {duration:.3f}s"
        )

    if len(archetypes) != len(set(archetypes)):
        warnings.append(
            "duplicate archetype detected; confirm this is an intentional return, "
            "not the shot-index modulo fallback"
        )
    if len(palettes) > 1 and len(set(palettes)) == 1:
        warnings.append("all shots use the same palette")
    if lyric_count == 0:
        warnings.append("storyboard has no lyric lines; confirm the segment is instrumental")

    if shot_durations:
        average = sum(shot_durations) / len(shot_durations)
        if lyric_count >= 12 and average > 7.0:
            warnings.append(
                f"dense lyric segment averages {average:.1f}s per shot; "
                "confirm this is intentional and not too static"
            )
        if average < 1.5:
            warnings.append(
                f"average shot length is {average:.1f}s; confirm this is a montage, "
                "not unintentional fragmentation"
            )
        for index, shot_duration in enumerate(shot_durations):
            if shot_duration < 0.8:
                warnings.append(
                    f"shot {index + 1} is {shot_duration:.2f}s; "
                    "short shots need a punctuation/transition reason"
                )
            if shot_duration > 8.0:
                warnings.append(
                    f"shot {index + 1} is {shot_duration:.2f}s; "
                    "confirm it has an internal phase change"
                )

    return errors, warnings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("storyboard", type=Path)
    parser.add_argument("--tolerance", type=float, default=0.25)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="treat warnings as failures",
    )
    parser.add_argument("--json", action="store_true", help="print machine-readable result")
    args = parser.parse_args()

    payload = json.loads(args.storyboard.read_text(encoding="utf-8"))
    errors, warnings = validate_storyboard(payload, tolerance=args.tolerance)
    result = {
        "ok": not errors and not (args.strict and warnings),
        "errors": errors,
        "warnings": warnings,
        "shots": len(payload.get("shots", [])) if isinstance(payload, dict) else 0,
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(
            f"{'PASS' if result['ok'] else 'FAIL'} · "
            f"{result['shots']} shots"
        )
        for error in errors:
            print(f"ERROR · {error}")
        for warning in warnings:
            print(f"WARN  · {warning}")

    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
