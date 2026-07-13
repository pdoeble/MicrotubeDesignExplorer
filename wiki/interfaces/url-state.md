# URL state

M5 stores shareable scientific inputs in the `state` query parameter. The URL
state preserves the complete editable `SimulationRequest`; it never replaces
the Python core request hash in `SimulationResultPayload`, which remains
authoritative for computed results.

## Current writer: version 2.0.0

New links use this deterministic, lossless transport:

1. JSON envelope containing the complete request:

   ```json
   {
     "version": "2.0.0",
     "request": { "contract_version": "1.0.0" }
   }
   ```

2. UTF-8 encoding;
3. Zlib/DEFLATE level 9 with pinned `fflate@0.8.3`;
4. unpadded base64url;
5. literal `v2.` prefix.

The paper-default state is currently 1,173 query characters. Including the
anticipated GitLab single-domain namespace/project path, the request target is
about 1,214 characters and therefore below the GitLab Pages default URI limit
of 2,048 characters.

The codec accepts at most 32,768 encoded characters and 65,536 decompressed
bytes. These bounds protect the synchronous browser decoder from untrusted URL
input. Compression changes transport only: values, fields, float precision and
SI units are unchanged.

## Legacy reader: version 1.0.0

Unprefixed v1 links remain supported. They contain the same complete JSON
envelope directly encoded as base64url without compression:

```json
{
  "version": "1.0.0",
  "request": { "contract_version": "1.0.0" }
}
```

The writer never emits v1, but the decoder must retain it until an explicit ADR
defines otherwise. This is required because scientific links may already be in
papers, reviews, reports, or messages.

## Behavior

- On startup, the frontend attempts v2 decoding for the `v2.` prefix and v1
  decoding otherwise.
- Invalid, corrupt, oversized, or unsupported versions fall back to committed
  paper defaults.
- Every state edit rewrites the current URL using `history.replaceState`.
- Reset restores the committed paper defaults and writes them as v2.
- Display unit conversions occur only in controls; the serialized request stays
  in SI units.
- The codec is deterministic: the same request produces the same state string.

## Implementation and evidence

- Encoder/decoder and safety bounds: `src/state/urlState.ts`.
- Editable request store: `src/state/simulationStore.ts`.
- Unit coverage: `tests/frontend/simulation-state.test.ts`.
- Browser URL roundtrip: `tests/e2e/app-acceptance.spec.ts`.
- Decision and dependency rationale:
  `wiki/decisions/ADR-0013-compressed-url-state-v2.md`.
