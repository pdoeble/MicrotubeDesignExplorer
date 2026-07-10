"""Report payload construction from one immutable simulation result.

The report payload is intentionally independent from UI state and Plotly
objects. It records the validated request, the public result payload, warnings,
scalar summaries, and a deterministic manifest for each transferred array.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

import numpy as np

from microtubes_core.api import SimulationResult
from microtubes_core.contracts import GridFieldRef, SimulationRequest

REPORT_PAYLOAD_VERSION = "1.0.0"


def build_report_payload(request: SimulationRequest, result: SimulationResult) -> dict[str, Any]:
    """Return a deterministic JSON-compatible report payload.

    The payload is reproducible for the same validated request and
    ``SimulationResult``. Numeric array contents are represented by hashes and
    summary statistics, keeping the report sidecar compact while preserving
    traceability to the transferred arrays.
    """
    return {
        "report_version": REPORT_PAYLOAD_VERSION,
        "request_hash": result.payload.request_hash,
        "provenance": result.payload.provenance.model_dump(mode="json"),
        "request": request.model_dump(mode="json"),
        "result_payload": result.payload.model_dump(mode="json"),
        "summaries": {
            "cooler_left": result.payload.cooler_left.summary.model_dump(mode="json"),
            "cooler_right": result.payload.cooler_right.summary.model_dump(mode="json"),
        },
        "warnings": {
            "cooler_left": [
                warning.model_dump(mode="json") for warning in result.payload.cooler_left.warnings
            ],
            "cooler_right": [
                warning.model_dump(mode="json") for warning in result.payload.cooler_right.warnings
            ],
            "comparison": [
                warning.model_dump(mode="json") for warning in result.payload.comparison.warnings
            ],
        },
        "array_manifest": _array_manifest(result),
    }


def report_json(payload: dict[str, Any]) -> str:
    """Serialize a report payload as canonical JSON for sidecar export."""
    return json.dumps(payload, allow_nan=False, separators=(",", ":"), sort_keys=True)


def _array_manifest(result: SimulationResult) -> list[dict[str, Any]]:
    refs = _all_refs(result)
    manifest: list[dict[str, Any]] = []
    for ref in refs:
        array = result.arrays[ref.buffer_index]
        finite = array[np.isfinite(array)]
        manifest.append(
            {
                "buffer_index": ref.buffer_index,
                "name": ref.name,
                "unit": ref.unit,
                "shape": list(ref.shape),
                "source": _source_for_ref(result, ref),
                "sha256": hashlib.sha256(np.ascontiguousarray(array).tobytes()).hexdigest(),
                "finite_count": int(finite.size),
                "nan_count": int(np.isnan(array).sum()),
                "minimum": float(np.min(finite)) if finite.size else None,
                "maximum": float(np.max(finite)) if finite.size else None,
            }
        )
    return manifest


def _all_refs(result: SimulationResult) -> list[GridFieldRef]:
    return [
        *result.payload.cooler_left.fields,
        *result.payload.cooler_left.masks,
        *result.payload.cooler_right.fields,
        *result.payload.cooler_right.masks,
        *result.payload.comparison.fields,
    ]


def _source_for_ref(result: SimulationResult, ref: GridFieldRef) -> str:
    if ref in result.payload.cooler_left.fields:
        return "cooler_left.fields"
    if ref in result.payload.cooler_left.masks:
        return "cooler_left.masks"
    if ref in result.payload.cooler_right.fields:
        return "cooler_right.fields"
    if ref in result.payload.cooler_right.masks:
        return "cooler_right.masks"
    return "comparison.fields"
