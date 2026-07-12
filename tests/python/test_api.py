"""Public API tests for SimulationRequest -> SimulationResultPayload."""

from __future__ import annotations

import numpy as np
from golden_loader import assert_float_matches_golden, default_case, read_f64, read_u8

from microtubes_core.api import SimulationResult, request_sha256, simulate
from microtubes_core.contracts import GridFieldRef, SimulationResultPayload, WarningCode
from microtubes_core.defaults import paper_default_request

M_TO_MM = 1.0e3
PA_TO_BAR = 1.0e-5


def test_simulate_returns_valid_payload_and_buffers() -> None:
    request = paper_default_request()
    result = simulate(request)
    restored = SimulationResultPayload.model_validate(result.payload.model_dump(mode="json"))

    assert restored == result.payload
    assert result.payload.request_hash == request_sha256(request)
    assert result.payload.provenance.request_hash == result.payload.request_hash
    assert result.payload.cooler_left.warnings == []
    assert result.payload.cooler_right.warnings == []
    refs = _all_refs(result)
    assert [ref.buffer_index for ref in refs] == list(range(len(refs)))
    assert len(result.arrays) == len(refs)
    for ref in refs:
        array = result.arrays[ref.buffer_index]
        assert array.dtype == np.float64
        assert array.flags.c_contiguous
        assert array.shape == ref.shape


def test_api_default_axes_and_fields_match_goldens() -> None:
    case_dir = default_case()
    result = simulate(paper_default_request())

    np.testing.assert_allclose(
        np.array(result.payload.outer_diameter_axis) * M_TO_MM,
        read_f64(case_dir / "da_mm")[0, :],
        rtol=1.0e-12,
        atol=1.0e-14,
    )
    assert_float_matches_golden(
        _field(result, result.payload.cooler_left.fields, "overall_coefficient"),
        read_f64(case_dir / "k_Al_raw"),
    )
    assert_float_matches_golden(
        _field(result, result.payload.cooler_right.fields, "overall_coefficient"),
        read_f64(case_dir / "k_Poly_raw"),
    )
    assert_float_matches_golden(
        _field(result, result.payload.cooler_left.fields, "burst_pressure_tolerance_standard")
        * PA_TO_BAR,
        read_f64(case_dir / "pB_Al_tol_std_bar"),
    )
    assert_float_matches_golden(
        _field(result, result.payload.cooler_left.fields, "burst_pressure_tolerance_medical")
        * PA_TO_BAR,
        read_f64(case_dir / "pB_Al_tol_med_bar"),
    )
    assert_float_matches_golden(
        _field(result, result.payload.cooler_right.fields, "burst_pressure_tolerance_standard")
        * PA_TO_BAR,
        read_f64(case_dir / "pB_Poly_tol_std_bar"),
    )
    assert_float_matches_golden(
        _field(result, result.payload.cooler_right.fields, "burst_pressure_tolerance_medical")
        * PA_TO_BAR,
        read_f64(case_dir / "pB_Poly_tol_med_bar"),
    )
    for refs, prefix in (
        (result.payload.cooler_left.fields, "Al"),
        (result.payload.cooler_right.fields, "PA"),
    ):
        for field_name, acceleration in (
            ("capillary_rise_1g", "g1"),
            ("capillary_rise_5g", "g5"),
            ("capillary_rise_10g", "g10"),
        ):
            assert_float_matches_golden(
                _field(result, refs, field_name) * M_TO_MM,
                read_f64(case_dir / f"capillaryRise{prefix}_raw_{acceleration}_mm"),
            )
    assert_float_matches_golden(
        _field(result, result.payload.comparison.fields, "ratio_tech_adjusted"),
        read_f64(case_dir / "ratio_tech_adjusted"),
    )
    assert_float_matches_golden(
        _field(result, result.payload.comparison.fields, "delta_same_geometry_percent"),
        100.0 * (read_f64(case_dir / "ratio_same_geometry") - 1.0),
    )
    assert_float_matches_golden(
        _field(result, result.payload.comparison.fields, "delta_tech_adjusted_percent"),
        100.0 * (read_f64(case_dir / "ratio_tech_adjusted") - 1.0),
    )
    assert_float_matches_golden(
        _field(
            result,
            result.payload.comparison.fields,
            "delta_bundle_conductance_tech_adjusted_percent",
        ),
        100.0 * (read_f64(case_dir / "ratio_kA_tech_adjusted") - 1.0),
    )
    assert_float_matches_golden(
        _field(result, result.payload.comparison.fields, "nearest_left_reference_diameter")
        * M_TO_MM,
        read_f64(case_dir / "dAlNearest_mm"),
    )
    np.testing.assert_allclose(
        _field(result, result.payload.cooler_left.fields, "hydraulic_power"),
        _field(result, result.payload.cooler_left.fields, "tube_pressure_drop")
        * _field(result, result.payload.cooler_left.fields, "coolant_volume_flow"),
        rtol=1.0e-12,
        atol=1.0e-14,
        equal_nan=True,
    )
    for refs, suffix in (
        (result.payload.cooler_left.fields, "Al"),
        (result.payload.cooler_right.fields, "Poly"),
    ):
        resistance_parts = [
            read_f64(case_dir / f"Ri_{suffix}_raw"),
            read_f64(case_dir / f"Rw_{suffix}_raw"),
            read_f64(case_dir / f"Ro_{suffix}_raw"),
        ]
        total = sum(resistance_parts)
        for field_name, resistance in zip(
            ("resistance_share_inner", "resistance_share_wall", "resistance_share_outer"),
            resistance_parts,
            strict=True,
        ):
            assert_float_matches_golden(
                _field(result, refs, field_name),
                100.0 * resistance / total,
            )


