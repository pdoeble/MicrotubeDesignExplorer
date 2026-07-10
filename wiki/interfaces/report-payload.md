# Report payload

M7 report exports are built from one validated `SimulationRequest` and one
immutable `SimulationResult`. The Python core owns the canonical payload in
`microtubes_core.exports.report`.

## Payload contents

- `report_version`: semantic version of the report payload contract.
- `request_hash`: SHA-256 over canonical request JSON.
- `provenance`: core version, contract version, request hash, and result
  generation timestamp from `SimulationResult`.
- `request`: validated request JSON.
- `result_payload`: public `SimulationResultPayload` without transferred array
  bytes.
- `summaries`: scalar summaries for both coolers.
- `warnings`: cooler and comparison warnings.
- `array_manifest`: one entry per transferred array with source group, field
  name, unit, shape, SHA-256 over contiguous `float64` bytes, finite count,
  NaN count, minimum, and maximum.

The sidecar JSON uses canonical serialization (`sort_keys`, compact separators,
`allow_nan=False`) so the same request/result pair yields byte-identical JSON.
