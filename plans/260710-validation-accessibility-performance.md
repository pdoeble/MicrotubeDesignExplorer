# Validation, accessibility, performance — living plan

> **Path:** `/plans/260710-validation-accessibility-performance.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8
> **Workstream:** W9 (Quality)
> **Status:** review
> **Created:** 2026-07-10
> **Last updated:** 2026-07-11

## Scope

Complete golden/contract regression suites; geometry-mode equivalence and
operating-mode cross-checks; link/reset/URL round-trips; report
regeneration; keyboard/screen-reader/contrast/zoom review; Pyodide startup,
sweep, memory, cancellation budgets; failure-path tests; independent review.

## Interfaces

- Consumes: all prior milestones.
- Produces: Playwright suites in `tests/e2e/`, budget numbers in this plan,
  `wiki/ui/accessibility.md` evidence section.

## Tasks

- [x] Playwright setup (Chromium/Firefox/WebKit projects configured).
- [x] E2E: reduced paper-default compute, tab keyboard flow, export smoke.
- [x] Complete golden and contract regression suites.
- [x] Geometry-mode equivalence and operating-mode cross-checks.
- [x] URL/reset, plot-rendering, report-regeneration, and export smoke.
- [x] Performance budgets defined and measured.
- [x] Failure-path tests (worker crash, invalid input, non-finite results).
- [x] Automated keyboard, contrast, zoom/reflow, landmark, and plot-description
      coverage.
- [ ] WCAG 2.2 AA review with documented exceptions.
- [ ] Independent scientific and accessibility review.

## Performance budgets

Reference environment: local Windows workstation, Playwright Chromium
(`chromium-1228`), reduced paper-default sweep (`16×16`) for browser smoke.
Full-release budgets remain release-candidate gates.

| Path | Budget | Evidence |
|---|---:|---|
| Pyodide worker startup | < 60 s | `tests/e2e/app-acceptance.spec.ts` Chromium budget smoke passed 2026-07-11 |
| Reduced sweep compute after startup | < 30 s | same |
| Reduced worker total startup + compute | < 90 s | same |
| UI result/export smoke | < 120 s per test | Chromium E2E passed 2026-07-11 |

## Risks

| Risk | Mitigation |
|---|---|
| Pyodide download flakiness in CI | cached assets, retries, generous timeouts |

## Tests / evidence

- 2026-07-11 M8 automation slice: `uv run pytest` (55 passed),
  `uv run mypy .`, `uv run ruff check ..`,
  `uv run ruff format --check ..`, `pnpm test` (40 passed),
  `pnpm typecheck`, `pnpm format:check`,
  `pnpm exec playwright test --project=chromium` (5 passed).
- 2026-07-11 Multi-browser exploratory run: Firefox and WebKit installed.
  Chromium and WebKit pass the local Vite-dev E2E suite. Firefox hangs in
  Pyodide startup only under the Vite dev server (`Loading Pyodide runtime`
  with pending `python_stdlib.zip`/`pyodide.asm.wasm` requests), but the
  production-preview app acceptance smoke passes in Firefox. Firefox dev-server
  Pyodide tests are skipped with this documented reason.
- 2026-07-11 M8 review-ready slice: `uv run pytest` (58 passed),
  `uv run mypy .`, `uv run ruff check ..`,
  `uv run ruff format --check ..`, `pnpm test` (41 passed),
  `pnpm typecheck`, `pnpm lint` (generated-contract warnings only),
  `pnpm format:check`, `pnpm build`, `pnpm test:e2e` (14 passed,
  4 documented skips), `python scripts/check_prohibited_files.py`,
  and `git diff --check`.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-11 | M8 automation slice added: geometry-representation API equivalence, worker-crash client failure test, Chromium E2E compute/export/URL/reset/accessibility smoke, and reduced-sweep performance budget. Independent review remains open. |
| 2026-07-11 | Multi-browser Playwright check expanded: WebKit passes the E2E suite; Firefox production-preview app acceptance passes. Firefox Vite-dev Pyodide startup remains a documented test-environment limitation. |
| 2026-07-11 | M8 moved to review-ready: operating-mode cross-checks, non-finite rejection, unsolved operating target warnings, report export failure cleanup, screen-reader landmark assertions, and 200% text-zoom reflow coverage added. Independent scientific/accessibility approval remains open. |

## Final commits

—
