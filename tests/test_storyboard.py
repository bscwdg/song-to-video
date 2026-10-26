"""Storyboard contract tests.

The point of these tests is to keep the product focused on lyric-driven
semantics, not shot-index rotation.
"""

from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPTS = REPO / "skills" / "papercut-mv" / "scripts"
SAMPLE = REPO / "examples" / "storyboard-first" / "storyboard.json"
sys.path.insert(0, str(SCRIPTS))

from validate_storyboard import validate_storyboard
from storyboard_to_timeline import build_timeline


class StoryboardContractTest(unittest.TestCase):
    def setUp(self):
        self.payload = json.loads(SAMPLE.read_text(encoding="utf-8"))

    def test_sample_is_valid(self):
        errors, warnings = validate_storyboard(self.payload)
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])

    def test_gap_is_rejected(self):
        payload = copy.deepcopy(self.payload)
        payload["shots"][1]["start"] += 0.3
        errors, _ = validate_storyboard(payload)
        self.assertTrue(any("does not continue" in error for error in errors))

    def test_missing_metaphor_is_rejected(self):
        payload = copy.deepcopy(self.payload)
        payload["shots"][0]["metaphor"] = ""
        errors, _ = validate_storyboard(payload)
        self.assertTrue(any("metaphor" in error for error in errors))

    def test_missing_style_is_rejected(self):
        payload = copy.deepcopy(self.payload)
        del payload["style"]
        errors, _ = validate_storyboard(payload)
        self.assertTrue(any("style" in error for error in errors))

    def test_duplicate_archetype_is_only_a_warning(self):
        payload = copy.deepcopy(self.payload)
        payload["shots"][1]["scene"]["archetype"] = payload["shots"][0]["scene"]["archetype"]
        errors, warnings = validate_storyboard(payload)
        self.assertEqual(errors, [])
        self.assertTrue(any("duplicate archetype" in warning for warning in warnings))

    def test_storyboard_drives_timeline_scenes_and_lyrics(self):
        timing = {
            "audio": "public/audio/song.mp3",
            "duration": 16.0,
            "musical_body_end": 16.0,
            "target_width": 1920,
            "target_height": 1080,
            "fps": 30,
            "bpm": 120,
            "beats": [round(0.5 * i, 4) for i in range(33)],
        }
        timeline = build_timeline(timing, self.payload)
        self.assertEqual(len(timeline["scenes"]), 4)
        self.assertEqual(len(timeline["lyrics"]), 4)
        self.assertEqual(
            [scene["component"] for scene in timeline["scenes"]],
            [
                "wedding-arch",
                "room-fill",
                "family-table",
                "paper-door",
            ],
        )

    def test_duration_mismatch_is_rejected(self):
        timing = {
            "duration": 15.0,
            "musical_body_end": 15.0,
            "target_width": 1920,
            "target_height": 1080,
            "fps": 30,
            "bpm": 120,
            "beats": [],
        }
        with self.assertRaises(ValueError):
            build_timeline(timing, self.payload)

    def test_dense_lyrics_with_long_average_shot_warns(self):
        payload = copy.deepcopy(self.payload)
        payload["duration"] = 32
        payload["shots"] = [payload["shots"][0], payload["shots"][1]]
        payload["shots"][0]["start"] = 0
        payload["shots"][0]["end"] = 16
        payload["shots"][0]["cut"]["snapped"] = 16
        payload["shots"][1]["start"] = 16
        payload["shots"][1]["end"] = 32
        payload["shots"][1]["cut"]["snapped"] = 32
        payload["shots"][0]["lyrics"] = [
            {"start": 1 + i * 2.4, "end": 2 + i * 2.4, "text": f"line {i}"}
            for i in range(6)
        ]
        payload["shots"][1]["lyrics"] = [
            {"start": 17 + i * 2.4, "end": 18 + i * 2.4, "text": f"line {i + 6}"}
            for i in range(6)
        ]
        errors, warnings = validate_storyboard(payload)
        self.assertEqual(errors, [])
        self.assertTrue(any("too static" in warning for warning in warnings))


if __name__ == "__main__":
    unittest.main()
