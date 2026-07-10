# URL state

M5 stores shareable scientific inputs in the `state` query parameter. The
payload is a base64url-encoded JSON object:

```json
{
  "version": "1.0.0",
  "request": { "contract_version": "1.0.0" }
}
```

`request` is the complete `SimulationRequest`. The Python core request hash in
`SimulationResultPayload` remains authoritative for computed results; the URL
state only preserves editable inputs.

## Behavior

- On startup, the frontend attempts to decode `state`; invalid or unsupported
  versions fall back to paper defaults.
- Every state edit rewrites the current URL using `history.replaceState`.
- Reset restores the committed paper defaults and writes them to the URL.
- Display unit conversions occur only in controls; the serialized request stays
  in SI units.

## Implementation

- Encoder/decoder: `src/state/urlState.ts`.
- Editable request store: `src/state/simulationStore.ts`.
- Round-trip tests: `tests/frontend/simulation-state.test.ts`.
