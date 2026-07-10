# Report and export system — living plan

> **Path:** `/plans/260710-report-and-export-system.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M7
> **Workstream:** W8 (Reports)
> **Status:** ready
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

PNG (selectable resolution) and SVG figure exports; standalone HTML report;
client-side PDF report; machine-readable JSON sidecar. Reports are generated
from one immutable `SimulationResult` and include inputs, materials, fluids,
assumptions, warnings, summaries, screens, figures, versions, timestamp,
and provenance.

## Interfaces

- Consumes: `SimulationResult` (M3), plot exports (M6).
- Produces: `src/features/export/**`,
  `python/microtubes_core/exports/` payload builders,
  `wiki/interfaces/report-payload.md`.

## Tasks

- [ ] ReportPayload builder in the Python core (single source).
- [ ] Standalone HTML report generator.
- [ ] Client-side PDF (print-safe, grayscale-readable).
- [ ] JSON sidecar with versions/hashes.
- [ ] Determinism test: same request + version ⇒ same report content.

## Risks

| Risk | Mitigation |
|---|---|
| Report drifting from screen UI | payload from core, not from UI components |
| PDF library rasterizing SVG | embed SVG where reliable; document fallback |

## Tests / evidence

- Determinism tests, payload schema validation.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |

## Final commits

—
