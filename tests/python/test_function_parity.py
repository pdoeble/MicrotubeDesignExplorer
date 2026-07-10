"""M3 function-level golden parity for ported physical submodels."""

from __future__ import annotations

from pathlib import Path
from typing import Any, cast

import numpy as np
import pytest
from golden_loader import (
    assert_float_matches_golden,
    default_case,
    function_case,
    read_f64,
    read_json,
    read_u8,
)
from numpy.typing import NDArray

from microtubes_core.defaults import CAPILLARY_CONSTANT_AL, CAPILLARY_CONSTANT_PA
from microtubes_core.models.capillary import capillary_rise
from microtubes_core.models.correlations import (
    InnerBoundary,
    vdi_g1_internal_tube_alpha,
    vdi_g7_inline_tube_bank_alpha,
)
from microtubes_core.models.cost import tube_supply_cost_index
from microtubes_core.models.geometry import (
    bundle_outer_area,
    clear_spacings,
    continuous_tube_count,
    inner_diameter,
    wall_ratio_percent,
)
from microtubes_core.models.pressure import (
    darcy_friction_factor_smooth_tube,
    effective_inner_diameter_for_burst,
    lame_burst_pressure,
    tube_friction_pressure_drop,
)
from microtubes_core.models.resistances import overall_coefficient_outer, resistance_parts_outer

MM_TO_M = 1.0e-3
BAR_TO_PA = 1.0e5


def _inputs(case_dir: Path) -> dict[str, Any]:
    return read_json(case_dir / "inputs.json")


def _as_m(values_mm: NDArray[np.float64]) -> NDArray[np.float64]:
    return values_mm * MM_TO_M


@pytest.mark.parametrize(
    "case_id",
    [
        "g7_alpha_o_a2b15",
        "g7_alpha_o_air_alt",
        "g7_alpha_o_b09",
        "g7_alpha_o_base",
        "g7_alpha_o_finite_rows",
        "g7_alpha_o_K11",
        "g7_alpha_o_v1",
    ],
)
def test_vdi_g7_air_side_matches_function_goldens(case_id: str) -> None:
    case_dir = function_case(case_id)
    inputs = _inputs(case_dir)
    model = inputs["model_outer"]
    air = inputs["air"]
    alpha, reynolds = vdi_g7_inline_tube_bank_alpha(
        inputs["v_a_ms"],
        _as_m(read_f64(case_dir / "d_o_mm")),
        pitch_transverse_ratio=model["a_pitch_transverse"],
        pitch_longitudinal_ratio=model["b_pitch_longitudinal"],
        n_rows=model["n_rows"],
        use_finite_row_correction=model["use_finite_row_correction"],
        property_correction=model["property_correction_K"],
        kinematic_viscosity=air["nu_m2s"],
        prandtl=air["Pr"],
        thermal_conductivity=air["lambda_WmK"],
    )
    assert_float_matches_golden(alpha, read_f64(case_dir / "alpha_o"))
    assert_float_matches_golden(reynolds, read_f64(case_dir / "Re_cl"))


@pytest.mark.parametrize(
    "case_id",
    [
        "g1_alpha_i_base",
        "g1_alpha_i_chf",
        "g1_alpha_i_L100",
        "g1_alpha_i_prwall",
        "g1_alpha_i_v01",
        "g1_alpha_i_v2",
        "g1_alpha_i_water",
    ],
)
def test_vdi_g1_tube_side_matches_function_goldens(case_id: str) -> None:
    case_dir = function_case(case_id)
    inputs = _inputs(case_dir)
    model = inputs["model_inner"]
    liquid = inputs["liquid"]
    alpha = vdi_g1_internal_tube_alpha(
        inputs["v_i_ms"],
        _as_m(read_f64(case_dir / "d_i_mm")),
        length=model["length_m"],
        boundary_condition=cast(InnerBoundary, model["boundary_condition"]),
        apply_liquid_pr_wall_correction=model["apply_liquid_Pr_wall_correction"],
        pr_wall=model["Pr_wall"],
        kinematic_viscosity=liquid["nu_m2s"],
        prandtl=liquid["Pr"],
        thermal_conductivity=liquid["lambda_WmK"],
    )
    assert_float_matches_golden(alpha, read_f64(case_dir / "alpha_i"))


