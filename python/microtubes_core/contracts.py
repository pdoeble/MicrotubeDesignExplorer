"""Public computation contracts: ``SimulationRequest`` → ``SimulationResult``.

Single source of truth for all cross-language data structures (AGENTS §6).
JSON Schemas and TypeScript types are generated from these models by
``scripts/export_contracts.py``; never edit the generated files by hand.

Units: strict SI throughout (m, s, kg, Pa, W, K). Display conversions
(mm, bar, L/min, …) are defined only in the parameter manifest
(:mod:`microtubes_core.parameter_manifest`).

Binding validity policy (master roadmap M2):

- Impossible geometry and malformed/non-finite input are **rejected**
  (`ErrorCode`, no computation).
- Correlation-range violations compute only when numerically safe and are
  marked ``outside-validity`` (`WarningCode.outside_validity`).
- Screened-out designs remain visible and distinguishable (masks, never
  deletion).
- Invalid cells are masked (NaN); silent clipping or interpolation is
  forbidden.
"""

from __future__ import annotations

import math
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from microtubes_core import CONTRACT_VERSION

__all__ = [
    "CONTRACT_VERSION",
    "AirOperatingMode",
    "AirSide",
    "BoundaryConditions",
    "BundleGeometry",
    "ComparisonResultPayload",
    "CoolantOperatingMode",
    "CoolantSide",
    "CoolerConfiguration",
    "CoolerResultPayload",
    "DesignPoint",
    "ErrorCode",
    "ErrorItem",
    "FluidProperties",
    "GeometryDimensions",
    "GeometryMode",
    "GeometryVolumeAspect",
    "GridFieldRef",
    "InnerBoundaryCondition",
    "LinkGroup",
    "Provenance",
    "ScalarSummary",
    "ScreenThresholds",
    "SimulationRequest",
    "SimulationResultPayload",
    "SolidMaterial",
    "SweepSettings",
    "TubeArrangement",
    "WarningCode",
    "WarningItem",
]

FiniteFloat = Annotated[float, Field(allow_inf_nan=False)]
PositiveFinite = Annotated[float, Field(gt=0, allow_inf_nan=False)]
NonNegativeFinite = Annotated[float, Field(ge=0, allow_inf_nan=False)]


class StrictModel(BaseModel):
    """Base: forbid unknown fields so malformed payloads are rejected."""

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class GeometryMode(StrEnum):
    """User-facing geometry input representation. Canonical form: dimensions."""

    dimensions = "dimensions"
    volume_aspect = "volume_aspect"


class TubeArrangement(StrEnum):
    inline = "inline"
    staggered = "staggered"


class InnerBoundaryCondition(StrEnum):
    """VDI G1 thermal boundary condition of the inner tube wall."""

    constant_wall_temperature = "constant_wall_temperature"
    constant_heat_flux = "constant_heat_flux"


class CoolantOperatingMode(StrEnum):
    """Coolant side supports all five modes (ADR-0003)."""

    constant_velocity = "constant_velocity"
    constant_volume_flow = "constant_volume_flow"
    constant_mass_flow = "constant_mass_flow"
    constant_pressure_drop = "constant_pressure_drop"
    constant_hydraulic_power = "constant_hydraulic_power"


class AirOperatingMode(StrEnum):
    """Air side: no pressure-drop physics in the approved model (ADR-0003)."""

    constant_velocity = "constant_velocity"
    constant_volume_flow = "constant_volume_flow"
    constant_mass_flow = "constant_mass_flow"


class LinkGroup(StrEnum):
    """Input groups that can be linked between the two coolers."""

    geometry = "geometry"
    materials = "materials"
    air_side = "air_side"
    coolant_side = "coolant_side"
    boundary_conditions = "boundary_conditions"


class ErrorCode(StrEnum):
    schema_invalid = "E_SCHEMA_INVALID"
    non_finite_input = "E_NON_FINITE_INPUT"
    geometry_impossible = "E_GEOMETRY_IMPOSSIBLE"
    value_out_of_range = "E_VALUE_OUT_OF_RANGE"
    mode_unsupported_air_side = "E_MODE_UNSUPPORTED_AIR_SIDE"
    operating_point_unsolvable = "E_OPERATING_POINT_UNSOLVABLE"
    contract_version_mismatch = "E_CONTRACT_VERSION_MISMATCH"
    internal = "E_INTERNAL"


class WarningCode(StrEnum):
    outside_validity = "W_OUTSIDE_VALIDITY"
    screened_out = "W_SCREENED_OUT"
    discrete_transition = "W_DISCRETE_TRANSITION"
    physically_unusual = "W_PHYSICALLY_UNUSUAL"
    no_feasible_reference = "W_NO_FEASIBLE_REFERENCE"


