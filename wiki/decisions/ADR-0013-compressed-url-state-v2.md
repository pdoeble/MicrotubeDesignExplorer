# ADR-0013: Lossless compressed URL state v2

- Status: accepted
- Date: 2026-07-13
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260713-gitlab-pages-migration.md`
- Interface: `wiki/interfaces/url-state.md`

## Context

URL state v1 serialized the complete `SimulationRequest` as UTF-8 JSON and then
base64url. The paper-default state alone produced a 4,312-character query value
and an approximately 4,344-character GitHub request target. GitLab Pages uses a
2,048-character URI limit by default. Increasing only the server limit would
leave shared links fragile across proxies and other static hosts.

The state is a public scientific interface. Compression must not round values,
drop fields, infer values from changing defaults, or invalidate already shared
v1 links.

## Decision

- Write new state with version `2.0.0` using this deterministic pipeline:
  1. complete `SimulationRequest` in the existing JSON envelope;
  2. UTF-8 encoding;
  3. Zlib/DEFLATE at level 9;
  4. base64url without padding;
  5. literal prefix `v2.`.
- Keep decoding the unprefixed v1 `1.0.0` base64url JSON format indefinitely
  unless a later ADR defines a migration/removal policy.
- Use the MIT-licensed, exact dependency `fflate@0.8.3` for synchronous browser
  compression and decompression. The version is frozen in `pnpm-lock.yaml`.
- Limit accepted encoded input to 32,768 characters and decompressed output to
  65,536 bytes. Invalid, oversized, corrupt, or unsupported values retain the
  established behavior of falling back to committed defaults.
- Test deterministic output, complete exact request roundtrip, Unicode,
  malformed input, size bounds, and a real v1 compatibility fixture.
- Keep all numeric values and SI units byte-for-byte represented by JSON; this
  change affects transport only and never scientific calculation.

## Consequences

- The paper-default v2 state is 1,173 characters and the anticipated GitLab
  namespace-in-path request target is about 1,214 characters, below the current
  2,048-character GitLab Pages default.
- Existing v1 URLs remain valid on both GitHub and a future GitLab deployment.
- New URLs are not human-readable without decompression, which is acceptable
  because v1 was already base64url encoded and the UI owns the public codec.
- The complete request remains independent of future default changes; no hidden
  default-delta reconstruction is introduced.
- A temporary 8 KiB GitLab URI limit is no longer required for v2-generated
  links, but remains useful during rollout so old v1 links continue to work on
  GitLab.
