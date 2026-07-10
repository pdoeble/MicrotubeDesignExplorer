"""Comparison helpers for two evaluated cooler sweeps.

Ports the MATLAB comparison helpers around
``nearestFeasibleAlReference`` (line 3132),
``compositeFeasibleDiameterBoundary`` (line 3167), and
``evaluateDesignScreenAtQueries`` (line 3187). Coordinates and field values are
SI internally; wall-ratio samples remain percent.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import BoolArray, FloatArray, broadcast_float_arrays
from microtubes_core.sweeps.design_space import CoolerSweepResult, DesignGrid
from microtubes_core.sweeps.screens import ScreenInputs, ScreenThresholdsSI

PLOT_WALL_RATIO_MIN_PCT = 0.0
PLOT_WALL_RATIO_MAX_PCT = 40.0
COMPOSITE_BOUNDARY_SAMPLES = 600
COMPOSITE_DIAMETER_OVERSAMPLE = 4


@dataclass(frozen=True)
class QueryEvaluation:
    """Screen-query result at arbitrary native-grid coordinates."""

    ok: BoolArray
    overall_coefficient: FloatArray
    bundle_conductance: FloatArray


@dataclass(frozen=True)
class NearestReferenceResult:
    """Nearest feasible left-reference values for right-feasible cells."""

    overall_coefficient: FloatArray
    bundle_conductance: FloatArray
    diameter: FloatArray


@dataclass(frozen=True)
class CompositeBoundaryResult:
    """Minimum feasible diameter as a function of wall-ratio percent."""

    wall_ratio_pct: FloatArray
    diameter: FloatArray


@dataclass(frozen=True)
class SweepComparisonResult:
    """Default right-vs-left comparison fields."""

    ratio_same_geometry: FloatArray
    nearest_left_reference: NearestReferenceResult
    ratio_tech_adjusted: FloatArray
    ratio_bundle_conductance_tech_adjusted: FloatArray
    boundary_left: CompositeBoundaryResult
    boundary_right: CompositeBoundaryResult


def compare_sweeps(
    left: CoolerSweepResult,
    right: CoolerSweepResult,
    *,
    plot_wall_ratio_min_pct: float = PLOT_WALL_RATIO_MIN_PCT,
    plot_wall_ratio_max_pct: float = PLOT_WALL_RATIO_MAX_PCT,
    boundary_samples: int = COMPOSITE_BOUNDARY_SAMPLES,
) -> SweepComparisonResult:
    """Return right-vs-left comparison fields for two evaluated sweeps."""
    ratio_same_geometry = right.overall_coefficient / left.overall_coefficient
    min_common_wall = max(
        left.screen_inputs.min_wall_thickness,
        right.screen_inputs.min_wall_thickness,
    )
    ratio_same_geometry = np.array(ratio_same_geometry, dtype=np.float64, copy=True)
    ratio_same_geometry[left.grid.wall_thickness < min_common_wall] = np.nan

    nearest = nearest_feasible_reference(
        left.grid,
        right.mask_all_screens_feasible,
        left.screen_inputs,
        left.screen_thresholds,
        plot_wall_ratio_min_pct=plot_wall_ratio_min_pct,
        plot_wall_ratio_max_pct=plot_wall_ratio_max_pct,
    )

    with np.errstate(invalid="ignore", divide="ignore"):
        ratio_tech_adjusted = right.overall_coefficient / nearest.overall_coefficient
        ratio_k_a_tech_adjusted = (
            right.bundle_conductance / nearest.bundle_conductance
        )
    invalid_reference = ~right.mask_all_screens_feasible | ~np.isfinite(nearest.diameter)
    ratio_tech_adjusted = np.array(ratio_tech_adjusted, dtype=np.float64, copy=True)
    ratio_k_a_tech_adjusted = np.array(ratio_k_a_tech_adjusted, dtype=np.float64, copy=True)
    ratio_tech_adjusted[invalid_reference] = np.nan
    ratio_k_a_tech_adjusted[invalid_reference] = np.nan

    boundary_left = composite_feasible_boundary(
        left.grid,
        left.screen_inputs,
        left.screen_thresholds,
        plot_wall_ratio_min_pct=plot_wall_ratio_min_pct,
        plot_wall_ratio_max_pct=plot_wall_ratio_max_pct,
        samples=boundary_samples,
    )
    boundary_right = composite_feasible_boundary(
        right.grid,
        right.screen_inputs,
        right.screen_thresholds,
        plot_wall_ratio_min_pct=plot_wall_ratio_min_pct,
        plot_wall_ratio_max_pct=plot_wall_ratio_max_pct,
        samples=boundary_samples,
    )

    return SweepComparisonResult(
        ratio_same_geometry=ratio_same_geometry,
        nearest_left_reference=nearest,
        ratio_tech_adjusted=ratio_tech_adjusted,
        ratio_bundle_conductance_tech_adjusted=ratio_k_a_tech_adjusted,
        boundary_left=boundary_left,
        boundary_right=boundary_right,
    )


def nearest_feasible_reference(
    grid: DesignGrid,
    right_feasible_mask: BoolArray,
    left_screen: ScreenInputs,
    left_thresholds: ScreenThresholdsSI,
    *,
    plot_wall_ratio_min_pct: float = PLOT_WALL_RATIO_MIN_PCT,
    plot_wall_ratio_max_pct: float = PLOT_WALL_RATIO_MAX_PCT,
) -> NearestReferenceResult:
    """Return nearest feasible left reference for each feasible right cell.

    For each feasible right point, candidates lie at equal wall ratio and
    equal-or-larger diameter, scanned from the current column to the right.
    """
    x_vec = grid.outer_diameter_axis
    t_vec = grid.wall_thickness_axis
    k_ref = np.full(grid.outer_diameter.shape, np.nan, dtype=np.float64)
    k_a_ref = np.full(grid.outer_diameter.shape, np.nan, dtype=np.float64)
    d_ref = np.full(grid.outer_diameter.shape, np.nan, dtype=np.float64)

    for col in range(x_vec.size):
        rows = np.flatnonzero(right_feasible_mask[:, col])
        if rows.size == 0:
            continue
        tau_fraction = grid.wall_ratio_pct[rows, col] / 100.0
        d_candidates = x_vec[col:]
        d_query = np.tile(d_candidates, (rows.size, 1))
        t_query = tau_fraction[:, np.newaxis] * d_query
        evaluated = evaluate_design_screen_at_queries(
            x_vec,
            t_vec,
            d_query,
            t_query,
            left_screen,
            left_thresholds,
            plot_wall_ratio_min_pct=plot_wall_ratio_min_pct,
            plot_wall_ratio_max_pct=plot_wall_ratio_max_pct,
        )
        has_reference = np.any(evaluated.ok, axis=1)
        if not np.any(has_reference):
            continue
        valid_query_rows = np.flatnonzero(has_reference)
        first_idx = np.argmax(evaluated.ok[valid_query_rows, :], axis=1)
        target_rows = rows[valid_query_rows]
        k_ref[target_rows, col] = evaluated.overall_coefficient[valid_query_rows, first_idx]
        k_a_ref[target_rows, col] = evaluated.bundle_conductance[valid_query_rows, first_idx]
        d_ref[target_rows, col] = d_query[valid_query_rows, first_idx]

    return NearestReferenceResult(
        overall_coefficient=k_ref,
        bundle_conductance=k_a_ref,
        diameter=d_ref,
    )


def composite_feasible_boundary(
    grid: DesignGrid,
    screen: ScreenInputs,
    thresholds: ScreenThresholdsSI,
    *,
    plot_wall_ratio_min_pct: float = PLOT_WALL_RATIO_MIN_PCT,
    plot_wall_ratio_max_pct: float = PLOT_WALL_RATIO_MAX_PCT,
    samples: int = COMPOSITE_BOUNDARY_SAMPLES,
) -> CompositeBoundaryResult:
    """Return smallest feasible diameter over sampled wall ratios."""
    x_vec = grid.outer_diameter_axis
    t_vec = grid.wall_thickness_axis
    wall_ratio_pct = np.linspace(
        max(float(plot_wall_ratio_min_pct), 0.05),
        float(plot_wall_ratio_max_pct),
        samples,
        dtype=np.float64,
    )
    diameter_candidates = (
        np.logspace(
            np.log10(x_vec[0] * 1.0e3),
            np.log10(x_vec[-1] * 1.0e3),
            COMPOSITE_DIAMETER_OVERSAMPLE * samples,
            dtype=np.float64,
        )
        * 1.0e-3
    )
    d_query = np.tile(diameter_candidates, (samples, 1))
    t_query = (wall_ratio_pct[:, np.newaxis] / 100.0) * d_query
    evaluated = evaluate_design_screen_at_queries(
        x_vec,
        t_vec,
        d_query,
        t_query,
        screen,
        thresholds,
        plot_wall_ratio_min_pct=plot_wall_ratio_min_pct,
        plot_wall_ratio_max_pct=plot_wall_ratio_max_pct,
    )
    diameter = np.full(wall_ratio_pct.shape, np.nan, dtype=np.float64)
    has_feasible = np.any(evaluated.ok, axis=1)
    valid_rows = np.flatnonzero(has_feasible)
    if valid_rows.size:
        first_idx = np.argmax(evaluated.ok[valid_rows, :], axis=1)
        diameter[valid_rows] = d_query[valid_rows, first_idx]
    return CompositeBoundaryResult(
        wall_ratio_pct=wall_ratio_pct[:, np.newaxis],
        diameter=diameter[:, np.newaxis],
    )


def evaluate_design_screen_at_queries(
    x_vec: FloatArray,
    t_vec: FloatArray,
    d_query: ArrayLike,
    t_query: ArrayLike,
    screen: ScreenInputs,
    thresholds: ScreenThresholdsSI,
    *,
    plot_wall_ratio_min_pct: float = PLOT_WALL_RATIO_MIN_PCT,
    plot_wall_ratio_max_pct: float = PLOT_WALL_RATIO_MAX_PCT,
) -> QueryEvaluation:
    """Evaluate all design screens at arbitrary native-grid coordinates."""
    d_q, t_q = broadcast_float_arrays(d_query, t_query)
    k_q = bilinear_interp2_native(x_vec, t_vec, screen.overall_coefficient, d_q, t_q)
    k_a_q = bilinear_interp2_native(x_vec, t_vec, screen.bundle_conductance, d_q, t_q)
    burst_q = bilinear_interp2_native(x_vec, t_vec, screen.burst_pressure, d_q, t_q)
    coolant_q = bilinear_interp2_native(x_vec, t_vec, screen.coolant_volume_flow, d_q, t_q)
    dp_q = bilinear_interp2_native(x_vec, t_vec, screen.tube_pressure_drop, d_q, t_q)
    cost_q = bilinear_interp2_native(x_vec, t_vec, screen.cost_index, d_q, t_q)
    capillary_q = bilinear_interp2_native(x_vec, t_vec, screen.capillary_rise, d_q, t_q)
    with np.errstate(invalid="ignore", divide="ignore"):
        tau_pct = 100.0 * t_q / d_q
    ok = (
        np.isfinite(k_q)
        & (k_q > 0.0)
        & np.isfinite(k_a_q)
        & (k_a_q > 0.0)
        & (t_q >= screen.min_wall_thickness)
        & (tau_pct >= plot_wall_ratio_min_pct)
        & (tau_pct <= plot_wall_ratio_max_pct)
        & (burst_q >= thresholds.min_burst_pressure)
        & (coolant_q >= thresholds.min_coolant_volume_flow)
        & (dp_q <= thresholds.max_tube_pressure_drop)
        & (cost_q < thresholds.max_cost_index)
        & (capillary_q <= thresholds.max_capillary_rise)
    )
    return QueryEvaluation(
        ok=np.asarray(ok, dtype=np.bool_),
        overall_coefficient=k_q,
        bundle_conductance=k_a_q,
    )


def bilinear_interp2_native(
    x_vec: FloatArray,
    t_vec: FloatArray,
    field: FloatArray,
    x_query: ArrayLike,
    t_query: ArrayLike,
) -> FloatArray:
    """Bilinear `interp2`-style interpolation on the native linear grid."""
    x_q, t_q = broadcast_float_arrays(x_query, t_query)
    result = np.full(x_q.shape, np.nan, dtype=np.float64)
    in_range = (
        np.isfinite(x_q)
        & np.isfinite(t_q)
        & (x_q >= x_vec[0])
        & (x_q <= x_vec[-1])
        & (t_q >= t_vec[0])
        & (t_q <= t_vec[-1])
    )
    if not np.any(in_range):
        return result

    x_indices = np.searchsorted(x_vec, x_q[in_range], side="right") - 1
    t_indices = np.searchsorted(t_vec, t_q[in_range], side="right") - 1
    x_indices = np.clip(x_indices, 0, x_vec.size - 2)
    t_indices = np.clip(t_indices, 0, t_vec.size - 2)

    x0 = x_vec[x_indices]
    x1 = x_vec[x_indices + 1]
    t0 = t_vec[t_indices]
    t1 = t_vec[t_indices + 1]
    with np.errstate(invalid="ignore", divide="ignore"):
        x_fraction = (x_q[in_range] - x0) / (x1 - x0)
        t_fraction = (t_q[in_range] - t0) / (t1 - t0)

    z00 = field[t_indices, x_indices]
    z10 = field[t_indices, x_indices + 1]
    z01 = field[t_indices + 1, x_indices]
    z11 = field[t_indices + 1, x_indices + 1]
    valid_corners = np.isfinite(z00) & np.isfinite(z10) & np.isfinite(z01) & np.isfinite(z11)
    interpolated = (
        (1.0 - x_fraction) * (1.0 - t_fraction) * z00
        + x_fraction * (1.0 - t_fraction) * z10
        + (1.0 - x_fraction) * t_fraction * z01
        + x_fraction * t_fraction * z11
    )

    flat_result = result[in_range]
    flat_result[valid_corners] = interpolated[valid_corners]
    result[in_range] = flat_result
    return result
