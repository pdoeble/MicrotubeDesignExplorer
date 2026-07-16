"""Build the standalone Python/CSV/JSON project-colormap handoff bundle.

The committed TypeScript table remains the only editable color-data source.

Usage:
    python scripts/export_project_colormap.py
    python scripts/export_project_colormap.py --check
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "src" / "features" / "plots" / "colormap.ts"
OUTPUT_DIRECTORY = ROOT / "output" / "spreadsheet" / "project-spectral-colormap"
ARCHIVE_PATH = OUTPUT_DIRECTORY.parent / "project-spectral-colormap.zip"
UPSTREAM_URL = "https://www.mathworks.com/matlabcentral/fileexchange/120088-200-colormaps"
EXPECTED_COLOR_COUNT = 256
ARCHIVE_PREFIX = "project-spectral-colormap"
ARCHIVE_TIMESTAMP = (2026, 7, 16, 0, 0, 0)

Rgb8 = tuple[int, int, int]
RgbTable = tuple[Rgb8, ...]


def extract_rgb_table(source: str) -> RgbTable:
    """Extract and validate the exact RGB8 table from the TypeScript source."""

    match = re.search(
        r"const MATLAB_SPECTRAL_RGB = \[(.*?)\]\s*as const;",
        source,
        flags=re.DOTALL,
    )
    if match is None:
        raise ValueError(f"Could not find MATLAB_SPECTRAL_RGB in {SOURCE_PATH}")
    colors = tuple(
        (int(red), int(green), int(blue))
        for red, green, blue in re.findall(
            r"\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]",
            match.group(1),
        )
    )
    if len(colors) != EXPECTED_COLOR_COUNT:
        raise ValueError(f"Expected {EXPECTED_COLOR_COUNT} colors, found {len(colors)}")
    if any(not 0 <= channel <= 255 for color in colors for channel in color):
        raise ValueError("RGB table contains a channel outside [0, 255]")
    return colors


def color_position(index: int, count: int) -> float:
    return index / (count - 1)


def color_hex(color: Rgb8) -> str:
    return "#" + "".join(f"{channel:02x}" for channel in color)


def rgb_sha256(colors: RgbTable) -> str:
    return hashlib.sha256(bytes(channel for color in colors for channel in color)).hexdigest()


def render_python_module(colors: RgbTable) -> str:
    rows = "\n".join(f"    ({red}, {green}, {blue})," for red, green, blue in colors)
    return f'''"""Exact project spectral colormap for Matplotlib and Plotly.

Generated from the Microtube Design Explorer's frozen 256-entry RGB8 table.
Do not edit the color values by hand; see the accompanying README and JSON
metadata for provenance.
"""

from __future__ import annotations

from matplotlib.colors import ListedColormap

PROJECT_SPECTRAL_RGB8: tuple[tuple[int, int, int], ...] = (
{rows}
)


def _matplotlib_colormap(colors: tuple[tuple[int, int, int], ...], name: str) -> ListedColormap:
    normalized = [[channel / 255.0 for channel in color] for color in colors]
    return ListedColormap(normalized, name=name)


PROJECT_SPECTRAL = _matplotlib_colormap(PROJECT_SPECTRAL_RGB8, "project_spectral")
PROJECT_SPECTRAL_REVERSED = _matplotlib_colormap(
    PROJECT_SPECTRAL_RGB8[::-1], "project_spectral_reversed"
)


def plotly_colorscale(*, reverse: bool = False) -> list[list[float | str]]:
    """Return the same palette in Plotly's normalized colorscale format."""

    colors = PROJECT_SPECTRAL_RGB8[::-1] if reverse else PROJECT_SPECTRAL_RGB8
    denominator = len(colors) - 1
    return [
        [index / denominator, f"rgb({{red}},{{green}},{{blue}})"]
        for index, (red, green, blue) in enumerate(colors)
    ]


