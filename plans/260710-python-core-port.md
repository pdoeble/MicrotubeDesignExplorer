# Python core port — living plan

> **Path:** `/plans/260710-python-core-port.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M3
> **Workstream:** W3 (Python core)
> **Status:** in-progress
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

Port the complete approved MATLAB model into `python/microtubes_core/`:
geometry and discrete tube counts, static fluids/materials, all operating
modes (ADR-0003), VDI G1/G7, wall conduction, resistance aggregation,
friction pressure drop, hydraulic power, tolerance-adjusted burst (Lamé),
capillary rise, cost index, screens/masks/sweeps, warnings, provenance,
comparison (delta/ratio/tech-adjusted). Golden parity at `rtol=1e-8`,
`atol=1e-10`.

## Interfaces

- Consumes: `/reference` goldens (M1), contracts (M2).
- Produces: `microtubes_core.models/`, `microtubes_core.sweeps/`,
  `microtubes_core.api`, equation docs in `wiki/model/equations.md`.

## Tasks

- [x] models: correlations (G1/G7), friction, burst, capillary, cost.
- [x] geometry: tube, bundle, footprint counts.
- [x] geometry: integrate canonical dimensions into sweep evaluation.
- [x] geometry: expose volume/aspect conversion through public API evaluation.
- [x] operating modes incl. deterministic Δp/P inversion.
- [x] integrate operating modes into sweep field generation.
- [x] sweeps: grids, masks (invalid d_i, τ-range, tech), screens.
- [x] sweeps: composite feasible boundaries.
- [x] comparison: same-geometry ratio, nearest-feasible-Al reference.
- [x] comparison: same-geometry and tech-adjusted percent-delta fields.
- [x] burst tolerance sensitivity fields: standard and medical Lamé grids.
- [x] capillary acceleration sensitivity fields: 1g, 5g, and 10g grids.
- [x] full golden regression tests for remaining tolerance/sensitivity fields.
- [x] default-case sweep/comparison/API golden regression tests.
- [x] function-level golden tests for ported isolated submodels.

## Risks

| Risk | Mitigation |
|---|---|
| interp2/meshgrid orientation mismatches | golden grid tests incl. mask topology |
| Hidden MATLAB semantics (NaN handling) | function-level goldens across branches |

## Tests / evidence

- `tests/python/test_function_parity.py` covers all current function-level
  goldens for G1/G7, Darcy friction factor, tube pressure drop, Lamé burst,
  cost, default-grid geometry, capillary, and resistance fields.
- 2026-07-10: `uv run pytest` (50), `uv run mypy .`, `uv run ruff check ..`.
- 2026-07-10: burst-tolerance slice full checks:
  `uv run pytest` (50 passed), `uv run mypy .`,
  `uv run ruff check ..`, touched-file
  `uv run ruff format --check ...`, `python scripts/check_prohibited_files.py`.
- 2026-07-10: targeted capillary-sensitivity parity:
  `uv run pytest ../tests/python/test_sweep_parity.py ../tests/python/test_api.py`
  from `/python` (7 passed).
- 2026-07-10: capillary-sensitivity slice full checks:
  `uv run pytest` (50 passed), `uv run mypy .`,
  `uv run ruff check ..`, touched-file
  `uv run ruff format --check ...`, `python scripts/check_prohibited_files.py`.
- 2026-07-10: targeted comparison-delta parity:
  `uv run pytest ../tests/python/test_comparison_parity.py ../tests/python/test_api.py`
  from `/python` (5 passed).
- 2026-07-10: comparison-delta slice full checks:
  `uv run pytest` (50 passed), `uv run mypy .`,
  `uv run ruff check ..`, touched-file
  `uv run ruff format --check ...`, `python scripts/check_prohibited_files.py`.
- 2026-07-10: targeted burst-tolerance parity:
  `uv run pytest ../tests/python/test_sweep_parity.py ../tests/python/test_api.py`
  from `/python` (7 passed).

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | M3 first core slice implemented: isolated models for G1/G7 correlations, pressure/burst, geometry, capillary, cost, and resistance aggregation; function-level goldens green. ADR-0004 records the cost-count floor/reference-normalization decision. |
| 2026-07-10 | Operating-mode conversions implemented for air and coolant, including deterministic pressure-drop and hydraulic-power bisection with unbracketed/invalid masks. |
| 2026-07-10 | Single-cooler sweep pipeline implemented for grids, invalid/Y/tech masks, operating-mode integration, raw fields, screen inputs, and all-screen feasibility masks. ADR-0005 records MATLAB-compatible axis generation for mask parity. |
| 2026-07-10 | Comparison helpers implemented for interp2-style screen queries, nearest feasible left reference, same-geometry ratio, tech-adjusted ratios, and composite feasible boundaries. |
| 2026-07-10 | Public Python `simulate(request)` API added with contract payload, C-order float64 array registry, request hash, provenance, scalar summaries, masks, comparison fields, and API-level golden checks. |
| 2026-07-10 | Burst tolerance sensitivity fields added for the MATLAB standard (0.020 mm) and medical (0.005 mm) rows; sweep and API golden checks cover both materials. |
| 2026-07-10 | Capillary acceleration sensitivity fields added for the MATLAB 1g, 5g, and 10g rows; remaining tolerance/sensitivity golden regression task completed. |
| 2026-07-10 | Comparison percent-delta fields added for same-geometry, tech-adjusted k, and tech-adjusted kA ratios, matching MATLAB `100*(ratio-1)` plot convention. |

## Final commits

—
