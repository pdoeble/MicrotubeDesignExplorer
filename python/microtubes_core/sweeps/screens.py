"""Design-screen masks for microtube sweeps.

Port of ``makeDesignScreenData`` and ``maskDesignBoundaryKAMap`` from
``source_materials/Waermedurchgang_V10_physical.m`` lines 3070-3096, using SI units.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from microtubes_core.models._array import BoolArray, FloatArray


@dataclass(frozen=True)
class ScreenInputs:
    """Field bundle consumed by all-screen feasibility logic."""

    min_wall_thickness: float
    overall_coefficient: FloatArray
    bundle_conductance: FloatArray
    burst_pressure: FloatArray
    coolant_volume_flow: FloatArray
    tube_pressure_drop: FloatArray
    cost_index: FloatArray
    capillary_rise: FloatArray


@dataclass(frozen=True)
class ScreenThresholdsSI:
    """All-screen threshold values in SI units."""

    min_burst_pressure: float
    min_coolant_volume_flow: float
    max_tube_pressure_drop: float
    max_cost_index: float
    max_capillary_rise: float


def all_screen_feasible_mask(
    d_o: FloatArray,
    wall_ratio_pct: FloatArray,
    screen: ScreenInputs,
    thresholds: ScreenThresholdsSI,
) -> BoolArray:
    """Return the all-screen feasible mask.

    The local wall thickness is reconstructed as ``d_o * tau / 100`` to match
    MATLAB's `X_mm .* Y_lin ./ 100` operation order.
    """
    local_wall = d_o * wall_ratio_pct / 100.0
    feasible = (
        np.isfinite(screen.bundle_conductance)
        & (screen.bundle_conductance > 0.0)
        & (local_wall >= screen.min_wall_thickness)
        & (screen.burst_pressure >= thresholds.min_burst_pressure)
        & (screen.coolant_volume_flow >= thresholds.min_coolant_volume_flow)
        & (screen.tube_pressure_drop <= thresholds.max_tube_pressure_drop)
        & (screen.cost_index < thresholds.max_cost_index)
        & (screen.capillary_rise <= thresholds.max_capillary_rise)
    )
    return np.asarray(feasible, dtype=np.bool_)


def mask_screened_conductance(
    d_o: FloatArray,
    wall_ratio_pct: FloatArray,
    screen: ScreenInputs,
    thresholds: ScreenThresholdsSI,
) -> tuple[FloatArray, BoolArray]:
    """Return ``kA`` with infeasible cells masked plus the feasibility mask."""
    feasible = all_screen_feasible_mask(d_o, wall_ratio_pct, screen, thresholds)
    conductance = np.array(screen.bundle_conductance, dtype=np.float64, copy=True)
    conductance[~feasible] = np.nan
    return conductance, feasible