__all__ = [
    "PROJECT_SPECTRAL",
    "PROJECT_SPECTRAL_REVERSED",
    "PROJECT_SPECTRAL_RGB8",
    "plotly_colorscale",
]
'''


def render_csv(colors: RgbTable) -> str:
    stream = io.StringIO(newline="")
    writer = csv.writer(stream, lineterminator="\n")
    writer.writerow(("index", "position", "red", "green", "blue", "hex"))
    for index, color in enumerate(colors):
        writer.writerow(
            (
                index,
                format(color_position(index, len(colors)), ".17g"),
                *color,
                color_hex(color),
            )
        )
    return stream.getvalue()


def render_json(colors: RgbTable) -> str:
    payload = {
        "format_version": 1,
        "name": "project_spectral",
        "sample_count": len(colors),
        "encoding": "8-bit sRGB",
        "order": "low values to high values",
        "source": {
            "application_source": "src/features/plots/colormap.ts",
            "legacy_call": "slanCM('spectral')",
            "matlab_release": "R2024b",
            "dumped_on": "2026-07-12",
            "integrated_and_accepted_on": "2026-07-13",
            "quantization": "round(255 * channel)",
            "upstream_url": UPSTREAM_URL,
        },
        "rgb8_sha256": rgb_sha256(colors),
        "rgb8": [list(color) for color in colors],
    }
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def render_example() -> str:
    return '''"""Small runnable example for the exported project colormap."""

import matplotlib.pyplot as plt
import numpy as np
from project_spectral import PROJECT_SPECTRAL, PROJECT_SPECTRAL_REVERSED

x = np.linspace(-3.0, 3.0, 301)
y = np.linspace(-2.0, 2.0, 201)
xx, yy = np.meshgrid(x, y)
values = np.sin(xx**2 + yy**2) * np.exp(-0.12 * (xx**2 + yy**2))

figure, axes = plt.subplots(1, 2, figsize=(10, 3.8), constrained_layout=True)
for axis, colormap, title in (
    (axes[0], PROJECT_SPECTRAL, "project_spectral"),
    (axes[1], PROJECT_SPECTRAL_REVERSED, "project_spectral_reversed"),
):
    image = axis.imshow(
        values,
        cmap=colormap,
        origin="lower",
        extent=(x.min(), x.max(), y.min(), y.max()),
        aspect="auto",
        vmin=-1.0,
        vmax=1.0,
    )
    axis.set(title=title, xlabel="x", ylabel="y")
    figure.colorbar(image, ax=axis)

