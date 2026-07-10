"""Single-cooler design-space sweep evaluation.

This module wires the pure physical submodels together while preserving the
MATLAB mask order documented in ``wiki/model/matlab-inventory.md`` §5:
invalid inner diameters are made NaN before correlations, then the wall-ratio
calculation mask is applied to screen-input fields but not to heat-transfer
coefficient fields.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from microtubes_core.contracts import (
    AirOperatingMode,
    CoolantOperatingMode,
    CoolerConfiguration,
    InnerBoundaryCondition,
    ScreenThresholds,
    SweepSettings,
    TubeArrangement,
)
from microtubes_core.models._array import BoolArray, FloatArray
from microtubes_core.models.capillary import capillary_rise
from microtubes_core.models.correlations import (
    InnerBoundary,
    vdi_g1_internal_tube_alpha,
    vdi_g7_inline_tube_bank_alpha,
)
from microtubes_core.models.cost import tube_supply_cost_index
from microtubes_core.models.geometry import (
    TubeArrangementName,
    bundle_outer_area,
    clear_spacings,
    continuous_tube_count,
    inner_diameter,
    wall_ratio_percent,
)
from microtubes_core.models.operating import (
    AirOperatingModeName,
    CoolantOperatingModeName,
    air_velocity_from_mode,
    coolant_mass_flow,
    coolant_velocity_from_mode,
    coolant_volume_flow,
)
from microtubes_core.models.pressure import (
    effective_inner_diameter_for_burst,
    lame_burst_pressure,
    tube_friction_pressure_drop,
)
from microtubes_core.models.resistances import overall_coefficient_outer, resistance_parts_outer
from microtubes_core.sweeps.screens import (
    ScreenInputs,
    ScreenThresholdsSI,
    all_screen_feasible_mask,
)

STANDARD_BURST_TOLERANCE = 0.020e-3
"""Standard local wall-thickness tolerance for burst sensitivity fields (MATLAB line 136)."""

MEDICAL_BURST_TOLERANCE = 0.005e-3
"""Medical local wall-thickness tolerance for burst sensitivity fields (MATLAB line 137)."""

CAPILLARY_ACCELERATION_1G = 1.0
CAPILLARY_ACCELERATION_5G = 5.0
CAPILLARY_ACCELERATION_10G = 10.0
"""Fixed capillary acceleration sensitivity cases from MATLAB line 309."""


@dataclass(frozen=True)
class DesignGrid:
    """Log-spaced design grid with rows=wall thickness and columns=diameter."""

    outer_diameter_axis: FloatArray
    wall_thickness_axis: FloatArray
    outer_diameter: FloatArray
    wall_thickness: FloatArray
    inner_diameter: FloatArray
    wall_ratio_pct: FloatArray
    mask_invalid_geometry: BoolArray
    mask_wall_ratio_range: BoolArray


@dataclass(frozen=True)
class CoolerSweepResult:
    """All raw fields for one cooler after the wall-ratio calculation mask."""

    grid: DesignGrid
    alpha_outer: FloatArray
    alpha_inner: FloatArray
    coolant_velocity: FloatArray
    mask_operating_unsolvable: BoolArray
    re_inner: FloatArray
    re_outer_simple: FloatArray
    re_outer_vdi: FloatArray
    tube_pressure_drop: FloatArray
    hydraulic_power: FloatArray
    coolant_volume_flow: FloatArray
    coolant_mass_flow: FloatArray
    tube_count_continuous: FloatArray
    bundle_outer_area: FloatArray
    overall_coefficient: FloatArray
    bundle_conductance: FloatArray
    burst_pressure: FloatArray
    burst_pressure_tolerance_standard: FloatArray
    burst_pressure_tolerance_medical: FloatArray
    clear_spacing_transverse: FloatArray
    clear_spacing_longitudinal: FloatArray
    clear_spacing_closest_inline: FloatArray
    clear_spacing_closest_staggered: FloatArray
    capillary_rise: FloatArray
    capillary_rise_1g: FloatArray
    capillary_rise_5g: FloatArray
    capillary_rise_10g: FloatArray
    cost_index: FloatArray
    resistance_inner: FloatArray
    resistance_wall: FloatArray
    resistance_outer: FloatArray
    mask_below_min_wall: BoolArray
    mask_all_screens_feasible: BoolArray
    screen_inputs: ScreenInputs
    screen_thresholds: ScreenThresholdsSI


def build_design_grid(sweep: SweepSettings) -> DesignGrid:
    """Build the MATLAB-compatible log-spaced sweep grid."""
    outer_axis = _matlab_logspace_axis(
        sweep.outer_diameter_min,
        sweep.outer_diameter_max,
        sweep.n_outer_diameter,
    )
    wall_axis = _matlab_logspace_axis(
        sweep.wall_thickness_min,
        sweep.wall_thickness_max,
        sweep.n_wall_thickness,
    )
    outer_diameter, wall_thickness = np.meshgrid(outer_axis, wall_axis)
    diameter_inner = inner_diameter(outer_diameter, wall_thickness)
    mask_invalid = diameter_inner <= 0.0
    wall_ratio = wall_ratio_percent(wall_thickness, outer_diameter)
    mask_wall_ratio = (wall_ratio < sweep.wall_ratio_calc_min_pct) | (
        wall_ratio > sweep.wall_ratio_calc_max_pct
    )
    return DesignGrid(
        outer_diameter_axis=outer_axis,
        wall_thickness_axis=wall_axis,
        outer_diameter=np.asarray(outer_diameter, dtype=np.float64),
        wall_thickness=np.asarray(wall_thickness, dtype=np.float64),
        inner_diameter=np.asarray(diameter_inner, dtype=np.float64),
        wall_ratio_pct=np.asarray(wall_ratio, dtype=np.float64),
        mask_invalid_geometry=np.asarray(mask_invalid, dtype=np.bool_),
        mask_wall_ratio_range=np.asarray(mask_wall_ratio, dtype=np.bool_),
    )


def _matlab_logspace_axis(minimum: float, maximum: float, count: int) -> FloatArray:
    """Return a logspace axis matching MATLAB's mm-valued reference grids.

    MATLAB generated the golden axes in millimetres. Building the exponent
    range in millimetres and converting back to SI preserves endpoint ULPs
    that affect the `tau <= 45 %` mask boundary.
    """
    return (
        np.logspace(
            np.log10(minimum * 1.0e3),
            np.log10(maximum * 1.0e3),
            count,
            dtype=np.float64,
        )
        * 1.0e-3
    )


def evaluate_cooler_sweep(
    sweep: SweepSettings,
    cooler: CoolerConfiguration,
    *,
    grid: DesignGrid | None = None,
) -> CoolerSweepResult:
    """Evaluate all single-cooler raw fields for one design-space sweep."""
    design_grid = build_design_grid(sweep) if grid is None else grid
    geometry = cooler.geometry
    dimensions = geometry.canonical_dimensions()
    inner = np.array(design_grid.inner_diameter, dtype=np.float64, copy=True)
    inner[design_grid.mask_invalid_geometry] = np.nan

    tube_count = continuous_tube_count(
        design_grid.outer_diameter,
        footprint_width=dimensions.width,
        footprint_depth=dimensions.depth,
        pitch_transverse_ratio=geometry.pitch_transverse_ratio,
        pitch_longitudinal_ratio=geometry.pitch_longitudinal_ratio,
    )
    bundle_area = bundle_outer_area(
        tube_count, design_grid.outer_diameter, length=dimensions.tube_length
    )
    tube_count[design_grid.mask_invalid_geometry] = np.nan
    bundle_area[design_grid.mask_invalid_geometry] = np.nan

    air_velocity = air_velocity_from_mode(
        _air_mode_name(cooler.air_side.mode),
        cooler.air_side.value,
        density=cooler.air_side.fluid.density,
        frontal_area=dimensions.width * dimensions.tube_length,
    )
    coolant_velocity_result = coolant_velocity_from_mode(
        _coolant_mode_name(cooler.coolant_side.mode),
        cooler.coolant_side.value,
        inner,
        tube_count,
        length=dimensions.tube_length,
        density=cooler.coolant_side.fluid.density,
        kinematic_viscosity=cooler.coolant_side.fluid.kinematic_viscosity,
    )
    coolant_velocity = coolant_velocity_result.velocity

    n_rows = _g7_row_count(
        dimensions.depth,
        pitch_longitudinal_ratio=geometry.pitch_longitudinal_ratio,
    )
    alpha_outer, re_outer_vdi = vdi_g7_inline_tube_bank_alpha(
        air_velocity,
        design_grid.outer_diameter,
        pitch_transverse_ratio=geometry.pitch_transverse_ratio,
        pitch_longitudinal_ratio=geometry.pitch_longitudinal_ratio,
        n_rows=n_rows,
        use_finite_row_correction=geometry.use_finite_row_correction,
        property_correction=1.0,
        kinematic_viscosity=cooler.air_side.fluid.kinematic_viscosity,
        prandtl=cooler.air_side.fluid.prandtl,
        thermal_conductivity=cooler.air_side.fluid.thermal_conductivity,
    )
    alpha_inner = vdi_g1_internal_tube_alpha(
        coolant_velocity,
        inner,
        length=dimensions.tube_length,
        boundary_condition=_inner_boundary_name(
            cooler.boundary_conditions.inner_boundary_condition
        ),
        apply_liquid_pr_wall_correction=False,
        pr_wall=None,
        kinematic_viscosity=cooler.coolant_side.fluid.kinematic_viscosity,
        prandtl=cooler.coolant_side.fluid.prandtl,
        thermal_conductivity=cooler.coolant_side.fluid.thermal_conductivity,
    )

    with np.errstate(invalid="ignore", divide="ignore"):
        re_inner = coolant_velocity * inner / cooler.coolant_side.fluid.kinematic_viscosity
        re_outer_simple = (
            air_velocity * design_grid.outer_diameter / cooler.air_side.fluid.kinematic_viscosity
        )
    pressure_drop = tube_friction_pressure_drop(
        coolant_velocity,
        inner,
        length=dimensions.tube_length,
        density=cooler.coolant_side.fluid.density,
        kinematic_viscosity=cooler.coolant_side.fluid.kinematic_viscosity,
    )
    volume_flow = coolant_volume_flow(coolant_velocity, inner, tube_count)
    mass_flow = coolant_mass_flow(
        coolant_velocity,
        inner,
        tube_count,
        density=cooler.coolant_side.fluid.density,
    )
    overall = overall_coefficient_outer(
        design_grid.outer_diameter,
        inner,
        alpha_inner,
        alpha_outer,
        wall_thermal_conductivity=cooler.material.thermal_conductivity,
    )
    overall[design_grid.mask_invalid_geometry] = np.nan
    conductance = overall * bundle_area

    burst_inner = effective_inner_diameter_for_burst(
        design_grid.outer_diameter,
        design_grid.wall_thickness,
        cooler.boundary_conditions.wall_tolerance,
    )
    burst = lame_burst_pressure(
        design_grid.outer_diameter,
        burst_inner,
        cooler.material.tensile_strength,
    )
    burst_standard = _burst_pressure_for_tolerance(
        design_grid,
        cooler.material.tensile_strength,
        STANDARD_BURST_TOLERANCE,
    )
    burst_medical = _burst_pressure_for_tolerance(
        design_grid,
        cooler.material.tensile_strength,
        MEDICAL_BURST_TOLERANCE,
    )
    spacing_t, spacing_l, spacing_inline, spacing_staggered = clear_spacings(
        design_grid.outer_diameter,
        pitch_transverse_ratio=geometry.pitch_transverse_ratio,
        pitch_longitudinal_ratio=geometry.pitch_longitudinal_ratio,
    )

    masked_tube_count = _masked(tube_count, design_grid.mask_wall_ratio_range)
    masked_bundle_area = _masked(bundle_area, design_grid.mask_wall_ratio_range)
    masked_overall = _masked(overall, design_grid.mask_wall_ratio_range)
    masked_conductance = _masked(conductance, design_grid.mask_wall_ratio_range)
    masked_burst = _masked(burst, design_grid.mask_wall_ratio_range)
    masked_burst_standard = _masked(burst_standard, design_grid.mask_wall_ratio_range)
    masked_burst_medical = _masked(burst_medical, design_grid.mask_wall_ratio_range)
    masked_re_inner = _masked(re_inner, design_grid.mask_wall_ratio_range)
    masked_re_outer_simple = _masked(re_outer_simple, design_grid.mask_wall_ratio_range)
    masked_re_outer_vdi = _masked(re_outer_vdi, design_grid.mask_wall_ratio_range)
    masked_pressure_drop = _masked(pressure_drop, design_grid.mask_wall_ratio_range)
    masked_volume_flow = _masked(volume_flow, design_grid.mask_wall_ratio_range)
    hydraulic_power = masked_pressure_drop * masked_volume_flow
    masked_mass_flow = _masked(mass_flow, design_grid.mask_wall_ratio_range)
    masked_spacing_t = _masked(spacing_t, design_grid.mask_wall_ratio_range)
    masked_spacing_l = _masked(spacing_l, design_grid.mask_wall_ratio_range)
    masked_spacing_inline = _masked(spacing_inline, design_grid.mask_wall_ratio_range)
    masked_spacing_staggered = _masked(spacing_staggered, design_grid.mask_wall_ratio_range)

    capillary = capillary_rise(
        cooler.material.capillary_constant,
        masked_spacing_inline,
        cooler.boundary_conditions.screens.capillary_acceleration_over_g,
    )
    capillary_1g = capillary_rise(
        cooler.material.capillary_constant,
        masked_spacing_inline,
        CAPILLARY_ACCELERATION_1G,
    )
    capillary_5g = capillary_rise(
        cooler.material.capillary_constant,
        masked_spacing_inline,
        CAPILLARY_ACCELERATION_5G,
    )
    capillary_10g = capillary_rise(
        cooler.material.capillary_constant,
        masked_spacing_inline,
        CAPILLARY_ACCELERATION_10G,
    )
    arrangement = _arrangement_name(geometry.arrangement)
    cost, _, _ = tube_supply_cost_index(
        design_grid.outer_diameter,
        pitch_transverse_ratio=geometry.pitch_transverse_ratio,
        pitch_longitudinal_ratio=geometry.pitch_longitudinal_ratio,
        arrangement=arrangement,
        material_reference_index=cooler.material.cost_reference_index,
        active_length=dimensions.tube_length,
    )
    masked_cost = _masked(cost, design_grid.mask_wall_ratio_range)

    r_inner, r_wall, r_outer = resistance_parts_outer(
        design_grid.outer_diameter,
        inner,
        alpha_inner,
        alpha_outer,
        wall_thermal_conductivity=cooler.material.thermal_conductivity,
    )
    r_inner[design_grid.mask_invalid_geometry] = np.nan
    r_wall[design_grid.mask_invalid_geometry] = np.nan
    r_outer[design_grid.mask_invalid_geometry] = np.nan
    masked_r_inner = _masked(r_inner, design_grid.mask_wall_ratio_range)
    masked_r_wall = _masked(r_wall, design_grid.mask_wall_ratio_range)
    masked_r_outer = _masked(r_outer, design_grid.mask_wall_ratio_range)

    mask_below_min_wall = design_grid.wall_thickness < cooler.material.min_wall_thickness
    screen_inputs = ScreenInputs(
        min_wall_thickness=cooler.material.min_wall_thickness,
        overall_coefficient=masked_overall,
        bundle_conductance=masked_conductance,
        burst_pressure=masked_burst,
        coolant_volume_flow=masked_volume_flow,
        tube_pressure_drop=masked_pressure_drop,
        cost_index=masked_cost,
        capillary_rise=capillary,
    )
    screen_thresholds = _screen_thresholds(cooler.boundary_conditions.screens)
    feasible = all_screen_feasible_mask(
        design_grid.outer_diameter,
        design_grid.wall_ratio_pct,
        screen_inputs,
        screen_thresholds,
    )

    return CoolerSweepResult(
        grid=design_grid,
        alpha_outer=alpha_outer,
        alpha_inner=alpha_inner,
        coolant_velocity=coolant_velocity,
        mask_operating_unsolvable=coolant_velocity_result.unsolvable,
        re_inner=masked_re_inner,
        re_outer_simple=masked_re_outer_simple,
        re_outer_vdi=masked_re_outer_vdi,
        tube_pressure_drop=masked_pressure_drop,
        hydraulic_power=hydraulic_power,
        coolant_volume_flow=masked_volume_flow,
        coolant_mass_flow=masked_mass_flow,
        tube_count_continuous=masked_tube_count,
        bundle_outer_area=masked_bundle_area,
        overall_coefficient=masked_overall,
        bundle_conductance=masked_conductance,
        burst_pressure=masked_burst,
        burst_pressure_tolerance_standard=masked_burst_standard,
        burst_pressure_tolerance_medical=masked_burst_medical,
        clear_spacing_transverse=masked_spacing_t,
        clear_spacing_longitudinal=masked_spacing_l,
        clear_spacing_closest_inline=masked_spacing_inline,
        clear_spacing_closest_staggered=masked_spacing_staggered,
        capillary_rise=capillary,
        capillary_rise_1g=capillary_1g,
        capillary_rise_5g=capillary_5g,
        capillary_rise_10g=capillary_10g,
        cost_index=masked_cost,
        resistance_inner=masked_r_inner,
        resistance_wall=masked_r_wall,
        resistance_outer=masked_r_outer,
        mask_below_min_wall=mask_below_min_wall,
        mask_all_screens_feasible=feasible,
        screen_inputs=screen_inputs,
        screen_thresholds=screen_thresholds,
    )


def _burst_pressure_for_tolerance(
    design_grid: DesignGrid,
    tensile_strength: float,
    tolerance: float,
) -> FloatArray:
    burst_inner = effective_inner_diameter_for_burst(
        design_grid.outer_diameter,
        design_grid.wall_thickness,
        tolerance,
    )
    return lame_burst_pressure(
        design_grid.outer_diameter,
        burst_inner,
        tensile_strength,
    )


def _masked(values: FloatArray, mask: BoolArray) -> FloatArray:
    masked_values = np.array(values, dtype=np.float64, copy=True)
    masked_values[mask] = np.nan
    return masked_values


def _screen_thresholds(thresholds: ScreenThresholds) -> ScreenThresholdsSI:
    return ScreenThresholdsSI(
        min_burst_pressure=thresholds.min_burst_pressure,
        min_coolant_volume_flow=thresholds.min_coolant_volume_flow,
        max_tube_pressure_drop=thresholds.max_tube_pressure_drop,
        max_cost_index=thresholds.max_cost_index,
        max_capillary_rise=thresholds.max_capillary_rise,
    )


def _air_mode_name(mode: AirOperatingMode) -> AirOperatingModeName:
    return mode.value


def _coolant_mode_name(mode: CoolantOperatingMode) -> CoolantOperatingModeName:
    return mode.value


def _inner_boundary_name(mode: InnerBoundaryCondition) -> InnerBoundary:
    return mode.value


def _arrangement_name(arrangement: TubeArrangement) -> TubeArrangementName:
    return arrangement.value


def _g7_row_count(depth: float, *, pitch_longitudinal_ratio: float) -> float:
    return max(1.0, float(depth) / (float(pitch_longitudinal_ratio) * 1.0e-3))
