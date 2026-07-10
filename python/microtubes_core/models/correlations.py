"""VDI heat-transfer correlations used by the microtube model.

The implemented equations are ported from
``references/Waermedurchgang_V10_physical.m`` local functions
``vdiG7InlineTubeBankAlpha`` (line 3691) and ``vdiG1InternalTubeAlpha``
(line 3756). Source: VDI-Waermeatlas 2013, chapters G7 and G1.
"""

from __future__ import annotations

from typing import Literal

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import FloatArray, broadcast_float_arrays, nan_array

InnerBoundary = Literal["constant_wall_temperature", "constant_heat_flux"]

RE_LAMINAR_MAX = 2300.0
RE_TRANSITION_MAX = 10000.0


def vdi_g7_inline_tube_bank_alpha(
    air_velocity: ArrayLike,
    d_o: ArrayLike,
    *,
    pitch_transverse_ratio: float,
    pitch_longitudinal_ratio: float,
    n_rows: float,
    use_finite_row_correction: bool,
    property_correction: float,
    kinematic_viscosity: float,
    prandtl: float,
    thermal_conductivity: float,
) -> tuple[FloatArray, FloatArray]:
    """Return air-side ``alpha_o`` and ``Re_c,l`` for an inline tube bank.

    SI inputs and outputs. ``alpha_o`` is referenced to the outer tube surface.
    The void-fraction branch, many-row/finite-row factor and gas property
    correction match MATLAB line 3691.
    """
    velocity, diameter = broadcast_float_arrays(air_velocity, d_o)
    alpha = nan_array(diameter.shape)
    reynolds = nan_array(diameter.shape)
    good = np.isfinite(diameter) & (diameter > 0.0)
    if not np.any(good):
        return alpha, reynolds

    a = float(pitch_transverse_ratio)
    b = float(pitch_longitudinal_ratio)
    c_void = 1.0 - np.pi / (4.0 * a) if b >= 1.0 else 1.0 - np.pi / (4.0 * a * b)
    characteristic_length = np.pi * diameter / 2.0

    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        reynolds_tmp = velocity * characteristic_length / (c_void * float(kinematic_viscosity))
        reynolds[good] = reynolds_tmp[good]

        nu_laminar = 0.664 * np.sqrt(reynolds_tmp) * float(prandtl) ** (1.0 / 3.0)
        nu_turbulent = (
            0.037 * reynolds_tmp**0.8 * float(prandtl)
        ) / (
            1.0
            + 2.443 * reynolds_tmp ** (-0.1) * (float(prandtl) ** (2.0 / 3.0) - 1.0)
        )
        nu_l0 = 0.3 + np.sqrt(nu_laminar**2 + nu_turbulent**2)
        area_factor = 1.0 + 0.7 * c_void ** (-1.5) * (
            (b / a - 0.3) / ((b / a + 0.7) ** 2)
        )
        if use_finite_row_correction:
            row_factor = (1.0 + (float(n_rows) - 1.0) * area_factor) / float(n_rows)
        else:
            row_factor = area_factor

        correction = float(property_correction)
        if not np.isfinite(correction):
            correction = 1.0
        nu_bundle = row_factor * nu_l0 * correction
        alpha_tmp = nu_bundle * float(thermal_conductivity) / characteristic_length
        alpha[good] = alpha_tmp[good]
    return alpha, reynolds


def vdi_g1_internal_tube_alpha(
    coolant_velocity: ArrayLike,
    d_i: ArrayLike,
    *,
    length: float,
    boundary_condition: InnerBoundary,
    apply_liquid_pr_wall_correction: bool,
    pr_wall: float | None,
    kinematic_viscosity: float,
    prandtl: float,
    thermal_conductivity: float,
) -> FloatArray:
    """Return tube-side ``alpha_i`` for circular internal flow.

    SI inputs and outputs. Laminar, transition and turbulent branches match
    VDI-Waermeatlas 2013 G1 as ported in MATLAB line 3756.
    """
    velocity, diameter = broadcast_float_arrays(coolant_velocity, d_i)
    alpha = nan_array(diameter.shape)
    good = np.isfinite(diameter) & (diameter > 0.0)
    if not np.any(good):
        return alpha

    pr = float(prandtl)
    tube_length = float(length)
    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        reynolds = velocity * diameter / float(kinematic_viscosity)
        nu = nan_array(diameter.shape)

        laminar = good & (reynolds < RE_LAMINAR_MAX)
        transition = good & (reynolds >= RE_LAMINAR_MAX) & (reynolds <= RE_TRANSITION_MAX)
        turbulent = good & (reynolds > RE_TRANSITION_MAX)

        if np.any(laminar):
            nu[laminar] = vdi_g1_laminar_mean_nu(
                reynolds[laminar], pr, diameter[laminar], tube_length, boundary_condition
            )
        if np.any(transition):
            nu_l_2300 = vdi_g1_laminar_transition_anchor_nu(
                pr, diameter[transition], tube_length, boundary_condition
            )
            nu_t_10000 = vdi_g1_turbulent_mean_nu(
                np.full(diameter[transition].shape, RE_TRANSITION_MAX, dtype=np.float64),
                pr,
                diameter[transition],
                tube_length,
            )
            transition_weight = (reynolds[transition] - RE_LAMINAR_MAX) / (
                RE_TRANSITION_MAX - RE_LAMINAR_MAX
            )
            nu[transition] = (1.0 - transition_weight) * nu_l_2300 + (
                transition_weight * nu_t_10000
            )
        if np.any(turbulent):
            nu[turbulent] = vdi_g1_turbulent_mean_nu(
                reynolds[turbulent], pr, diameter[turbulent], tube_length
            )

        if apply_liquid_pr_wall_correction:
            if pr_wall is None or not np.isfinite(float(pr_wall)):
                raise ValueError("Pr-wall correction requested, but pr_wall is missing.")
            nu = nu * (pr / float(pr_wall)) ** 0.11

        alpha_tmp = nu * float(thermal_conductivity) / diameter
        alpha[good] = alpha_tmp[good]
    return alpha


