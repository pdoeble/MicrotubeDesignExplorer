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

## Current field groups

Each cooler exports heat-transfer coefficients, Reynolds numbers, coolant
velocity, pressure drop, hydraulic power, volume and mass flow, tube count,
bundle area, overall coefficient, bundle conductance, configured-screen burst
pressure, fixed standard/medical burst-tolerance sensitivity fields,
spacings, configured-screen capillary rise, fixed `1g`/`5g`/`10g`
capillary-rise sensitivity fields, cost index, and thermal resistance parts.

Comparison exports same-geometry ratio, nearest left-reference diameter,
tech-adjusted ratios, and composite feasible boundary vectors.