def test_darcy_friction_factor_matches_function_golden() -> None:
    case_dir = function_case("friction_factor")
    friction = darcy_friction_factor_smooth_tube(read_f64(case_dir / "Re"))
    assert_float_matches_golden(friction, read_f64(case_dir / "fD"))


@pytest.mark.parametrize(
    "case_id",
    ["dp_friction_base", "dp_friction_L100", "dp_friction_v2", "dp_friction_water"],
)
def test_tube_friction_pressure_drop_matches_function_goldens(case_id: str) -> None:
    case_dir = function_case(case_id)
    inputs = _inputs(case_dir)
    model = inputs["model_inner"]
    liquid = inputs["liquid"]
    pressure_drop = tube_friction_pressure_drop(
        inputs["v_i_ms"],
        _as_m(read_f64(case_dir / "d_i_mm")),
        length=model["length_m"],
        density=liquid["rho_kgm3"],
        kinematic_viscosity=liquid["nu_m2s"],
    )
    assert_float_matches_golden(pressure_drop, read_f64(case_dir / "dp_bar") * BAR_TO_PA)


def test_lame_burst_pressure_matches_function_goldens() -> None:
    case_dir = function_case("burst_pressure")
    inputs = _inputs(case_dir)
    outer_diameter = _as_m(read_f64(case_dir / "DO_mm"))
    wall = _as_m(read_f64(case_dir / "T_nom_mm"))
    for tolerance_mm, tolerance_name in zip(inputs["tol_mm"], inputs["tol_names"], strict=True):
        effective = effective_inner_diameter_for_burst(
            outer_diameter, wall, float(tolerance_mm) * MM_TO_M
        )
        assert_float_matches_golden(
            effective, _as_m(read_f64(case_dir / f"DI_eff_{tolerance_name}_mm"))
        )
        for material, tensile_mpa in (
            ("Al", inputs["Rm_Al_MPa"]),
            ("Poly", inputs["Rm_Poly_MPa"]),
        ):
            pressure = lame_burst_pressure(outer_diameter, effective, float(tensile_mpa) * 1.0e6)
            assert_float_matches_golden(
                pressure, read_f64(case_dir / f"pB_{material}_{tolerance_name}_bar") * BAR_TO_PA
            )


@pytest.mark.parametrize(
    "case_id",
    ["cost_inline_al", "cost_inline_poly", "cost_staggered_al", "cost_staggered_poly"],
)
def test_tube_supply_cost_matches_function_goldens(case_id: str) -> None:
    case_dir = function_case(case_id)
    inputs = _inputs(case_dir)
    cost_params = inputs["cost_params"]
    model = inputs["model_outer"]
    material = str(inputs["material"]).lower()
    reference_index = (
        cost_params["reference_index_Al"]
        if material in {"al", "alu", "aluminum"}
        else cost_params["reference_index_Poly"]
    )
    cost_index, tube_count, raw_length = tube_supply_cost_index(
        _as_m(read_f64(case_dir / "d_o_mm")),
        pitch_transverse_ratio=model["a_pitch_transverse"],
        pitch_longitudinal_ratio=model["b_pitch_longitudinal"],
        arrangement=cost_params["arrangement"],
        material_reference_index=reference_index,
        active_length=cost_params["active_length_mm"] * MM_TO_M,
        overhang_total=cost_params["overhang_total_mm"] * MM_TO_M,
        scrap_factor=cost_params["scrap_factor"],
        reference_outer_diameter=cost_params["reference_do_mm"] * MM_TO_M,
        reference_n_transverse=cost_params["reference_n_transverse"],
        reference_n_longitudinal=cost_params["reference_n_longitudinal"],
    )
    assert_float_matches_golden(cost_index, read_f64(case_dir / "cost_index"))
    np.testing.assert_array_equal(tube_count, read_f64(case_dir / "n_tubes"))
    assert_float_matches_golden(raw_length, _as_m(read_f64(case_dir / "raw_tube_length_mm")))


