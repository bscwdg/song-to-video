"""Pipeline invariants for song-to-video.

These test the properties that actually broke, not the visuals:

* scripts in every mirror stay identical (drift guard)
* the director never stalls and its shots tile the timeline exactly
* beat accents are normalised, and a downbeat is marked even on a soft kick
* the QA's dead-beat rule is relative to the film, not a magic number

Runs with the stdlib only:  python -m unittest discover -s tests
"""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPTS = REPO / "skills" / "papercut-mv" / "scripts"
sys.path.insert(0, str(SCRIPTS))


class ScriptMirrorTest(unittest.TestCase):
    """A bug fixed in one copy must not stay live in another."""

    def test_mirrors_match_canonical(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "sync_scripts.py"), "--check"],
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            result.returncode,
            0,
            f"script drift detected:\n{result.stdout}\n{result.stderr}",
        )


class BeatStrengthTest(unittest.TestCase):
    def test_strengths_are_normalised(self):
        import numpy as np

        from song_facts import beat_strengths

        low = np.array([0.9, 0.1, 0.5, 0.2, 0.7, 0.05, 0.3, 0.85])
        flux = np.array([0.8, 0.05, 0.4, 0.1, 0.6, 0.02, 0.2, 0.75])
        rms = np.array([0.85, 0.2, 0.5, 0.25, 0.7, 0.1, 0.35, 0.8])
        index = np.arange(len(low))
        flags = [i % 4 == 0 for i in range(len(low))]

        strengths = beat_strengths(low, flux, rms, index, flags)

        self.assertEqual(len(strengths), len(low))
        self.assertTrue(all(0.0 <= s <= 1.0 for s in strengths))
        # The loudest beat must not score lower than the quietest.
        self.assertGreater(max(strengths), min(strengths))
        self.assertLess(min(strengths), 0.2)
        self.assertGreater(max(strengths), 0.7)

    def test_downbeat_boost_marks_soft_bar_lines(self):
        import numpy as np

        from song_facts import beat_strengths

        # All beats equally soft: without the boost every value would be 0.
        low = np.full(8, 0.3)
        flux = np.full(8, 0.3)
        rms = np.full(8, 0.3)
        index = np.arange(8)
        flags = [i % 4 == 0 for i in range(8)]

        strengths = beat_strengths(low, flux, rms, index, flags)

        downbeats = [strengths[i] for i in range(8) if flags[i]]
        self.assertTrue(all(s > 0 for s in downbeats))


