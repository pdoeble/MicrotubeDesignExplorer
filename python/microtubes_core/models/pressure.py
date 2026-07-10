"""Tube pressure-drop and Lamé burst-pressure submodels.

Equations are ported from ``Waermedurchgang_V10_physical.m`` local functions
``calcTubeFrictionPressureDropBar`` (line 3898),
``calcDarcyFrictionFactorSmoothTube`` (line 3933),
``calcEffectiveInnerDiameterForBurst`` (line 3880), and ``calcPburstBar``
(line 3887). SI inputs and outputs are used throughout.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import FloatArray, broadcast_float_arrays, nan_array

RE_LAMINAR_MAX = 2300.0
RE_TRANSITION_MAX = 10000.0


def effective_inner_diameter_for_burst(
    d_o: ArrayLike,
    t_wall: ArrayLike,
    tolerance: ArrayLike,
) -> FloatArray:
    """Return effective inner diameter for tolerance-adjusted Lamé burst checks."""
    outer_diameter, wall, tol = broadcast_float_arrays(d_o, t_wall, tolerance)
    local_wall = wall - tol
    effective = outer_diameter - 2.0 * local_wall
    return np.where(local_wall <= 0.0, np.nan, effective)


def lame_burst_pressure(
    d_o: ArrayLike,
    d_i_effective: ArrayLike,
    tensile_strength: float,
) -> FloatArray:
    """Return Lamé burst pressure in Pa for ``d_o > d_i_effective > 0``."""
    outer_diameter, inner_diameter = broadcast_float_arrays(d_o, d_i_effective)
    pressure = nan_array(outer_diameter.shape)
    good = (
        np.isfinite(outer_diameter)
        & np.isfinite(inner_diameter)
        & (outer_diameter > 0.0)
        & (inner_diameter > 0.0)
        & (outer_diameter > inner_diameter)
    )
    with np.errstate(invalid="ignore", divide="ignore"):
        pressure_tmp = (
            float(tensile_strength)
            * (outer_diameter**2 - inner_diameter**2)
            / (outer_diameter**2 + inner_diameter**2)
        )
        pressure[good] = pressure_tmp[good]
    return pressure


def darcy_friction_factor_smooth_tube(reynolds: ArrayLike) -> FloatArray:
    """Return Darcy friction factor for smooth circular tubes.

    Laminar, transition and turbulent branches match MATLAB line 3933.
    """
    re = np.asarray(reynolds, dtype=np.float64)
    friction = nan_array(re.shape)
    laminar = np.isfinite(re) & (re > 0.0) & (re < RE_LAMINAR_MAX)
    transition = np.isfinite(re) & (re >= RE_LAMINAR_MAX) & (re <= RE_TRANSITION_MAX)
    turbulent = np.isfinite(re) & (re > RE_TRANSITION_MAX)

    with np.errstate(invalid="ignore", divide="ignore"):
        friction[laminar] = 64.0 / re[laminar]

        def turbulent_friction(value: ArrayLike) -> FloatArray:
            value_array = np.asarray(value, dtype=np.float64)
            return (1.8 * np.log10(value_array) - 1.5) ** (-2.0)

        if np.any(transition):
            f_2300 = 64.0 / RE_LAMINAR_MAX
            f_10000 = turbulent_friction(RE_TRANSITION_MAX)
            transition_weight = (re[transition] - RE_LAMINAR_MAX) / (
                RE_TRANSITION_MAX - RE_LAMINAR_MAX
            )
            friction[transition] = (1.0 - transition_weight) * f_2300 + (
                transition_weight * f_10000
            )
        if np.any(turbulent):
            friction[turbulent] = turbulent_friction(re[turbulent])

    friction[~np.isfinite(friction) | (friction <= 0.0)] = np.nan
    return friction


def tube_friction_pressure_drop(
    coolant_velocity: ArrayLike,
    d_i: ArrayLike,
    *,
    length: float,
    density: float,
    kinematic_viscosity: float,
) -> FloatArray:
    """Return straight-tube Darcy-Weisbach friction pressure drop in Pa.

    Headers, bends, maldistribution and distributor losses are outside the
    approved MATLAB diagnostic model.
    """
    velocity, diameter = broadcast_float_arrays(coolant_velocity, d_i)
    pressure_drop = nan_array(diameter.shape)
    good = np.isfinite(diameter) & (diameter > 0.0) & np.isfinite(velocity) & (velocity > 0.0)
    if not np.any(good):
        return pressure_drop

    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        reynolds = velocity * diameter / float(kinematic_viscosity)
        friction = darcy_friction_factor_smooth_tube(reynolds)
        pressure_tmp = friction * (float(length) / diameter) * 0.5 * float(density) * velocity**2
        pressure_drop[good] = pressure_tmp[good]
    pressure_drop[~np.isfinite(pressure_drop) | (pressure_drop <= 0.0)] = np.nan
    return pressure_drop
