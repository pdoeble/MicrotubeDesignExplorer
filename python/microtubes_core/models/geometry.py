"""Geometry helpers for the microtube design-space model.

The continuous-count and spacing equations are ported from
``Waermedurchgang_V10_physical.m`` lines 489-575. The discrete footprint
count follows ``calcTubeCountInFootprint`` at line 3999.
"""

from __future__ import annotations

from typing import Literal

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import FloatArray, broadcast_float_arrays

TubeArrangementName = Literal["inline", "staggered"]

REFERENCE_OUTER_DIAMETER = 1.0e-3
REFERENCE_N_TRANSVERSE = 30
REFERENCE_N_LONGITUDINAL = 36


def inner_diameter(d_o: ArrayLike, t_wall: ArrayLike) -> FloatArray:
    """Return nominal inner diameter ``d_i = d_o - 2 t``."""
    outer_diameter, wall = broadcast_float_arrays(d_o, t_wall)
    return outer_diameter - 2.0 * wall


def wall_ratio_percent(t_wall: ArrayLike, d_o: ArrayLike) -> FloatArray:
    """Return wall ratio ``100 t / d_o`` in percent."""
    wall, outer_diameter = broadcast_float_arrays(t_wall, d_o)
    with np.errstate(invalid="ignore", divide="ignore"):
        return 100.0 * wall / outer_diameter


def pitch_spacing(
    d_o: ArrayLike,
    *,
    pitch_transverse_ratio: float,
    pitch_longitudinal_ratio: float,
) -> tuple[FloatArray, FloatArray]:
    """Return transverse and longitudinal pitch distances."""
    outer_diameter = np.asarray(d_o, dtype=np.float64)
    return (
        float(pitch_transverse_ratio) * outer_diameter,
        float(pitch_longitudinal_ratio) * outer_diameter,
    )


def clear_spacings(
    d_o: ArrayLike,
    *,
    pitch_transverse_ratio: float,
    pitch_longitudinal_ratio: float,
) -> tuple[FloatArray, FloatArray, FloatArray, FloatArray]:
    """Return transverse, longitudinal, inline-min and staggered-min clear spacing."""
    outer_diameter = np.asarray(d_o, dtype=np.float64)
    pitch_transverse, pitch_longitudinal = pitch_spacing(
        outer_diameter,
        pitch_transverse_ratio=pitch_transverse_ratio,
        pitch_longitudinal_ratio=pitch_longitudinal_ratio,
    )
    transverse = pitch_transverse - outer_diameter
    longitudinal = pitch_longitudinal - outer_diameter
    closest_inline = np.minimum(transverse, longitudinal)
    closest_staggered = np.minimum(
        transverse, np.sqrt(pitch_longitudinal**2 + (0.5 * pitch_transverse) ** 2) - outer_diameter
    )
    return transverse, longitudinal, closest_inline, closest_staggered


def continuous_tube_count(
    d_o: ArrayLike,
    *,
    footprint_width: float,
    footprint_depth: float,
    pitch_transverse_ratio: float,
    pitch_longitudinal_ratio: float,
) -> FloatArray:
    """Return continuous geometrically similar tube count in a fixed footprint."""
    outer_diameter = np.asarray(d_o, dtype=np.float64)
    with np.errstate(invalid="ignore", divide="ignore"):
        count = (
            float(footprint_width)
            * float(footprint_depth)
            / (
                float(pitch_transverse_ratio)
                * float(pitch_longitudinal_ratio)
                * outer_diameter**2
            )
        )
    return count


def bundle_outer_area(tube_count: ArrayLike, d_o: ArrayLike, *, length: float) -> FloatArray:
    """Return total outer tube area ``N pi d_o L``."""
    count, outer_diameter = broadcast_float_arrays(tube_count, d_o)
    return count * np.pi * outer_diameter * float(length)


def tube_count_in_footprint(
    d_o: ArrayLike,
    *,
    pitch_transverse_ratio: float,
    pitch_longitudinal_ratio: float,
    arrangement: TubeArrangementName,
    reference_outer_diameter: float = REFERENCE_OUTER_DIAMETER,
    reference_n_transverse: int = REFERENCE_N_TRANSVERSE,
    reference_n_longitudinal: int = REFERENCE_N_LONGITUDINAL,
) -> FloatArray:
    """Return floored discrete tube count in the reference footprint.

    The count uses direct floating-point ``floor`` to preserve MATLAB parity at
    near-integer boundaries in the function-level goldens.
    """
    outer_diameter = np.asarray(d_o, dtype=np.float64)
    a = float(pitch_transverse_ratio)
    b = float(pitch_longitudinal_ratio)
    d_ref = float(reference_outer_diameter)
    if any(value <= 0.0 or not np.isfinite(value) for value in (a, b, d_ref)):
        raise ValueError("Pitch ratios and reference diameter must be positive finite values.")

    footprint_transverse = float(reference_n_transverse) * a * d_ref
    footprint_longitudinal = float(reference_n_longitudinal) * b * d_ref
    with np.errstate(invalid="ignore", divide="ignore"):
        pitch_transverse = a * outer_diameter
        pitch_longitudinal = b * outer_diameter
        n_transverse = np.maximum(np.floor(footprint_transverse / pitch_transverse), 0.0)
        n_longitudinal = np.maximum(
            np.floor(footprint_longitudinal / pitch_longitudinal), 0.0
        )

        if arrangement == "inline":
            count = n_transverse * n_longitudinal
        elif arrangement == "staggered":
            rows_full = np.ceil(n_longitudinal / 2.0)
            rows_shifted = np.floor(n_longitudinal / 2.0)
            shifted_transverse = np.maximum(
                np.floor((footprint_transverse - 0.5 * pitch_transverse) / pitch_transverse),
                0.0,
            )
            count = rows_full * n_transverse + rows_shifted * shifted_transverse
        else:
            raise ValueError(f"Unknown tube arrangement: {arrangement}")

    bad = (
        ~np.isfinite(outer_diameter)
        | (outer_diameter <= 0.0)
        | ~np.isfinite(n_transverse)
        | ~np.isfinite(n_longitudinal)
    )
    count = np.asarray(count, dtype=np.float64)
    count[bad] = np.nan
    return count
