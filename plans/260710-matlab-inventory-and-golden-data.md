# MATLAB inventory and golden data — living plan

> **Path:** `/plans/260710-matlab-inventory-and-golden-data.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M1
> **Workstream:** W2 (MATLAB reference)
> **Status:** completed
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

Inventory the complete approved behavior of
`references/Waermedurchgang_V10_physical.m` (inputs, defaults, units,
equation branches, masks, screens, plots) and generate immutable golden
references with MATLAB R2024b per ADR-0002. Excludes any porting work (M3).

## Interfaces

- Produces: `wiki/model/matlab-inventory.md`, `wiki/model/symbol-glossary.md`,
  `wiki/model/plot-catalog.md`, `wiki/model/golden-data.md`,
  `/reference/**` (grids `.f64`, JSON scalars, `manifest.json`).
- Consumes: `references/` (read-only), MATLAB R2024b.

## Tasks

- [x] Inventory every input, default, unit, equation branch, mask, screen, plot
      (`wiki/model/matlab-inventory.md`).
- [x] Separate scientific logic from presentation-only MATLAB code (inventory §7).
- [x] Symbol glossary MATLAB → Python (`wiki/model/symbol-glossary.md`).
- [x] Plot catalog with stable web plot IDs (`wiki/model/plot-catalog.md`).
- [x] Golden generator script (`scripts/golden/generate_golden_references.m`).
- [x] Function-level golden sweeps: 24 case folders covering all correlation
      branches, exact Re anchors, invalid inputs, alt fluids/pitches/tolerances.
- [x] Provenance + SHA-256 manifest (`reference/provenance.json`,
      `reference/manifest.json`, 278 files, 21.3 MB).
- [x] Regeneration procedure documented (`wiki/model/golden-data.md`).

## Risks

| Risk | Mitigation |
|---|---|
| Script plotting slows/blocks batch run | headless `-batch`, skip optional grids via env vars |
| Accidental writes into `/references` | `WAERME_EXPORT_DIR` scratch + `WAERME_SKIP_EXPORT=1` |
| Transcription errors in extracted functions | verbatim text slicing, no manual copying |

## Tests / evidence

- MATLAB R2024b Update 1 batch run exit 0 (2026-07-10); console diagnostics:
  Al 8482 feasible points (d_o 0.648–10 mm), PA 7787 (0.358–10 mm),
  7787 PA points with nearest feasible Al reference — captured in
  `reference/default_case/scalars.json`.
- In-script asserts (α_o, R_o, R_ii ranges; capillary convention) passed
  during the run (script errors on violation).
- `reference/manifest.json`: SHA-256 for all 278 golden files.
- `/references` verified untouched (`git status` clean).

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | Inventory, glossary, plot catalog written; goldens generated from MATLAB R2024b; manifest built. Plan completed. |

## Final commits

- `feat(golden): M1 MATLAB inventory and golden references` (this commit)
