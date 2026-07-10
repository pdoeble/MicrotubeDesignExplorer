"""Small NumPy helpers for physical submodels."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray

type FloatArray = NDArray[np.float64]


def as_float_array(value: ArrayLike) -> FloatArray:
    """Return ``value`` as a float64 NumPy array without hidden unit changes."""
    return np.asarray(value, dtype=np.float64)


def nan_array(shape: tuple[int, ...]) -> FloatArray:
    """Allocate a float64 array filled with NaN."""
    return np.full(shape, np.nan, dtype=np.float64)


def broadcast_float_arrays(*values: ArrayLike) -> tuple[FloatArray, ...]:
    """Broadcast values as float64 arrays."""
    arrays = tuple(as_float_array(value) for value in values)
    return tuple(np.asarray(item, dtype=np.float64) for item in np.broadcast_arrays(*arrays))