plt.show()
'''


def render_readme() -> str:
    return f"""# Project Spectral Colormap – Python-Export

Dieses Paket enthält exakt die 256 RGB-Stützstellen, die der Microtube Design
Explorer für seine wissenschaftlichen Abbildungen verwendet. Die normale
Reihenfolge läuft von Dunkelrot (`#9e0142`) bei kleinen Werten zu Violett
(`#5e4fa2`) bei großen Werten. Für umgekehrte Abbildungen ist eine zweite
Variante enthalten.

## Schnellstart mit Matplotlib

1. Diese ZIP-Datei entpacken.
2. Matplotlib und NumPy installieren:

   ```bash
   python -m pip install matplotlib numpy
   ```

3. `project_spectral.py` neben das eigene Skript legen und importieren:

   ```python
   import matplotlib.pyplot as plt
   from project_spectral import PROJECT_SPECTRAL

   image = plt.imshow(data, cmap=PROJECT_SPECTRAL, vmin=minimum, vmax=maximum)
   plt.colorbar(image)
   plt.show()
   ```

Für die umgekehrte Richtung:

```python
from project_spectral import PROJECT_SPECTRAL_REVERSED

plt.imshow(data, cmap=PROJECT_SPECTRAL_REVERSED)
```

Das vollständige Beispiel startet mit:

```bash
python example_matplotlib.py
```

## Plotly

```python
import plotly.graph_objects as go
from project_spectral import plotly_colorscale

figure = go.Figure(
    go.Heatmap(z=data, colorscale=plotly_colorscale())
)
figure.show()
```

Die umgekehrte Skala erhält man mit `plotly_colorscale(reverse=True)`.

## CSV ohne das Python-Modul laden

```python
import pandas as pd
from matplotlib.colors import ListedColormap

table = pd.read_csv("project_spectral.csv")
rgb = table[["red", "green", "blue"]].to_numpy(dtype=float) / 255.0
cmap = ListedColormap(rgb, name="project_spectral")
```

## Wichtig für identische Abbildungen

Die Colormap bestimmt nur die Farben. Für dieselbe Zuordnung von Messwerten zu
Farben müssen außerdem dieselben Grenzen (`vmin`, `vmax`) beziehungsweise
dieselbe Matplotlib-`norm` verwendet werden. Bei logarithmischen Skalen zum
Beispiel:

```python
from matplotlib.colors import LogNorm

plt.imshow(data, cmap=PROJECT_SPECTRAL, norm=LogNorm(vmin=0.05, vmax=5.0))
```

Matplotlibs eingebaute Map `Spectral` ergab bei der Validierung dieselben 256
RGB8-Werte. Für reproduzierbare Projektabbildungen sollte trotzdem die hier
eingefrorene Tabelle verwendet werden.

## Dateien

- `project_spectral.py`: direkt nutzbare Matplotlib-Maps und Plotly-Helfer
- `project_spectral.csv`: Index, normierte Position, RGB8 und Hex
- `project_spectral.json`: maschinenlesbare Tabelle und Provenienz
- `example_matplotlib.py`: lauffähiges Normal-/Reversed-Beispiel
- `ATTRIBUTION.md`: Herkunft und Weitergabehinweise

Die Tabelle wurde am 12.07.2026 aus MATLAB R2024b exportiert und am 13.07.2026
in der Anwendung integriert und abgenommen. Der RGB8-Hash lautet
`{rgb_sha256(extract_rgb_table(SOURCE_PATH.read_text(encoding="utf-8")))}`.
"""


def render_attribution() -> str:
    return f"""# Attribution and provenance

The 256-entry RGB8 table is exported from the frozen Microtube Design Explorer
snapshot of `slanCM('spectral')`. The table was dumped with MATLAB R2024b on
2026-07-12 using `round(255 * channel)` and integrated/accepted in the
application on 2026-07-13.

Upstream palette package:

{UPSTREAM_URL}

Suggested acknowledgement:

> Zhaoxu Liu / slandarer, “200 colormaps”, MATLAB Central File Exchange,
> palette `spectral`; Python rendering with Matplotlib.

This handoff contains no MATLAB implementation, paper source, or scientific
golden dataset. Keep this attribution file with redistributed copies and
review the upstream terms for the intended use. The small Python adapter and
generation script remain subject to the repository's own license terms; this
file does not assert that those terms replace upstream palette terms.
"""


def render_files(colors: RgbTable) -> dict[str, str]:
    return {
        "README.md": render_readme(),
        "ATTRIBUTION.md": render_attribution(),
        "example_matplotlib.py": render_example(),
        "project_spectral.csv": render_csv(colors),
        "project_spectral.json": render_json(colors),
        "project_spectral.py": render_python_module(colors),
    }


def render_archive(files: dict[str, str]) -> bytes:
    stream = io.BytesIO()
    with zipfile.ZipFile(
        stream,
        mode="w",
        compression=zipfile.ZIP_DEFLATED,
        compresslevel=9,
    ) as archive:
        for filename, content in files.items():
            info = zipfile.ZipInfo(
                filename=f"{ARCHIVE_PREFIX}/{filename}",
                date_time=ARCHIVE_TIMESTAMP,
            )
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, content.encode("utf-8"))
    return stream.getvalue()


def write_outputs(files: dict[str, str], archive: bytes) -> None:
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    for filename, content in files.items():
        (OUTPUT_DIRECTORY / filename).write_text(content, encoding="utf-8", newline="\n")
    ARCHIVE_PATH.write_bytes(archive)


def check_outputs(files: dict[str, str], archive: bytes) -> list[str]:
    mismatches: list[str] = []
    for filename, content in files.items():
        path = OUTPUT_DIRECTORY / filename
        if not path.is_file():
            mismatches.append(f"missing {path.relative_to(ROOT)}")
        elif path.read_text(encoding="utf-8") != content:
            mismatches.append(f"outdated {path.relative_to(ROOT)}")
    if not ARCHIVE_PATH.is_file():
        mismatches.append(f"missing {ARCHIVE_PATH.relative_to(ROOT)}")
    elif ARCHIVE_PATH.read_bytes() != archive:
        mismatches.append(f"outdated {ARCHIVE_PATH.relative_to(ROOT)}")
    return mismatches


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail if the committed output bundle does not match the source table",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    colors = extract_rgb_table(SOURCE_PATH.read_text(encoding="utf-8"))
    files = render_files(colors)
    archive = render_archive(files)
    if args.check:
        mismatches = check_outputs(files, archive)
        if mismatches:
            for mismatch in mismatches:
                print(mismatch, file=sys.stderr)
            return 1
        print(f"Colormap export is current: {len(colors)} colors, {rgb_sha256(colors)}")
        return 0
    write_outputs(files, archive)
    print(f"Wrote {ARCHIVE_PATH.relative_to(ROOT)} with {len(colors)} colors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
