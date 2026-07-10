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
- [ ] geometry: expose volume/aspect conversion through public API evaluation.
- [x] operating modes incl. deterministic Δp/P inversion.
- [x] integrate operating modes into sweep field generation.
- [x] sweeps: grids, masks (invalid d_i, τ-range, tech), screens.
- [x] sweeps: composite feasible boundaries.
- [x] comparison: same-geometry ratio, nearest-feasible-Al reference.
- [ ] full golden regression tests for default-case sweep and comparison.
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
- 2026-07-10: `uv run pytest` (47), `uv run mypy .`, `uv run ruff check ..`.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | M3 first core slice implemented: isolated models for G1/G7 correlations, pressure/burst, geometry, capillary, cost, and resistance aggregation; function-level goldens green. ADR-0004 records the cost-count floor/reference-normalization decision. |
| 2026-07-10 | Operating-mode conversions implemented for air and coolant, including deterministic pressure-drop and hydraulic-power bisection with unbracketed/invalid masks. |
| 2026-07-10 | Single-cooler sweep pipeline implemented for grids, invalid/Y/tech masks, operating-mode integration, raw fields, screen inputs, and all-screen feasibility masks. ADR-0005 records MATLAB-compatible axis generation for mask parity. |
| 2026-07-10 | Comparison helpers implemented for interp2-style screen queries, nearest feasible left reference, same-geometry ratio, tech-adjusted ratios, and composite feasible boundaries. |

## Final commits

—
