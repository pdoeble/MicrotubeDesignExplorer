# MATLAB inventory and golden data — living plan

> **Path:** `/plans/260710-matlab-inventory-and-golden-data.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M1
> **Workstream:** W2 (MATLAB reference)
> **Status:** ready
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

- [ ] Inventory every input, default, unit, equation branch, mask, screen, plot.
- [ ] Separate scientific logic from presentation-only MATLAB code.
- [ ] Symbol glossary MATLAB → Python.
- [ ] Plot catalog with stable web plot IDs.
- [ ] Golden generator script (script-run harvest + verbatim function extraction).
- [ ] Function-level golden sweeps (laminar/transition/turbulent, boundaries).
- [ ] Record provenance (MATLAB version, script hash, command) in manifest.
- [ ] Document regeneration procedure in `wiki/model/golden-data.md`.

## Risks

| Risk | Mitigation |
|---|---|
| Script plotting slows/blocks batch run | headless `-batch`, skip optional grids via env vars |
| Accidental writes into `/references` | `WAERME_EXPORT_DIR` scratch + `WAERME_SKIP_EXPORT=1` |
| Transcription errors in extracted functions | verbatim text slicing, no manual copying |

## Tests / evidence

- `reference/manifest.json` hashes; regeneration reproduces identical files.
- Spot checks against in-script asserts and paper figures.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |

## Final commits

—
