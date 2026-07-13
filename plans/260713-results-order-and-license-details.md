# Results order and license details — living plan

> **Path:** `/plans/260713-results-order-and-license-details.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8/M9 UX refinement
> **Workstream:** W6/W7
> **Status:** completed
> **Created:** 2026-07-13
> **Last updated:** 2026-07-13

## Scope

Reorder the Results page so the primary workflow is Run simulation, plot
selection, and plot, followed by status/KPI/report details. Extend Settings
with explicit software authorship, citation, copyright, license scope, and
warranty information derived from `CITATION.cff` and `LICENSE`.

No scientific contract, numerical model, plot definition, or license text is
changed.

## Interfaces

- `ResultPlotsTab` presentation order only; existing result and export state is
  preserved.
- `SettingsTab` renders repository metadata already established by
  `CITATION.cff`, `LICENSE`, and build-time version variables.
- Links target the canonical GitHub repository files so they also work in the
  static GitHub Pages deployment.

## Tasks

- [x] Move plot selection and rendered plot ahead of KPI/report details.
- [x] Add detailed authorship, citation, MIT scope, excluded-material scope,
  and warranty information to Settings.
- [x] Add frontend/E2E assertions for metadata and Results DOM order.
- [x] Update stable UI documentation.
- [x] Run scoped frontend checks and Chromium acceptance.
- [x] Commit only this work, preserving concurrent plot-fidelity changes, then
  push the resulting commit on top of current `origin/main`.

## Risks

| Risk | Mitigation |
|---|---|
| Concurrent plot work is accidentally included | Stage/commit an isolated patch against `HEAD`; inspect the commit file list before push |
| Visual order differs from keyboard/DOM order | Reorder JSX rather than using CSS `order` |
| License summary overstates the MIT grant | Reproduce the explicit scope distinction in `LICENSE` and link the full text |
| Remote advances during work | Fetch and require a fast-forward push; never force-push |

## Tests / evidence

- Frontend role/text/link assertions for Settings metadata.
- Chromium assertion that Run simulation precedes plot selection, the plot
  precedes KPI/report content, and exports still work.
- Scoped Prettier, ESLint, Vitest, Vite production build, and Chromium E2E.

Validation completed on 2026-07-13:

- scoped Prettier and ESLint: passed;
- App Vitest: 5/5 passed;
- Vite production bundle: passed;
- Chromium app acceptance: 7/7 passed, including result order and report
  exports;
- the staged `ResultPlotsTab` diff was generated against `HEAD` and inspected
  to exclude all concurrent plot-fidelity changes.

## Status log

| Date | Change |
|---|---|
| 2026-07-13 | Scope audited; `f3420cd` confirmed as an ancestor of current GitHub `origin/main`. |
| 2026-07-13 | Results DOM order, Settings legal metadata, tests and UI documentation completed. |
| 2026-07-13 | Scoped checks and all seven Chromium app-acceptance tests passed. |

## Final commits

`feat(ui): prioritize results plots and expand license details`