# ---------------------------------------------------------------------------
# Property sets (static, no temperature dependence — paper model)
# ---------------------------------------------------------------------------


class FluidProperties(StrictModel):
    """Static fluid property set (no temperature-dependent models)."""

    name: str = Field(min_length=1)
    reference_temperature: FiniteFloat = Field(
        description="Reference temperature of the property set", json_schema_extra={"unit": "K"}
    )
    density: PositiveFinite = Field(json_schema_extra={"unit": "kg/m^3"})
    specific_heat_capacity: PositiveFinite = Field(json_schema_extra={"unit": "J/(kg K)"})
    thermal_conductivity: PositiveFinite = Field(json_schema_extra={"unit": "W/(m K)"})
    kinematic_viscosity: PositiveFinite = Field(json_schema_extra={"unit": "m^2/s"})
    dynamic_viscosity: PositiveFinite = Field(json_schema_extra={"unit": "Pa s"})
    prandtl: PositiveFinite = Field(json_schema_extra={"unit": "-"})


class SolidMaterial(StrictModel):
    """Tube material incl. manufacturing/process screening properties."""

    name: str = Field(min_length=1)
    thermal_conductivity: PositiveFinite = Field(json_schema_extra={"unit": "W/(m K)"})
    tensile_strength: PositiveFinite = Field(
        description="Rm used by the Lamé burst screen", json_schema_extra={"unit": "Pa"}
    )
    min_wall_thickness: PositiveFinite = Field(
        description="Technology minimum wall thickness (screen boundary)",
        json_schema_extra={"unit": "m"},
    )
    capillary_constant: PositiveFinite = Field(
        description="C_cap of the potting capillary-rise screen (full-gap slit convention)",
        json_schema_extra={"unit": "m^2"},
    )
    cost_reference_index: PositiveFinite = Field(
        description="Material tube-supply cost index at the reference geometry",
        json_schema_extra={"unit": "-"},
    )


# ---------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------


class GeometryDimensions(StrictModel):
    """Canonical package representation: transverse × longitudinal × tube length."""

    width: PositiveFinite = Field(
        description="Package extent transverse to the air flow",
        json_schema_extra={"unit": "m"},
    )
    depth: PositiveFinite = Field(
        description="Package extent along the air flow (tube-bank depth)",
        json_schema_extra={"unit": "m"},
    )
    tube_length: PositiveFinite = Field(
        description="Active tube length L", json_schema_extra={"unit": "m"}
    )


class GeometryVolumeAspect(StrictModel):
    """Alternative representation; converted exactly to dimensions.

    width = aspect_width_over_depth · depth,
    tube_length = aspect_length_over_depth · depth,
    depth = (volume / (aspect_width_over_depth · aspect_length_over_depth))^(1/3).
    """

    volume: PositiveFinite = Field(json_schema_extra={"unit": "m^3"})
    aspect_width_over_depth: PositiveFinite = Field(json_schema_extra={"unit": "-"})
    aspect_length_over_depth: PositiveFinite = Field(json_schema_extra={"unit": "-"})

    def to_dimensions(self) -> GeometryDimensions:
        depth = (self.volume / (self.aspect_width_over_depth * self.aspect_length_over_depth)) ** (
            1.0 / 3.0
        )
        return GeometryDimensions(
            width=self.aspect_width_over_depth * depth,
            depth=depth,
            tube_length=self.aspect_length_over_depth * depth,
        )


class BundleGeometry(StrictModel):
    """Tube-bank geometry. Exactly one representation must match `mode`."""

    mode: GeometryMode = GeometryMode.dimensions
    dimensions: GeometryDimensions | None = None
    volume_aspect: GeometryVolumeAspect | None = None
    pitch_transverse_ratio: PositiveFinite = Field(
        description="a = S_T/d_o", json_schema_extra={"unit": "-"}
    )
    pitch_longitudinal_ratio: PositiveFinite = Field(
        description="b = S_L/d_o", json_schema_extra={"unit": "-"}
    )
    arrangement: TubeArrangement = TubeArrangement.inline
    use_finite_row_correction: bool = Field(
        default=False,
        description="VDI G7 finite-row factor (1+(n-1)·f_A)/n instead of many-row f_A",
    )

    @model_validator(mode="after")
    def _exactly_one_representation(self) -> BundleGeometry:
        if self.mode is GeometryMode.dimensions and self.dimensions is None:
            raise ValueError("geometry mode 'dimensions' requires the dimensions block")
        if self.mode is GeometryMode.volume_aspect and self.volume_aspect is None:
            raise ValueError("geometry mode 'volume_aspect' requires the volume_aspect block")
        return self

    def canonical_dimensions(self) -> GeometryDimensions:
        """Canonical conversion rule (frozen in M2)."""
        if self.mode is GeometryMode.dimensions:
            assert self.dimensions is not None
            return self.dimensions
        assert self.volume_aspect is not None
        return self.volume_aspect.to_dimensions()


