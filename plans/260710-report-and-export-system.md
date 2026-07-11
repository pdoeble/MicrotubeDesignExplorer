# Report and export system — living plan

> **Path:** `/plans/260710-report-and-export-system.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M7
> **Workstream:** W8 (Reports)
> **Status:** in-progress
> **Created:** 2026-07-10
> **Last updated:** 2026-07-11

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

- [x] ReportPayload builder in the Python core (single source).
- [x] Standalone HTML report generator.
- [x] Client-side PDF path through browser print/PDF using print-safe report HTML.
- [x] Canonical JSON sidecar payload with versions, hashes, summaries, warnings,
      and array manifests.
- [x] Browser JSON sidecar download.
- [x] Embed report figures from registered Plotly specs/SVG exports.
- [x] Determinism policy/test: same request + version + immutable result
      provenance => same report content.

## Risks

| Risk | Mitigation |
|---|---|
| Report drifting from screen UI | payload from core, not from UI components |
| PDF library rasterizing SVG | embed SVG where reliable; document fallback |

## Tests / evidence

- 2026-07-10 ReportPayload basis: `uv run pytest` (54 passed),
  `uv run mypy .`, `uv run ruff check ..`, `uv run ruff format --check ..`.
- 2026-07-10 Browser report export slice: `pnpm test -- report-export`,
  `pnpm test` (38 passed), `pnpm typecheck`, `pnpm lint` (generated-contract
  warnings only), `pnpm format:check`, `pnpm build`,
  `python scripts/check_prohibited_files.py`, `git diff --check`.
- 2026-07-11 Figure/report completion candidate: `pnpm test` (39 passed),
  `pnpm typecheck`, `pnpm lint` (generated-contract warnings only),
  `pnpm format:check`, `pnpm build`, `python scripts/check_prohibited_files.py`,
  `git diff --check`.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | M7 started: Python `microtubes_core.exports.report` builds canonical report payloads and JSON sidecars from one request/result pair with deterministic array manifests. |
| 2026-07-10 | Browser export adapter added: JSON sidecar download, standalone HTML report, and browser print/PDF path all use the current worker `SimulationResult`; embedded report figures remain open. |
| 2026-07-11 | Report figure embedding and selectable PNG scale implemented: HTML/PDF reports capture a fixed SVG figure set from registered Plotly specs, JSON sidecars remain image-free, and individual figure PNG export supports 1x/2x/3x resolution. |

## Final commits

—
