# Scientific validation evidence

This page summarizes the validation evidence for the Python scientific core and
browser execution path. It does not replace the independent scientific approval
required by M8.

## Source hierarchy

Validation follows the project source-of-truth order:

1. Accepted equations and assumptions in `source_materials/Paper.pdf`.
2. Executable legacy behavior in
   `source_materials/Waermedurchgang_V10_physical.m`.
3. Immutable MATLAB-derived golden references under `reference/`.
4. Documented decisions in `wiki/decisions/` and model notes in `wiki/model/`.

## Golden parity coverage

The MATLAB reference set is documented in
[golden-data.md](golden-data.md). It covers:

- the paper default aluminum and polyamide cases;
- scalar defaults, model constants, materials, fluids, and screens;
- full 250x250 design-space grids and masks for the default case;
- function-level branches for VDI G1/G7, friction, burst pressure, cost,
  capillary, invalid geometry, and transition anchor points;
- comparison fields including same-geometry and technology-adjusted ratios.

The Python regression suite compares scalar values, grid fields, masks,
screen transitions, and comparison outputs against those immutable files.

## Additional M8 acceptance coverage

`tests/python/test_validation_acceptance.py` adds release-readiness checks that
are not simple golden-file comparisons:

- exact public-API equivalence between dimension and volume/aspect geometry
  requests;
- air-side velocity, volume-flow, and mass-flow operating-mode equivalence;
- coolant-side velocity, volume-flow, mass-flow, pressure-drop, and
  hydraulic-power operating-mode cross-checks over representative arrays;
- defensive rejection of programmatically injected non-finite request values;
- unsolved coolant operating targets remain reported as masks and warnings
  rather than crashing the public API.

Browser acceptance coverage in `tests/e2e/` checks reduced paper-default
execution through Pyodide, direct Python parity for worker output summaries,
plot rendering, report export, URL round-trips, and worker startup/compute
budgets.

## Current approval state

As of 2026-07-11, automated scientific validation is implemented and locally
executable. The M8 exit gate still requires an independent scientific reviewer
to approve the validation report or record accepted findings in a decision
record before M9/M10 can be marked complete.
