"""Public Python API for the scientific core.

This module is the M3 boundary from ``SimulationRequest`` to
``SimulationResultPayload`` plus the out-of-band numeric arrays referenced by
``GridFieldRef``. Browser transport details remain M4 work.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime

import numpy as np

import microtubes_core
from microtubes_core.contracts import (
    ComparisonResultPayload,
    CoolerConfiguration,
    CoolerResultPayload,
    GridFieldRef,
    Provenance,
    ScalarSummary,
    SimulationRequest,
    SimulationResultPayload,
    WarningCode,
    WarningItem,
    ensure_finite_request,
)
from microtubes_core.models._array import BoolArray, FloatArray
from microtubes_core.sweeps.comparison import (
    bilinear_interp2_native,
    compare_sweeps,
    evaluate_design_screen_at_queries,
)
from microtubes_core.sweeps.design_space import (
    CoolerSweepResult,
    DesignGrid,
    build_design_grid,
    evaluate_cooler_sweep,
)

G7_RE_MIN = 10.0
G7_RE_MAX = 1.0e6
G7_PR_MIN = 0.6
G7_PR_MAX = 1.0e3
G1_RE_MAX = 1.0e6
G1_PR_MIN = 0.1
G1_PR_MAX = 1.0e3


@dataclass(frozen=True)
class SimulationResult:
    """Computation result: JSON payload plus referenced float64 arrays."""

    payload: SimulationResultPayload
    arrays: tuple[FloatArray, ...]


@dataclass
class _ArrayRegistry:
    arrays: list[FloatArray]

    def add(self, name: str, unit: str, values: FloatArray, description: str = "") -> GridFieldRef:
        array = np.ascontiguousarray(values, dtype=np.float64)
        self.arrays.append(array)
        return GridFieldRef(
            name=name,
            unit=unit,
            description=description,
            shape=(int(array.shape[0]), int(array.shape[1])),
            buffer_index=len(self.arrays) - 1,
        )


def simulate(request: SimulationRequest) -> SimulationResult:
    """Evaluate a full two-cooler design-space request.

    The returned payload contains JSON metadata and `GridFieldRef` objects;
    numeric arrays are returned separately in row-major `float64` order.
    """
    ensure_finite_request(request)
    request_hash = request_sha256(request)
    grid = build_design_grid(request.sweep)
    left = evaluate_cooler_sweep(request.sweep, request.cooler_left, grid=grid)
    right = evaluate_cooler_sweep(request.sweep, request.cooler_right, grid=grid)
    comparison = compare_sweeps(left, right)

    registry = _ArrayRegistry(arrays=[])
    left_payload = _cooler_payload(
        request.cooler_left,
        left,
        grid,
        registry,
    )
    right_payload = _cooler_payload(
        request.cooler_right,
        right,
        grid,
        registry,
    )
    comparison_payload = ComparisonResultPayload(
        fields=[
            registry.add("ratio_same_geometry", "-", comparison.ratio_same_geometry),
            registry.add(
                "delta_same_geometry_percent",
                "%",
                comparison.delta_same_geometry_percent,
            ),
            registry.add(
                "nearest_left_reference_diameter",
                "m",
                comparison.nearest_left_reference.diameter,
            ),
            registry.add("ratio_tech_adjusted", "-", comparison.ratio_tech_adjusted),
            registry.add(
                "delta_tech_adjusted_percent",
                "%",
                comparison.delta_tech_adjusted_percent,
            ),
            registry.add(
                "ratio_bundle_conductance_tech_adjusted",
                "-",
                comparison.ratio_bundle_conductance_tech_adjusted,
            ),
            registry.add(
                "delta_bundle_conductance_tech_adjusted_percent",
                "%",
                comparison.delta_bundle_conductance_tech_adjusted_percent,
            ),
            registry.add(
                "boundary_wall_ratio",
                "%",
                comparison.boundary_left.wall_ratio_pct,
            ),
            registry.add("boundary_left_diameter", "m", comparison.boundary_left.diameter),
            registry.add("boundary_right_diameter", "m", comparison.boundary_right.diameter),
        ],
        warnings=[],
    )
    payload = SimulationResultPayload(
        request_hash=request_hash,
        outer_diameter_axis=grid.outer_diameter_axis.tolist(),
        wall_thickness_axis=grid.wall_thickness_axis.tolist(),
        cooler_left=left_payload,
        cooler_right=right_payload,
        comparison=comparison_payload,
        errors=[],
        provenance=Provenance(
            core_version=microtubes_core.__version__,
            contract_version=microtubes_core.CONTRACT_VERSION,
            request_hash=request_hash,
            generated_utc=datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        ),
    )
    return SimulationResult(payload=payload, arrays=tuple(registry.arrays))


def request_sha256(request: SimulationRequest) -> str:
    """Return SHA-256 over canonical request JSON."""
    canonical = json.dumps(
        request.model_dump(mode="json"),
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def _cooler_payload(
    cooler: CoolerConfiguration,
    result: CoolerSweepResult,
    grid: DesignGrid,
    registry: _ArrayRegistry,
) -> CoolerResultPayload:
    design_diameter = cooler.design_point.outer_diameter
    design_wall = cooler.design_point.wall_thickness
    field_specs = [
        ("alpha_outer", "W/(m^2 K)", result.alpha_outer),
        ("alpha_inner", "W/(m^2 K)", result.alpha_inner),
        ("coolant_velocity", "m/s", result.coolant_velocity),
        ("re_inner", "-", result.re_inner),
        ("re_outer_simple", "-", result.re_outer_simple),
        ("re_outer_vdi", "-", result.re_outer_vdi),
        ("tube_pressure_drop", "Pa", result.tube_pressure_drop),
        ("hydraulic_power", "W", result.hydraulic_power),
        ("coolant_volume_flow", "m^3/s", result.coolant_volume_flow),
        ("coolant_mass_flow", "kg/s", result.coolant_mass_flow),
        ("tube_count_continuous", "-", result.tube_count_continuous),
        ("bundle_outer_area", "m^2", result.bundle_outer_area),
        ("overall_coefficient", "W/(m^2 K)", result.overall_coefficient),
        ("bundle_conductance", "W/K", result.bundle_conductance),
        ("burst_pressure", "Pa", result.burst_pressure),
        (
            "burst_pressure_tolerance_standard",
            "Pa",
            result.burst_pressure_tolerance_standard,
        ),
        ("burst_pressure_tolerance_medical", "Pa", result.burst_pressure_tolerance_medical),
        ("clear_spacing_transverse", "m", result.clear_spacing_transverse),
        ("clear_spacing_longitudinal", "m", result.clear_spacing_longitudinal),
        ("clear_spacing_closest_inline", "m", result.clear_spacing_closest_inline),
        (
            "clear_spacing_closest_staggered",
            "m",
            result.clear_spacing_closest_staggered,
        ),
        ("capillary_rise", "m", result.capillary_rise),
        ("capillary_rise_1g", "m", result.capillary_rise_1g),
        ("capillary_rise_5g", "m", result.capillary_rise_5g),
        ("capillary_rise_10g", "m", result.capillary_rise_10g),
        ("cost_index", "-", result.cost_index),
        ("resistance_inner", "m^2 K/W", result.resistance_inner),
        ("resistance_wall", "m^2 K/W", result.resistance_wall),
        ("resistance_outer", "m^2 K/W", result.resistance_outer),
    ]
    fields = [registry.add(name, unit, values) for name, unit, values in field_specs]
    masks = [
        registry.add("mask_invalid_geometry", "-", _mask_array(grid.mask_invalid_geometry)),
        registry.add("mask_wall_ratio_range", "-", _mask_array(grid.mask_wall_ratio_range)),
        registry.add("mask_below_min_wall", "-", _mask_array(result.mask_below_min_wall)),
        registry.add(
            "mask_all_screens_feasible",
            "-",
            _mask_array(result.mask_all_screens_feasible),
        ),
        registry.add(
            "mask_operating_unsolvable",
            "-",
            _mask_array(result.mask_operating_unsolvable),
        ),
    ]
    return CoolerResultPayload(
        label=cooler.label,
        fields=fields,
        masks=masks,
        summary=_scalar_summary(
            design_diameter,
            design_wall,
            cooler.material.min_wall_thickness,
            result,
            grid,
        ),
        warnings=_warnings_for_result(result, cooler, grid, design_diameter, design_wall),
    )


def _scalar_summary(
    design_diameter: float,
    design_wall: float,
    material_min_wall_thickness: float,
    result: CoolerSweepResult,
    grid: DesignGrid,
) -> ScalarSummary:
    values = {
        "design_outer_diameter": design_diameter,
        "design_wall_thickness": design_wall,
        "design_wall_ratio": 100.0 * design_wall / design_diameter,
        "material_min_wall_thickness": material_min_wall_thickness,
        "overall_coefficient": _sample_field(
            grid, result.overall_coefficient, design_diameter, design_wall
        ),
        "bundle_conductance": _sample_field(
            grid, result.bundle_conductance, design_diameter, design_wall
        ),
        "tube_pressure_drop": _sample_field(
            grid, result.tube_pressure_drop, design_diameter, design_wall
        ),
        "hydraulic_power": _sample_field(
            grid, result.hydraulic_power, design_diameter, design_wall
        ),
        "coolant_volume_flow": _sample_field(
            grid, result.coolant_volume_flow, design_diameter, design_wall
        ),
        "burst_pressure": _sample_field(grid, result.burst_pressure, design_diameter, design_wall),
        "burst_pressure_tolerance_standard": _sample_field(
            grid, result.burst_pressure_tolerance_standard, design_diameter, design_wall
        ),
        "burst_pressure_tolerance_medical": _sample_field(
            grid, result.burst_pressure_tolerance_medical, design_diameter, design_wall
        ),
        "capillary_rise": _sample_field(grid, result.capillary_rise, design_diameter, design_wall),
        "capillary_rise_1g": _sample_field(
            grid, result.capillary_rise_1g, design_diameter, design_wall
        ),
        "capillary_rise_5g": _sample_field(
            grid, result.capillary_rise_5g, design_diameter, design_wall
        ),
        "capillary_rise_10g": _sample_field(
            grid, result.capillary_rise_10g, design_diameter, design_wall
        ),
        "cost_index": _sample_field(grid, result.cost_index, design_diameter, design_wall),
    }
    units = {
        "design_outer_diameter": "m",
        "design_wall_thickness": "m",
        "design_wall_ratio": "%",
        "material_min_wall_thickness": "m",
        "overall_coefficient": "W/(m^2 K)",
        "bundle_conductance": "W/K",
        "tube_pressure_drop": "Pa",
        "hydraulic_power": "W",
        "coolant_volume_flow": "m^3/s",
        "burst_pressure": "Pa",
        "burst_pressure_tolerance_standard": "Pa",
        "burst_pressure_tolerance_medical": "Pa",
        "capillary_rise": "m",
        "capillary_rise_1g": "m",
        "capillary_rise_5g": "m",
        "capillary_rise_10g": "m",
        "cost_index": "-",
    }
    screen_query = evaluate_design_screen_at_queries(
        grid.outer_diameter_axis,
        grid.wall_thickness_axis,
        np.array([[design_diameter]], dtype=np.float64),
        np.array([[design_wall]], dtype=np.float64),
        result.screen_inputs,
        result.screen_thresholds,
    )
    design_feasible = bool(screen_query.ok[0, 0])
    screens = {
        "all_screens": design_feasible,
        "operating_point": not bool(
            _sample_mask(grid, result.mask_operating_unsolvable, design_diameter, design_wall)
        ),
    }
    return ScalarSummary(
        values=values,
        units=units,
        screens_passed=screens,
        is_feasible=design_feasible,
    )


def _sample_field(
    grid: DesignGrid,
    field: FloatArray,
    diameter: float,
    wall: float,
) -> float | None:
    sample = bilinear_interp2_native(
        grid.outer_diameter_axis,
        grid.wall_thickness_axis,
        field,
        np.array([[diameter]], dtype=np.float64),
        np.array([[wall]], dtype=np.float64),
    )
    value = float(sample[0, 0])
    return value if np.isfinite(value) else None


def _sample_mask(grid: DesignGrid, mask: BoolArray, diameter: float, wall: float) -> bool:
    column = int(np.argmin(np.abs(grid.outer_diameter_axis - diameter)))
    row = int(np.argmin(np.abs(grid.wall_thickness_axis - wall)))
    return bool(mask[row, column])


def _mask_array(mask: BoolArray) -> FloatArray:
    return np.asarray(mask, dtype=np.float64)


def _warnings_for_result(
    result: CoolerSweepResult,
    cooler: CoolerConfiguration,
    grid: DesignGrid,
    design_diameter: float,
    design_wall: float,
) -> list[WarningItem]:
    warnings: list[WarningItem] = []
    if np.any(result.mask_operating_unsolvable):
        warnings.append(
            WarningItem(
                code=WarningCode.screened_out,
                message="Some cells have unsolved coolant operating points.",
                affected_quantity="coolant_velocity",
                recommendation="Adjust the coolant operating target or sweep range.",
            )
        )
    warnings.extend(
        _correlation_validity_warnings(result, cooler, grid, design_diameter, design_wall)
    )
    return warnings


def _correlation_validity_warnings(
    result: CoolerSweepResult,
    cooler: CoolerConfiguration,
    grid: DesignGrid,
    design_diameter: float,
    design_wall: float,
) -> list[WarningItem]:
    warnings: list[WarningItem] = []
    warnings.extend(
        _range_warning_for_grid(
            result.re_outer_vdi,
            affected_quantity="re_outer_vdi",
            label="VDI G7 tube-bank Reynolds number",
            lower=G7_RE_MIN,
            upper=G7_RE_MAX,
            design_value=_sample_field(grid, result.re_outer_vdi, design_diameter, design_wall),
            recommendation="Treat cells outside the VDI G7 range as outside-validity.",
        )
    )
    warnings.extend(
        _range_warning_for_value(
            cooler.air_side.fluid.prandtl,
            affected_quantity="air_side.fluid.prandtl",
            label="VDI G7 air-side Prandtl number",
            lower=G7_PR_MIN,
            upper=G7_PR_MAX,
            recommendation="Use a fluid property set within the VDI G7 Prandtl range.",
        )
    )
    warnings.extend(
        _range_warning_for_grid(
            result.re_inner,
            affected_quantity="re_inner",
            label="VDI G1 tube-side Reynolds number",
            lower=None,
            upper=G1_RE_MAX,
            design_value=_sample_field(grid, result.re_inner, design_diameter, design_wall),
            recommendation="Treat cells above the VDI G1 Reynolds limit as outside-validity.",
        )
    )
    warnings.extend(
        _range_warning_for_value(
            cooler.coolant_side.fluid.prandtl,
            affected_quantity="coolant_side.fluid.prandtl",
            label="VDI G1 coolant-side Prandtl number",
            lower=G1_PR_MIN,
            upper=G1_PR_MAX,
            recommendation="Use a fluid property set within the VDI G1 Prandtl range.",
        )
    )
    return warnings


def _range_warning_for_grid(
    values: FloatArray,
    *,
    affected_quantity: str,
    label: str,
    lower: float | None,
    upper: float,
    design_value: float | None,
    recommendation: str,
) -> list[WarningItem]:
    finite = values[np.isfinite(values)]
    if finite.size == 0:
        return []
    outside = _outside_range(finite, lower=lower, upper=upper)
    outside_count = int(np.count_nonzero(outside))
    design_outside = (
        design_value is not None
        and np.isfinite(design_value)
        and bool(_outside_range(np.array([design_value]), lower=lower, upper=upper)[0])
    )
    if outside_count == 0 and not design_outside:
        return []
    share = outside_count / int(finite.size)
    message = (
        f"{outside_count} of {int(finite.size)} finite grid cells "
        f"({share:.1%}) are outside the {label} validity range"
    )
    if design_outside:
        message = f"{message}; the design point is also outside the range"
    return [
        WarningItem(
            code=WarningCode.outside_validity,
            message=message,
            affected_quantity=affected_quantity,
            recommendation=recommendation,
        )
    ]


def _range_warning_for_value(
    value: float,
    *,
    affected_quantity: str,
    label: str,
    lower: float,
    upper: float,
    recommendation: str,
) -> list[WarningItem]:
    if not bool(_outside_range(np.array([value], dtype=np.float64), lower=lower, upper=upper)[0]):
        return []
    return [
        WarningItem(
            code=WarningCode.outside_validity,
            message=f"{label}={value:g} is outside the validity range [{lower:g}, {upper:g}].",
            affected_quantity=affected_quantity,
            recommendation=recommendation,
        )
    ]


def _outside_range(values: FloatArray, *, lower: float | None, upper: float) -> BoolArray:
    if lower is None:
        return values > upper
    return (values < lower) | (values > upper)


def iter_field_arrays(result: SimulationResult) -> Iterable[FloatArray]:
    """Yield numeric arrays in payload buffer order."""
    yield from result.arrays