def test_api_default_masks_match_goldens() -> None:
    case_dir = default_case()
    result = simulate(paper_default_request())

    np.testing.assert_array_equal(
        _field(result, result.payload.cooler_left.masks, "mask_invalid_geometry"),
        read_u8(case_dir / "mask_invalid_di").astype(np.float64),
    )
    np.testing.assert_array_equal(
        _field(result, result.payload.cooler_left.masks, "mask_all_screens_feasible"),
        read_u8(case_dir / "mask_design_feasible_al").astype(np.float64),
    )
    np.testing.assert_array_equal(
        _field(result, result.payload.cooler_right.masks, "mask_all_screens_feasible"),
        read_u8(case_dir / "mask_design_feasible_pa").astype(np.float64),
    )
    np.testing.assert_array_equal(
        _field(result, result.payload.cooler_left.masks, "mask_screen_min_wall"),
        _field(result, result.payload.cooler_left.masks, "mask_below_min_wall"),
    )
    for name in (
        "mask_screen_burst_pressure",
        "mask_screen_coolant_flow",
        "mask_screen_pressure_drop",
        "mask_screen_cost",
        "mask_screen_capillary",
    ):
        assert (
            _field(result, result.payload.cooler_left.masks, name).shape
            == _field(result, result.payload.cooler_left.masks, "mask_all_screens_feasible").shape
        )


def test_api_summary_exposes_plot_marker_geometry() -> None:
    request = paper_default_request()
    result = simulate(request)

    for cooler_key in ("cooler_left", "cooler_right"):
        cooler = getattr(request, cooler_key)
        summary = getattr(result.payload, cooler_key).summary
        assert summary.values["design_outer_diameter"] == cooler.design_point.outer_diameter
        assert summary.values["design_wall_thickness"] == cooler.design_point.wall_thickness
        assert summary.values["design_wall_ratio"] == 10.0
        assert summary.values["material_min_wall_thickness"] == cooler.material.min_wall_thickness
        assert summary.units["design_outer_diameter"] == "m"
        assert summary.units["design_wall_thickness"] == "m"
        assert summary.units["design_wall_ratio"] == "%"
        assert summary.units["material_min_wall_thickness"] == "m"


def test_api_reports_correlation_validity_warnings() -> None:
    request = paper_default_request()
    air_fluid = request.cooler_left.air_side.fluid.model_copy(update={"prandtl": 0.05})
    air_side = request.cooler_left.air_side.model_copy(update={"fluid": air_fluid})
    coolant_side = request.cooler_left.coolant_side.model_copy(update={"value": 2000.0})
    request = request.model_copy(
        update={
            "cooler_left": request.cooler_left.model_copy(
                update={"air_side": air_side, "coolant_side": coolant_side}
            ),
            "cooler_right": request.cooler_right.model_copy(
                update={"air_side": air_side, "coolant_side": coolant_side}
            ),
        }
    )

    result = simulate(request)

    outside = [
        warning
        for warning in result.payload.cooler_left.warnings
        if warning.code == WarningCode.outside_validity
    ]
    affected = {warning.affected_quantity for warning in outside}
    assert {"air_side.fluid.prandtl", "re_inner"}.issubset(affected)
    assert all(warning.recommendation for warning in outside)


def _all_refs(result: SimulationResult) -> list[GridFieldRef]:
    return [
        *result.payload.cooler_left.fields,
        *result.payload.cooler_left.masks,
        *result.payload.cooler_right.fields,
        *result.payload.cooler_right.masks,
        *result.payload.comparison.fields,
    ]


def _field(result: SimulationResult, refs: list[GridFieldRef], name: str) -> np.ndarray:
    for ref in refs:
        if ref.name == name:
            return result.arrays[ref.buffer_index]
    raise AssertionError(f"missing field {name}")
