"""Export contract artifacts from the Pydantic source of truth.

Writes deterministic JSON into src/contracts/:
  - schema/simulation-request.schema.json
  - schema/simulation-result.schema.json
  - defaults.json           (paper defaults, single defaults source)
  - parameter-manifest.json (UI ranges/scales/units, frozen in M2)

Run:  uv run --project python python scripts/export_contracts.py
CI verifies the committed artifacts are in sync (no manual edits).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "python"))

from microtubes_core import CONTRACT_VERSION  # noqa: E402
from microtubes_core.contracts import (  # noqa: E402
    SimulationRequest,
    SimulationResultPayload,
)
from microtubes_core.defaults import DEFAULTS_VERSION, paper_default_request  # noqa: E402
from microtubes_core.parameter_manifest import MANIFEST_VERSION, build_manifest  # noqa: E402

OUT_DIR = REPO_ROOT / "src" / "contracts"


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False)
    path.write_text(text + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {path.relative_to(REPO_ROOT)}")


def main() -> None:
    write_json(
        OUT_DIR / "schema" / "simulation-request.schema.json",
        SimulationRequest.model_json_schema(),
    )
    write_json(
        OUT_DIR / "schema" / "simulation-result.schema.json",
        SimulationResultPayload.model_json_schema(),
    )
    write_json(
        OUT_DIR / "defaults.json",
        {
            "contract_version": CONTRACT_VERSION,
            "defaults_version": DEFAULTS_VERSION,
            "request": paper_default_request().model_dump(mode="json"),
        },
    )
    write_json(
        OUT_DIR / "parameter-manifest.json",
        {
            "manifest_version": MANIFEST_VERSION,
            "parameters": [p.model_dump(mode="json") for p in build_manifest()],
        },
    )


if __name__ == "__main__":
    main()
