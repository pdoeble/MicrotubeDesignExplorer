# Project spectral colormap export — living plan

> **Path:** `/plans/260716-project-spectral-colormap-export.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M6 scientific plot support
> **Workstream:** W6/W7
> **Status:** completed
> **Created:** 2026-07-16
> **Last updated:** 2026-07-16

## Scope

Export the exact 256-entry project `slanCM('spectral')` snapshot as a
standalone bundle that can be handed to a Python user. Include Matplotlib and
Plotly helpers, a neutral CSV/JSON representation, a runnable example,
provenance, and concise German instructions.

No scientific model, public computation contract, plot rendering behavior,
or source-material file is changed.

## Interfaces

- `src/features/plots/colormap.ts` remains the single source of truth.
- `scripts/export_project_colormap.py` deterministically regenerates and
  checks the external bundle.
- Final artifacts live under
  `output/spreadsheet/project-spectral-colormap/` plus one adjacent ZIP file.

## Tasks

- [x] Verify the 256 RGB entries and normal/reversed orientation.
- [x] Compare the snapshot with Matplotlib's named `Spectral` map.
- [x] Implement the deterministic export and handoff documentation.
- [x] Add a regression check against the TypeScript source table.
- [x] Validate CSV structure, Python imports/rendering, archive contents, and
  repository checks.
- [x] Mark the plan completed and commit the coherent export change.

## Risks

| Risk | Mitigation |
|---|---|
| A copied table drifts from the application | Generate every representation from `colormap.ts` and provide a `--check` mode |
| Reversed plots are reproduced with the wrong direction | Export explicit normal and reversed Matplotlib objects and document the endpoints |
| Matching colors are mistaken for matching normalization | Explain that `vmin`/`vmax` or `norm` must also match |
| Project licensing is incorrectly asserted for upstream palette data | Preserve upstream attribution and avoid bundling MATLAB or paper source |

## Tests / evidence

- Deterministic generator `--check` mode.
- Python regression test comparing CSV and JSON entries to the source table.
- Pandas validation of row count, column types, index, positions, and RGB
  bounds.
- Matplotlib import and example execution using a non-interactive backend.
- Ruff, pytest, prohibited-file check, and `git diff --check`.

## Status log

| Date | Change |
|---|---|
| 2026-07-16 | Scope accepted; repository history clarified that the full table was dumped on 2026-07-12 and integrated/accepted on 2026-07-13. |
| 2026-07-16 | Matplotlib 3.9.2 `Spectral`, sampled at 256 entries and rounded to RGB8, matched all 768 source channels exactly. |
| 2026-07-16 | Deterministic Python/CSV/JSON/example/attribution bundle and ZIP generated; source-drift regression test added. |
| 2026-07-16 | Validation passed: generator `--check`; 74 pytest tests; MyPy; Ruff lint; scoped Ruff format; Pandas 3.0.3 table audit; Matplotlib 3.11.0 import/example and 768-channel parity; prohibited-file and whitespace checks. The repository-wide formatter also reports two pre-existing untouched files (`test_diagnostics.py`, `test_sweep_parity.py`); all files in this change are formatted. |

## Final commits

`feat(plots): export project spectral colormap for Python`
