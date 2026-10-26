#!/usr/bin/env python3
"""v2 song facts: beats, downbeats, bars, sections, energy, lyric phrasing.

This is the layer the v1 pipeline was missing. It does not render anything;
it produces `song.json`, which the director turns into `shots.json`.

Example:
  python song_facts.py song.mp3 --lrc lyrics.lrc --out song.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import librosa
import numpy as np

REPO = Path(__file__).resolve().parents[3]
SKILL_SCRIPTS = REPO / "skills" / "papercut-mv" / "scripts"
if str(SKILL_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SKILL_SCRIPTS))

from analyze_track import estimate_body_end, parse_lrc


def parse_lrc_lines(path: Path | None, body_end: float) -> list[dict[str, Any]]:
    if path is None:
        return []
    rows = [r for r in parse_lrc(path) if 0 <= float(r["t"]) < body_end]
    lines: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        start = float(row["t"])
        next_start = float(rows[index + 1]["t"]) if index + 1 < len(rows) else body_end
        end = min(next_start, start + 4.8, body_end)
        end = max(start + 0.25, end)
        if next_start - start >= 0.25:
            end = min(end, next_start - 0.02)
        lines.append(
            {
                "start": round(start, 4),
                "end": round(max(start + 0.1, end), 4),
                "text": str(row["text"]),
                "gapAfter": round(max(0.0, next_start - end), 4),
            }
        )
    return lines


def phrase_groups(lines: list[dict[str, Any]], gap: float = 1.15) -> list[dict[str, Any]]:
    if not lines:
        return []
    phrases: list[dict[str, Any]] = []
    start = float(lines[0]["start"])
    count = 1
    for previous, current in zip(lines, lines[1:]):
        if float(current["start"]) - float(previous["end"]) >= gap:
            phrases.append(
                {
                    "start": round(start, 4),
                    "end": round(float(previous["end"]), 4),
                    "lines": count,
                }
            )
            start = float(current["start"])
            count = 1
        else:
            count += 1
    phrases.append(
        {
            "start": round(start, 4),
            "end": round(float(lines[-1]["end"]), 4),
            "lines": count,
        }
    )
    return phrases


def frame_features(y: np.ndarray, sr: int, hop: int) -> dict[str, np.ndarray]:
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
    stft = np.abs(librosa.stft(y, n_fft=1024, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=1024)
    low = stft[(freqs >= 30) & (freqs < 200)].sum(axis=0)
    mid = stft[(freqs >= 200) & (freqs < 2000)].sum(axis=0)
    high = stft[freqs >= 2000].sum(axis=0)
    flux = np.concatenate([[0.0], np.maximum(0.0, np.diff(stft, axis=1)).sum(axis=0)])

    def norm(values: np.ndarray) -> np.ndarray:
        peak = float(np.max(values)) if len(values) else 0.0
        return values / peak if peak > 1e-9 else np.zeros_like(values)

    return {
        "rms": norm(rms),
        "low": norm(low),
        "mid": norm(mid),
        "high": norm(high),
        "flux": norm(flux),
    }


def sample(values: np.ndarray, times: np.ndarray, sr: int, hop: int) -> np.ndarray:
    if len(values) == 0:
        return np.zeros_like(times, dtype=float)
    index = np.clip(np.round(times * sr / hop).astype(int), 0, len(values) - 1)
    return values[index]


def estimate_meter(
    low: np.ndarray,
    beat_index: np.ndarray,
    candidates: tuple[int, ...] = (4, 3),
) -> tuple[int, int, float]:
    """Pick the bar length and phase whose beat carries the strongest low-end."""
    best = (4, 0, 0.0)
    global_std = float(np.std(low[beat_index])) or 1e-9
    for meter in candidates:
        for phase in range(meter):
            idx = beat_index[phase::meter]
            if len(idx) < 3:
                continue
            score = float(np.mean(low[idx]))
            contrast = score / global_std
            if contrast > best[2]:
                best = (meter, phase, contrast)
    return best


def tempo_octave_check(
    y: np.ndarray,
    sr: int,
    hop: int,
    bpm: float,
    body_end: float,
    margin: float = 1.35,
) -> dict[str, Any]:
    """Is the detected BPM the real beat, or a half/double-tempo mistake?

    librosa.beat_track regularly locks onto the subdivision. money-girl reported
    161.499 BPM with 7-9 beat shots — the signature of a half-tempo grid read at
    double speed. v1 just divided by two and printed it; nothing verified.

    Salience is measured on a tempogram: the mean tempo salience curve across
    the whole track. If the energy peak sits at half the detected tempo, we are
    counting subdivisions, not beats. Requiring a `margin` before flipping keeps
    genuinely fast songs from being slowed down by noise.
    """
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    if len(onset_env) < 8:
        return {"octave": "same", "reason": "too-short", "salience": {}}

    tempogram = librosa.feature.tempogram(
        onset_envelope=onset_env, sr=sr, hop_length=hop
    )
    bpms = librosa.tempo_frequencies(tempogram.shape[0], sr=sr, hop_length=hop)
    salience = np.mean(tempogram, axis=1)

    def at(target: float) -> float:
        if target <= 0:
            return 0.0
        index = int(np.argmin(np.abs(bpms - target)))
        return float(salience[index])

    half = bpm / 2.0
    double = bpm * 2.0
    s_half, s_same, s_double = at(half), at(bpm), at(double)
    total = max(s_half + s_same + s_double, 1e-9)

    octave = "same"
    reason = "salience-agrees"
    if s_half > s_same * margin and s_half >= s_double:
        octave, reason = "half", "salience-favours-half"
    elif s_double > s_same * margin and s_double > s_half:
        octave, reason = "double", "salience-favours-double"

    # Independent witness: do the detected beats actually land on onsets?
    onset_times = librosa.frames_to_time(
        np.arange(len(onset_env)), sr=sr, hop_length=hop
    )
    grid = np.arange(0.0, body_end, 60.0 / max(bpm, 1e-6))
    if len(grid) and len(onset_times):
        hits = 0
        for t in grid:
            near = onset_env[(onset_times >= t - 0.03) & (onset_times <= t + 0.03)]
            if len(near) and float(np.max(near)) > float(np.percentile(onset_env, 55)):
                hits += 1
        coverage = hits / len(grid)
    else:
        coverage = 0.0

    return {
        "octave": octave,
        "reason": reason,
        "confidence": round(max(s_half, s_same, s_double) / total, 4),
        "beatCoverage": round(float(coverage), 4),
        "salience": {
            "half": round(s_half / total, 4),
            "same": round(s_same / total, 4),
            "double": round(s_double / total, 4),
        },
        "halfBpm": round(half, 4),
        "doubleBpm": round(double, 4),
    }


def decimate_beats(
    beat_times: np.ndarray,
    low: np.ndarray,
    beat_index: np.ndarray,
) -> np.ndarray:
    """Keep every second beat, choosing the phase with the strongest low end.

    If the grid is a subdivision, the true beats are a subset — not a new
    estimate. Subsampling preserves the measured positions exactly, so every
    beat stays on a real onset instead of being re-guessed.
    """
    if len(beat_times) < 4:
        return beat_times
    best_phase, best_score = 0, -1.0
    for phase in (0, 1):
        idx = beat_index[phase::2]
        if len(idx) < 2:
            continue
        score = float(np.mean(low[idx]))
        if score > best_score:
            best_phase, best_score = phase, score
    return beat_times[best_phase::2]


def beat_strengths(
    low: np.ndarray,
    flux: np.ndarray,
    rms: np.ndarray,
    beat_index: np.ndarray,
    is_downbeat: list[bool],
) -> list[float]:
    """How hard does this beat actually hit? 0 = empty, 1 = the loudest in the song.

    v1 only had `beats[]`, so every beat drove the same visual decay. This turns
    the per-beat spectrum into one scalar the renderer can scale amplitude by.
    Low end dominates (kick/bass), flux carries transients, rms keeps quiet
    sections from reading as accents.
    """
    raw = np.zeros(len(beat_index), dtype=float)
    for position, index in enumerate(beat_index):
        raw[position] = (
            float(low[index]) * 0.45
            + float(flux[index]) * 0.30
            + float(rms[index]) * 0.25
        )
    if len(raw) == 0:
        return []
    low_ref = float(np.percentile(raw, 8))
    high_ref = float(np.percentile(raw, 92))
    span = max(high_ref - low_ref, 1e-6)
    strengths: list[float] = []
    for position, value in enumerate(raw):
        strength = (float(value) - low_ref) / span
        strength = max(0.0, min(1.0, strength))
        # A downbeat is an edit point: mark it even when the low end is soft.
        if is_downbeat[position]:
            strength = min(1.0, strength * 1.22 + 0.08)
        strengths.append(round(strength, 4))
    return strengths


def estimate_sections(
    bar_energy: list[float],
    bar_chroma: list[list[float]],
    bar_times: list[float],
    body_end: float,
) -> list[dict[str, Any]]:
    count = len(bar_energy)
    if count <= 1:
        return [
            {
                "start": 0.0,
                "end": round(body_end, 4),
                "bars": max(1, count),
                "energy": round(float(bar_energy[0]) if bar_energy else 0.0, 4),
                "label": "verse",
            }
        ]

    values = np.asarray(bar_energy, dtype=float)
    peak = float(np.max(values)) or 1e-9
    padded = np.convolve(values, np.ones(3) / 3, mode="same") if count >= 3 else values
    energy_delta = np.abs(np.diff(padded)) / peak

    chroma = np.asarray(bar_chroma, dtype=float)
    chroma_delta = []
    for before, after in zip(chroma, chroma[1:]):
        denom = float(np.linalg.norm(before) * np.linalg.norm(after))
        chroma_delta.append(1.0 - float(np.dot(before, after)) / denom if denom > 1e-9 else 0.0)
    chroma_delta = np.asarray(chroma_delta)
    if len(chroma_delta) != len(energy_delta):
        chroma_delta = np.resize(chroma_delta, len(energy_delta))

    novelty = energy_delta * 0.55 + chroma_delta * 0.45
    threshold = max(0.055, float(np.percentile(novelty, 68))) if len(novelty) else 1.0

    cuts = [0]
    for index in range(1, count):
        if novelty[index - 1] >= threshold and index - cuts[-1] >= 2:
            cuts.append(index)
    cuts.append(count)
    if len(cuts) > 7:
        strengths = [(novelty[c - 1], c) for c in cuts[1:-1]]
        keep = sorted(c for _, c in sorted(strengths, reverse=True)[:5])
        cuts = [0] + keep + [count]

    sections: list[dict[str, Any]] = []
    for index, (start_bar, end_bar) in enumerate(zip(cuts, cuts[1:])):
        energy = float(np.mean(padded[start_bar:end_bar])) / peak
        start = 0.0 if start_bar == 0 else bar_times[start_bar]
        end = body_end if end_bar == count else bar_times[end_bar]
        if index == 0 and (end - start) < body_end * 0.35:
            label = "intro"
        elif end_bar == count and start > body_end * 0.8:
            label = "outro"
        elif energy >= 0.66:
            label = "chorus"
        elif energy <= 0.4:
            label = "verse"
        else:
            label = "bridge"
        sections.append(
            {
                "start": round(float(start), 4),
                "end": round(float(end), 4),
                "bars": int(end_bar - start_bar),
                "energy": round(energy, 4),
                "label": label,
            }
        )
    return sections


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--lrc", type=Path)
    parser.add_argument("--out", type=Path, default=Path("song.json"))
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--sr", type=int, default=22050)
    parser.add_argument("--body-end", type=float)
    parser.add_argument(
        "--tempo-mode",
        choices=("auto", "keep"),
        default="auto",
        help="auto: halve the grid when salience says it is a subdivision; keep: trust librosa",
    )
    args = parser.parse_args()

    y, sr = librosa.load(args.audio, sr=args.sr, mono=True)
    duration = len(y) / sr
    if duration <= 0:
        raise SystemExit("audio is empty")

    hop = 512
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    active = rms[rms > np.percentile(rms, 40)]
    threshold = float(np.percentile(active, 25) * 0.12) if len(active) else 1e-5
    body_end, body_method = estimate_body_end(rms_times, rms, threshold, duration)
    if args.body_end is not None:
        body_end = min(args.body_end, duration)
        body_method = "cli"

    tempo, beat_times = librosa.beat.beat_track(y=y, sr=sr, units="time", trim=False)
    bpm = float(np.asarray(tempo).reshape(-1)[0])
    beat_times = np.asarray(
        [float(t) for t in beat_times if 0 <= float(t) <= body_end + 0.001],
        dtype=float,
    )
    if not np.isfinite(bpm) or bpm <= 0 or len(beat_times) < 2:
        bpm = 120.0
        beat_times = np.arange(0.0, body_end, 60.0 / bpm)

    intervals = np.diff(beat_times)
    beat_confidence = float(
        max(0.0, 1.0 - (np.std(intervals) / max(np.mean(intervals), 1e-6)))
    )

    features = frame_features(y, sr, hop)

    # Octave check runs before anything derives a grid from bpm.
    detected_bpm = bpm
    octave = tempo_octave_check(y, sr, hop, bpm, body_end)
    if args.tempo_mode == "keep":
        octave["octave"] = "same"
        octave["reason"] = "mode-keep"
    if octave["octave"] == "half":
        probe_index = np.clip(
            np.round(beat_times * sr / hop).astype(int), 0, len(features["low"]) - 1
        )
        reduced = decimate_beats(beat_times, features["low"], probe_index)
        if len(reduced) >= 2:
            beat_times = reduced
            bpm = bpm / 2.0
    elif octave["octave"] == "double":
        # Do not invent subdivisions: keep the measured grid, but record the doubt.
        octave["reason"] = "salience-favours-double-kept-grid"

    if len(beat_times) >= 2:
        intervals = np.diff(beat_times)
        beat_confidence = float(
            max(0.0, 1.0 - (np.std(intervals) / max(np.mean(intervals), 1e-6)))
        )
    y_harm = librosa.effects.hpss(y)[0]
    harm_rms = librosa.feature.rms(y=y_harm, frame_length=2048, hop_length=hop)[0]
    harm_peak = float(np.max(harm_rms)) if len(harm_rms) else 0.0
    harm_rms = harm_rms / harm_peak if harm_peak > 1e-9 else np.zeros_like(harm_rms)
    chroma = librosa.feature.chroma_cqt(y=y_harm, sr=sr, hop_length=hop)

    beat_index = np.clip(
        np.round(beat_times * sr / hop).astype(int), 0, len(features["rms"]) - 1
    )
    meter, phase, meter_score = estimate_meter(features["low"], beat_index)

    downbeats = [
        round(float(beat_times[i]), 4)
        for i in range(phase, len(beat_times), meter)
    ]
    bar_times = downbeats
    bar_energy: list[float] = []
    bar_chroma: list[list[float]] = []
    for bar_index, start_beat in enumerate(range(phase, len(beat_times), meter)):
        end_beat = min(start_beat + meter, len(beat_times))
        bar_energy.append(float(np.mean(harm_rms[beat_index[start_beat:end_beat]])))
        bar_start = bar_times[bar_index]
        bar_end = bar_times[bar_index + 1] if bar_index + 1 < len(bar_times) else body_end
        frame_from = int(np.clip(bar_start * sr / hop, 0, chroma.shape[1] - 1))
        frame_to = int(np.clip(bar_end * sr / hop, frame_from + 1, chroma.shape[1]))
        bar_chroma.append(np.mean(chroma[:, frame_from:frame_to], axis=1).tolist())

    downbeat_flags = [
        index >= phase and (index - phase) % meter == 0 for index in range(len(beat_times))
    ]
    strengths = beat_strengths(
        features["low"], features["flux"], features["rms"], beat_index, downbeat_flags
    )

    beat_features: list[dict[str, Any]] = []
    for index, time in enumerate(beat_times):
        sample_index = int(beat_index[index])
        beat_features.append(
            {
                "t": round(float(time), 4),
                "bar": int((index - phase) // meter) if index >= phase else 0,
                "beatInBar": int((index - phase) % meter) if index >= phase else 0,
                "isDownbeat": downbeat_flags[index],
                "rms": round(float(features["rms"][sample_index]), 4),
                "low": round(float(features["low"][sample_index]), 4),
                "mid": round(float(features["mid"][sample_index]), 4),
                "high": round(float(features["high"][sample_index]), 4),
                "flux": round(float(features["flux"][sample_index]), 4),
                "strength": strengths[index],
            }
        )

    sections = estimate_sections(bar_energy, bar_chroma, bar_times, body_end)

    # Tag every beat with the section it belongs to. Without this the renderer
    # cannot tell a verse beat from a chorus beat, so "the chorus should hit
    # harder" stays a note in a markdown file instead of a render decision.
    def section_at(t: float) -> dict[str, Any] | None:
        for section in sections:
            if float(section["start"]) - 1e-6 <= t < float(section["end"]) + 1e-6:
                return section
        return sections[-1] if sections else None

    for row in beat_features:
        owner = section_at(float(row["t"]))
        row["section"] = owner["label"] if owner else "verse"
        row["sectionEnergy"] = round(float(owner["energy"]), 4) if owner else 0.0

    lyrics = parse_lrc_lines(args.lrc, body_end)
    phrases = phrase_groups(lyrics)

    payload = {
        "audio": str(args.audio),
        "duration": round(duration, 4),
        "bodyEnd": round(body_end, 4),
        "bodyEndMethod": body_method,
        "fps": args.fps,
        "width": args.width,
        "height": args.height,
        "tempo": {
            "bpm": round(bpm, 4),
            "detectedBpm": round(detected_bpm, 4),
            "halfTempoBpm": round(bpm / 2, 4),
            "beatSeconds": round(60.0 / bpm, 6),
            "confidence": round(beat_confidence, 4),
            "octave": octave.get("octave", "same"),
            "octaveReason": octave.get("reason", ""),
            "octaveConfidence": octave.get("confidence", 0.0),
            "beatCoverage": octave.get("beatCoverage", 0.0),
            "salience": octave.get("salience", {}),
        },
        "meter": meter,
        "downbeatPhase": phase,
        "strengthMean": round(float(np.mean(strengths)) if strengths else 0.0, 4),
        "meterScore": round(meter_score, 4),
        "beats": [round(float(t), 4) for t in beat_times],
        "downbeats": downbeats,
        "bars": [
            {
                "index": index,
                "start": round(float(time), 4),
                "energy": round(bar_energy[index], 4),
            }
            for index, time in enumerate(bar_times)
        ],
        "beatFeatures": beat_features,
        "sections": sections,
        "lyrics": lyrics,
        "phrases": phrases,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    summary = {
        "body_end": payload["bodyEnd"],
        "bpm": payload["tempo"]["bpm"],
        "beat_confidence": payload["tempo"]["confidence"],
        "meter": meter,
        "beats": len(beat_times),
        "downbeats": len(downbeats),
        "sections": [
            f"{s['label']} {s['start']:.2f}-{s['end']:.2f} ({s['bars']} bars)"
            for s in sections
        ],
        "lyrics": len(lyrics),
        "phrases": len(phrases),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
