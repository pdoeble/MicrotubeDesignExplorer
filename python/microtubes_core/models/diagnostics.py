"""Dimensionless heat-transfer diagnostics for design-space interpretation.

The definitions follow the diagnostic section of
``source_materials/Waermedurchgang_V10_physical.m`` (Graetz/G1 sensitivity/
wall-Biot fields) and the derivation supplied in
``source_materials/260716_Isolinien-Morphologie-Wiki.md``. They add no
correlation or empirical calibration to the accepted G1/G7 model.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import FloatArray, broadcast_float_arrays, nan_array
from microtubes_core.models.correlations import InnerBoundary, vdi_g1_internal_tube_alpha

G1_LOG_DIAMETER_STEP = 1.0e-5
"""Central logarithmic diameter step used for the local G1 sensitivity."""


def graetz_number(
    reynolds: ArrayLike,
    prandtl: float,
    diameter: ArrayLike,
    length: float,
) -> FloatArray:
    """Return ``Gz = Re Pr d/L`` using SI geometry.

    ``Re`` and ``Pr`` are dimensionless. The definition is the argument of
    the VDI G1 entrance-region terms used by the MATLAB reference.
    """
    re, d = broadcast_float_arrays(reynolds, diameter)
    result = nan_array(d.shape)
    good = np.isfinite(re) & np.isfinite(d) & (d > 0.0)
    if not np.any(good):
        return result
    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        values = re * float(prandtl) * d / float(length)
        result[good] = values[good]
    return result


def wall_biot_number(
    overall_coefficient: ArrayLike,
    diameter: ArrayLike,
    wall_thermal_conductivity: float,
) -> FloatArray:
    """Return the effective wall Biot-type number ``Bi = k_o d_o/lambda_w``.

    ``k_o`` is the overall heat-transfer coefficient on the outside-area
    basis, not the air-side coefficient. Consequently ``Bi = 1`` does not by
    itself imply a 50-percent wall-resistance share.
    """
    coefficient, d = broadcast_float_arrays(overall_coefficient, diameter)
    result = nan_array(d.shape)
    good = np.isfinite(coefficient) & np.isfinite(d) & (coefficient > 0.0) & (d > 0.0)
    if not np.any(good):
        return result
    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        values = coefficient * d / float(wall_thermal_conductivity)
        result[good] = values[good]
    return result


def g1_diameter_sensitivity(
    coolant_velocity: ArrayLike,
    diameter: ArrayLike,
    *,
    length: float,
    boundary_condition: InnerBoundary,
    kinematic_viscosity: float,
    prandtl: float,
    thermal_conductivity: float,
    log_step: float = G1_LOG_DIAMETER_STEP,
) -> FloatArray:
    """Return ``d ln(Nu_i) / d ln(d_i)`` at fixed local tube velocity.

    The derivative uses a pointwise central logarithmic stencil. Holding the
    supplied velocity array fixed makes the partial derivative independent of
    the user's sweep resolution and clearly separates it from diameter changes
    caused by a selected bundle operating mode.
    """
    velocity, d = broadcast_float_arrays(coolant_velocity, diameter)
    result = nan_array(d.shape)
    good = np.isfinite(velocity) & np.isfinite(d) & (velocity >= 0.0) & (d > 0.0)
    if not np.any(good):
        return result
    step = float(log_step)
    if not np.isfinite(step) or step <= 0.0:
        raise ValueError("log_step must be finite and positive")

    diameter_plus = d * np.exp(step)
    diameter_minus = d * np.exp(-step)
    alpha_plus = vdi_g1_internal_tube_alpha(
        velocity,
        diameter_plus,
        length=float(length),
        boundary_condition=boundary_condition,
        apply_liquid_pr_wall_correction=False,
        pr_wall=None,
        kinematic_viscosity=float(kinematic_viscosity),
        prandtl=float(prandtl),
        thermal_conductivity=float(thermal_conductivity),
    )
    alpha_minus = vdi_g1_internal_tube_alpha(
        velocity,
        diameter_minus,
        length=float(length),
        boundary_condition=boundary_condition,
        apply_liquid_pr_wall_correction=False,
        pr_wall=None,
        kinematic_viscosity=float(kinematic_viscosity),
        prandtl=float(prandtl),
        thermal_conductivity=float(thermal_conductivity),
    )
    with np.errstate(invalid="ignore", divide="ignore", over="ignore"):
        nu_plus = alpha_plus * diameter_plus / float(thermal_conductivity)
        nu_minus = alpha_minus * diameter_minus / float(thermal_conductivity)
        values = (np.log(nu_plus) - np.log(nu_minus)) / (2.0 * step)
        result[good] = values[good]
    return result
