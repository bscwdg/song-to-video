#!/usr/bin/env python3
"""Generate a deterministic 32s test track for the v2 pipeline.

Not music: a click/pad bed with four energy sections, used to prove that
song_facts -> direct -> Remotion works end to end without shipping audio.
"""

from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np

SR = 22050
BPM = 100.0
BEAT = 60.0 / BPM
BAR = BEAT * 4
BARS = 13
DURATION = BARS * BAR

t = np.arange(int(DURATION * SR)) / SR
mix = np.zeros_like(t)
rng = np.random.default_rng(1701)


def add(start: float, signal: np.ndarray) -> None:
    i0 = int(start * SR)
    n = min(len(signal), len(mix) - i0)
    if n > 0:
        mix[i0 : i0 + n] += signal[:n]


for beat in range(BARS * 4):
    start = beat * BEAT
    tt = np.arange(int(0.24 * SR)) / SR
    kick = np.sin(2 * np.pi * (46 + 34 * np.exp(-tt * 18)) * tt) * np.exp(-tt * 16)
    add(start, kick * 0.85)

    if beat % 4 in (1, 3):
        noise = rng.normal(0, 1, int(0.16 * SR))
        snare = noise * np.exp(-np.arange(len(noise)) / SR * 24) * 0.28
        add(start, snare)

    for half in (0.0, 0.5):
        hat_t = np.arange(int(0.05 * SR)) / SR
        hat = rng.normal(0, 1, len(hat_t)) * np.exp(-hat_t * 70) * 0.06
        add(start + half * BEAT, hat)

chords = [
    [220.0, 277.18, 329.63],
    [196.0, 246.94, 293.66],
    [174.61, 220.0, 261.63],
    [146.83, 185.0, 220.0],
]
melody = [440.0, 523.25, 659.25, 587.33, 523.25, 440.0, 392.0, 349.23]

for bar in range(BARS):
    section = 0 if bar < 4 else 1 if bar < 8 else 2 if bar < 12 else 3
    start = bar * BAR
    tt = np.arange(int(BAR * SR)) / SR
    env = np.minimum(1.0, tt / 0.08) * np.minimum(1.0, (BAR - tt) / 0.12)
    gain = [0.16, 0.24, 0.32, 0.18][section]
    for freq in chords[section]:
        mix_segment = (
            np.sin(2 * np.pi * freq * tt) * 0.5
            + np.sin(2 * np.pi * freq * 2.002 * tt) * 0.12
        ) * env * gain
        add(start, mix_segment)

    if section in (1, 2):
        note = melody[bar % len(melody)]
        lead = np.sin(2 * np.pi * note * tt) * env * (0.10 if section == 2 else 0.06)
        add(start, lead)

fade = np.ones_like(mix)
fade[: int(0.3 * SR)] = np.linspace(0, 1, int(0.3 * SR))
fade[-int(0.8 * SR) :] = np.linspace(1, 0, int(0.8 * SR))
mix *= fade
mix /= max(np.max(np.abs(mix)), 1e-9) * 1.15
stereo = np.column_stack([mix, np.roll(mix, 13) * 0.96])
pcm = np.int16(np.clip(stereo, -1, 1) * 32767)

out = Path(__file__).resolve().parents[1] / "public" / "audio" / "test.wav"
out.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(out), "wb") as handle:
    handle.setnchannels(2)
    handle.setsampwidth(2)
    handle.setframerate(SR)
    handle.writeframes(pcm.tobytes())
print(f"{out} · {DURATION:.2f}s · {BPM:.0f} BPM · {BARS} bars")
