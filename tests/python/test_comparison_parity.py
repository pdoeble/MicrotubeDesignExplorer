"""Default-case comparison parity for tech-adjusted reference logic."""

from __future__ import annotations

import numpy as np
from golden_loader import assert_float_matches_golden, default_case, read_f64

from microtubes_core.defaults import paper_default_request
from microtubes_core.sweeps.comparison import compare_sweeps
from microtubes_core.sweeps.design_space import build_design_grid, evaluate_cooler_sweep

M_TO_MM = 1.0e3


def test_default_comparison_fields_match_goldens() -> None:
    request = paper_default_request()
    case_dir = default_case()
    grid = build_design_grid(request.sweep)
    left = evaluate_cooler_sweep(request.sweep, request.cooler_left, grid=grid)
    right = evaluate_cooler_sweep(request.sweep, request.cooler_right, grid=grid)

    comparison = compare_sweeps(left, right)

    assert_float_matches_golden(
        comparison.ratio_same_geometry,
        read_f64(case_dir / "ratio_same_geometry"),
    )
    assert_float_matches_golden(
        comparison.nearest_left_reference.diameter * M_TO_MM,
        read_f64(case_dir / "dAlNearest_mm"),
    )
    assert_float_matches_golden(
        comparison.ratio_tech_adjusted,
        read_f64(case_dir / "ratio_tech_adjusted"),
    )
    assert_float_matches_golden(
        comparison.ratio_bundle_conductance_tech_adjusted,
        read_f64(case_dir / "ratio_kA_tech_adjusted"),
    )
    assert int(np.count_nonzero(np.isfinite(comparison.nearest_left_reference.diameter))) == 7787


def test_default_composite_boundaries_match_goldens() -> None:
    request = paper_default_request()
    case_dir = default_case()
    grid = build_design_grid(request.sweep)
    left = evaluate_cooler_sweep(request.sweep, request.cooler_left, grid=grid)
    right = evaluate_cooler_sweep(request.sweep, request.cooler_right, grid=grid)

    comparison = compare_sweeps(left, right)

    assert_float_matches_golden(
        comparison.boundary_left.wall_ratio_pct,
        read_f64(case_dir / "boundaryYPct"),
    )
    assert_float_matches_golden(
        comparison.boundary_left.diameter * M_TO_MM,
        read_f64(case_dir / "boundaryAlXmm"),
    )
    assert_float_matches_golden(
        comparison.boundary_right.diameter * M_TO_MM,
        read_f64(case_dir / "boundaryPAXmm"),
    )
