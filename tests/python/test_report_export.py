"""Tests for report payload and JSON sidecar construction."""

from __future__ import annotations

import json

from microtubes_core.api import simulate
from microtubes_core.defaults import paper_default_request
from microtubes_core.exports import REPORT_PAYLOAD_VERSION, build_report_payload, report_json


def test_report_payload_is_deterministic_for_one_result() -> None:
    request = paper_default_request()
    result = simulate(request)

    first = build_report_payload(request, result)
    second = build_report_payload(request, result)

    assert first == second
    assert first["report_version"] == REPORT_PAYLOAD_VERSION
    assert report_json(first) == report_json(second)
    assert json.loads(report_json(first)) == first


def test_report_payload_contains_traceable_array_manifest() -> None:
    request = paper_default_request()
    result = simulate(request)
    payload = build_report_payload(request, result)

    manifest = payload["array_manifest"]
    assert len(manifest) == len(result.arrays)
    assert manifest[0]["buffer_index"] == 0
    assert len(manifest[0]["sha256"]) == 64
    assert manifest[0]["source"] == "cooler_left.fields"
    assert manifest[-1]["source"] == "comparison.fields"
    assert payload["result_payload"]["request_hash"] == payload["request_hash"]
