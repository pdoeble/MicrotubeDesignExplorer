from __future__ import annotations

import ast
import csv
import hashlib
import io
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_PATH = ROOT / "src" / "features" / "plots" / "colormap.ts"
OUTPUT_DIRECTORY = ROOT / "output" / "spreadsheet" / "project-spectral-colormap"
ARCHIVE_PATH = OUTPUT_DIRECTORY.parent / "project-spectral-colormap.zip"


def source_rgb_table() -> list[list[int]]:
    source = SOURCE_PATH.read_text(encoding="utf-8")
    match = re.search(
        r"const MATLAB_SPECTRAL_RGB = \[(.*?)\]\s*as const;",
        source,
        flags=re.DOTALL,
    )
    assert match is not None
    return [
        [int(red), int(green), int(blue)]
        for red, green, blue in re.findall(
            r"\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]",
            match.group(1),
        )
    ]


def test_colormap_handoff_bundle_matches_source_table() -> None:
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "export_project_colormap.py"), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr

    expected = source_rgb_table()
    assert len(expected) == 256
    assert expected[0] == [158, 1, 66]
    assert expected[-1] == [94, 79, 162]

    metadata = json.loads((OUTPUT_DIRECTORY / "project_spectral.json").read_text("utf-8"))
    assert metadata["rgb8"] == expected
    assert metadata["sample_count"] == 256
    expected_bytes = bytes(channel for row in expected for channel in row)
    expected_hash = hashlib.sha256(expected_bytes).hexdigest()
    assert metadata["rgb8_sha256"] == expected_hash

    csv_rows = list(
        csv.DictReader(io.StringIO((OUTPUT_DIRECTORY / "project_spectral.csv").read_text("utf-8")))
    )
    assert len(csv_rows) == 256
    assert [int(csv_rows[0][channel]) for channel in ("red", "green", "blue")] == expected[0]
    assert [int(csv_rows[-1][channel]) for channel in ("red", "green", "blue")] == expected[-1]
    assert float(csv_rows[0]["position"]) == 0.0
    assert float(csv_rows[-1]["position"]) == 1.0
    assert csv_rows[0]["hex"] == "#9e0142"
    assert csv_rows[-1]["hex"] == "#5e4fa2"

    module_path = OUTPUT_DIRECTORY / "project_spectral.py"
    ast.parse(module_path.read_text("utf-8"), filename=str(module_path))

    exported_files = [path for path in OUTPUT_DIRECTORY.iterdir() if path.is_file()]
    expected_archive_names = {f"project-spectral-colormap/{path.name}" for path in exported_files}
    with zipfile.ZipFile(ARCHIVE_PATH) as archive:
        assert set(archive.namelist()) == expected_archive_names
        for path in exported_files:
            assert archive.read(f"project-spectral-colormap/{path.name}") == path.read_bytes()
