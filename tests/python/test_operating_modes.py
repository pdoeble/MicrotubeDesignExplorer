"""Operating-mode conversion and inversion tests."""

from __future__ import annotations

import numpy as np

from microtubes_core.models.operating import (
    air_velocity_from_mode,
    coolant_mass_flow,
    coolant_velocity_from_mode,
    coolant_volume_flow,
)
from microtubes_core.models.pressure import tube_friction_pressure_drop

RHO = 1041.5
NU = 1.23e-6
LENGTH = 0.160


def test_air_velocity_modes_use_face_area() -> None:
    area = 0.0984 * 0.160
    assert air_velocity_from_mode(
        "constant_velocity", 5.0, density=1.189, frontal_area=area
    ) == 5.0
    assert air_velocity_from_mode(
        "constant_volume_flow", area * 4.0, density=1.189, frontal_area=area
    ) == 4.0
    assert air_velocity_from_mode(
        "constant_mass_flow", 1.189 * area * 3.0, density=1.189, frontal_area=area
    ) == 3.0


def test_coolant_volume_and_mass_modes_use_total_tube_area() -> None:
    diameter = np.array([[0.8e-3, 1.2e-3]], dtype=np.float64)
    tube_count = np.array([[1080.0, 540.0]], dtype=np.float64)
    velocity = np.array([[0.5, 1.1]], dtype=np.float64)
    volume_flow = coolant_volume_flow(velocity, diameter, tube_count)
    mass_flow = coolant_mass_flow(velocity, diameter, tube_count, density=RHO)

    from_volume = coolant_velocity_from_mode(
        "constant_volume_flow",
        volume_flow,
        diameter,
        tube_count,
        length=LENGTH,
        density=RHO,
        kinematic_viscosity=NU,
    )
    from_mass = coolant_velocity_from_mode(
        "constant_mass_flow",
        mass_flow,
        diameter,
        tube_count,
        length=LENGTH,
        density=RHO,
        kinematic_viscosity=NU,
    )

    np.testing.assert_allclose(from_volume.velocity, velocity, rtol=1e-12, atol=1e-14)
    np.testing.assert_allclose(from_mass.velocity, velocity, rtol=1e-12, atol=1e-14)
    assert not np.any(from_volume.unsolvable)
    assert not np.any(from_mass.unsolvable)


def test_pressure_drop_mode_inverts_darcy_model() -> None:
    diameter = np.array([[0.6e-3, 1.2e-3, 2.4e-3]], dtype=np.float64)
    tube_count = np.array([[900.0, 600.0, 300.0]], dtype=np.float64)
    velocity = np.array([[0.15, 0.9, 3.0]], dtype=np.float64)
    target = tube_friction_pressure_drop(
        velocity, diameter, length=LENGTH, density=RHO, kinematic_viscosity=NU
    )

    solved = coolant_velocity_from_mode(
        "constant_pressure_drop",
        target,
        diameter,
        tube_count,
        length=LENGTH,
        density=RHO,
        kinematic_viscosity=NU,
    )

    np.testing.assert_allclose(solved.velocity, velocity, rtol=1e-10, atol=1e-12)
    reproduced = tube_friction_pressure_drop(
        solved.velocity, diameter, length=LENGTH, density=RHO, kinematic_viscosity=NU
    )
    np.testing.assert_allclose(reproduced, target, rtol=1e-10, atol=1e-8)
    assert not np.any(solved.unsolvable)


def test_hydraulic_power_mode_inverts_pressure_times_volume_flow() -> None:
    diameter = np.array([[0.7e-3, 1.5e-3]], dtype=np.float64)
    tube_count = np.array([[800.0, 420.0]], dtype=np.float64)
    velocity = np.array([[0.25, 2.2]], dtype=np.float64)
    pressure_drop = tube_friction_pressure_drop(
        velocity, diameter, length=LENGTH, density=RHO, kinematic_viscosity=NU
    )
    target_power = pressure_drop * coolant_volume_flow(velocity, diameter, tube_count)

    solved = coolant_velocity_from_mode(
        "constant_hydraulic_power",
        target_power,
        diameter,
        tube_count,
        length=LENGTH,
        density=RHO,
        kinematic_viscosity=NU,
    )

    np.testing.assert_allclose(solved.velocity, velocity, rtol=1e-10, atol=1e-12)
    reproduced_power = tube_friction_pressure_drop(
        solved.velocity, diameter, length=LENGTH, density=RHO, kinematic_viscosity=NU
    ) * coolant_volume_flow(solved.velocity, diameter, tube_count)
    np.testing.assert_allclose(reproduced_power, target_power, rtol=1e-10, atol=1e-10)
    assert not np.any(solved.unsolvable)


def test_inversion_reports_unbracketed_and_invalid_cells() -> None:
    diameter = np.array([[1.0e-3, 1.0e-3, np.nan]], dtype=np.float64)
    tube_count = np.array([[100.0, 100.0, 100.0]], dtype=np.float64)
    too_high = tube_friction_pressure_drop(
        np.array([[200.0, 1.0, 1.0]], dtype=np.float64),
        diameter,
        length=LENGTH,
        density=RHO,
        kinematic_viscosity=NU,
    )

    solved = coolant_velocity_from_mode(
        "constant_pressure_drop",
        too_high,
        diameter,
        tube_count,
        length=LENGTH,
        density=RHO,
        kinematic_viscosity=NU,
    )

    assert solved.unsolvable.tolist() == [[True, False, True]]
    assert np.isnan(solved.velocity[0, 0])
    assert np.isnan(solved.velocity[0, 2])
