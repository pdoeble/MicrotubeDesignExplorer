# Python core port — living plan

> **Path:** `/plans/260710-python-core-port.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M3
> **Workstream:** W3 (Python core)
> **Status:** ready
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

- [ ] models: correlations (G1/G7), friction, burst, capillary, cost.
- [ ] geometry: tube, bundle, footprint counts, volume/aspect conversion.
- [ ] operating modes incl. deterministic Δp/P inversion.
- [ ] sweeps: grids, masks (invalid d_i, τ-range, tech), screens, boundaries.
- [ ] comparison: same-geometry ratio, nearest-feasible-Al reference.
- [ ] equation-level unit tests + golden regression tests.

## Risks

| Risk | Mitigation |
|---|---|
| interp2/meshgrid orientation mismatches | golden grid tests incl. mask topology |
| Hidden MATLAB semantics (NaN handling) | function-level goldens across branches |

## Tests / evidence

- `tests/python/test_correlations.py`, `test_golden_parity.py`, etc.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |

## Final commits

—