class DirectorTest(unittest.TestCase):
    """The director must terminate and must tile the whole song."""

    @classmethod
    def setUpClass(cls):
        cls.song = {
            "audio": "public/audio/test.wav",
            "bodyEnd": 12.0,
            "fps": 30,
            "width": 1920,
            "height": 1080,
            "tempo": {"bpm": 100.0},
            "meter": 4,
            "beats": [round(0.6 * i, 4) for i in range(20)],
            "bars": [{"index": i, "start": round(2.4 * i, 4), "energy": 0.5} for i in range(5)],
            "beatFeatures": [
                {
                    "t": round(0.6 * i, 4),
                    "isDownbeat": i % 4 == 0,
                    "beatInBar": i % 4,
                    "strength": 0.5,
                    "low": 0.5,
                    "flux": 0.4,
                    "section": "verse",
                    "sectionEnergy": 0.5,
                }
                for i in range(20)
            ],
            "sections": [
                {"start": 0.0, "end": 12.0, "bars": 5, "energy": 0.5, "label": "verse"}
            ],
            "lyrics": [],
            # Phrase ends that sit exactly on bar lines 2 and 4.
            "phrases": [
                {"start": 0.0, "end": 4.8, "lines": 1},
                {"start": 4.8, "end": 9.6, "lines": 1},
            ],
        }

    def _run_director(self, extra: list[str] | None = None) -> dict:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            song_path = Path(tmp) / "song.json"
            out_path = Path(tmp) / "shots.json"
            ts_path = Path(tmp) / "shots.generated.ts"
            song_path.write_text(json.dumps(self.song), encoding="utf-8")
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPTS / "direct.py"),
                    str(song_path),
                    "--out",
                    str(out_path),
                    "--emit-ts",
                    str(ts_path),
                    *(extra or []),
                ],
                capture_output=True,
                text=True,
                timeout=60,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads(out_path.read_text(encoding="utf-8"))

    def test_director_terminates_and_tiles_timeline(self):
        payload = self._run_director()
        shots = payload["shots"]
        self.assertGreater(len(shots), 0)

        # Contiguous coverage in frames: no gaps, no overlaps, ends on bodyEnd.
        fps = payload["fps"]
        cursor = 0
        for shot in shots:
            start_frame = round(shot["start"] * fps)
            self.assertEqual(start_frame, cursor, f"{shot['id']} does not start where the previous ended")
            cursor = start_frame + max(1, round(shot["duration"] * fps))
        self.assertEqual(cursor, round(payload["duration"] * fps))

    def test_phrase_snapping_respects_phrase_ends(self):
        payload = self._run_director()
        bar_starts = [2.4 * i for i in range(5)]
        for shot in payload["shots"][:-1]:
            end = shot["start"] + shot["duration"]
            # Every cut should land on a bar line.
            nearest = min(bar_starts, key=lambda b: abs(b - end))
            self.assertLess(abs(nearest - end), 0.05, f"{shot['id']} cuts off the bar grid")

    def test_no_phrase_snap_flag_still_terminates(self):
        payload = self._run_director(["--no-phrase-snap"])
        self.assertGreater(len(payload["shots"]), 0)