# ---------------------------------------------------------------------------
# Operating conditions
# ---------------------------------------------------------------------------


class AirSide(StrictModel):
    """Air-side fluid and operating point."""

    fluid: FluidProperties
    mode: AirOperatingMode = AirOperatingMode.constant_velocity
    value: PositiveFinite = Field(
        description=(
            "Meaning depends on mode: constant_velocity → face velocity [m/s]; "
            "constant_volume_flow → volume flow [m^3/s]; "
            "constant_mass_flow → mass flow [kg/s]"
        )
    )


class CoolantSide(StrictModel):
    """Coolant-side fluid and operating point (all five modes, ADR-0003)."""

    fluid: FluidProperties
    mode: CoolantOperatingMode = CoolantOperatingMode.constant_velocity
    value: PositiveFinite = Field(
        description=(
            "Meaning depends on mode: constant_velocity → mean tube velocity [m/s]; "
            "constant_volume_flow → total bundle volume flow [m^3/s]; "
            "constant_mass_flow → total mass flow [kg/s]; "
            "constant_pressure_drop → tube friction pressure drop [Pa]; "
            "constant_hydraulic_power → hydraulic power [W]"
        )
    )


# ---------------------------------------------------------------------------
# Boundary conditions and screens
# ---------------------------------------------------------------------------


class ScreenThresholds(StrictModel):
    """All-screen feasibility thresholds (paper design-boundary settings)."""

    min_burst_pressure: NonNegativeFinite = Field(json_schema_extra={"unit": "Pa"})
    min_coolant_volume_flow: NonNegativeFinite = Field(json_schema_extra={"unit": "m^3/s"})
    max_tube_pressure_drop: PositiveFinite = Field(json_schema_extra={"unit": "Pa"})
    max_cost_index: PositiveFinite = Field(json_schema_extra={"unit": "-"})
    max_capillary_rise: PositiveFinite = Field(json_schema_extra={"unit": "m"})
    capillary_acceleration_over_g: PositiveFinite = Field(json_schema_extra={"unit": "-"})


class BoundaryConditions(StrictModel):
    """Model boundary conditions and production tolerance settings."""

    inner_boundary_condition: InnerBoundaryCondition = (
        InnerBoundaryCondition.constant_wall_temperature
    )
    wall_tolerance: NonNegativeFinite = Field(
        description="Δt for the tolerance-adjusted Lamé screen (t_loc,min = t_nom − Δt)",
        json_schema_extra={"unit": "m"},
    )
    screens: ScreenThresholds


# ---------------------------------------------------------------------------
# Sweep and design point
# ---------------------------------------------------------------------------


class SweepSettings(StrictModel):
    """Design-space grid definition (log-spaced axes as in the reference)."""

    outer_diameter_min: PositiveFinite = Field(json_schema_extra={"unit": "m"})
    outer_diameter_max: PositiveFinite = Field(json_schema_extra={"unit": "m"})
    wall_thickness_min: PositiveFinite = Field(json_schema_extra={"unit": "m"})
    wall_thickness_max: PositiveFinite = Field(json_schema_extra={"unit": "m"})
    n_outer_diameter: int = Field(ge=16, le=1000)
    n_wall_thickness: int = Field(ge=16, le=1000)
    wall_ratio_calc_min_pct: NonNegativeFinite = Field(
        default=0.0, description="τ window lower bound", json_schema_extra={"unit": "%"}
    )
    wall_ratio_calc_max_pct: PositiveFinite = Field(
        description="τ window upper bound (values outside are masked)",
        json_schema_extra={"unit": "%"},
    )

    @model_validator(mode="after")
    def _ranges_ordered(self) -> SweepSettings:
        if not self.outer_diameter_min < self.outer_diameter_max:
            raise ValueError("outer_diameter_min must be < outer_diameter_max")
        if not self.wall_thickness_min < self.wall_thickness_max:
            raise ValueError("wall_thickness_min must be < wall_thickness_max")
        if not self.wall_ratio_calc_min_pct < self.wall_ratio_calc_max_pct:
            raise ValueError("wall_ratio_calc window must be ordered")
        return self


class DesignPoint(StrictModel):
    """Point in the design space used for the scalar KPI summary."""

    outer_diameter: PositiveFinite = Field(json_schema_extra={"unit": "m"})
    wall_thickness: PositiveFinite = Field(json_schema_extra={"unit": "m"})

    @model_validator(mode="after")
    def _valid_inner_diameter(self) -> DesignPoint:
        if self.outer_diameter - 2.0 * self.wall_thickness <= 0.0:
            raise ValueError("design point has non-positive inner diameter")
        return self


