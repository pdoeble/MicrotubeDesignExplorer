"""Operating-mode conversions for air and coolant side.

The paper MATLAB script uses fixed air and coolant velocities. M2 contracts
extend the coolant side to volume-flow, mass-flow, pressure-drop, and
hydraulic-power modes per ADR-0003. The inversion policy follows
``plans/260710-handover-m3-core-port.md``: deterministic bracketed bisection
against the approved straight-tube Darcy pressure-drop model.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import (
    BoolArray,
    FloatArray,
    broadcast_float_arrays,
    nan_array,
)
from microtubes_core.models.pressure import tube_friction_pressure_drop

AirOperatingModeName = Literal["constant_velocity", "constant_volume_flow", "constant_mass_flow"]
CoolantOperatingModeName = Literal[
    "constant_velocity",
    "constant_volume_flow",
    "constant_mass_flow",
    "constant_pressure_drop",
    "constant_hydraulic_power",
]

BISECTION_LOWER_VELOCITY = 1.0e-6
BISECTION_UPPER_VELOCITY = 100.0
BISECTION_ITERATIONS = 80


@dataclass(frozen=True)
class OperatingVelocityResult:
    """Velocity field plus cells where the requested operating point was unsolved."""

    velocity: FloatArray
    unsolvable: BoolArray


def air_velocity_from_mode(
    mode: AirOperatingModeName,
    value: float,
    *,
    density: float,
    frontal_area: float,
) -> float:
    """Return scalar air face velocity in m/s.

    ``frontal_area`` is the paper face area convention `width * tube_length`.
    Air-side pressure-drop and hydraulic-power modes are intentionally absent
    per ADR-0003.
    """
    if frontal_area <= 0.0 or not np.isfinite(frontal_area):
        raise ValueError("Air frontal area must be positive and finite.")
    if mode == "constant_velocity":
        return float(value)
    if mode == "constant_volume_flow":
        return float(value) / frontal_area
    if mode == "constant_mass_flow":
        if density <= 0.0 or not np.isfinite(density):
            raise ValueError("Air density must be positive and finite.")
        return float(value) / (float(density) * frontal_area)
    raise ValueError(f"Unsupported air operating mode: {mode}")


def coolant_velocity_from_mode(
    mode: CoolantOperatingModeName,
    value: ArrayLike,
    d_i: ArrayLike,
    tube_count: ArrayLike,
    *,
    length: float,
    density: float,
    kinematic_viscosity: float,
    lower_velocity: float = BISECTION_LOWER_VELOCITY,
    upper_velocity: float = BISECTION_UPPER_VELOCITY,
    iterations: int = BISECTION_ITERATIONS,
) -> OperatingVelocityResult:
    """Return coolant mean tube velocity field for the selected mode.

    For pressure-drop and hydraulic-power modes, cells outside the deterministic
    bisection bracket return NaN velocity and ``unsolvable=True``.
    """
    target, diameter, count = broadcast_float_arrays(value, d_i, tube_count)
    if mode == "constant_velocity":
        velocity = np.array(target, dtype=np.float64, copy=True)
        return _result_with_basic_validity(velocity)
    if mode == "constant_volume_flow":
        with np.errstate(invalid="ignore", divide="ignore"):
            velocity = target / _tube_flow_area(diameter, count)
        return _result_with_basic_validity(velocity)
    if mode == "constant_mass_flow":
        if density <= 0.0 or not np.isfinite(density):
            raise ValueError("Coolant density must be positive and finite.")
        with np.errstate(invalid="ignore", divide="ignore"):
            velocity = target / (float(density) * _tube_flow_area(diameter, count))
        return _result_with_basic_validity(velocity)
    if mode in {"constant_pressure_drop", "constant_hydraulic_power"}:
        return _invert_coolant_operating_target(
            mode,
            target,
            diameter,
            count,
            length=length,
            density=density,
            kinematic_viscosity=kinematic_viscosity,
            lower_velocity=lower_velocity,
            upper_velocity=upper_velocity,
            iterations=iterations,
        )
    raise ValueError(f"Unsupported coolant operating mode: {mode}")


def coolant_volume_flow(
    coolant_velocity: ArrayLike,
    d_i: ArrayLike,
    tube_count: ArrayLike,
) -> FloatArray:
    """Return total bundle coolant volume flow in m^3/s."""
    velocity, diameter, count = broadcast_float_arrays(coolant_velocity, d_i, tube_count)
    return velocity * _tube_flow_area(diameter, count)


def coolant_mass_flow(
    coolant_velocity: ArrayLike,
    d_i: ArrayLike,
    tube_count: ArrayLike,
    *,
    density: float,
) -> FloatArray:
    """Return total bundle coolant mass flow in kg/s."""
    return float(density) * coolant_volume_flow(coolant_velocity, d_i, tube_count)


def _tube_flow_area(diameter: FloatArray, tube_count: FloatArray) -> FloatArray:
    return tube_count * (np.pi / 4.0) * diameter**2


def _result_with_basic_validity(velocity: FloatArray) -> OperatingVelocityResult:
    unsolvable = ~np.isfinite(velocity) | (velocity <= 0.0)
    velocity = np.where(unsolvable, np.nan, velocity)
    return OperatingVelocityResult(
        velocity=np.asarray(velocity, dtype=np.float64),
        unsolvable=np.asarray(unsolvable, dtype=np.bool_),
    )


def _invert_coolant_operating_target(
    mode: Literal["constant_pressure_drop", "constant_hydraulic_power"],
    target: FloatArray,
    diameter: FloatArray,
    tube_count: FloatArray,
    *,
    length: float,
    density: float,
    kinematic_viscosity: float,
    lower_velocity: float,
    upper_velocity: float,
    iterations: int,
) -> OperatingVelocityResult:
    velocity = nan_array(target.shape)
    unsolvable = np.ones(target.shape, dtype=np.bool_)
    good = (
        np.isfinite(target)
        & (target > 0.0)
        & np.isfinite(diameter)
        & (diameter > 0.0)
        & np.isfinite(tube_count)
        & (tube_count > 0.0)
    )
    if not np.any(good):
        return OperatingVelocityResult(velocity=velocity, unsolvable=unsolvable)

    lo = np.full(target.shape, float(lower_velocity), dtype=np.float64)
    hi = np.full(target.shape, float(upper_velocity), dtype=np.float64)
    response_lo = _coolant_operating_response(
        mode,
        lo,
        diameter,
        tube_count,
        length=length,
        density=density,
        kinematic_viscosity=kinematic_viscosity,
    )
    response_hi = _coolant_operating_response(
        mode,
        hi,
        diameter,
        tube_count,
        length=length,
        density=density,
        kinematic_viscosity=kinematic_viscosity,
    )
    bracketed = (
        good
        & np.isfinite(response_lo)
        & np.isfinite(response_hi)
        & (response_lo <= target)
        & (target <= response_hi)
    )
    if not np.any(bracketed):
        return OperatingVelocityResult(velocity=velocity, unsolvable=unsolvable)

    for _ in range(iterations):
        mid = 0.5 * (lo + hi)
        response_mid = _coolant_operating_response(
            mode,
            mid,
            diameter,
            tube_count,
            length=length,
            density=density,
            kinematic_viscosity=kinematic_viscosity,
        )
        move_hi = bracketed & (response_mid >= target)
        move_lo = bracketed & ~move_hi
        hi = np.where(move_hi, mid, hi)
        lo = np.where(move_lo, mid, lo)

    solved = 0.5 * (lo + hi)
    velocity[bracketed] = solved[bracketed]
    unsolvable[bracketed] = False
    return OperatingVelocityResult(velocity=velocity, unsolvable=unsolvable)


def _coolant_operating_response(
    mode: Literal["constant_pressure_drop", "constant_hydraulic_power"],
    velocity: FloatArray,
    diameter: FloatArray,
    tube_count: FloatArray,
    *,
    length: float,
    density: float,
    kinematic_viscosity: float,
) -> FloatArray:
    pressure_drop = tube_friction_pressure_drop(
        velocity,
        diameter,
        length=length,
        density=density,
        kinematic_viscosity=kinematic_viscosity,
    )
    if mode == "constant_pressure_drop":
        return pressure_drop
    return pressure_drop * coolant_volume_flow(velocity, diameter, tube_count)
