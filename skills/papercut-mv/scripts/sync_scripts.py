#!/usr/bin/env python3
"""Keep the duplicated pipeline scripts identical to their one source of truth.

`song-to-video` ships the same scripts in several places:

* `skills/papercut-mv/scripts/`        — the canonical copies
* `skills/papercut-mv/template/scripts/` — must stay self-contained, because the
  whole template directory is copied out with `Copy-Item -Recurse`
* `skills/papercut-mv/examples/paper-tide/scripts/`
* `examples/{money-girl,papercut-song}/scripts/`

That duplication is deliberate (each project has to run standalone), but it had
already rotted: `examples/papercut-song/scripts/qa_video.py` was an older
version than the skill's, so a bug fixed in one copy was still live in another.

This tool makes the drift mechanical instead of accidental:

  python sync_scripts.py            # copy canonical -> every mirror
  python sync_scripts.py --check    # exit 1 if any mirror differs (use in CI)
"""

from __future__ import annotations

import argparse
import hashlib
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
REPO = HERE.parents[2]

CANONICAL = HERE

# Every directory that carries copies of the canonical scripts.
MIRRORS = [
    SKILL / "template" / "scripts",
    SKILL / "examples" / "paper-tide" / "scripts",
    REPO / "examples" / "money-girl" / "scripts",
    REPO / "examples" / "papercut-song" / "scripts",
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def plan() -> list[tuple[Path, Path]]:
    """(canonical, mirror) pairs that exist in both places.

    Only scripts a project already has are synced: a v1 example is not given a
    v2 director it never asked for.
    """
    pairs: list[tuple[Path, Path]] = []
    canonical = {p.name: p for p in CANONICAL.glob("*.py")}
    for mirror in MIRRORS:
        if not mirror.is_dir():
            continue
        for existing in mirror.glob("*.py"):
            source = canonical.get(existing.name)
            if source is not None:
                pairs.append((source, existing))
    return pairs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    pairs = plan()
    if not pairs:
        raise SystemExit("no mirrored scripts found; check MIRRORS paths")

    drifted = [(a, b) for a, b in pairs if digest(a) != digest(b)]

    if args.check:
        print(f"checked {len(pairs)} mirrored script(s)")
        if not drifted:
            print("OK · every mirror matches the canonical script")
            return
        print(f"\nFAIL · {len(drifted)} script(s) drifted from the canonical copy:")
        for source, mirror in drifted:
            print(f"  {mirror.relative_to(REPO)}  !=  {source.name}")
        print("\nRun: python skills/papercut-mv/scripts/sync_scripts.py")
        raise SystemExit(1)

    if not drifted:
        print(f"OK · {len(pairs)} mirrored script(s) already in sync")
        return

    for source, mirror in drifted:
        shutil.copy2(source, mirror)
        print(f"synced {mirror.relative_to(REPO)}")
    print(f"\n{len(drifted)} script(s) synced from {CANONICAL.relative_to(REPO)}")


if __name__ == "__main__":
    main()
