# ADR-0004 — Cost count floor and reference normalization

- **Status:** accepted
- **Date:** 2026-07-10
- **Workstream:** W3
- **Related plan:** /plans/260710-python-core-port.md

## Context

The M3 handover proposed a small relative snap before discrete tube-count
`floor` operations to stabilize exact integer boundaries. Function-level
goldens from MATLAB show a boundary-sensitive counterexample:
`cost_inline_*` at `d_o = 0.1 mm` evaluates the transverse quotient as
`299.99999999999994`, and MATLAB `floor` therefore returns `299`, not `300`.

The same cost model also normalizes by a reference count at `d_ref = 1 mm`.
The goldens infer `N_ref = 1080` for inline and `N_ref = 1062` for staggered.
Computing that reference point through SI floating-point arithmetic can
incorrectly floor the intended `30` transverse rows to `29`.

## Decision

Use direct floating-point `floor` for sweep tube counts, matching MATLAB
golden behavior at near-integer sweep points.

Compute the cost-reference tube count from the integer reference rows and
arrangement:

- inline: `N_ref = n_transverse * n_longitudinal`;
- staggered: `N_ref = ceil(n_longitudinal/2) * n_transverse
  + floor(n_longitudinal/2) * floor(n_transverse - 0.5)`.

Do not apply a generalized snap policy unless a future ADR defines it and the
golden references are reviewed.

## Consequences

The port preserves MATLAB parity for the current immutable goldens. The cost
normalization remains stable under SI internals without introducing a hidden
calibration factor. Any future user-facing discrete-boundary smoothing or
snapping must be explicit, documented, and tested separately from the MATLAB
parity path.

## Evidence

- `uv run pytest` passes 36 tests including all current function-level cost
  goldens.
- `uv run mypy .` passes.
- `uv run ruff check ..` passes.
