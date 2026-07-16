"""Default-case sweep parity for grid, raw fields, and design masks."""

from __future__ import annotations

import numpy as np
import pytest
from golden_loader import assert_float_matches_golden, default_case, read_f64, read_u8

from microtubes_core.defaults import paper_default_request
from microtubes_core.sweeps.design_space import build_design_grid, evaluate_cooler_sweep

M_TO_MM = 1.0e3
PA_TO_BAR = 1.0e-5
M3S_TO_LMIN = 60000.0


def test_default_grid_and_common_sweep_fields_match_goldens() -> None:
    request = paper_default_request()
    case_dir = default_case()
    grid = build_design_grid(request.sweep)
    left = evaluate_cooler_sweep(request.sweep, request.cooler_left, grid=grid)

    assert_float_matches_golden(
        grid.outer_diameter * M_TO_MM, read_f64(case_dir / "da_mm")
    )
    assert_float_matches_golden(grid.wall_ratio_pct, read_f64(case_dir / "Y_pct"))
    np.testing.assert_array_equal(
        grid.mask_invalid_geometry.astype(np.uint8),
        read_u8(case_dir / "mask_invalid_di"),
    )
    np.testing.assert_array_equal(
        grid.mask_wall_ratio_range.astype(np.uint8), read_u8(case_dir / "mask_y_calc")
    )

    for actual, golden_name, scale in (
        (left.alpha_outer, "alpha_a", 1.0),
        (left.alpha_inner, "alpha_i", 1.0),
        (left.re_inner, "Re_i_raw", 1.0),
        (left.re_outer_simple, "Re_o_simple_raw", 1.0),
        (left.re_outer_vdi, "Re_o_vdi_raw", 1.0),
        (left.graetz_inner, "Gz_raw", 1.0),
        (left.tube_pressure_drop, "dp_i_fric_bar_raw", PA_TO_BAR),
        (left.coolant_volume_flow, "coolant_Vdot_Lmin_raw", M3S_TO_LMIN),
        (left.coolant_mass_flow, "coolant_mdot_kg_s_raw", 1.0),
        (left.tube_count_continuous, "N_tubes_raw", 1.0),
        (left.clear_spacing_transverse, "clearSpacingTrans_mm_raw", M_TO_MM),
        (left.clear_spacing_longitudinal, "clearSpacingLong_mm_raw", M_TO_MM),
        (
            left.clear_spacing_closest_inline,
            "clearSpacingClosestInline_mm_raw",
            M_TO_MM,
        ),
        (
            left.clear_spacing_closest_staggered,
            "clearSpacingClosestStaggered_mm_raw",
            M_TO_MM,
        ),
    ):
        assert_float_matches_golden(actual * scale, read_f64(case_dir / golden_name))


@pytest.mark.parametrize(
    ("side", "prefix", "tech_mask_name", "feasible_mask_name"),
    [
        ("left", "Al", "mask_tech_al", "mask_design_feasible_al"),
        ("right", "Poly", "mask_tech_poly", "mask_design_feasible_pa"),
    ],
)
def test_default_material_sweep_fields_and_masks_match_goldens(
    side: str,
    prefix: str,
    tech_mask_name: str,
    feasible_mask_name: str,
) -> None:
    request = paper_default_request()
    case_dir = default_case()
    grid = build_design_grid(request.sweep)
    cooler = request.cooler_left if side == "left" else request.cooler_right
    result = evaluate_cooler_sweep(request.sweep, cooler, grid=grid)

    np.testing.assert_array_equal(
        result.mask_below_min_wall.astype(np.uint8), read_u8(case_dir / tech_mask_name)
    )
    np.testing.assert_array_equal(
        result.mask_all_screens_feasible.astype(np.uint8),
        read_u8(case_dir / feasible_mask_name),
    )

    for actual, golden_name, scale in (
        (result.overall_coefficient, f"k_{prefix}_raw", 1.0),
        (result.wall_biot, f"Bi_{prefix if prefix == 'Al' else 'PA'}_raw", 1.0),
        (result.bundle_conductance, f"kA_{prefix}_raw_WK", 1.0),
        (result.burst_pressure, f"pB_{prefix}_bar_raw", PA_TO_BAR),
        (
            result.burst_pressure_tolerance_standard,
            f"pB_{prefix}_tol_std_bar",
            PA_TO_BAR,
        ),
        (
            result.burst_pressure_tolerance_medical,
            f"pB_{prefix}_tol_med_bar",
            PA_TO_BAR,
        ),
        (result.cost_index, f"cost_{prefix}_index_raw", 1.0),
        (result.resistance_inner, f"Ri_{prefix}_raw", 1.0),
        (result.resistance_wall, f"Rw_{prefix}_raw", 1.0),
        (result.resistance_outer, f"Ro_{prefix}_raw", 1.0),
    ):
        assert_float_matches_golden(actual * scale, read_f64(case_dir / golden_name))

    sensitivity_expected = read_f64(case_dir / "s_field")
    reynolds = result.re_inner
    laminar = np.isfinite(reynolds) & (reynolds <= 2200.0)
    transition = np.isfinite(reynolds) & (reynolds >= 2310.0) & (reynolds <= 9990.0)
    np.testing.assert_allclose(
        result.g1_diameter_sensitivity[laminar],
        sensitivity_expected[laminar],
        rtol=0.0,
        atol=1.0e-6,
    )
    np.testing.assert_allclose(
        result.g1_diameter_sensitivity[transition],
        sensitivity_expected[transition],
        rtol=0.0,
        atol=4.0e-4,
    )

    capillary_name = (
        "capillaryRiseAl_raw_g10_mm" if prefix == "Al" else "capillaryRisePA_raw_g10_mm"
    )
    assert_float_matches_golden(
        result.capillary_rise * M_TO_MM,
        read_f64(case_dir / capillary_name),
    )
    capillary_prefix = "Al" if prefix == "Al" else "PA"
    for actual, acceleration in (
        (result.capillary_rise_1g, "g1"),
        (result.capillary_rise_5g, "g5"),
        (result.capillary_rise_10g, "g10"),
    ):
        assert_float_matches_golden(
            actual * M_TO_MM,
            read_f64(
                case_dir / f"capillaryRise{capillary_prefix}_raw_{acceleration}_mm"
            ),
        )


def test_default_feasibility_counts_match_matlab_diagnostics() -> None:
    request = paper_default_request()
    grid = build_design_grid(request.sweep)
    left = evaluate_cooler_sweep(request.sweep, request.cooler_left, grid=grid)
    right = evaluate_cooler_sweep(request.sweep, request.cooler_right, grid=grid)

    assert int(np.count_nonzero(left.mask_all_screens_feasible)) == 8482
    assert int(np.count_nonzero(right.mask_all_screens_feasible)) == 7787
