# ADR-0005 — Sweep axis generation for golden parity

- **Status:** accepted
- **Date:** 2026-07-10
- **Workstream:** W3
- **Related plan:** /plans/260710-python-core-port.md

## Context

The M3 handover stated that the `d_o` and `t` axes are log-spaced in SI. The
MATLAB reference, however, generates the golden sweep axes in millimetres:
`t_mm = logspace(log10(0.001), log10(4.5), 250)` and
`da_mm = logspace(log10(0.1), log10(10), 250)`.

For most points, SI and millimetre construction are equivalent within normal
floating tolerance. At the upper-right grid corner, NumPy SI construction gives
`tau = 44.99999999999998 %`, while the MATLAB golden field has
`tau = 45.00000000000001 %`. Because the wall-ratio mask is defined as
`tau > 45 %`, this single ULP difference changes one mask cell.

## Decision

Construct sweep logspace axes by applying the exponent range in millimetres
and immediately converting the resulting axes back to SI for all internal
fields.

This is an explicit golden-parity rule for grid construction, not permission
to mix display units inside physical equations.

## Consequences

The Python grid reproduces MATLAB mask topology exactly, including the
upper-right `tau > 45 %` cell. All downstream computations still consume SI
arrays.

Future non-MATLAB sweeps may define a different axis policy only through a new
ADR and separate regression coverage.

## Evidence

- `uv run pytest` passes 45 tests including default sweep mask parity.
- `uv run mypy .` passes.
- `uv run ruff check ..` passes.