def vdi_g1_laminar_mean_nu(
    reynolds: ArrayLike,
    prandtl: float,
    d_i: ArrayLike,
    length: float,
    boundary_condition: InnerBoundary,
) -> FloatArray:
    """Return the VDI G1 laminar mean Nusselt number."""
    re, diameter = broadcast_float_arrays(reynolds, d_i)
    pr = float(prandtl)
    tube_length = float(length)
    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        x_value = re * pr * diameter / tube_length
        if boundary_condition == "constant_wall_temperature":
            nu_1 = 3.66
            nu_2 = 1.615 * x_value ** (1.0 / 3.0)
            nu_3 = (2.0 / (1.0 + 22.0 * pr)) ** (1.0 / 6.0) * np.sqrt(x_value)
            result = (nu_1**3 + 0.7**3 + (nu_2 - 0.7) ** 3 + nu_3**3) ** (1.0 / 3.0)
            return np.asarray(result, dtype=np.float64)
        if boundary_condition == "constant_heat_flux":
            nu_1 = 4.364
            nu_2 = 1.953 * x_value ** (1.0 / 3.0)
            nu_3 = 0.924 * pr ** (1.0 / 3.0) * np.sqrt(re * diameter / tube_length)
            result = (nu_1**3 + 0.6**3 + (nu_2 - 0.6) ** 3 + nu_3**3) ** (1.0 / 3.0)
            return np.asarray(result, dtype=np.float64)
    raise ValueError(f"Unknown VDI G1 boundary condition: {boundary_condition}")


def vdi_g1_laminar_transition_anchor_nu(
    prandtl: float,
    d_i: ArrayLike,
    length: float,
    boundary_condition: InnerBoundary,
) -> FloatArray:
    """Return dedicated VDI G1 transition anchors at ``Re = 2300``."""
    diameter = np.asarray(d_i, dtype=np.float64)
    pr = float(prandtl)
    tube_length = float(length)
    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        if boundary_condition == "constant_wall_temperature":
            nu_2 = 1.615 * (RE_LAMINAR_MAX * pr * diameter / tube_length) ** (1.0 / 3.0)
            nu_3 = (2.0 / (1.0 + 22.0 * pr)) ** (1.0 / 6.0) * np.sqrt(
                RE_LAMINAR_MAX * pr * diameter / tube_length
            )
            result = (4.9**3 + (nu_2 - 0.7) ** 3 + nu_3**3) ** (1.0 / 3.0)
            return np.asarray(result, dtype=np.float64)
        if boundary_condition == "constant_heat_flux":
            nu_2 = 1.953 * (RE_LAMINAR_MAX * pr * diameter / tube_length) ** (1.0 / 3.0)
            nu_3 = 0.924 * pr ** (1.0 / 3.0) * np.sqrt(
                RE_LAMINAR_MAX * diameter / tube_length
            )
            result = (8.3**3 + (nu_2 - 0.6) ** 3 + nu_3**3) ** (1.0 / 3.0)
            return np.asarray(result, dtype=np.float64)
    raise ValueError(f"Unknown VDI G1 boundary condition: {boundary_condition}")


def vdi_g1_turbulent_mean_nu(
    reynolds: ArrayLike,
    prandtl: float,
    d_i: ArrayLike,
    length: float,
) -> FloatArray:
    """Return the VDI G1 turbulent Gnielinski/Konakov mean Nusselt number."""
    re, diameter = broadcast_float_arrays(reynolds, d_i)
    pr = float(prandtl)
    tube_length = float(length)
    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        xi = (1.8 * np.log10(re) - 1.5) ** (-2.0)
        result = (
            ((xi / 8.0) * (re - 1000.0) * pr)
            / (1.0 + 12.7 * np.sqrt(xi / 8.0) * (pr ** (2.0 / 3.0) - 1.0))
            * (1.0 + (diameter / tube_length) ** (2.0 / 3.0))
        )
        return np.asarray(result, dtype=np.float64)
