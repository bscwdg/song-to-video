#!/usr/bin/env python3
"""Turn song facts into an editable shot list, storyboard and Remotion data.

The director is deliberately a deterministic rule set, not a model call:
same song -> same edit, every time. A human can edit shots.json and re-render.

Example:
  python direct.py song.json --out shots.json \
    --storyboard STORYBOARD.md \
    --emit-ts src/generated/shots.generated.ts
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

PALETTES = ["dusk", "ember", "wine", "night"]

ARCHETYPE_POOLS = {
    "low": ["wide-horizon", "window"],
    "mid": ["corridor", "window", "iris"],
    "high": ["iris", "corridor", "macro"],
}

# A shot with no camera move only reads if the set itself moves. `window` had
# almost no internal motion, so pairing it with `static` produced a 4-second
# ending at 1/5 the normal frame difference — the film stopped before it ended.
# The order matters on purpose: `static` is available, but only after the moves
# that keep the frame alive.
CAMERAS = {
    "wide-horizon": ["push", "trackRight", "static"],
    "corridor": ["trackRight", "push", "trackLeft"],
    "window": ["handheld", "push", "static"],
    "iris": ["pull", "push", "static"],
    "macro": ["push", "craneUp", "handheld"],
}

CUES = {
    "wide-horizon": ["paper-rise.wav", 0.05],
    "corridor": ["curtain-split.wav", 0.045],
    "window": ["chime.wav", 0.04],
    "iris": ["shimmer.wav", 0.038],
    "macro": ["glint.wav", 0.04],
}

# What each archetype is allowed to change between two songs. A slot the
# director never varies is a hard-coded scene wearing a parameter's name.
SUBJECTS = {
    "wide-horizon": ["singer", "boat", "ridge"],
    "corridor": ["walker", "couple", "lone"],
    "window": ["figure", "watcher", "absent"],
    "iris": ["memory", "home", "two"],
    "macro": ["flower", "letter", "cup"],
}

METAPHORS = {
    "intro": ["before", "hush", "distance"],
    "verse": ["distance", "waiting", "small"],
    "bridge": ["turning", "slipping", "almost"],
    "chorus": ["shatter", "rise", "flood"],
    "outro": ["after", "settle", "echo"],
}


def phrase_cut_bars(
    phrases: list[dict[str, Any]], bar_starts: list[float], tolerance: float = 1.2
) -> list[int]:
    """Bar indices where a sung phrase ends.

    v1 cut purely on bar counts, so a shot could start or stop in the middle of
    a line. `phrases` was computed by song_facts.py and then ignored. These are
    the bar lines that agree with a phrase end, within `tolerance` seconds.
    """
    if not phrases or not bar_starts:
        return []
    found: set[int] = set()
    for phrase in phrases:
        target = float(phrase["end"])
        best_index, best_delta = -1, float("inf")
        for index, start in enumerate(bar_starts):
            delta = abs(start - target)
            if delta < best_delta:
                best_index, best_delta = index, delta
        if best_index >= 0 and best_delta <= tolerance:
            found.add(best_index)
    return sorted(found)


def snap_to_phrase(
    end_bar: int, cursor: int, phrase_bars: list[int], min_bars: int, total: int
) -> int:
    """Pull a shot end onto a phrase end when one is within one bar."""
    if not phrase_bars or end_bar >= total:
        return end_bar
    nearest = min(phrase_bars, key=lambda b: abs(b - end_bar))
    if abs(nearest - end_bar) <= 1 and nearest - cursor >= min_bars:
        return nearest
    return end_bar


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def tier(energy: float, label: str) -> str:
    if label in {"intro", "outro"}:
        return "low"
    if energy >= 0.62:
        return "high"
    if energy <= 0.35:
        return "low"
    return "mid"


def choose_bars(energy: float, label: str, remaining: int) -> int:
    if remaining <= 2:
        return max(1, remaining)
    if label in {"intro", "outro"}:
        size = 4
    elif energy >= 0.62:
        size = 2
    elif energy <= 0.35:
        size = 4
    else:
        size = 2 if remaining % 4 == 0 else 4
    if remaining - size == 1:
        size += 1
    return max(1, min(size, remaining))


def pick_archetype(
    pool: list[str],
    previous: str,
    history: list[str],
    used: set[str],
) -> str:
    fresh = [name for name in pool if name not in used and name != previous]
    if fresh:
        return fresh[0]
    candidates = [name for name in pool if name != previous] or pool
    for name in candidates:
        if history[-2:] != [name, name]:
            return name
    return candidates[0]


def bar_start_index(bars: list[dict[str, Any]], start: float) -> int:
    for index, bar in enumerate(bars):
        if abs(float(bar["start"]) - start) < 0.02:
            return index
    return min(range(len(bars)), key=lambda i: abs(float(bars[i]["start"]) - start))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("song", type=Path)
    parser.add_argument("--out", type=Path, default=Path("shots.json"))
    parser.add_argument("--storyboard", type=Path)
    parser.add_argument("--emit-ts", type=Path)
    parser.add_argument("--min-shot-bars", type=int, default=1)
    parser.add_argument(
        "--no-phrase-snap",
        action="store_true",
        help="ignore lyric phrase ends when choosing cut points",
    )
    args = parser.parse_args()

    song = json.loads(args.song.read_text(encoding="utf-8"))
    bars = song.get("bars", [])
    if not bars:
        raise SystemExit("song.json has no bars; run song_facts.py first")

    bar_starts = [float(bar["start"]) for bar in bars]
    body_end = float(song["bodyEnd"])
    lyrics = song.get("lyrics", [])
    sections = song.get("sections", [])
    beat_features = song.get("beatFeatures", [])
    phrases = song.get("phrases", [])
    phrase_bars = [] if args.no_phrase_snap else phrase_cut_bars(phrases, bar_starts)

    shots: list[dict[str, Any]] = []
    previous = ""
    history: list[str] = []
    used_archetypes: set[str] = set()
    shot_index = 0

    for section_index, section in enumerate(sections):
        level = tier(float(section["energy"]), str(section["label"]))
        pool = ARCHETYPE_POOLS[level]
        cursor = bar_start_index(bars, float(section["start"]))
        remaining = int(section["bars"])

        while remaining > 0:
            size = choose_bars(float(section["energy"]), str(section["label"]), remaining)
            size = max(args.min_shot_bars, size)
            size = min(size, remaining)
            end_bar = min(cursor + size, len(bars))
            # Prefer ending where the singer ends a phrase. Falls back to the
            # bar-count decision when no phrase end is close.
            snapped = snap_to_phrase(
                end_bar, cursor, phrase_bars, args.min_shot_bars, len(bars)
            )
            # A snap must always advance the cursor, or this loop never ends.
            end_bar = snapped if snapped > cursor else min(cursor + max(1, size), len(bars))
            if end_bar <= cursor:
                break
            start = bar_starts[cursor]
            end = body_end if end_bar >= len(bars) else bar_starts[end_bar]
            if end - start < 0.35:
                break

            archetype = pick_archetype(pool, previous, history, used_archetypes)
            camera = CAMERAS[archetype][shot_index % len(CAMERAS[archetype])]
            palette = PALETTES[shot_index % len(PALETTES)]
            if shots and palette == shots[-1]["palette"]:
                palette = PALETTES[(shot_index + 1) % len(PALETTES)]
            energy = float(section["energy"])
            subject_pool = SUBJECTS[archetype]
            subject = subject_pool[shot_index % len(subject_pool)]
            label = str(section["label"])
            metaphor_pool = METAPHORS.get(label, METAPHORS["verse"])
            metaphor = metaphor_pool[shot_index % len(metaphor_pool)]
            # Composition slots: normalised, so a 9:16 render can re-lay the
            # same shot instead of being a scale of the 16:9 one.
            seed_value = 100 + shot_index * 17
            composition = {
                "focus": round(0.32 + ((seed_value % 7) / 7) * 0.36, 3),
                "horizon": round(0.58 + ((seed_value % 5) / 5) * 0.16, 3),
                "density": round(clamp(energy * 0.8 + 0.1, 0.15, 0.95), 3),
            }
            shot_lyrics = [
                line["text"]
                for line in lyrics
                if float(line["start"]) < end and float(line["end"]) > start
            ]
            cue_file, cue_volume = CUES[archetype]
            # Chorus hits harder: same archetype, more intensity, denser frame.
            boost = 0.12 if label == "chorus" else 0.0
            shots.append(
                {
                    "id": f"{shot_index + 1:02d}-{archetype}",
                    "archetype": archetype,
                    "start": round(start, 4),
                    "duration": round(end - start, 4),
                    "bars": end_bar - cursor,
                    "palette": palette,
                    "camera": camera,
                    "intensity": round(
                        clamp(energy * 1.05 + 0.1 + boost, 0.25, 0.98), 4
                    ),
                    "seed": seed_value,
                    "section": label,
                    "energy": round(energy, 4),
                    "subject": subject,
                    "metaphor": metaphor,
                    "composition": composition,
                    "lyrics": shot_lyrics,
                    "sfx": {"t": round(start, 4), "file": cue_file, "volume": cue_volume},
                }
            )
            previous = archetype
            used_archetypes.add(archetype)
            history.append(archetype)
            shot_index += 1
            remaining = int(section["bars"]) - (
                end_bar - bar_start_index(bars, float(section["start"]))
            )
            cursor = end_bar
            if remaining <= 0:
                break

    if not shots:
        raise SystemExit("director produced no shots")

    # Ensure the last shot really ends at the body end.
    shots[-1]["duration"] = round(body_end - float(shots[-1]["start"]), 4)

    # The bar grid starts on a downbeat, which may be after 0. Lead in from 0
    # so the render never begins on a black frame.
    if float(shots[0]["start"]) > 0.001:
        lead = float(shots[0]["start"])
        shots[0]["start"] = 0.0
        shots[0]["duration"] = round(float(shots[0]["duration"]) + lead, 4)
        if "sfx" in shots[0]:
            shots[0]["sfx"]["t"] = 0.0

    payload = {
        "title": args.song.stem,
        "fps": song.get("fps", 30),
        "width": song.get("width", 1920),
        "height": song.get("height", 1080),
        "duration": round(body_end, 4),
        "bps": song.get("tempo", {}).get("bpm"),
        "meter": song.get("meter", 4),
        "shots": shots,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    if args.storyboard:
        lines = [
            f"# {payload['title']} · auto storyboard",
            "",
            f"- {payload['width']}x{payload['height']} / {payload['fps']}fps / {body_end:.2f}s",
            f"- BPM {payload['bps']} / {payload['meter']}/4 / {len(shots)} shots",
            "- 切点全部来自小节线（song.json），不是估拍。",
            "",
            "| # | 时间 | 小节 | 构图 | 色板 | 运镜 | 能量 | 歌词 |",
            "|---:|---|---:|---|---|---|---:|---|",
        ]
        for shot in shots:
            lyric = " / ".join(shot["lyrics"])[:52]
            lines.append(
                f"| {shot['id']} | {shot['start']:.2f}–{shot['start'] + shot['duration']:.2f}s "
                f"| {shot['bars']} | {shot['archetype']} | {shot['palette']} "
                f"| {shot['camera']} | {shot['energy']:.2f} | {lyric} |"
            )
        lines += [
            "",
            "## 审查点",
            "",
            "1. 相邻两镜构图轴是否真的不同",
            "2. 副歌镜头是否比主歌更短、更亮",
            "3. 每镜是否有且只有一个 hero motion",
            "4. 歌词是否落在镜头安全区内",
            "",
        ]
        args.storyboard.write_text("\n".join(lines), encoding="utf-8")

    if args.emit_ts:
        spec = [
            {
                key: shot[key]
                for key in (
                    "id",
                    "archetype",
                    "start",
                    "duration",
                    "palette",
                    "camera",
                    "intensity",
                    "seed",
                    "subject",
                    "metaphor",
                    "composition",
                )
            }
            for shot in shots
        ]
        audio_name = Path(song["audio"]).name if song.get("audio") else None
        audio_asset = f"audio/{audio_name}" if audio_name else None
        lyric_rows = [
            {
                "start": row["start"],
                "end": row["end"],
                "text": row["text"],
                "gapAfter": row.get("gapAfter", 0.0),
            }
            for row in song.get("lyrics", [])
        ]
        # Measured accents go to the renderer. Without this the picture is on the
        # grid but deaf: every beat decays identically regardless of what hit.
        meter = int(song.get("meter", 4))
        marks = [
            {
                "t": row["t"],
                "strength": row.get("strength", 0.5),
                "low": row.get("low", 0.5),
                "flux": row.get("flux", 0.4),
                "downbeat": bool(row.get("isDownbeat", False)),
                "beatInBar": int(row.get("beatInBar", 0)),
                "section": row.get("section", "verse"),
                "sectionEnergy": row.get("sectionEnergy", 0.0),
            }
            for row in song.get("beatFeatures", [])
        ]
        # SFX cues were written into shots.json and then never reached the
        # renderer. Export them so the film can actually play its paper sounds.
        sfx_cues = [
            {
                "t": shot["sfx"]["t"],
                "file": shot["sfx"]["file"],
                "volume": shot["sfx"]["volume"],
            }
            for shot in shots
            if "sfx" in shot and shot["sfx"]
        ]
        text = (
            "// AUTO-GENERATED by direct.py. Do not edit by hand.\n"
            'import type {ShotSpec} from "../engine/Shot";\n\n'
            f"export const BEATS: number[] = {json.dumps(song.get('beats', []))};\n\n"
            "export type BeatMark = {\n"
            "  t: number;\n"
            "  strength: number;\n"
            "  low: number;\n"
            "  flux: number;\n"
            "  downbeat: boolean;\n"
            "  beatInBar: number;\n"
            "  section: string;\n"
            "  sectionEnergy: number;\n"
            "};\n\n"
            f"export const METER = {meter};\n\n"
            f"export const MARKS: BeatMark[] = {json.dumps(marks, indent=2)};\n\n"
            "export type SfxCue = {t: number; file: string; volume: number};\n\n"
            f"export const SFX: SfxCue[] = {json.dumps(sfx_cues, ensure_ascii=False, indent=2)};\n\n"
            f"export const AUDIO: string | null = {json.dumps(audio_asset)};\n\n"
            "export type LyricRow = {start: number; end: number; text: string; gapAfter: number};\n\n"
            f"export const LYRICS: LyricRow[] = {json.dumps(lyric_rows, ensure_ascii=False, indent=2)};\n\n"
            f"export const SONG_META = {json.dumps({k: payload[k] for k in ('title','fps','width','height','duration','bps','meter')}, ensure_ascii=False, indent=2)} as const;\n\n"
            f"export const SHOTS: ShotSpec[] = {json.dumps(spec, ensure_ascii=False, indent=2)};\n"
        )
        args.emit_ts.parent.mkdir(parents=True, exist_ok=True)
        args.emit_ts.write_text(text, encoding="utf-8")

    print(
        json.dumps(
            {
                "shots": len(shots),
                "archetypes": sorted({s["archetype"] for s in shots}),
                "out": str(args.out),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
