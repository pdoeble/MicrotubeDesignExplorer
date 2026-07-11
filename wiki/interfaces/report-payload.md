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

## Browser export adapter

`src/features/export/reportExport.ts` mirrors the payload shape for browser
downloads from the current worker `SimulationResult`. It does not recompute
scientific fields; it copies the validated request, result payload, summaries,
warnings, provenance, and hashes each transferred `Float64Array` with Web Crypto
SHA-256.

The Result Plots page exposes three report actions after a simulation has
completed:

- JSON sidecar: canonical report JSON.
- HTML: standalone report document with provenance, summaries, screen status,
  warnings, embedded SVG figures, array manifest, request JSON, and embedded
  canonical sidecar JSON.
- Print / PDF: the same standalone HTML opened in a print-safe browser window
  for client-side print-to-PDF.

Registered Plotly figures are still exported individually through the plot
controls. Report figures are captured as SVG from the same registered Plotly
specs, using a fixed default selection rather than the complete plot registry
to keep reports printable and deterministic. The JSON sidecar intentionally
does not embed figure image data.
