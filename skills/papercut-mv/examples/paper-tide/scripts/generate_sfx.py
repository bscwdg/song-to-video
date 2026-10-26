"""Synthesize the small diegetic sound-design layer for the paper-cut MV.

Everything is generated from deterministic noise and sine partials so the
sound effects stay original, reproducible, and lightweight.
"""

from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np


SR = 44_100
# Default output stays inside the skill package; --out-dir lets a project (e.g.
# examples/v2-lab) receive the cues so the film can actually play them.
OUT = Path(__file__).resolve().parents[1] / "public" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(2600)


def envelope(n: int, attack: float, decay: float, release: float) -> np.ndarray:
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    d = max(1, n - a - r)
    env = np.ones(n, dtype=np.float64)
    env[:a] = np.linspace(0.0, 1.0, a, endpoint=False) ** 1.7
    env[a : a + d] = np.linspace(1.0, 0.55, d, endpoint=False) ** decay
    env[a + d :] = np.linspace(0.55, 0.0, r) ** 2.2
    return env


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    alpha = 1.0 - math.exp(-2.0 * math.pi * cutoff / SR)
    out = np.empty_like(x)
    acc = 0.0
    for i, value in enumerate(x):
        acc += alpha * (value - acc)
        out[i] = acc
    return out


def highpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    return x - lowpass(x, cutoff)


def save(name: str, mono: np.ndarray, peak: float = 0.4) -> None:
    mono = np.nan_to_num(mono)
    mono = mono / max(np.max(np.abs(mono)), 1e-9)
    mono *= peak
    stereo = np.column_stack([mono, np.roll(mono, 7) * 0.94])
    pcm = np.int16(np.clip(stereo, -1.0, 1.0) * 32767.0)
    with wave.open(str(OUT / name), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def paper_rise() -> None:
    n = int(0.34 * SR)
    t = np.arange(n) / SR
    noise = highpass(RNG.normal(0.0, 1.0, n), 900)
    flutter = np.sin(2 * np.pi * (5.0 + 6.0 * t) * t) * 0.35 + 0.65
    body = lowpass(RNG.normal(0.0, 0.7, n), 2400)
    mix = (noise * 0.28 + body * 0.7) * flutter
    save("paper-rise.wav", mix * envelope(n, 0.025, 1.1, 0.18), 0.25)


def paper_swish() -> None:
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    noise = RNG.normal(0.0, 1.0, n)
    sweep = lowpass(noise, 5200) * np.linspace(0.35, 1.0, n)
    air = highpass(noise, 2800) * np.linspace(1.0, 0.12, n)
    tone = np.sin(2 * np.pi * (180 + 700 * t) * t) * 0.08
    save("paper-swish.wav", (sweep * 0.65 + air * 0.3 + tone) * envelope(n, 0.012, 1.3, 0.1), 0.3)


def paper_pop() -> None:
    n = int(0.13 * SR)
    t = np.arange(n) / SR
    click = RNG.normal(0.0, 1.0, n) * np.exp(-t * 48)
    tone = np.sin(2 * np.pi * (230 + 110 * np.exp(-t * 24)) * t) * np.exp(-t * 17)
    save("paper-pop.wav", click * 0.22 + tone * 0.7, 0.26)


def chime() -> None:
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    partials = [
        (523.25, 0.62, 4.2),
        (784.88, 0.28, 5.6),
        (1046.5, 0.17, 7.2),
        (1567.98, 0.08, 9.4),
    ]
    signal = np.zeros(n)
    for freq, amp, decay in partials:
        signal += np.sin(2 * np.pi * freq * t + freq * 0.002) * amp * np.exp(-t * decay)
    save("chime.wav", signal * envelope(n, 0.006, 1.0, 0.2), 0.25)


def glint() -> None:
    n = int(0.8 * SR)
    t = np.arange(n) / SR
    signal = (
        np.sin(2 * np.pi * 1174.66 * t) * 0.55 * np.exp(-t * 5.0)
        + np.sin(2 * np.pi * 1760.0 * t) * 0.27 * np.exp(-t * 7.5)
        + np.sin(2 * np.pi * 2637.0 * t) * 0.11 * np.exp(-t * 11.0)
    )
    save("glint.wav", signal * envelope(n, 0.004, 1.0, 0.12), 0.2)


def water_plop() -> None:
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    freq = 86 + 250 * np.exp(-t * 9)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 7.4)
    bubble = np.sin(phase * 2.03) * 0.22 * np.exp(-t * 10.5)
    splash = lowpass(RNG.normal(0.0, 1.0, n), 1900) * 0.2 * np.exp(-t * 12)
    save("water-plop.wav", body * 0.75 + bubble + splash, 0.25)


def whale_call() -> None:
    n = int(1.9 * SR)
    t = np.arange(n) / SR
    bend = 86 + 54 * np.sin(np.pi * np.clip(t / 1.9, 0, 1)) + 9 * np.sin(2 * np.pi * 0.7 * t)
    phase = 2 * np.pi * np.cumsum(bend) / SR
    body = (
        np.sin(phase) * 0.7
        + np.sin(phase * 2.0 + 0.2) * 0.18
        + np.sin(phase * 3.01 + 0.8) * 0.08
    )
    breath = lowpass(RNG.normal(0.0, 1.0, n), 700) * 0.1
    save("whale-call.wav", (body + breath) * envelope(n, 0.2, 0.55, 0.7), 0.22)


def curtain_split() -> None:
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    noise = RNG.normal(0.0, 1.0, n)
    low = lowpass(noise, 1200) * np.linspace(0.25, 1.0, n)
    cloth = lowpass(RNG.normal(0.0, 1.0, n), 540) * 0.55
    tear = highpass(noise, 3300) * (0.18 + 0.1 * np.sin(2 * np.pi * 23 * t))
    save("curtain-split.wav", (low * 0.38 + cloth + tear) * envelope(n, 0.02, 0.8, 0.36), 0.3)


def shimmer() -> None:
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    signal = np.zeros(n)
    for j, base in enumerate((659.25, 830.61, 987.77, 1318.51, 1661.22)):
        freq = base * (1 + 0.0015 * np.sin(2 * np.pi * (0.7 + j * 0.13) * t))
        signal += np.sin(2 * np.pi * np.cumsum(freq) / SR) * (0.28 / (j + 1)) * np.exp(-t * (2.3 + j * 0.6))
    save("shimmer.wav", signal * envelope(n, 0.04, 0.9, 0.4), 0.19)


def page_fall() -> None:
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    noise = lowpass(RNG.normal(0.0, 1.0, n), 2200)
    flutter = 0.55 + 0.45 * np.sin(2 * np.pi * (7 + 5 * t) * t)
    tick = np.sin(2 * np.pi * 110 * t) * np.exp(-t * 35) * 0.16
    save("page-fall.wav", (noise * 0.34 + tick) * flutter * envelope(n, 0.008, 1.2, 0.22), 0.23)


def main() -> None:
    global OUT
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="write cues here instead of the skill's public/sfx",
    )
    args = parser.parse_args()
    if args.out_dir is not None:
        OUT = args.out_dir.resolve()
        OUT.mkdir(parents=True, exist_ok=True)

    paper_rise()
    paper_swish()
    paper_pop()
    chime()
    glint()
    water_plop()
    whale_call()
    curtain_split()
    shimmer()
    page_fall()
    for path in sorted(OUT.glob("*.wav")):
        print(f"{path.name:20s} {path.stat().st_size / 1024:7.1f} KiB")


if __name__ == "__main__":
    main()
