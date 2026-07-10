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
        request.cooler_left.label,
        request.cooler_left.design_point.outer_diameter,
        request.cooler_left.design_point.wall_thickness,
        left,
        grid,
        registry,
    )
    right_payload = _cooler_payload(
        request.cooler_right.label,
        request.cooler_right.design_point.outer_diameter,
        request.cooler_right.design_point.wall_thickness,
        right,
        grid,
        registry,
    )
    comparison_payload = ComparisonResultPayload(
        fields=[
            registry.add("ratio_same_geometry", "-", comparison.ratio_same_geometry),
            registry.add(
                "nearest_left_reference_diameter",
                "m",
                comparison.nearest_left_reference.diameter,
            ),
            registry.add("ratio_tech_adjusted", "-", comparison.ratio_tech_adjusted),
            registry.add(
                "ratio_bundle_conductance_tech_adjusted",
                "-",
                comparison.ratio_bundle_conductance_tech_adjusted,
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
    label: str,
    design_diameter: float,
    design_wall: float,
    result: CoolerSweepResult,
    grid: DesignGrid,
    registry: _ArrayRegistry,
) -> CoolerResultPayload:
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
        ("clear_spacing_transverse", "m", result.clear_spacing_transverse),
        ("clear_spacing_longitudinal", "m", result.clear_spacing_longitudinal),
        ("clear_spacing_closest_inline", "m", result.clear_spacing_closest_inline),
        (
            "clear_spacing_closest_staggered",
            "m",
            result.clear_spacing_closest_staggered,
        ),
        ("capillary_rise", "m", result.capillary_rise),
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
        label=label,
        fields=fields,
        masks=masks,
        summary=_scalar_summary(design_diameter, design_wall, result, grid),
        warnings=_warnings_for_result(result),
    )


def _scalar_summary(
    design_diameter: float,
    design_wall: float,
    result: CoolerSweepResult,
    grid: DesignGrid,
) -> ScalarSummary:
    values = {
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
        "capillary_rise": _sample_field(grid, result.capillary_rise, design_diameter, design_wall),
        "cost_index": _sample_field(grid, result.cost_index, design_diameter, design_wall),
    }
    units = {
        "overall_coefficient": "W/(m^2 K)",
        "bundle_conductance": "W/K",
        "tube_pressure_drop": "Pa",
        "hydraulic_power": "W",
        "coolant_volume_flow": "m^3/s",
        "burst_pressure": "Pa",
        "capillary_rise": "m",
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


def _warnings_for_result(result: CoolerSweepResult) -> list[WarningItem]:
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
    return warnings


def iter_field_arrays(result: SimulationResult) -> Iterable[FloatArray]:
    """Yield numeric arrays in payload buffer order."""
    yield from result.arrays
