"""M2 contract tests: defaults, round-trips, link semantics, geometry modes."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from microtubes_core.contracts import (
    BundleGeometry,
    GeometryDimensions,
    GeometryMode,
    GeometryVolumeAspect,
    LinkGroup,
    SimulationRequest,
    ensure_finite_request,
)
from microtubes_core.defaults import paper_default_request
from microtubes_core.parameter_manifest import build_manifest

REPO_ROOT = Path(__file__).resolve().parents[2]


def test_paper_defaults_validate_and_round_trip() -> None:
    request = paper_default_request()
    ensure_finite_request(request)
    dumped = request.model_dump(mode="json")
    restored = SimulationRequest.model_validate(dumped)
    assert restored == request


def test_defaults_match_matlab_snapshot() -> None:
    """Paper defaults must equal the values captured from the MATLAB run."""
    scalars = json.loads(
        (REPO_ROOT / "reference" / "default_case" / "scalars.json").read_text("utf-8")
    )
    request = paper_default_request()
    left = request.cooler_left

    assert left.air_side.value == scalars["params"]["v_a_ms"]
    assert left.coolant_side.value == scalars["params"]["v_i_ms"]
    assert left.material.thermal_conductivity == scalars["mat"]["Al"]["lambda_WmK"]
    assert (
        request.cooler_right.material.thermal_conductivity == (scalars["mat"]["Poly"]["lambda_WmK"])
    )
    assert left.material.tensile_strength == scalars["mat"]["Al"]["Rm_MPa"] * 1e6
    assert left.geometry.pitch_transverse_ratio == scalars["model_outer"]["a_pitch_transverse"]
    assert left.geometry.canonical_dimensions().tube_length == scalars["model_inner"]["length_m"]
    assert left.material.min_wall_thickness * 1e3 == pytest.approx(
        scalars["params"]["tmin_Al_mm"], rel=1e-12
    )
    assert left.boundary_conditions.wall_tolerance * 1e3 == pytest.approx(
        scalars["params"]["wall_tol_standard_mm"], rel=1e-12
    )
    # Capillary constants (mm^2 in MATLAB)
    assert left.material.capillary_constant * 1e6 == pytest.approx(
        scalars["params"]["capillary"]["Ccap_al_mm2"], rel=1e-12
    )
    assert (
        request.cooler_right.material.capillary_constant * 1e6
        == (scalars["params"]["capillary"]["Ccap_pa_eff_mm2"])
    )
    # Screens
    screens = left.boundary_conditions.screens
    assert screens.min_burst_pressure / 1e5 == pytest.approx(
        scalars["params"]["design_boundary_min_burst_bar"], rel=1e-12
    )
    assert screens.min_coolant_volume_flow * 60000 == pytest.approx(
        scalars["params"]["design_boundary_min_flow_Lmin"], rel=1e-12
    )
    assert screens.max_tube_pressure_drop / 1e5 == pytest.approx(
        scalars["params"]["design_boundary_max_dp_bar"], rel=1e-12
    )
    assert screens.max_cost_index == scalars["params"]["design_boundary_max_cost_index"]
    assert screens.max_capillary_rise * 1e3 == pytest.approx(
        scalars["params"]["design_boundary_max_capillary_mm"], rel=1e-12
    )
    # Footprint: width/depth reproduce the benchmark 30×36 footprint
    dims = left.geometry.canonical_dimensions()
    assert dims.width == pytest.approx(30 * 3.28e-3, rel=1e-12)
    assert dims.depth == pytest.approx(36 * 2.00e-3, rel=1e-12)


def test_linked_group_mismatch_rejected() -> None:
    request = paper_default_request()
    payload = request.model_dump(mode="json")
    payload["cooler_right"]["geometry"]["dimensions"]["width"] = 0.2
    with pytest.raises(ValidationError, match="linked group 'geometry'"):
        SimulationRequest.model_validate(payload)


def test_materials_unlinked_allows_difference() -> None:
    request = paper_default_request()
    assert request.linked_groups[LinkGroup.materials] is False
    assert request.cooler_left.material != request.cooler_right.material


def test_unknown_field_rejected() -> None:
    payload = paper_default_request().model_dump(mode="json")
    payload["cooler_left"]["material"]["hidden_fudge_factor"] = 1.2
    with pytest.raises(ValidationError):
        SimulationRequest.model_validate(payload)


def test_non_finite_rejected() -> None:
    payload = paper_default_request().model_dump(mode="json")
    payload["cooler_left"]["air_side"]["value"] = float("nan")
    with pytest.raises(ValidationError):
        SimulationRequest.model_validate(payload)


def test_geometry_mode_equivalence() -> None:
    """volume_aspect built from dimensions converts back exactly (M8 check, frozen here)."""
    dims = GeometryDimensions(width=0.0984, depth=0.072, tube_length=0.160)
    volume = dims.width * dims.depth * dims.tube_length
    alt = BundleGeometry(
        mode=GeometryMode.volume_aspect,
        volume_aspect=GeometryVolumeAspect(
            volume=volume,
            aspect_width_over_depth=dims.width / dims.depth,
            aspect_length_over_depth=dims.tube_length / dims.depth,
        ),
        pitch_transverse_ratio=3.28,
        pitch_longitudinal_ratio=2.0,
    )
    converted = alt.canonical_dimensions()
    assert converted.width == pytest.approx(dims.width, rel=1e-12)
    assert converted.depth == pytest.approx(dims.depth, rel=1e-12)
    assert converted.tube_length == pytest.approx(dims.tube_length, rel=1e-12)


def test_geometry_missing_representation_rejected() -> None:
    with pytest.raises(ValidationError, match="volume_aspect"):
        BundleGeometry(
            mode=GeometryMode.volume_aspect,
            pitch_transverse_ratio=3.28,
            pitch_longitudinal_ratio=2.0,
        )


def test_parameter_manifest_consistent() -> None:
    specs = build_manifest()
    assert len(specs) >= 40
    for spec in specs:
        assert spec.minimum < spec.maximum, spec.path
        assert spec.minimum <= spec.default <= spec.maximum, spec.path
        if spec.scale == "log":
            assert spec.minimum > 0, f"log scale requires positive minimum: {spec.path}"


def test_exported_artifacts_in_sync() -> None:
    """Committed src/contracts artifacts must match the Pydantic source."""
    from microtubes_core import CONTRACT_VERSION

    defaults = json.loads((REPO_ROOT / "src" / "contracts" / "defaults.json").read_text("utf-8"))
    assert defaults["contract_version"] == CONTRACT_VERSION
    assert SimulationRequest.model_validate(defaults["request"]) == paper_default_request()
    schema = json.loads(
        (REPO_ROOT / "src" / "contracts" / "schema" / "simulation-request.schema.json").read_text(
            "utf-8"
        )
    )
    assert schema == SimulationRequest.model_json_schema()
