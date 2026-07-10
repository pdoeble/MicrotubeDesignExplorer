# Python core API

M3 exposes `microtubes_core.api.simulate(request)` as the direct Python
boundary from `SimulationRequest` to `SimulationResultPayload`.

## Return shape

`simulate` returns a `SimulationResult` dataclass:

- `payload`: validated `SimulationResultPayload` JSON metadata;
- `arrays`: tuple of C-contiguous `float64` NumPy arrays referenced by
  `GridFieldRef.buffer_index`.

The worker transport in M4 will map these arrays to transferables. This M3
API does not define worker message envelopes, cancellation, progress, or
Pyodide loading.

## Array policy

All exported numeric arrays are row-major `float64`. Until the frozen v1.0.0
contract gains a dtype field, masks are exported as `float64` arrays with
values `0.0` and `1.0` through the same `GridFieldRef` structure.

Grid fields use shape `(n_wall_thickness, n_outer_diameter)`. Boundary
vectors are exported as column arrays with shape `(n_samples, 1)` to preserve
MATLAB golden parity.

## Provenance

`request_hash` is SHA-256 over canonical request JSON:

- `model_dump(mode="json")`;
- sorted object keys;
- compact separators.

The payload provenance includes core version, contract version, request hash,
and UTC generation timestamp. Golden-reference manifest transport remains a
future packaging concern.

## Warnings

Cooler-level warnings include numerically safe VDI validity violations:

- VDI G7 air-side tube-bank Reynolds range `10 <= Re_c,l <= 1e6`;
- VDI G7 Prandtl range `0.6 <= Pr <= 1e3`;
- VDI G1 tube-side Reynolds upper limit `Re_i <= 1e6`;
- VDI G1 Prandtl range `0.1 <= Pr <= 1e3`.

Grid warnings report the number and share of finite cells outside the range
and mark whether the design point is also outside. Fluid-property warnings
name the offending Prandtl value. Values are still computed when numerically
safe, matching the M2 validity policy.

## Current field groups

Each cooler summary includes design-point outer diameter, wall thickness,
wall ratio, and material minimum wall thickness so frontend plots can draw
markers and minimum-wall lines without reading the original request.

Each cooler exports heat-transfer coefficients, Reynolds numbers, coolant
velocity, pressure drop, hydraulic power, volume and mass flow, tube count,
bundle area, overall coefficient, bundle conductance, configured-screen burst
pressure, fixed standard/medical burst-tolerance sensitivity fields,
spacings, configured-screen capillary rise, fixed `1g`/`5g`/`10g`
capillary-rise sensitivity fields, cost index, and thermal resistance parts.

Comparison exports same-geometry ratio and percent delta, nearest
left-reference diameter, tech-adjusted ratios and percent deltas, and
composite feasible boundary vectors.
