# Source materials rename — living plan

> **Path:** `/plans/260710-source-materials-rename.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M1
> **Workstream:** W2
> **Status:** completed
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

Rename the read-only source-material folder to `/source_materials` so it is
no longer confused with `/reference`, which
contains immutable MATLAB-derived golden data.

This plan does not change numerical golden arrays or the MATLAB model.

## Interfaces

- Consumes: old source material folder name.
- Provides: `/source_materials` source material folder.
- Updates: AGENTS instructions, docs, scripts, provenance metadata, and path
  references in plans/wiki/code.

## Tasks

- [x] Move the source material folder to `/source_materials`.
- [x] Replace path references across code, docs, plans, wiki, and metadata.
- [x] Keep `/reference` golden-test data layout unchanged.
- [x] Validate no stale old source-material path remains.

## Risks

| Risk | Mitigation |
|---|---|
| Generated golden metadata becomes inconsistent | Rebuild or verify manifest metadata after path update. |
| Another agent's in-flight plan retains stale paths | Update only the path text needed for this repository-wide rename and record why here. |

## Tests / evidence

- stale-path search for old source-material path forms: no matches
- `python scripts/check_prohibited_files.py`: passed
- `git diff --cached --check`: passed
- `python -m py_compile scripts/check_prohibited_files.py scripts/golden/build_manifest.py`: passed
- `uv run pytest`: 50 passed
- `uv run mypy .`: passed
- `uv run ruff check ..`: passed

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Started repo-wide source-material path rename. |
| 2026-07-10 | Completed rename to `/source_materials`, updated docs/scripts/provenance, and rebuilt `reference/manifest.json`. |

## Final commits

- `chore(repo): rename source materials directory`
