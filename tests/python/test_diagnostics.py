"""Dimensionless diagnostic definitions and operating-mode coverage."""

from __future__ import annotations

import numpy as np
import pytest

from microtubes_core.contracts import (
    CoolantOperatingMode,
    InnerBoundaryCondition,
    LinkGroup,
)
from microtubes_core.defaults import paper_default_request
from microtubes_core.models.diagnostics import (
    g1_diameter_sensitivity,
    graetz_number,
    wall_biot_number,
)
from microtubes_core.sweeps.design_space import build_design_grid, evaluate_cooler_sweep


def test_graetz_and_wall_biot_follow_the_documented_algebra() -> None:
    reynolds = np.array([[100.0, 2300.0]], dtype=np.float64)
    diameter = np.array([[0.5e-3, 1.5e-3]], dtype=np.float64)
    coefficient = np.array([[250.0, 300.0]], dtype=np.float64)

    np.testing.assert_array_equal(
        graetz_number(reynolds, 10.0, diameter, 0.2),
        reynolds * 10.0 * diameter / 0.2,
    )
    np.testing.assert_array_equal(
        wall_biot_number(coefficient, diameter, 0.25),
        coefficient * diameter / 0.25,
    )


@pytest.mark.parametrize(
    "boundary_condition", ["constant_wall_temperature", "constant_heat_flux"]
)
def test_g1_sensitivity_is_stencil_converged_away_from_branch_anchors(
    boundary_condition: str,
) -> None:
    velocity = np.array([[0.2, 0.5, 3.0]], dtype=np.float64)
    diameter = np.array([[0.6e-3, 1.0e-3, 2.0e-3]], dtype=np.float64)
    common = {
        "length": 0.160,
        "boundary_condition": boundary_condition,
        "kinematic_viscosity": 1.23e-6,
        "prandtl": 10.77846,
        "thermal_conductivity": 0.423,
    }

    reference = g1_diameter_sensitivity(velocity, diameter, log_step=1.0e-5, **common)
    wider = g1_diameter_sensitivity(velocity, diameter, log_step=1.0e-4, **common)
    narrower = g1_diameter_sensitivity(velocity, diameter, log_step=1.0e-6, **common)

    assert np.all(np.isfinite(reference))
    np.testing.assert_allclose(reference, wider, rtol=0.0, atol=2.0e-8)
    np.testing.assert_allclose(reference, narrower, rtol=0.0, atol=2.0e-8)


def test_g1_sensitivity_matches_independent_reference_points() -> None:
    actual = g1_diameter_sensitivity(
        np.full(3, 0.5, dtype=np.float64),
        np.array([0.6e-3, 1.0e-3, 1.5e-3], dtype=np.float64),
        length=0.160,
        boundary_condition="constant_wall_temperature",
        kinematic_viscosity=1.23e-6,
        prandtl=10.77846,
        thermal_conductivity=0.423,
    )

    np.testing.assert_allclose(actual, [0.279, 0.515, 0.656], rtol=0.0, atol=3.0e-3)


@pytest.mark.parametrize(
    ("mode", "value"),
    [
        (CoolantOperatingMode.constant_velocity, 0.5),
        (CoolantOperatingMode.constant_volume_flow, 10.0 / 60000.0),
        (CoolantOperatingMode.constant_mass_flow, 1041.5 * 10.0 / 60000.0),
        (CoolantOperatingMode.constant_pressure_drop, 2.0e4),
        (CoolantOperatingMode.constant_hydraulic_power, 5.0),
    ],
)
@pytest.mark.parametrize("linked", [True, False])
def test_diagnostic_sweeps_cover_all_coolant_modes_and_link_states(
    mode: CoolantOperatingMode,
    value: float,
    linked: bool,
) -> None:
    request = paper_default_request()
    sweep = request.sweep.model_copy(
        update={"n_outer_diameter": 16, "n_wall_thickness": 16}
    )
    left_coolant = request.cooler_left.coolant_side.model_copy(
        update={"mode": mode, "value": value}
    )
    left_boundary = request.cooler_left.boundary_conditions.model_copy(
        update={
            "inner_boundary_condition": InnerBoundaryCondition.constant_wall_temperature
        }
    )
    left = request.cooler_left.model_copy(
        update={"coolant_side": left_coolant, "boundary_conditions": left_boundary}
    )
    right_coolant = request.cooler_right.coolant_side.model_copy(
        update={"mode": mode, "value": value if linked else 1.1 * value}
    )
    right_boundary = request.cooler_right.boundary_conditions.model_copy(
        update={
            "inner_boundary_condition": InnerBoundaryCondition.constant_wall_temperature
            if linked
            else InnerBoundaryCondition.constant_heat_flux
        }
    )
    right = request.cooler_right.model_copy(
        update={"coolant_side": right_coolant, "boundary_conditions": right_boundary}
    )
    linked_groups = dict(request.linked_groups)
    linked_groups[LinkGroup.coolant_side] = linked
    linked_groups[LinkGroup.boundary_conditions] = linked
    grid = build_design_grid(sweep)
    results = (
        evaluate_cooler_sweep(sweep, left, grid=grid),
        evaluate_cooler_sweep(sweep, right, grid=grid),
    )

    for result in results:
        valid = np.isfinite(result.re_inner)
        assert np.any(valid)
        assert np.all(np.isfinite(result.graetz_inner[valid]))
        assert np.all(np.isfinite(result.g1_diameter_sensitivity[valid]))
        assert np.all(np.isfinite(result.wall_biot[valid]))
    assert linked_groups[LinkGroup.coolant_side] is linked
    assert linked_groups[LinkGroup.boundary_conditions] is linked


def test_diagnostics_preserve_invalid_cells_as_nan() -> None:
    values = np.array([[1.0, np.nan]], dtype=np.float64)
    diameter = np.array([[np.nan, -1.0]], dtype=np.float64)

    assert np.all(np.isnan(graetz_number(values, 1.0, diameter, 1.0)))
    assert np.all(np.isnan(wall_biot_number(values, diameter, 1.0)))
    assert np.all(
        np.isnan(
            g1_diameter_sensitivity(
                values,
                diameter,
                length=0.160,
                boundary_condition="constant_wall_temperature",
                kinematic_viscosity=1.23e-6,
                prandtl=10.77846,
                thermal_conductivity=0.423,
            )
        )
    )
