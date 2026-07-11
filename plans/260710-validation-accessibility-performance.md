# Validation, accessibility, performance — living plan

> **Path:** `/plans/260710-validation-accessibility-performance.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8
> **Workstream:** W9 (Quality)
> **Status:** in-progress
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
- [x] Performance budgets defined and measured.
- [x] Failure-path tests (worker crash, invalid input, non-finite results).
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
  `pnpm test:e2e` produced Chromium pass, WebKit pass, and Firefox failure in
  Pyodide startup (`Loading Pyodide runtime` with pending
  `python_stdlib.zip`/`pyodide.asm.wasm` requests). Firefox compatibility
  remains an open M8 finding; it is not accepted as a release limitation yet.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-11 | M8 automation slice added: geometry-representation API equivalence, worker-crash client failure test, Chromium E2E compute/export/URL/reset/accessibility smoke, and reduced-sweep performance budget. Independent review remains open. |
| 2026-07-11 | Multi-browser Playwright check expanded: WebKit passes the E2E suite; Firefox currently fails in Pyodide startup and needs investigation or formal release-scope decision. |

## Final commits

—
