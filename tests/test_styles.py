"""Style registry and pack integrity tests."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
REGISTRY = REPO / "styles" / "registry.json"


class StyleRegistryTest(unittest.TestCase):
    def setUp(self):
        self.payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
        self.styles = self.payload["styles"]

    def test_registry_ids_are_unique(self):
        ids = [style["id"] for style in self.styles]
        self.assertEqual(len(ids), len(set(ids)))

    def test_all_expected_styles_are_registered(self):
        ids = {style["id"] for style in self.styles}
        self.assertTrue(
            {
                "papercut-mv",
                "painted-animation",
                "kinetic-reel",
                "ink-wash",
                "flat-explainer",
                "pixel-8bit",
            }.issubset(ids)
        )

    def test_each_style_pack_has_recipe(self):
        for style in self.styles:
            if style["status"] == "stable":
                continue
            root = REPO / style["path"]
            self.assertTrue((root / "STYLE.md").is_file(), style["id"])
            metadata = json.loads((root / "style.json").read_text(encoding="utf-8"))
            self.assertEqual(metadata["id"], style["id"])

    def test_each_preview_style_has_gallery_component(self):
        preview_root = REPO / "examples" / "style-gallery" / "src" / "previews"
        for style in self.styles:
            if style["status"] == "stable":
                continue
            self.assertTrue((preview_root / f"{style['id']}.tsx").is_file(), style["id"])

    def test_beta_styles_have_runnable_template(self):
        for style in self.styles:
            if style["status"] != "beta":
                continue
            template = REPO / style["template"]
            self.assertTrue((template / "package.json").is_file(), style["id"])
            self.assertTrue((template / "src" / "Root.tsx").is_file(), style["id"])


if __name__ == "__main__":
    unittest.main()
