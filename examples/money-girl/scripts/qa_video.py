#!/usr/bin/env python3
"""Delivery checks for paper-cut MV renders.

Two layers, deliberately separated:

* **Spec** — codecs, streams, resolution, frame rate, duration. Proves the file
  is well-formed. Cheap, and it is what v1 shipped.
* **Craft** — dead beats, black frames, frozen stretches, subtitle safe area,
  loudness. Proves the file is a *film*. v1 had none of this, so a render with
  three static seconds still reported PASS.

The craft layer decodes the video once, at low resolution, and reasons about
luminance. It needs ffmpeg; a system ffmpeg is used when present, otherwise the
binary bundled inside Remotion's compositor package.

Examples:
  python qa_video.py out/song.mp4 --timing timing.json
  python qa_video.py out/song.mp4 --song song.json --strict
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from fractions import Fraction
from pathlib import Path
from typing import Any

# Low-resolution decode: enough to see a cut, cheap enough to run per render.
ANALYSIS_W = 160
ANALYSIS_H = 90

DEFAULT_TIMING_NAMES = ("timing.json", "song.json", "shots.json")


def find_tool(name: str) -> str | None:
    """Prefer PATH, fall back to the ffmpeg Remotion already ships.

    The bundled binary lives in the *Remotion project's* node_modules, which is
    not necessarily the cwd (song2video may be invoked from the repo root). So
    search upward from the caller's cwd, and also walk up from this file, then
    check the skill's own tree.
    """
    found = shutil.which(name)
    if found:
        return found

    roots: list[Path] = []
    # cwd and every parent
    here = Path.cwd()
    roots.extend([here, *here.parents])
    # and this script's location, in case it runs from elsewhere entirely
    script_dir = Path(__file__).resolve().parent
    roots.extend([script_dir, *script_dir.parents])

    seen: set[Path] = set()

    def scan(node_modules: Path) -> str | None:
        if not node_modules.is_dir() or node_modules in seen:
            return None
        seen.add(node_modules)
        for candidate in node_modules.glob("@remotion/compositor-*"):
            for exe_name in (f"{name}.exe", name):
                exe = candidate / exe_name
                if exe.exists():
                    return str(exe)
        return None

    # Ancestors first (the usual `npm install` layout).
    for root in roots:
        found = scan(root / "node_modules")
        if found:
            return found

    # Then downward: a repo root holding several projects, each with its own
    # node_modules, is a normal layout and the bundled ffmpeg lives there.
    # One level is not enough (repo/experiments/v2-engine/node_modules), so walk two.
    def walk_down(root: Path, depth: int) -> str | None:
        if depth <= 0 or not root.is_dir():
            return None
        try:
            children = [c for c in root.iterdir() if c.is_dir()]
        except OSError:
            return None
        for child in children:
            found = scan(child / "node_modules")
            if found:
                return found
        for child in children:
            found = walk_down(child, depth - 1)
            if found:
                return found
        return None

    starts = [Path.cwd(), *Path.cwd().parents[:1], script_dir, *script_dir.parents[:1]]
    for start in starts:
        found = walk_down(start, 3)
        if found:
            return found
    return None


def require_tool(name: str) -> str:
    path = find_tool(name)
    if path is None:
        raise SystemExit(
            f"{name} not found. Install it, or run `npm install` in the Remotion "
            "project so its bundled copy is available."
        )
    return path


def probe(ffprobe: str, path: Path) -> dict[str, Any]:
    cmd = [
        ffprobe,
        "-v",
        "error",
        "-show_entries",
        "format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,"
        "r_frame_rate,sample_rate,channels,nb_frames",
        "-of",
        "json",
        str(path),
    ]
    return json.loads(
        subprocess.run(cmd, capture_output=True, check=True, text=True).stdout
    )


def read_luma(ffmpeg: str, path: Path, fps: float) -> list[Any]:
    """Decode the whole film once into small grayscale frames.

    Remotion ships a slim ffmpeg: no `rawvideo` muxer and no `fps` filter, only
    `scale`. So frames come out as a PNG sequence at the film's native rate
    (no resampling needed — the video already plays at the expected fps) and are
    read with Pillow.
    """
    import tempfile

    import numpy as np
    from PIL import Image

    with tempfile.TemporaryDirectory(prefix="qa-frames-") as tmp:
        pattern = str(Path(tmp) / "f%05d.png")
        cmd = [
            ffmpeg,
            "-v",
            "error",
            "-i",
            str(path),
            "-an",
            "-vf",
            f"scale={ANALYSIS_W}:{ANALYSIS_H}",
            "-pix_fmt",
            "gray",
            "-f",
            "image2",
            "-y",
            pattern,
        ]
        run = subprocess.run(cmd, capture_output=True, text=True)
        if run.returncode != 0:
            raise SystemExit(
                "could not decode frames from the render:\n"
                f"{run.stderr.strip()[:600]}"
            )
        frames: list[Any] = []
        for file in sorted(Path(tmp).glob("f*.png")):
            image = Image.open(file).convert("L")
            frames.append(np.asarray(image, dtype=np.uint8))
        return frames


def beat_times_from(source: Path | None, timing: dict[str, Any] | None) -> list[float]:
    """Beats in absolute seconds, from song.json / timing.json / shots.json."""
    if source is None:
        return []
    try:
        data = json.loads(source.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    if isinstance(data.get("beatFeatures"), list):
        return [float(row["t"]) for row in data["beatFeatures"] if "t" in row]
    if isinstance(data.get("beats"), list):
        return [float(t) for t in data["beats"]]
    if isinstance(data.get("shots"), list):
        return [float(shot["start"]) for shot in data["shots"] if "start" in shot]
    return []


def shot_ranges_from(source: Path | None) -> list[tuple[float, float]]:
    """(start, end) in seconds for each shot, when the source knows them.

    Motion is designed per shot, so the shot is the only fair baseline for the
    dead-beat rule. Without these ranges the check has to fall back to a whole
    film baseline, which is exactly the comparison that mislabels a quiet
    ending as dead.
    """
    if source is None:
        return []
    try:
        data = json.loads(source.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []

    ranges: list[tuple[float, float]] = []
    shots = data.get("shots")
    if isinstance(shots, list):
        for shot in shots:
            if "start" not in shot:
                continue
            start = float(shot["start"])
            duration = shot.get("duration")
            if duration is None:
                duration = shot.get("end", start) - start
            ranges.append((start, start + float(duration)))
        return ranges

    scenes = data.get("scenes")
    if isinstance(scenes, list):
        for scene in scenes:
            if "start" in scene and "end" in scene:
                ranges.append((float(scene["start"]), float(scene["end"])))
    return ranges


def analyse(
    frames: list[Any],
    fps: float,
    beats: list[float],
    dead_ratio: float,
    dead_floor: float,
    black_threshold: float,
    freeze_ratio: float,
    freeze_seconds: float,
    shot_ranges: list[tuple[float, float]] | None = None,
) -> dict[str, Any]:
    """Judge the film against its own rhythm, not against a magic number.

    A fixed `dead_threshold` cannot work across styles: an observed paper-cut
    render sits around 0.05-0.25 mean frame difference, so a 0.6 cutoff reports
    every beat as dead and a 0.01 cutoff reports none. Both are noise.

    The baseline is per **shot**, not global and not a time window. A quiet
    closing shot is supposed to be quieter than the chorus before it, and a hard
    cut between them is a legitimate 30x frame difference. Comparing across
    either makes the quieter shot look dead when it is merely quiet.
    """
    import numpy as np

    if not frames:
        return {"available": False}
    n = len(frames)
    stack = np.stack(frames).astype(np.int16)
    # Mean absolute difference between consecutive frames, 0..255 scale.
    diffs = np.abs(np.diff(stack, axis=0)).mean(axis=(1, 2)) if n > 1 else np.array([])
    luma = stack.mean(axis=(1, 2))

    report: dict[str, Any] = {
        "available": True,
        "framesAnalysed": int(n),
        "meanFrameDiff": round(float(diffs.mean()) if len(diffs) else 0.0, 4),
        "medianFrameDiff": round(float(np.median(diffs)) if len(diffs) else 0.0, 4),
        "minFrameDiff": round(float(diffs.min()) if len(diffs) else 0.0, 4),
        "maxFrameDiff": round(float(diffs.max()) if len(diffs) else 0.0, 4),
    }

    # Black frames: anything the viewer would read as a gap.
    black = [i for i, value in enumerate(luma) if value < black_threshold]
    report["blackFrames"] = black[:20]
    report["blackFrameCount"] = len(black)

    # Per-beat motion, measured first so the threshold can be relative.
    beat_peaks: list[dict[str, Any]] = []
    if beats and len(diffs):
        for t in beats:
            index = int(round(t * fps))
            if index < 1 or index >= n:
                continue
            window = diffs[max(0, index - 1) : min(len(diffs), index + 2)]
            if not len(window):
                continue
            beat_peaks.append({"t": round(t, 3), "peak": float(window.max())})

    if beat_peaks:
        peaks = np.array([row["peak"] for row in beat_peaks])
        times = np.array([row["t"] for row in beat_peaks])
        typical = float(np.median(peaks))

        # Assign each beat to the shot that contains it. The shot is the edit
        # unit: motion is designed per shot, so it is the only fair baseline.
        def shot_of(t: float) -> int:
            if not shot_ranges:
                return -1
            for i, (a, b) in enumerate(shot_ranges):
                if a - 1e-6 <= t < b + 1e-6:
                    return i
            return -1

        groups: dict[int, list[int]] = {}
        for i, t in enumerate(times):
            groups.setdefault(shot_of(float(t)), []).append(i)

        local_baselines = np.empty(len(peaks), dtype=float)
        local_cutoffs = np.empty(len(peaks), dtype=float)
        for shot_index, members in groups.items():
            member_peaks = peaks[members]
            # A shot with too few beats to judge falls back to the film median.
            baseline = (
                float(np.median(member_peaks)) if len(members) >= 3 else typical
            )
            for i in members:
                local_baselines[i] = baseline
                local_cutoffs[i] = max(dead_floor, baseline * dead_ratio)

        dead = [
            {
                "t": row["t"],
                "frameDiff": round(row["peak"], 4),
                "shotBaseline": round(float(local_baselines[i]), 4),
            }
            for i, row in enumerate(beat_peaks)
            if row["peak"] < local_cutoffs[i]
        ]
        report["beatMotionMedian"] = round(typical, 4)
        report["deadBeatCutoff"] = round(float(np.median(local_cutoffs)), 4)
        report["deadBeatCutoffKind"] = f"per-shot median × {dead_ratio:g}"
        report["deadBeats"] = dead[:30]
        report["deadBeatCount"] = len(dead)
        report["beatsChecked"] = len(beat_peaks)
    else:
        report["deadBeats"] = []
        report["deadBeatCount"] = 0
        report["beatsChecked"] = 0

    # Frozen stretches: long runs where the film nearly stops.
    freeze_cutoff = max(0.004, float(np.median(diffs)) * freeze_ratio) if len(diffs) else 0.01
    runs: list[dict[str, Any]] = []
    if len(diffs):
        run_start = None
        for i, value in enumerate(diffs):
            if value < freeze_cutoff:
                if run_start is None:
                    run_start = i
            elif run_start is not None:
                length = i - run_start
                if length / fps >= freeze_seconds:
                    runs.append(
                        {"startFrame": run_start + 1, "seconds": round(length / fps, 3)}
                    )
                run_start = None
        if run_start is not None:
            length = len(diffs) - run_start
            if length / fps >= freeze_seconds:
                runs.append({"startFrame": run_start + 1, "seconds": round(length / fps, 3)})
    report["freezeCutoff"] = round(float(freeze_cutoff), 4)
    report["freezes"] = runs
    report["freezeCount"] = len(runs)
    return report


def check_subtitle_safe_area(frames: list[Any], fps: float, bottom_safe: float) -> dict[str, Any]:
    """Look for bright text bleeding below the bottom safe line.

    Subtitles are drawn in the lower third. If high-luminance pixels appear
    below the safe area, a long line has escaped its box on some frame.
    """
    import numpy as np

    if not frames:
        return {"available": False}
    stack = np.stack(frames).astype(np.int16)
    height = stack.shape[1]
    # The band a subtitle must never enter: the outer bottom margin.
    line = int(height * (1.0 - bottom_safe))
    if line >= height - 1:
        return {"available": False}
    band = stack[:, line:, :]
    bright = band > 215
    offenders = [int(i) for i in range(stack.shape[0]) if bright[i].sum() > 12]
    return {
        "available": True,
        "safeLineRow": line,
        "framesWithTextInMargin": offenders[:20],
        "count": len(offenders),
    }


def loudness(ffmpeg: str, path: Path) -> dict[str, Any]:
    """Integrated loudness, measured from the decoded audio.

    Remotion's bundled ffmpeg has no `ebur128`/`astats`/`volumedetect` filters
    (only amix/atrim/volume/silencedetect), so loudness cannot be read off the
    log. The audio is decoded to WAV and measured here instead.

    `lufsApprox` is a BS.1770-style estimate: K-weighting (high shelf + high
    pass) then gated mean square. It is close enough to catch "mixed too hot"
    or "buried", and it is labelled approximate because it is not a certified
    EBU R128 meter.
    """
    import tempfile
    import wave

    import numpy as np

    with tempfile.TemporaryDirectory(prefix="qa-audio-") as tmp:
        wav = Path(tmp) / "a.wav"
        cmd = [
            ffmpeg,
            "-v",
            "error",
            "-i",
            str(path),
            "-vn",
            "-ac",
            "2",
            "-ar",
            "48000",
            "-f",
            "wav",
            "-y",
            str(wav),
        ]
        run = subprocess.run(cmd, capture_output=True, text=True)
        if run.returncode != 0 or not wav.exists():
            return {"error": run.stderr.strip()[:300] or "decode failed"}

        with wave.open(str(wav), "rb") as handle:
            channels = handle.getnchannels()
            rate = handle.getframerate()
            width = handle.getsampwidth()
            raw = handle.readframes(handle.getnframes())
        if width != 2 or not raw:
            return {"error": "unsupported audio layout"}
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
        if channels > 1:
            samples = samples.reshape(-1, channels)
        else:
            samples = samples.reshape(-1, 1)
        mono = samples.mean(axis=1)

    peak = float(np.max(np.abs(samples))) if len(samples) else 0.0
    peak_db = 20 * np.log10(peak) if peak > 1e-9 else None
    rms = float(np.sqrt(np.mean(mono**2))) if len(mono) else 0.0
    rms_db = 20 * np.log10(rms) if rms > 1e-9 else None

    # BS.1770 K-weighting, using the published 48 kHz coefficients directly.
    # (An earlier attempt used scipy's iirpeak as a "shelf"; it is a narrow band
    # peak, so it threw away most of the signal and reported -36 LUFS on audio
    # whose RMS was -20.9 dBFS. Use the standard filters or do not report LUFS.)
    lufs: float | None = None
    try:
        from scipy import signal as sps

        if rate == 48000:
            b1 = np.array([1.53512485958697, -2.69169618940638, 1.19839281085285])
            a1 = np.array([1.0, -1.69065929318241, 0.73248077421585])
            b2 = np.array([1.0, -2.0, 1.0])
            a2 = np.array([1.0, -1.99004745483398, 0.99007225036621])
            weighted = sps.lfilter(b2, a2, sps.lfilter(b1, a1, mono))
        else:
            # Resampling to 48 kHz is not worth it for an advisory check; fall
            # back to a plain first-order high pass and label it as rough.
            b_hp, a_hp = sps.butter(2, 38.0 / (rate / 2), btype="highpass")
            weighted = sps.lfilter(b_hp, a_hp, mono)

        # Gating per BS.1770: 400 ms blocks, -70 LUFS absolute, -10 LU relative.
        block = max(1, int(0.4 * rate))
        count = len(weighted) // block
        if count:
            blocks = weighted[: count * block].reshape(count, block)
            block_ms = np.mean(blocks**2, axis=1)
            block_lufs = -0.691 + 10 * np.log10(np.maximum(block_ms, 1e-12))
            keep = block_lufs > -70.0
            if keep.any():
                relative = float(np.mean(block_lufs[keep])) - 10.0
                keep &= block_lufs > relative
            if keep.any():
                mean_square = float(np.mean(block_ms[keep]))
                lufs = -0.691 + 10 * np.log10(max(mean_square, 1e-12))
    except Exception:  # noqa: BLE001 - loudness is advisory, never fatal
        lufs = None

    return {
        "integratedLufs": round(lufs, 2) if lufs is not None else None,
        "lufsKind": "BS1770-gated-approximate",
        "rmsDbfs": round(rms_db, 2) if rms_db is not None else None,
        "peakDbfs": round(peak_db, 2) if peak_db is not None else None,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("--timing", type=Path)
    parser.add_argument("--song", type=Path, help="song.json, for per-beat checks")
    parser.add_argument(
        "--shots",
        type=Path,
        help="shots.json, for per-shot dead-beat baselines",
    )
    parser.add_argument("--expect-duration", type=float)
    parser.add_argument("--width", type=int)
    parser.add_argument("--height", type=int)
    parser.add_argument("--fps", type=float)
    parser.add_argument("--video-codec", default="h264")
    parser.add_argument("--audio-codec", default="aac")
    parser.add_argument("--tolerance-ms", type=float, default=120)
    parser.add_argument(
        "--strict", action="store_true", help="craft findings also fail the run"
    )
    parser.add_argument("--allow-black-frames", type=int, default=0)
    parser.add_argument("--allow-dead-beats", type=int, default=0)
    parser.add_argument("--allow-freezes", type=int, default=0)
    parser.add_argument(
        "--dead-ratio",
        type=float,
        default=0.35,
        help="a beat is dead below this fraction of the film's median beat motion",
    )
    parser.add_argument(
        "--dead-floor",
        type=float,
        default=0.02,
        help="absolute lower bound so a nearly static film still reports real dead beats",
    )
    parser.add_argument("--black-threshold", type=float, default=10.0)
    parser.add_argument(
        "--freeze-ratio",
        type=float,
        default=0.15,
        help="a run counts as frozen below this fraction of the median frame diff",
    )
    parser.add_argument("--freeze-seconds", type=float, default=0.5)
    parser.add_argument("--bottom-safe", type=float, default=0.05)
    parser.add_argument("--target-lufs", type=float, default=-14.0)
    parser.add_argument("--lufs-tolerance", type=float, default=4.0)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    if not args.video.exists():
        raise SystemExit(f"video not found: {args.video}")

    ffmpeg = require_tool("ffmpeg")
    ffprobe = require_tool("ffprobe")

    expected_duration = None
    expected_width = 1920
    expected_height = 1080
    expected_fps = 30.0
    timing: dict[str, Any] | None = None
    if args.timing:
        timing = json.loads(args.timing.read_text(encoding="utf-8"))
        expected_duration = (
            timing.get("musical_body_end") or timing.get("bodyEnd") or timing.get("duration")
        )
        expected_width = timing.get("target_width", timing.get("width", expected_width))
        expected_height = timing.get("target_height", timing.get("height", expected_height))
        expected_fps = float(timing.get("fps", expected_fps))
    # Explicit CLI values intentionally override the timing file.
    if args.expect_duration is not None:
        expected_duration = args.expect_duration
    if args.width is not None:
        expected_width = args.width
    if args.height is not None:
        expected_height = args.height
    if args.fps is not None:
        expected_fps = args.fps

    data = probe(ffprobe, args.video)
    streams = data["streams"]
    video = next((s for s in streams if s["codec_type"] == "video"), None)
    audio = next((s for s in streams if s["codec_type"] == "audio"), None)
    duration = float(data["format"]["duration"])
    failures: list[str] = []
    warnings: list[str] = []

    # ---- spec layer ----
    if video is None:
        failures.append("missing video stream")
    else:
        if video["width"] != expected_width or video["height"] != expected_height:
            failures.append(
                f"resolution {video['width']}x{video['height']} "
                f"!= {expected_width}x{expected_height}"
            )
        if video.get("codec_name") != args.video_codec:
            failures.append(f"video codec {video.get('codec_name')} != {args.video_codec}")
        actual_fps_raw = video.get("r_frame_rate", "0/1")
        try:
            actual_fps = float(Fraction(actual_fps_raw))
        except (ValueError, ZeroDivisionError):
            actual_fps = 0.0
        if abs(actual_fps - expected_fps) > 0.02:
            failures.append(
                f"frame rate {actual_fps_raw} ({actual_fps:.3f}) != {expected_fps:.3f}fps"
            )
    if audio is None:
        failures.append("missing audio stream")
    elif audio.get("codec_name") != args.audio_codec:
        failures.append(f"audio codec {audio.get('codec_name')} != {args.audio_codec}")
    if expected_duration is None:
        warnings.append("no expected duration; pass --timing or --expect-duration")
    elif abs(duration - expected_duration) * 1000 > args.tolerance_ms:
        failures.append(
            f"duration {duration:.3f}s is not within {args.tolerance_ms:.0f}ms "
            f"of {expected_duration:.3f}s"
        )

    # ---- craft layer ----
    song_path = args.song
    if song_path is None:
        for name in DEFAULT_TIMING_NAMES:
            candidate = args.video.parent.parent / name
            if candidate.exists():
                song_path = candidate
                break
    beats = beat_times_from(song_path, timing)
    shot_ranges = shot_ranges_from(song_path)
    if not shot_ranges and args.shots:
        shot_ranges = shot_ranges_from(args.shots)
    frames = read_luma(ffmpeg, args.video, expected_fps)
    craft = analyse(
        frames,
        expected_fps,
        beats,
        args.dead_ratio,
        args.dead_floor,
        args.black_threshold,
        args.freeze_ratio,
        args.freeze_seconds,
        shot_ranges=shot_ranges or None,
    )
    subs = check_subtitle_safe_area(frames, expected_fps, args.bottom_safe)
    level = loudness(ffmpeg, args.video)

    if craft.get("available"):
        if craft["blackFrameCount"] > args.allow_black_frames:
            msg = (
                f"{craft['blackFrameCount']} black frames "
                f"(first at {craft['blackFrames'][:3]})"
            )
            (failures if args.strict else warnings).append(msg)
        if craft["deadBeatCount"] > args.allow_dead_beats:
            msg = (
                f"{craft['deadBeatCount']}/{craft['beatsChecked']} beats show no visible "
                f"change (first: {craft['deadBeats'][:3]})"
            )
            (failures if args.strict else warnings).append(msg)
        if craft["freezeCount"] > args.allow_freezes:
            msg = f"{craft['freezeCount']} frozen stretches (first: {craft['freezes'][:3]})"
            (failures if args.strict else warnings).append(msg)
    else:
        warnings.append("could not decode frames; craft checks skipped")

    if subs.get("available") and subs["count"] > 0:
        msg = f"{subs['count']} frames have text inside the bottom margin"
        (failures if args.strict else warnings).append(msg)

    integrated = level.get("integratedLufs")
    if integrated is not None:
        if abs(integrated - args.target_lufs) > args.lufs_tolerance:
            msg = (
                f"integrated loudness {integrated:.1f} LUFS is outside "
                f"{args.target_lufs:.0f}±{args.lufs_tolerance:.0f}"
            )
            (failures if args.strict else warnings).append(msg)

    payload = {
        "spec": data,
        "craft": craft,
        "subtitles": subs,
        "loudness": level,
        "failures": failures,
        "warnings": warnings,
    }
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    print(json.dumps(payload, ensure_ascii=False, indent=2))

    if failures:
        print("\nFAIL")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    if warnings:
        print("\nPASS with warnings")
        for warning in warnings:
            print(f"- {warning}")
        raise SystemExit(0)
    print("\nPASS · spec and craft checks are clean")


if __name__ == "__main__":
    main()
