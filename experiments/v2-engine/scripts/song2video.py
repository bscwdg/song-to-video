#!/usr/bin/env python3
"""One-command entry: song -> song.json -> shots.json -> generated film.

Examples:
  python song2video.py song.mp3 --lrc lyrics.lrc --project experiments/v2-engine
  python song2video.py song.mp3 --project experiments/v2-engine --render

The project must be a Remotion project containing src/engine and V2Song
(this experiment is the reference project). The song is copied into
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
REPO = HERE.parents[3]


def resolve_executable(name: str) -> str:
    """Resolve a command for subprocess.

    On Windows `npx` is a `.cmd` shim; passing the bare name to subprocess
    raises FileNotFoundError (WinError 2) because CreateProcess does not search
    PATHEXT. Resolving through PATH first keeps this cross-platform.
    """
    found = shutil.which(name)
    return found or name


def run(step: list[str], cwd: Path) -> None:
    step = [resolve_executable(step[0]), *step[1:]]
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
        "--qa",
        choices=("auto", "strict", "off"),
        default="auto",
        help="run delivery checks after rendering (auto: warn, strict: fail the run)",
    )
    parser.add_argument(
        "--portrait", action="store_true", help="render the 9:16 composition instead"
    )
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
    composition = "V2SongPortrait" if args.portrait else "V2Song"
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
                    else f"npx remotion render src/index.ts {composition} out/song.mp4 "
                    f"--codec=h264 --crf={args.crf} --pixel-format=yuv420p"
                ),
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    if args.render:
        composition = "V2SongPortrait" if args.portrait else "V2Song"
        output = "out/song-portrait.mp4" if args.portrait else "out/song.mp4"
        command = [
            "npx",
            "remotion",
            "render",
            "src/index.ts",
            composition,
            output,
            "--codec=h264",
            f"--crf={args.crf}",
            "--pixel-format=yuv420p",
        ]
        if args.scale and args.scale != "1":
            command.append(f"--scale={args.scale}")
        if Path(args.browser_executable).exists():
            command.append(f"--browser-executable={args.browser_executable}")
        run(command, project)

        # Rendering without checking is how a film with three static seconds
        # ships as PASS. QA runs by default; strict mode makes it authoritative.
        if args.qa != "off":
            qa_command = [
                sys.executable,
                str(HERE / "qa_video.py"),
                str(project / output),
                "--timing",
                str(song_json),
            ]
            if args.portrait:
                qa_command += ["--width", "1080", "--height", "1920"]
            if args.qa == "strict":
                qa_command.append("--strict")
            run(qa_command, REPO)


if __name__ == "__main__":
    main()
