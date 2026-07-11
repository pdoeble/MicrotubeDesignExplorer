"""M8 acceptance checks spanning public API configuration invariants."""

from __future__ import annotations

import numpy as np
import pytest

from microtubes_core.api import SimulationResult, simulate
from microtubes_core.contracts import (
    BundleGeometry,
    CoolantOperatingMode,
    GeometryMode,
    GeometryVolumeAspect,
    SimulationRequest,
)
from microtubes_core.defaults import paper_default_request
from microtubes_core.models.operating import (
    air_velocity_from_mode,
    coolant_mass_flow,
    coolant_velocity_from_mode,
    coolant_volume_flow,
)
from microtubes_core.models.pressure import tube_friction_pressure_drop


def test_geometry_representations_are_api_equivalent() -> None:
    dimensions_request = paper_default_request()
    volume_request = _as_volume_aspect_request(dimensions_request)

    dimensions_result = simulate(dimensions_request)
    volume_result = simulate(volume_request)

    assert (
        dimensions_result.payload.outer_diameter_axis == volume_result.payload.outer_diameter_axis
    )
    assert (
        dimensions_result.payload.wall_thickness_axis == volume_result.payload.wall_thickness_axis
    )
    _assert_named_arrays_equal(dimensions_result, volume_result)


def test_operating_mode_conversions_are_cross_checked() -> None:
    request = paper_default_request()
    cooler = request.cooler_left
    dimensions = cooler.geometry.canonical_dimensions()
    frontal_area = dimensions.width * dimensions.tube_length
    air_velocity = cooler.air_side.value

    assert air_velocity_from_mode(
        "constant_volume_flow",
        air_velocity * frontal_area,
        density=cooler.air_side.fluid.density,
        frontal_area=frontal_area,
    ) == pytest.approx(air_velocity)
    assert air_velocity_from_mode(
        "constant_mass_flow",
        air_velocity * cooler.air_side.fluid.density * frontal_area,
        density=cooler.air_side.fluid.density,
        frontal_area=frontal_area,
    ) == pytest.approx(air_velocity)

    diameter = np.array([[0.8e-3, 1.2e-3]], dtype=np.float64)
    tube_count = np.array([[300.0, 520.0]], dtype=np.float64)
    velocity = np.array([[0.25, 0.75]], dtype=np.float64)
    density = cooler.coolant_side.fluid.density
    viscosity = cooler.coolant_side.fluid.kinematic_viscosity
    volume_flow = coolant_volume_flow(velocity, diameter, tube_count)
    mass_flow = coolant_mass_flow(velocity, diameter, tube_count, density=density)
    pressure_drop = tube_friction_pressure_drop(
        velocity,
        diameter,
        length=dimensions.tube_length,
        density=density,
        kinematic_viscosity=viscosity,
    )
    hydraulic_power = pressure_drop * volume_flow

    for mode, target in (
        ("constant_volume_flow", volume_flow),
        ("constant_mass_flow", mass_flow),
        ("constant_pressure_drop", pressure_drop),
        ("constant_hydraulic_power", hydraulic_power),
    ):
        result = coolant_velocity_from_mode(
            mode,
            target,
            diameter,
            tube_count,
            length=dimensions.tube_length,
            density=density,
            kinematic_viscosity=viscosity,
        )
        assert not result.unsolvable.any()
        np.testing.assert_allclose(result.velocity, velocity, rtol=1.0e-10, atol=1.0e-10)


def test_non_finite_request_values_are_rejected_defensively() -> None:
    request = paper_default_request()
    bad_coolant = request.cooler_left.coolant_side.model_copy(update={"value": float("nan")})
    bad_left = request.cooler_left.model_copy(update={"coolant_side": bad_coolant})
    bad_request = request.model_copy(update={"cooler_left": bad_left})

    with pytest.raises(ValueError, match="non-finite value"):
        simulate(bad_request)


def test_unsolved_operating_targets_are_reported_without_crashing() -> None:
    request = paper_default_request()
    pressure_drop_target = 1.0e15
    updates = {}
    for cooler_key in ("cooler_left", "cooler_right"):
        cooler = getattr(request, cooler_key)
        coolant = cooler.coolant_side.model_copy(
            update={
                "mode": CoolantOperatingMode.constant_pressure_drop,
                "value": pressure_drop_target,
            }
        )
        updates[cooler_key] = cooler.model_copy(update={"coolant_side": coolant})
    result = simulate(request.model_copy(update=updates))
    left_unsolved = _array_by_name(
        result,
        result.payload.cooler_left.masks,
        "mask_operating_unsolvable",
    )

    assert np.all(left_unsolved == 1.0)
    assert result.payload.cooler_left.summary.screens_passed["operating_point"] is False
    assert any(
        warning.affected_quantity == "coolant_velocity"
        for warning in result.payload.cooler_left.warnings
    )


def _as_volume_aspect_request(request: SimulationRequest) -> SimulationRequest:
    updates = {}
    for cooler_key in ("cooler_left", "cooler_right"):
        cooler = getattr(request, cooler_key)
        dimensions = cooler.geometry.canonical_dimensions()
        volume_aspect = GeometryVolumeAspect(
            aspect_length_over_depth=dimensions.tube_length / dimensions.depth,
            aspect_width_over_depth=dimensions.width / dimensions.depth,
            volume=dimensions.width * dimensions.depth * dimensions.tube_length,
        )
        geometry = BundleGeometry(
            arrangement=cooler.geometry.arrangement,
            dimensions=None,
            mode=GeometryMode.volume_aspect,
            pitch_longitudinal_ratio=cooler.geometry.pitch_longitudinal_ratio,
            pitch_transverse_ratio=cooler.geometry.pitch_transverse_ratio,
            use_finite_row_correction=cooler.geometry.use_finite_row_correction,
            volume_aspect=volume_aspect,
        )
        updates[cooler_key] = cooler.model_copy(update={"geometry": geometry})
    return request.model_copy(update=updates)


def _array_by_name(
    result: SimulationResult,
    refs: list,
    name: str,
) -> np.ndarray:
    ref = next(ref for ref in refs if ref.name == name)
    return result.arrays[ref.buffer_index]


def _assert_named_arrays_equal(left: SimulationResult, right: SimulationResult) -> None:
    left_refs = [
        *left.payload.cooler_left.fields,
        *left.payload.cooler_left.masks,
        *left.payload.cooler_right.fields,
        *left.payload.cooler_right.masks,
        *left.payload.comparison.fields,
    ]
    right_refs = [
        *right.payload.cooler_left.fields,
        *right.payload.cooler_left.masks,
        *right.payload.cooler_right.fields,
        *right.payload.cooler_right.masks,
        *right.payload.comparison.fields,
    ]
    assert [(ref.name, ref.shape, ref.unit) for ref in left_refs] == [
        (ref.name, ref.shape, ref.unit) for ref in right_refs
    ]
    for left_ref, right_ref in zip(left_refs, right_refs, strict=True):
        np.testing.assert_allclose(
            left.arrays[left_ref.buffer_index],
            right.arrays[right_ref.buffer_index],
            rtol=1.0e-12,
            atol=1.0e-14,
            equal_nan=True,
        )
