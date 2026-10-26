#!/usr/bin/env python3
"""One-command entry: song -> song.json -> shots.json -> generated film.

Examples:
  python song2video.py song.mp3 --lrc lyrics.lrc --project examples/v2-lab
  python song2video.py song.mp3 --project examples/v2-lab --render

The project must be a Remotion project containing src/engine and V2Song
(the v2-lab is the reference project). The song is copied into
<project>/public/audio/ so Remotion can serve it.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]


def run(step: list[str], cwd: Path) -> None:
    print("$", " ".join(step))
    subprocess.run(step, cwd=str(cwd), check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--lrc", type=Path)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--title", default="")
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--crf", default="16")
    parser.add_argument("--scale", default="1")
    parser.add_argument(
        "--browser-executable",
        default=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    )
    args = parser.parse_args()

    project = args.project.resolve()
    if not (project / "src" / "engine").exists():
        raise SystemExit(f"{project} is not a v2 project (missing src/engine)")
    if not args.audio.exists():
        raise SystemExit(f"audio not found: {args.audio}")

    audio_dir = project / "public" / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    local_audio = audio_dir / args.audio.name
    if args.audio.resolve() != local_audio.resolve():
        shutil.copy2(args.audio, local_audio)
        print(f"copied song -> {local_audio}")

    song_json = project / "song.json"
    shots_json = project / "shots.json"
    storyboard = project / "STORYBOARD.auto.md"
    emit_ts = project / "src" / "generated" / "shots.generated.ts"

    facts = [
        sys.executable,
        str(HERE / "song_facts.py"),
        str(local_audio),
        "--out",
        str(song_json),
    ]
    if args.lrc:
        facts += ["--lrc", str(args.lrc)]
    run(facts, REPO)

    direct = [
        sys.executable,
        str(HERE / "direct.py"),
        str(song_json),
        "--out",
        str(shots_json),
        "--storyboard",
        str(storyboard),
        "--emit-ts",
        str(emit_ts),
    ]
    run(direct, REPO)

    summary = json.loads(shots_json.read_text(encoding="utf-8"))
    print(
        json.dumps(
            {
                "title": summary.get("title"),
                "duration": summary.get("duration"),
                "shots": len(summary.get("shots", [])),
                "project": str(project),
                "next": (
                    "render"
                    if args.render
                    else f"npx remotion render src/index.ts V2Song out/song.mp4 "
                    f"--codec=h264 --crf={args.crf} --pixel-format=yuv420p"
                ),
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    if args.render:
        command = [
            "npx",
            "remotion",
            "render",
            "src/index.ts",
            "V2Song",
            "out/song.mp4",
            "--codec=h264",
            f"--crf={args.crf}",
            "--pixel-format=yuv420p",
        ]
        if args.scale and args.scale != "1":
            command.append(f"--scale={args.scale}")
        if Path(args.browser_executable).exists():
            command.append(f"--browser-executable={args.browser_executable}")
        run(command, project)


if __name__ == "__main__":
    main()