class QaThresholdTest(unittest.TestCase):
    """The dead-beat rule must scale with the film, not a fixed constant."""

    def test_dead_beat_detection_is_relative(self):
        import numpy as np

        from qa_video import analyse

        fps = 30.0
        frames = []
        # 4 seconds at 30fps. Frame-to-frame change of 0.2 everywhere, except
        # three nearly-static frames right before beats at 1.0s and 2.0s.
        for i in range(120):
            base = np.full((90, 160), 20 + (i % 7) * 3, dtype=np.uint8)
            if i in (29, 59):
                base = base.copy()
                base[:] = 20 + (28 % 7) * 3
            frames.append(base)

        report = analyse(
            frames,
            fps,
            [1.0, 2.0, 3.0],
            dead_ratio=0.35,
            dead_floor=0.02,
            black_threshold=10.0,
            freeze_ratio=0.15,
            freeze_seconds=0.5,
        )

        self.assertTrue(report["available"])
        self.assertEqual(report["beatsChecked"], 3)
        # A relative cutoff must be reported so the number is auditable.
        self.assertIn("deadBeatCutoff", report)

    def test_per_shot_baseline_does_not_flag_a_quiet_ending(self):
        """A quiet closing shot must be judged against itself, not the chorus.

        This is the regression that made a fixed local window useless: the
        window straddled a hard cut, so the quiet final shot was compared with
        the loud shot before it and its beats were declared dead.
        """
        import numpy as np

        from qa_video import analyse

        fps = 30.0
        frames = []
        # Shot A (0-3s): loud, a 6-unit luminance swing every frame.
        for i in range(90):
            frames.append(np.full((90, 160), 20 + (i * 6) % 200, dtype=np.uint8))
        # Shot B (3-6s): quiet, but still a 3-unit swing every frame.
        for i in range(90):
            frames.append(np.full((90, 160), 120 + (i * 3) % 30, dtype=np.uint8))

        # Beats every 0.5s; the quiet shot's beats move less in absolute terms.
        beats = [round(0.5 * i, 3) for i in range(1, 13)]

        report = analyse(
            frames,
            fps,
            beats,
            dead_ratio=0.35,
            dead_floor=0.02,
            black_threshold=10.0,
            freeze_ratio=0.15,
            freeze_seconds=0.5,
            shot_ranges=[(0.0, 3.0), (3.0, 6.0)],
        )

        self.assertEqual(report["deadBeatCutoffKind"], "per-shot median × 0.35")
        # Shot B beats move consistently, so none should be called dead.
        self.assertEqual(report["deadBeatCount"], 0, report["deadBeats"])

    def test_per_shot_baseline_still_catches_a_dead_beat(self):
        """The per-shot rule must not become a pass-everything rule."""
        import numpy as np

        from qa_video import analyse

        fps = 30.0
        frames = []
        # A slow ramp (1 unit per frame), with a genuine plateau at frames
        # 27-35. The plateau has to be wider than the ±1 frame look-around, or
        # the jump that ends it lands inside the window and masks the stillness.
        for i in range(60):
            value = 47 if 27 <= i <= 35 else 20 + i
            frames.append(np.full((90, 160), value, dtype=np.uint8))

        # Beats every 0.5s: frame 15 (ramp), frame 30 (plateau), frame 45 (ramp).
        report = analyse(
            frames,
            fps,
            [0.5, 1.0, 1.5],
            dead_ratio=0.35,
            dead_floor=0.02,
            black_threshold=10.0,
            freeze_ratio=0.15,
            freeze_seconds=0.5,
            shot_ranges=[(0.0, 2.0)],
        )

        flagged = [row["t"] for row in report["deadBeats"]]
        self.assertIn(1.0, flagged, f"the plateau beat must be caught, got {flagged}")
        self.assertNotIn(0.5, flagged, f"a ramping beat must not be flagged, got {flagged}")

    def test_black_frames_are_detected(self):
        import numpy as np

        from qa_video import analyse

        # 30 frames at 30fps = 1.0s of black: longer than the 0.5s freeze rule,
        # so both the black-frame count and the freeze run must fire.
        frames = [np.zeros((90, 160), dtype=np.uint8) for _ in range(30)]
        report = analyse(
            frames,
            30.0,
            [],
            dead_ratio=0.35,
            dead_floor=0.02,
            black_threshold=10.0,
            freeze_ratio=0.15,
            freeze_seconds=0.5,
        )
        self.assertEqual(report["blackFrameCount"], 30)
        self.assertGreaterEqual(report["freezeCount"], 1)

    def test_short_static_stretch_is_not_a_freeze(self):
        """A third of a second of stillness is a held frame, not a freeze."""
        import numpy as np

        from qa_video import analyse

        frames = [np.zeros((90, 160), dtype=np.uint8) for _ in range(10)]
        report = analyse(
            frames,
            30.0,
            [],
            dead_ratio=0.35,
            dead_floor=0.02,
            black_threshold=10.0,
            freeze_ratio=0.15,
            freeze_seconds=0.5,
        )
        self.assertEqual(report["blackFrameCount"], 10)
        self.assertEqual(report["freezeCount"], 0)


class GeometryTest(unittest.TestCase):
    """Composition slots must stay inside the frame in both aspects."""

    def test_slot_x_in_portrait_stays_in_frame(self):
        sys.path.insert(0, str(REPO / "examples" / "v2-lab"))
        # stage.ts is TS; mirror its rule here to pin the intent.
        def slot_x(w, h, focus):
            m_spread = 0.62 if w < h else 1.0
            return w / 2 + (focus - 0.5) * w * m_spread

        for w, h in ((1920, 1080), (1080, 1920)):
            for focus in (0.0, 0.32, 0.5, 0.68, 1.0):
                x = slot_x(w, h, focus)
                self.assertGreaterEqual(x, 0, f"focus {focus} at {w}x{h} leaves the frame")
                self.assertLessEqual(x, w, f"focus {focus} at {w}x{h} leaves the frame")


if __name__ == "__main__":
    unittest.main()
