"""Thermal resistance aggregation on the outer tube area basis.

Equations are ported from ``Waermedurchgang_V10_physical.m`` lines 506-509
and 729-732.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike

from microtubes_core.models._array import FloatArray, broadcast_float_arrays


def resistance_parts_outer(
    d_o: ArrayLike,
    d_i: ArrayLike,
    alpha_inner: ArrayLike,
    alpha_outer: ArrayLike,
    *,
    wall_thermal_conductivity: float,
) -> tuple[FloatArray, FloatArray, FloatArray]:
    """Return ``R_i``, ``R_w`` and ``R_o`` on the outer surface reference."""
    outer_diameter, inner_diameter, alpha_i, alpha_o = broadcast_float_arrays(
        d_o, d_i, alpha_inner, alpha_outer
    )
    with np.errstate(invalid="ignore", divide="ignore"):
        r_inner = outer_diameter / (inner_diameter * alpha_i)
        r_wall = (
            outer_diameter
            / (2.0 * float(wall_thermal_conductivity))
            * np.log(outer_diameter / inner_diameter)
        )
        r_outer = 1.0 / alpha_o
    return r_inner, r_wall, r_outer


def overall_coefficient_outer(
    d_o: ArrayLike,
    d_i: ArrayLike,
    alpha_inner: ArrayLike,
    alpha_outer: ArrayLike,
    *,
    wall_thermal_conductivity: float,
) -> FloatArray:
    """Return overall heat-transfer coefficient ``k`` on the outer area basis."""
    r_inner, r_wall, r_outer = resistance_parts_outer(
        d_o,
        d_i,
        alpha_inner,
        alpha_outer,
        wall_thermal_conductivity=wall_thermal_conductivity,
    )
    with np.errstate(invalid="ignore", divide="ignore"):
        return 1.0 / (r_inner + r_wall + r_outer)


def resistance_shares(
    r_inner: ArrayLike,
    r_wall: ArrayLike,
    r_outer: ArrayLike,
) -> tuple[FloatArray, FloatArray, FloatArray]:
    """Return fractional resistance shares for ``R_i``, ``R_w`` and ``R_o``."""
    inner, wall, outer = broadcast_float_arrays(r_inner, r_wall, r_outer)
    total = inner + wall + outer
    with np.errstate(invalid="ignore", divide="ignore"):
        return inner / total, wall / total, outer / total
