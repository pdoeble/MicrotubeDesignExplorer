# Plot registry and rendering — living plan

> **Path:** `/plans/260710-plot-registry-and-rendering.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M6
> **Workstream:** W7 (Plots)
> **Status:** in-progress
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

- [x] Plot registry typed against catalog IDs.
- [x] Log-color map family (contour/heatmap, no WebGL traces).
- [x] Percent-delta family with symmetric diverging color scale.
- [x] Composite feasible boundary, minimum-wall line, and design-point overlays.
- [ ] Boundary-lines family with individual screen boundaries.
- [x] KPI summary panel (roadmap §9 quantities).
- [x] Tandem mode with shared finite color scales.
- [x] Delta/ratio switching for comparison fields.
- [x] PNG + SVG export with provenance footer.

## Risks

| Risk | Mitigation |
|---|---|
| WebGL traces break SVG export | registry forbids gl traces |
| Physics creeping into plot code | plots read only `SimulationResult` |

## Tests / evidence

- Vitest registry/spec tests; numerical assertions on plotted arrays.
- 2026-07-10 registry/rendering slice: `pnpm typecheck`, `pnpm test`
  (21 passed), `pnpm format:check`, `pnpm lint` (0 errors; generated
  contract warnings only), `pnpm build`, `pnpm test:e2e`, and
  `python scripts/check_prohibited_files.py`.
- 2026-07-10 field-name spot check: plot registry fields exist in the Python
  paper-default `SimulationResult` for cooler and comparison scopes.
- 2026-07-10 figure-export slice: `pnpm typecheck`, `pnpm lint` (0 errors; 2
  generated-contract warnings), `pnpm format:check`, `pnpm test` (26 passed),
  `pnpm build`, and `python scripts/check_prohibited_files.py`.
- 2026-07-10 overlay slice: `uv run pytest` (52 passed), `uv run mypy .`,
  `uv run ruff check ..`, `uv run ruff format --check ..`, `pnpm typecheck`,
  `pnpm test` (28 passed), `pnpm lint` (0 errors; 2 generated-contract
  warnings), `pnpm format:check`, `pnpm build`, and
  `python scripts/check_prohibited_files.py`.
- 2026-07-10 tandem slice: `pnpm test` (30 passed), `pnpm lint` (0 errors; 2
  generated-contract warnings), `pnpm typecheck`, `pnpm format:check`, and
  `pnpm build`.
- 2026-07-10 delta/ratio slice: `pnpm test` (32 passed), `pnpm lint` (0
  errors; 2 generated-contract warnings), `pnpm typecheck`,
  `pnpm format:check`, and `pnpm build`.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | M6 implementation started: added typed registry, Plotly heatmap renderer, simulation-run result workflow, cooler/comparison plot selection, and KPI summary; exports, boundary overlays, detailed alt views, and complete plot-family parity remain open. |
| 2026-07-10 | Figure export slice completed: Plotly specs moved into a tested factory, every registered plot exposes PNG and SVG export buttons, and exports include request/version provenance in the figure footer. |
| 2026-07-10 | Overlay slice completed: Python summaries now expose design geometry and material minimum wall values; Plotly specs draw composite feasible boundaries, minimum-wall lines, and design-point markers from `SimulationResult` only. |
| 2026-07-10 | Tandem slice completed: cooler-scoped plots can render left/right panels together with a shared finite color domain; comparison percent-delta plots keep symmetric zero-centered scales. |
| 2026-07-10 | Delta/ratio slice completed: comparison plot variants are linked by registry group, ratio companions render exported ratio fields, and the Result Plots tab switches between delta and ratio without deriving values in the UI. |

## Final commits

—
