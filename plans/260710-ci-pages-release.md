# CI, Pages, release — living plan

> **Path:** `/plans/260710-ci-pages-release.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M9/M10
> **Workstream:** W10 (CI and release)
> **Status:** in-progress
> **Created:** 2026-07-10
> **Last updated:** 2026-07-11

## Scope

CI quality gates, GitHub Pages deployment, deployed-site smoke tests,
prohibited-source verification, release tagging, versioning, changelog,
CITATION. The master roadmap section 7.1 defines the binding lean CI/CD
operating model.

## Interfaces

- Produces: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`,
  `scripts/check_prohibited_files.py`, release notes.

## Tasks

- [x] Baseline CI (ruff/format/mypy/pytest + tsc/eslint/prettier/vitest/build). (M0)
- [x] Prohibited-file gate. (M0)
- [x] Pages workflow scaffold (configure-pages → upload → deploy). (M0)
- [x] Keep PR/main CI aligned with roadmap 7.1:
      prohibited files, locked `uv`, ruff, format, mypy, pytest, Python
      contract drift, frozen `pnpm`, generated TypeScript contract drift,
      typecheck, lint, format, Vitest, and production build.
- [x] Gate Pages deployment with prohibited-file checks, frozen frontend
      install, type/unit tests, deterministic build metadata, artifact upload,
      and minimal Pages permissions.
- [x] Deployed-site Playwright smoke tests: app load, Pyodide worker startup,
      reduced paper-default computation, at least one rendered result plot,
      export/report smoke path after M7, and no fatal console errors.
- [ ] Release gates: green CI, deployed smoke evidence, license check,
      `CITATION.cff` review, changelog/release notes, contract/default freeze
      verification, prohibited-source check on source and `dist`.
- [ ] Tagging + release notes + CITATION finalization (M10).

## Risks

| Risk | Mitigation |
|---|---|
| Pages base path breaks assets | `base` derived from `GITHUB_REPOSITORY` in vite.config.ts |
| PR validation becomes too slow | Keep PR CI lean; reserve full deployed smoke, accessibility, performance, and release evidence for M8/M9 unless directly affected |
| Deployed artifact differs from validated source | Build from frozen lockfiles, stamp version/commit metadata, upload the validated `dist` artifact, and smoke-test the deployed URL |

## Tests / evidence

- 2026-07-11 M9 CI/Pages smoke configuration slice: `pnpm typecheck`,
  `pnpm format:check`, `pnpm test:e2e:chromium` (5 passed).
- Green CI on GitHub and a deployed URL smoke run remain M9 exit evidence.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created; CI + Pages scaffolds added in M0. |
| 2026-07-10 | Synchronized with master roadmap 7.1: lean PR/main CI, deterministic Pages deployment, deployed smoke tests, and manual release gates made explicit. |
| 2026-07-11 | Pages deployment now exposes the deployed URL and runs Chromium Playwright smoke against that URL. Playwright supports `PLAYWRIGHT_BASE_URL` for deployed smoke and keeps the local web server path for development. |

## Final commits

—
