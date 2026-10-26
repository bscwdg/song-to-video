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
from pathlib import Path
from typing import Any

import librosa
import numpy as np

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

    beat_features: list[dict[str, Any]] = []
    for index, time in enumerate(beat_times):
        sample_index = int(beat_index[index])
        beat_features.append(
            {
                "t": round(float(time), 4),
                "bar": int((index - phase) // meter) if index >= phase else 0,
                "beatInBar": int((index - phase) % meter) if index >= phase else 0,
                "isDownbeat": index >= phase and (index - phase) % meter == 0,
                "rms": round(float(features["rms"][sample_index]), 4),
                "low": round(float(features["low"][sample_index]), 4),
                "mid": round(float(features["mid"][sample_index]), 4),
                "high": round(float(features["high"][sample_index]), 4),
                "flux": round(float(features["flux"][sample_index]), 4),
            }
        )

    sections = estimate_sections(bar_energy, bar_chroma, bar_times, body_end)
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
            "halfTempoBpm": round(bpm / 2, 4),
            "beatSeconds": round(60.0 / bpm, 6),
            "confidence": round(beat_confidence, 4),
        },
        "meter": meter,
        "downbeatPhase": phase,
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
