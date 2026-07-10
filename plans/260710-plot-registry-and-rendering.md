# Plot registry and rendering — living plan

> **Path:** `/plans/260710-plot-registry-and-rendering.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M6
> **Workstream:** W7 (Plots)
> **Status:** ready
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

Typed plot registry with stable IDs from the M1 plot catalog; grouped
selector; tandem mode with shared comparison scales; approved delta/ratio
plots; screen boundaries, minimum-wall lines, benchmark markers; hover with
units and validity; tabular access and alt text; PNG/SVG export per figure.
Physics stays out of plotting code — values come only from `SimulationResult`.

## Interfaces

- Consumes: `SimulationResult` (M2/M3), plot catalog (M1), worker client (M4).
- Produces: `src/features/plots/**`, plot-spec factories per family.

## Tasks

- [ ] Plot registry typed against catalog IDs.
- [ ] Log-color map family (contour/heatmap, no WebGL traces).
- [ ] Percent-delta family, boundary-lines family.
- [ ] KPI summary panel (roadmap §9 quantities).
- [ ] Tandem/delta/ratio switching with common scales.
- [ ] PNG + SVG export with provenance footer.

## Risks

| Risk | Mitigation |
|---|---|
| WebGL traces break SVG export | registry forbids gl traces |
| Physics creeping into plot code | plots read only `SimulationResult` |

## Tests / evidence

- Vitest registry/spec tests; numerical assertions on plotted arrays.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |

## Final commits

—