def test_default_geometry_capillary_and_resistance_fields_match_goldens() -> None:
    case_dir = default_case()
    outer_axis = _as_m(read_f64(case_dir / "da_mm")[0, :])
    wall_axis = _as_m(read_f64(case_dir / "t_mm").reshape(-1))
    outer_diameter, wall = np.meshgrid(outer_axis, wall_axis)
    wall_ratio = wall_ratio_percent(wall, outer_diameter)
    mask_y = read_u8(case_dir / "mask_y_calc").astype(bool)
    mask_invalid = read_u8(case_dir / "mask_invalid_di").astype(bool)

    assert_float_matches_golden(wall_ratio, read_f64(case_dir / "Y_pct"))

    spacing_t, spacing_l, spacing_inline, spacing_staggered = clear_spacings(
        outer_diameter,
        pitch_transverse_ratio=3.28,
        pitch_longitudinal_ratio=2.0,
    )
    for actual, golden_name in (
        (spacing_t, "clearSpacingTrans_mm_raw"),
        (spacing_l, "clearSpacingLong_mm_raw"),
        (spacing_inline, "clearSpacingClosestInline_mm_raw"),
        (spacing_staggered, "clearSpacingClosestStaggered_mm_raw"),
    ):
        expected = _as_m(read_f64(case_dir / golden_name))
        actual_masked = actual.copy()
        actual_masked[mask_y] = np.nan
        assert_float_matches_golden(actual_masked, expected)

    tube_count = continuous_tube_count(
        outer_diameter,
        footprint_width=30 * 3.28e-3,
        footprint_depth=36 * 2.0e-3,
        pitch_transverse_ratio=3.28,
        pitch_longitudinal_ratio=2.0,
    )
    tube_count[mask_y] = np.nan
    assert_float_matches_golden(tube_count, read_f64(case_dir / "N_tubes_raw"))

    bundle_area = bundle_outer_area(tube_count, outer_diameter, length=0.160)
    alpha_inner = read_f64(case_dir / "alpha_i")
    alpha_outer = read_f64(case_dir / "alpha_a")
    inner = inner_diameter(outer_diameter, wall)
    inner[mask_invalid] = np.nan

    for conductivity, prefix in ((220.0, "Al"), (0.25, "Poly")):
        overall = overall_coefficient_outer(
            outer_diameter,
            inner,
            alpha_inner,
            alpha_outer,
            wall_thermal_conductivity=conductivity,
        )
        overall[mask_y] = np.nan
        assert_float_matches_golden(overall, read_f64(case_dir / f"k_{prefix}_raw"))
        assert_float_matches_golden(
            overall * bundle_area, read_f64(case_dir / f"kA_{prefix}_raw_WK")
        )

        r_inner, r_wall, r_outer = resistance_parts_outer(
            outer_diameter,
            inner,
            alpha_inner,
            alpha_outer,
            wall_thermal_conductivity=conductivity,
        )
        for actual, golden_name in (
            (r_inner, f"Ri_{prefix}_raw"),
            (r_wall, f"Rw_{prefix}_raw"),
            (r_outer, f"Ro_{prefix}_raw"),
        ):
            actual[mask_y] = np.nan
            assert_float_matches_golden(actual, read_f64(case_dir / golden_name))

    spacing_for_capillary = spacing_inline.copy()
    spacing_for_capillary[mask_y] = np.nan
    assert_float_matches_golden(
        capillary_rise(CAPILLARY_CONSTANT_AL, spacing_for_capillary, 10.0),
        _as_m(read_f64(case_dir / "capillaryRiseAl_raw_g10_mm")),
    )
    assert_float_matches_golden(
        capillary_rise(CAPILLARY_CONSTANT_PA, spacing_for_capillary, 10.0),
        _as_m(read_f64(case_dir / "capillaryRisePA_raw_g10_mm")),
    )
