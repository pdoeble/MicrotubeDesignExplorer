# CI, Pages, release — living plan

> **Path:** `/plans/260710-ci-pages-release.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M9/M10
> **Workstream:** W10 (CI and release)
> **Status:** in-progress
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

CI quality gates, GitHub Pages deployment, deployed-site smoke tests,
prohibited-source verification, release tagging, versioning, changelog,
CITATION.

## Interfaces

- Produces: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`,
  `scripts/check_prohibited_files.py`, release notes.

## Tasks

- [x] Baseline CI (ruff/format/mypy/pytest + tsc/eslint/prettier/vitest/build). (M0)
- [x] Prohibited-file gate. (M0)
- [x] Pages workflow scaffold (configure-pages → upload → deploy). (M0)
- [ ] Deployed-site smoke tests.
- [ ] Release gates (license check, contract freeze verification).
- [ ] Tagging + release notes + CITATION finalization (M10).

## Risks

| Risk | Mitigation |
|---|---|
| Pages base path breaks assets | `base` derived from `GITHUB_REPOSITORY` in vite.config.ts |

## Tests / evidence

- Green CI on GitHub; deployed URL smoke run (M9).

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created; CI + Pages scaffolds added in M0. |

## Final commits

—
