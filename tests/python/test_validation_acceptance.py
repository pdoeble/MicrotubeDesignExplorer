"""M8 acceptance checks spanning public API configuration invariants."""

from __future__ import annotations

import numpy as np

from microtubes_core.api import SimulationResult, simulate
from microtubes_core.contracts import (
    BundleGeometry,
    GeometryMode,
    GeometryVolumeAspect,
    SimulationRequest,
)
from microtubes_core.defaults import paper_default_request


def test_geometry_representations_are_api_equivalent() -> None:
    dimensions_request = paper_default_request()
    volume_request = _as_volume_aspect_request(dimensions_request)

    dimensions_result = simulate(dimensions_request)
    volume_result = simulate(volume_request)

    assert (
        dimensions_result.payload.outer_diameter_axis == volume_result.payload.outer_diameter_axis
    )
    assert (
        dimensions_result.payload.wall_thickness_axis == volume_result.payload.wall_thickness_axis
    )
    _assert_named_arrays_equal(dimensions_result, volume_result)


def _as_volume_aspect_request(request: SimulationRequest) -> SimulationRequest:
    updates = {}
    for cooler_key in ("cooler_left", "cooler_right"):
        cooler = getattr(request, cooler_key)
        dimensions = cooler.geometry.canonical_dimensions()
        volume_aspect = GeometryVolumeAspect(
            aspect_length_over_depth=dimensions.tube_length / dimensions.depth,
            aspect_width_over_depth=dimensions.width / dimensions.depth,
            volume=dimensions.width * dimensions.depth * dimensions.tube_length,
        )
        geometry = BundleGeometry(
            arrangement=cooler.geometry.arrangement,
            dimensions=None,
            mode=GeometryMode.volume_aspect,
            pitch_longitudinal_ratio=cooler.geometry.pitch_longitudinal_ratio,
            pitch_transverse_ratio=cooler.geometry.pitch_transverse_ratio,
            use_finite_row_correction=cooler.geometry.use_finite_row_correction,
            volume_aspect=volume_aspect,
        )
        updates[cooler_key] = cooler.model_copy(update={"geometry": geometry})
    return request.model_copy(update=updates)


def _assert_named_arrays_equal(left: SimulationResult, right: SimulationResult) -> None:
    left_refs = [
        *left.payload.cooler_left.fields,
        *left.payload.cooler_left.masks,
        *left.payload.cooler_right.fields,
        *left.payload.cooler_right.masks,
        *left.payload.comparison.fields,
    ]
    right_refs = [
        *right.payload.cooler_left.fields,
        *right.payload.cooler_left.masks,
        *right.payload.cooler_right.fields,
        *right.payload.cooler_right.masks,
        *right.payload.comparison.fields,
    ]
    assert [(ref.name, ref.shape, ref.unit) for ref in left_refs] == [
        (ref.name, ref.shape, ref.unit) for ref in right_refs
    ]
    for left_ref, right_ref in zip(left_refs, right_refs, strict=True):
        np.testing.assert_allclose(
            left.arrays[left_ref.buffer_index],
            right.arrays[right_ref.buffer_index],
            rtol=1.0e-12,
            atol=1.0e-14,
            equal_nan=True,
        )
