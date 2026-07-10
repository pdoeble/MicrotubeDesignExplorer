"""Helpers for loading immutable MATLAB golden arrays in tests."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

REPO_ROOT = Path(__file__).resolve().parents[2]
REFERENCE_ROOT = REPO_ROOT / "reference"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text("utf-8"))


def read_f64(path_without_suffix: Path) -> NDArray[np.float64]:
    meta = read_json(path_without_suffix.with_suffix(".meta.json"))
    data = np.fromfile(path_without_suffix.with_suffix(".f64"), dtype="<f8")
    shape = tuple(int(item) for item in meta["shape"])
    order = str(meta["order"])
    return data.reshape(shape, order=order)


def read_u8(path_without_suffix: Path) -> NDArray[np.uint8]:
    meta = read_json(path_without_suffix.with_suffix(".meta.json"))
    data = np.fromfile(path_without_suffix.with_suffix(".u8"), dtype=np.uint8)
    shape = tuple(int(item) for item in meta["shape"])
    order = str(meta["order"])
    return data.reshape(shape, order=order)


def function_case(case_id: str) -> Path:
    return REFERENCE_ROOT / "functions" / case_id


def default_case() -> Path:
    return REFERENCE_ROOT / "default_case"


def assert_float_matches_golden(
    actual: NDArray[np.float64],
    expected: NDArray[np.float64],
    *,
    rtol: float = 1.0e-8,
    atol: float = 1.0e-10,
) -> None:
    assert actual.shape == expected.shape
    np.testing.assert_array_equal(np.isnan(actual), np.isnan(expected))
    np.testing.assert_allclose(actual, expected, rtol=rtol, atol=atol, equal_nan=True)
