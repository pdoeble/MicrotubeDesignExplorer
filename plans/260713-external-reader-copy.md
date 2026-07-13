# External-reader copy cleanup — living plan

> **Path:** `/plans/260713-external-reader-copy.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8/M9 UX refinement
> **Workstream:** W3/W6
> **Status:** completed
> **Created:** 2026-07-13
> **Last updated:** 2026-07-13

## Scope

Make the deployed application read as a companion for external readers of the
paper. Remove internal implementation and validation notices from visible UI
copy, retain the public software/license/citation information, and correct the
VDI-Wärmeatlas edition to the paper's cited 12th edition (2019).

No numerical equation, scientific contract, default, or machine-readable
provenance field changes.

## Interfaces

- `StartTab` describes the paper calculation without implementation-history
  language.
- `SettingsTab` retains reset, software identity, authorship, MIT license,
  warranty, citation, and repository information but no URL-state diagnostics
  or scientific-material repository note.
- Result captions and HTML report presentation use reader-facing language and
  omit internal validation identifiers. Contracted result/JSON fields remain
  backward compatible.
- Python docstrings and model wiki use the paper's bibliographic edition.

## Tasks

- [x] Revise Start and Settings copy for external paper readers.
- [x] Remove visible implementation/validation terminology from Results and
  presentation exports while preserving required provenance.
- [x] Record and resolve the 2013/2019 source conflict.
- [x] Update frontend tests and stable UI/model documentation.
- [x] Run format, lint, type, frontend, and relevant Python checks.
- [x] Commit the completed change independently.

## Risks

| Risk | Mitigation |
|---|---|
| Reproducibility metadata is removed with UI diagnostics | Keep version, request hash, timestamp, contract fields, and the complete JSON payload |
| Citation correction is mistaken for a model change | ADR states that equations and numerical behavior are unchanged |
| Reader-facing cleanup weakens accessible plot alternatives | Preserve units, finite-cell counts, ranges, and scientific status counts |

## Tests / evidence

- Frontend assertions for paper-focused Start copy, 12th-edition citation, and
  absence of Settings diagnostics/internal material wording.
- Plot/report export assertions that public provenance remains while the golden
  validation identifier is not rendered.
- Prettier, ESLint, TypeScript, Vitest, Vite build, Ruff, Mypy, and Pytest as
  applicable to the touched files.

Validation completed on 2026-07-13:

- scoped Prettier and Ruff formatting passed;
- ESLint passed with two pre-existing generated-file warnings; TypeScript and
  Ruff checks passed;
- Vitest passed 74/74 tests;
- Mypy passed for all 20 Python source files and Pytest passed 58/58 tests;
- the Vite production build and Pages artifact gate passed;
- Chromium passed seven concurrent checks; the compute/export check timed out
  only while competing with another Pyodide test and then passed in isolation
  with one worker in 18.1 s.

## Status log

| Date | Change |
|---|---|
| 2026-07-13 | Started external-reader copy audit and verified the paper cites VDI-Wärmeatlas, 12th ed. (2019), while the read-only MATLAB reference comments say 2013. |
| 2026-07-13 | Removed internal diagnostics and validation wording from public presentation, corrected paper authorship metadata, and accepted ADR-0014. |
| 2026-07-13 | Frontend, Python, build, Pages artifact, and isolated Chromium acceptance validation completed; plan marked completed. |

## Final commits

`fix(ui): tailor copy for external paper readers`
