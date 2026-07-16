"""Tube supply cost index model.

Port of ``calcTubeSupplyCostIndex`` in
``source_materials/Waermedurchgang_V10_physical.m`` function
``calcTubeSupplyCostIndex`` (currently line 4203). The model is a
relative tube-count and effective-length index; it is not a market price fit.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import FloatArray
from microtubes_core.models.geometry import (
    REFERENCE_N_LONGITUDINAL,
    REFERENCE_N_TRANSVERSE,
    REFERENCE_OUTER_DIAMETER,
    TubeArrangementName,
    tube_count_in_footprint,
)


def tube_supply_cost_index(
    d_o: ArrayLike,
    *,
    pitch_transverse_ratio: float,
    pitch_longitudinal_ratio: float,
    arrangement: TubeArrangementName,
    material_reference_index: float,
    active_length: float,
    overhang_total: float = 0.0,
    scrap_factor: float = 1.0,
    reference_outer_diameter: float = REFERENCE_OUTER_DIAMETER,
    reference_n_transverse: int = REFERENCE_N_TRANSVERSE,
    reference_n_longitudinal: int = REFERENCE_N_LONGITUDINAL,
) -> tuple[FloatArray, FloatArray, FloatArray]:
    """Return cost index, discrete tube count, and effective raw tube length.

    All lengths are SI. ``material_reference_index`` is the normalized index at
    the reference geometry from the paper defaults.
    """
    outer_diameter = np.asarray(d_o, dtype=np.float64)
    effective_length = (float(active_length) + float(overhang_total)) * float(scrap_factor)
    if not np.isfinite(effective_length) or effective_length <= 0.0:
        raise ValueError("Cost model effective tube length must be positive.")

    tube_count = tube_count_in_footprint(
        outer_diameter,
        pitch_transverse_ratio=pitch_transverse_ratio,
        pitch_longitudinal_ratio=pitch_longitudinal_ratio,
        arrangement=arrangement,
        reference_outer_diameter=reference_outer_diameter,
        reference_n_transverse=reference_n_transverse,
        reference_n_longitudinal=reference_n_longitudinal,
    )
    reference_count = _reference_tube_count(
        arrangement=arrangement,
        reference_n_transverse=reference_n_transverse,
        reference_n_longitudinal=reference_n_longitudinal,
    )
    if not np.isfinite(reference_count) or reference_count <= 0.0:
        raise ValueError("Cost model reference tube count must be positive.")

    raw_tube_length = tube_count * effective_length
    reference_raw_length = reference_count * effective_length
    cost_per_raw_length_index = float(material_reference_index) / reference_raw_length
    cost_index = raw_tube_length * cost_per_raw_length_index
    cost_index[~np.isfinite(outer_diameter) | (outer_diameter <= 0.0)] = np.nan
    return cost_index, tube_count, raw_tube_length


def _reference_tube_count(
    *,
    arrangement: TubeArrangementName,
    reference_n_transverse: int,
    reference_n_longitudinal: int,
) -> float:
    if arrangement == "inline":
        return float(reference_n_transverse * reference_n_longitudinal)
    if arrangement == "staggered":
        rows_full = int(np.ceil(reference_n_longitudinal / 2.0))
        rows_shifted = int(np.floor(reference_n_longitudinal / 2.0))
        shifted_transverse = int(np.floor(reference_n_transverse - 0.5))
        return float(rows_full * reference_n_transverse + rows_shifted * max(shifted_transverse, 0))
    raise ValueError(f"Unknown tube arrangement: {arrangement}")
