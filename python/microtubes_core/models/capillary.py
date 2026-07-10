"""Capillary-rise screen model for potting resin between adjacent tubes.

Ported from ``Waermedurchgang_V10_physical.m`` lines 649-669. The approved
model uses ``h = C_cap / (s * G)`` with a full clear-spacing gap ``s`` and
effective acceleration multiplier ``G``.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import FloatArray, broadcast_float_arrays


def capillary_rise(
    capillary_constant: ArrayLike,
    clear_spacing: ArrayLike,
    acceleration_over_g: ArrayLike,
) -> FloatArray:
    """Return capillary rise in metres."""
    constant, spacing, acceleration = broadcast_float_arrays(
        capillary_constant, clear_spacing, acceleration_over_g
    )
    with np.errstate(invalid="ignore", divide="ignore"):
        return constant / (spacing * acceleration)
