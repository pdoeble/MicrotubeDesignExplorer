"""Versioned paper defaults — the single defaults source (AGENTS §7).

Every value is traceable to the authoritative reference
``references/Waermedurchgang_V10_physical.m`` (line numbers in comments) and
is snapshotted in ``reference/default_case/scalars.json``. SI units.
"""

from __future__ import annotations

import math

from microtubes_core.contracts import (
    AirOperatingMode,
    AirSide,
    BoundaryConditions,
    BundleGeometry,
    CoolantOperatingMode,
    CoolantSide,
    CoolerConfiguration,
    DesignPoint,
    FluidProperties,
    GeometryDimensions,
    GeometryMode,
    InnerBoundaryCondition,
    LinkGroup,
    ScreenThresholds,
    SimulationRequest,
    SolidMaterial,
    SweepSettings,
    TubeArrangement,
)

DEFAULTS_VERSION = "1.0.0"

STANDARD_GRAVITY = 9.80665  # m/s^2 (line 308)

# Capillary constants (lines 308–318). Aluminum: literature-based wetting
# estimate 2·γ·cos(θ)/(ρ·g); PA: measured process proxy 5.4 mm².
_CAPILLARY_GAMMA_AL = 45.6e-3  # N/m
_CAPILLARY_THETA_AL_DEG = 41.39
_CAPILLARY_RHO_POTTING = 1110.0  # kg/m^3
CAPILLARY_CONSTANT_AL = (
    2.0
    * _CAPILLARY_GAMMA_AL
    * math.cos(math.radians(_CAPILLARY_THETA_AL_DEG))
    / (_CAPILLARY_RHO_POTTING * STANDARD_GRAVITY)
)  # m^2
CAPILLARY_CONSTANT_PA = 5.4e-6  # m^2


def air_default() -> FluidProperties:
    """Air at 20 °C, 1 bar (Wenger/Stoffdaten Online; lines 386–393)."""
    return FluidProperties(
        name="air_20C_1bar",
        reference_temperature=293.15,
        density=1.189,
        specific_heat_capacity=1006.0,
        thermal_conductivity=0.02587,
        kinematic_viscosity=15.32e-6,
        dynamic_viscosity=18.21548e-6,
        prandtl=0.70834,
    )


def coolant_default() -> FluidProperties:
    """Water–ethylene-glycol 50:50 at 70 °C (lines 401–408)."""
    return FluidProperties(
        name="EGL5050_70C",
        reference_temperature=343.15,
        density=1041.5,
        specific_heat_capacity=3555.0,
        thermal_conductivity=0.423,
        kinematic_viscosity=1.23e-6,
        dynamic_viscosity=1.2825e-3,
        prandtl=10.77846,
    )


def aluminum_default() -> SolidMaterial:
    """Aluminum (lines 375–378, 127, 352–359)."""
    return SolidMaterial(
        name="Aluminum",
        thermal_conductivity=220.0,
        tensile_strength=200.0e6,
        min_wall_thickness=0.07e-3,
        capillary_constant=CAPILLARY_CONSTANT_AL,
        cost_reference_index=2.096225695575453,
    )


def polyamide_default() -> SolidMaterial:
    """Polyamide PA (lines 375–378, 128, 352–359)."""
    return SolidMaterial(
        name="Polyamide (PA)",
        thermal_conductivity=0.25,
        tensile_strength=10.0e6,
        min_wall_thickness=0.025e-3,
        capillary_constant=CAPILLARY_CONSTANT_PA,
        cost_reference_index=0.6269018203303992,
    )


def geometry_default() -> BundleGeometry:
    """Paper benchmark footprint: 30×36 tubes at d_ref=1 mm, a=3.28, b=2.00,
    L=160 mm (lines 352–356, 416–420, 433–434)."""
    return BundleGeometry(
        mode=GeometryMode.dimensions,
        dimensions=GeometryDimensions(
            width=30 * 3.28 * 1.0e-3,
            depth=36 * 2.00 * 1.0e-3,
            tube_length=0.160,
        ),
        pitch_transverse_ratio=3.28,
        pitch_longitudinal_ratio=2.00,
        arrangement=TubeArrangement.inline,
        use_finite_row_correction=False,
    )


def boundary_conditions_default() -> BoundaryConditions:
    """Screens and tolerances (lines 132–141, 219–226, 434)."""
    return BoundaryConditions(
        inner_boundary_condition=InnerBoundaryCondition.constant_wall_temperature,
        wall_tolerance=0.020e-3,  # standard production tolerance
        screens=ScreenThresholds(
            min_burst_pressure=6.0e5,  # 6 bar
            min_coolant_volume_flow=10.0 / 60000.0,  # 10 L/min
            max_tube_pressure_drop=0.5e5,  # 0.5 bar
            max_cost_index=5.0,
            max_capillary_rise=2.0e-3,  # 2 mm
            capillary_acceleration_over_g=10.0,
        ),
    )


def sweep_default() -> SweepSettings:
    """Grid as in the reference (lines 88–95, 118–124): d_o 0.1–10 mm,
    t 0.001–4.5 mm (max widened by the τ window), 250×250, τ ≤ 45 %."""
    return SweepSettings(
        outer_diameter_min=0.1e-3,
        outer_diameter_max=10.0e-3,
        wall_thickness_min=0.001e-3,
        wall_thickness_max=4.5e-3,
        n_outer_diameter=250,
        n_wall_thickness=250,
        wall_ratio_calc_min_pct=0.0,
        wall_ratio_calc_max_pct=45.0,
    )


def design_point_default() -> DesignPoint:
    """Validated benchmark geometry marker: d_o=1 mm, t=0.1 mm (lines 108–111)."""
    return DesignPoint(outer_diameter=1.0e-3, wall_thickness=0.1e-3)


def cooler_default(label: str, material: SolidMaterial) -> CoolerConfiguration:
    return CoolerConfiguration(
        label=label,
        geometry=geometry_default(),
        material=material,
        air_side=AirSide(
            fluid=air_default(),
            mode=AirOperatingMode.constant_velocity,
            value=5.0,  # v_a (line 49)
        ),
        coolant_side=CoolantSide(
            fluid=coolant_default(),
            mode=CoolantOperatingMode.constant_velocity,
            value=0.5,  # v_i (line 50)
        ),
        boundary_conditions=boundary_conditions_default(),
        design_point=design_point_default(),
    )


def paper_default_request() -> SimulationRequest:
    """The approved paper comparison: equal geometry, aluminum vs. PA."""
    return SimulationRequest(
        sweep=sweep_default(),
        cooler_left=cooler_default("Aluminum", aluminum_default()),
        cooler_right=cooler_default("Polyamide (PA)", polyamide_default()),
        linked_groups={
            LinkGroup.geometry: True,
            LinkGroup.materials: False,
            LinkGroup.air_side: True,
            LinkGroup.coolant_side: True,
            LinkGroup.boundary_conditions: True,
        },
    )