# ---------------------------------------------------------------------------
# Cooler configuration and request
# ---------------------------------------------------------------------------


class CoolerConfiguration(StrictModel):
    label: str = Field(min_length=1, max_length=80)
    geometry: BundleGeometry
    material: SolidMaterial
    air_side: AirSide
    coolant_side: CoolantSide
    boundary_conditions: BoundaryConditions
    design_point: DesignPoint


class SimulationRequest(StrictModel):
    """Complete two-cooler design-space computation request."""

    contract_version: Literal["1.0.0"] = CONTRACT_VERSION  # type: ignore[assignment]
    sweep: SweepSettings
    cooler_left: CoolerConfiguration
    cooler_right: CoolerConfiguration
    linked_groups: dict[LinkGroup, bool] = Field(
        description="Group-level linking left↔right; linked groups must be equal"
    )

    @model_validator(mode="after")
    def _linked_groups_consistent(self) -> SimulationRequest:
        pairs: dict[LinkGroup, tuple[object, object]] = {
            LinkGroup.geometry: (self.cooler_left.geometry, self.cooler_right.geometry),
            LinkGroup.materials: (self.cooler_left.material, self.cooler_right.material),
            LinkGroup.air_side: (self.cooler_left.air_side, self.cooler_right.air_side),
            LinkGroup.coolant_side: (
                self.cooler_left.coolant_side,
                self.cooler_right.coolant_side,
            ),
            LinkGroup.boundary_conditions: (
                self.cooler_left.boundary_conditions,
                self.cooler_right.boundary_conditions,
            ),
        }
        for group, (left, right) in pairs.items():
            if self.linked_groups.get(group, False) and left != right:
                raise ValueError(f"linked group '{group.value}' differs between coolers")
        return self


# ---------------------------------------------------------------------------
# Result payload (JSON metadata; large arrays travel as transferables)
# ---------------------------------------------------------------------------


class GridFieldRef(StrictModel):
    """Reference to a 2D float64 array shipped outside the JSON payload.

    ``buffer_index`` addresses the transferable ArrayBuffer list of the
    worker message (row-major / C order, shape [n_wall_thickness,
    n_outer_diameter]).
    """

    name: str
    unit: str
    description: str = ""
    shape: tuple[int, int]
    buffer_index: int = Field(ge=0)


class WarningItem(StrictModel):
    code: WarningCode
    message: str
    affected_quantity: str = ""
    recommendation: str = ""


class ErrorItem(StrictModel):
    code: ErrorCode
    message: str
    field_path: str = Field(default="", description="JSON path of the offending input")


class ScalarSummary(StrictModel):
    """KPI values at the cooler's design point (roadmap §9). SI units."""

    values: dict[str, FiniteFloat | None] = Field(
        description="KPI name → value (None where undefined/masked)"
    )
    units: dict[str, str]
    screens_passed: dict[str, bool]
    is_feasible: bool


class CoolerResultPayload(StrictModel):
    label: str
    fields: list[GridFieldRef]
    masks: list[GridFieldRef]
    summary: ScalarSummary
    warnings: list[WarningItem]


class ComparisonResultPayload(StrictModel):
    """Right-vs-left comparison fields (delta/ratio and tech-adjusted)."""

    fields: list[GridFieldRef]
    warnings: list[WarningItem]


class Provenance(StrictModel):
    core_version: str
    contract_version: str
    request_hash: str = Field(description="SHA-256 over the canonical request JSON")
    generated_utc: str
    golden_reference: str = Field(
        default="", description="Manifest hash of the golden dataset the core was validated against"
    )


class SimulationResultPayload(StrictModel):
    contract_version: Literal["1.0.0"] = CONTRACT_VERSION  # type: ignore[assignment]
    request_hash: str
    outer_diameter_axis: list[float] = Field(json_schema_extra={"unit": "m"})
    wall_thickness_axis: list[float] = Field(json_schema_extra={"unit": "m"})
    cooler_left: CoolerResultPayload
    cooler_right: CoolerResultPayload
    comparison: ComparisonResultPayload
    errors: list[ErrorItem]
    provenance: Provenance


def ensure_finite_request(request: SimulationRequest) -> None:
    """Reject NaN/Inf anywhere in a request (binding validity policy).

    Pydantic field constraints already forbid non-finite floats; this is a
    defense-in-depth check for payloads constructed programmatically.
    """
    stack: list[object] = [request.model_dump()]
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            stack.extend(item.values())
        elif isinstance(item, list):
            stack.extend(item)
        elif isinstance(item, float) and not math.isfinite(item):
            raise ValueError("non-finite value in SimulationRequest")
