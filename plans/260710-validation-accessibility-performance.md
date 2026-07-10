# Validation, accessibility, performance — living plan

> **Path:** `/plans/260710-validation-accessibility-performance.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8
> **Workstream:** W9 (Quality)
> **Status:** ready
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

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

- [ ] Playwright setup (Chromium/Firefox/WebKit).
- [ ] E2E: default compute, tab keyboard flow, export smoke.
- [ ] Performance budgets defined and measured.
- [ ] Failure-path tests (worker crash, invalid input, non-finite results).
- [ ] WCAG 2.2 AA review with documented exceptions.

## Risks

| Risk | Mitigation |
|---|---|
| Pyodide download flakiness in CI | cached assets, retries, generous timeouts |

## Tests / evidence

- CI acceptance suites; budget table in this plan.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |

## Final commits

—
