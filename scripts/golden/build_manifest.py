"""Build reference/manifest.json with SHA-256 hashes of all golden files.

Run after scripts/golden/generate_golden_references.m (ADR-0002):

    python scripts/golden/build_manifest.py

The manifest makes accidental golden mutations detectable in review and CI.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REFERENCE_DIR = REPO_ROOT / "reference"
MANIFEST_PATH = REFERENCE_DIR / "manifest.json"


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    files = sorted(p for p in REFERENCE_DIR.rglob("*") if p.is_file() and p != MANIFEST_PATH)
    entries = {
        p.relative_to(REFERENCE_DIR).as_posix(): {
            "sha256": sha256_of(p),
            "bytes": p.stat().st_size,
        }
        for p in files
    }
    provenance = json.loads((REFERENCE_DIR / "provenance.json").read_text("utf-8"))
    manifest = {
        "note": "Immutable MATLAB-derived golden references (ADR-0002). "
        "Regeneration requires provenance review (AGENTS §10).",
        "provenance": provenance,
        "file_count": len(entries),
        "files": entries,
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"Wrote {MANIFEST_PATH} with {len(entries)} entries.")


if __name__ == "__main__":
    main()
