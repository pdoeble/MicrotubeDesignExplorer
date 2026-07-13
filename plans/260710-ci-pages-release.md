# CI, Pages, release — living plan

> **Path:** `/plans/260710-ci-pages-release.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M9/M10
> **Workstream:** W10 (CI and release)
> **Status:** review
> **Created:** 2026-07-10
> **Last updated:** 2026-07-13

## Scope

CI quality gates, GitHub Pages deployment, deployed-site smoke tests,
prohibited-source verification, release tagging, versioning, changelog,
CITATION. The master roadmap section 7.1 defines the binding lean CI/CD
operating model.

## Interfaces

- Produces: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`,
  `scripts/check_prohibited_files.py`, `scripts/check_pages_artifact.mjs`,
  release notes.

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
- [x] Gate every production build on resolved base-path references, artifact
      size/file limits, prohibited formats, and Pyodide/core-wheel manifest
      hashes while preserving the established GitHub repository path.
- [x] Add a production-preview Chromium smoke at the nested GitLab
      namespace/project path without activating GitLab CI.
- [x] Deployed-site Playwright smoke tests: app load, Pyodide worker startup,
      reduced paper-default computation, at least one rendered result plot,
      export/report smoke path after M7, and no fatal console errors.
- [x] Release gates: green CI, deployed smoke evidence, license check,
      `CITATION.cff` review, changelog/release notes, contract/default freeze
      verification, prohibited-source check on source and `dist`.
- [x] `CITATION.cff` and `CHANGELOG.md` aligned with package version `0.1.0`.
- [ ] Tagging + release notes publication (M10).

## Risks

| Risk                                            | Mitigation                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Pages base path breaks assets                   | Tested precedence: explicit base, `CI_PAGES_URL`, unchanged GitHub repository path, local `/`; nested production-preview smoke    |
| PR validation becomes too slow                  | Keep PR CI lean; reserve full deployed smoke, accessibility, performance, and release evidence for M8/M9 unless directly affected |
| Deployed artifact differs from validated source | Build from frozen lockfiles, stamp version/commit metadata, upload the validated `dist` artifact, and smoke-test the deployed URL |

## Tests / evidence

- 2026-07-11 M9 CI/Pages smoke configuration slice: `pnpm typecheck`,
  `pnpm format:check`, `pnpm test:e2e:chromium` (5 passed).
- 2026-07-11 Release-gate script slice: `uv run ruff check
../scripts/check_release_gate.py`, `uv run ruff format --check
../scripts/check_release_gate.py`, `python scripts/check_release_gate.py
--allow-provisional`.
- 2026-07-11 Strict local release gate: `pnpm build`,
  `python scripts/check_release_gate.py`, `python scripts/check_prohibited_files.py`,
  and `git diff --check` passed with `CITATION.cff` version `0.1.0`.
- 2026-07-11 GitHub CI and Pages deployment evidence: first successful
  release-candidate CI run `29140082451` passed; first successful Pages run
  `29140082435` passed after enabling Pages with `build_type=workflow`;
  subsequent documentation-only pushes must also keep CI/Pages green. Deployed URL:
  `https://pdoeble.github.io/MicrotubeDesignExplorer/`.
- 2026-07-11 Deployed smoke evidence: GitHub deployed-smoke passed in Pages run
  `29140082435`; local live smoke passed for reduced compute/report export;
  full paper-default UI compute on the deployed site returned
  `Computed 90 numeric fields.` with plot and summary visible; live export smoke
  downloaded SVG, PNG, JSON, HTML, and opened the print/PDF report window with
  no console errors.
- 2026-07-11 remote release-gate workflow run `29173624206` passed on
  `6130d58978daa4229a1777e2e7a1058844a05450`.
- 2026-07-12 UTC review tracking issues are open for the final pre-tag
  approvals: scientific review #1 and accessibility review #2.
- 2026-07-13 GitLab-readiness slice: host-neutral base unit tests, integrated
  Pages artifact gate, and nested production-preview smoke added under
  ADR-0012. `.github/workflows/pages.yml` remains unchanged and `pnpm build`
  enforces the new gate for GitHub automatically.
- 2026-07-13 portability validation: GitHub `/MicrotubeDesignExplorer/` and
  GitLab-style `/phdoeble/MicrotubeDesignExplorer/` production builds passed
  the artifact and strict release gates; both Chromium acceptance smokes
  completed the reduced Pyodide computation and export workflow. Full local
  suites passed with 72 frontend and 58 Python tests.
- M10 release publication remains blocked on independent scientific and
  accessibility approval.

## Status log

| Date       | Change                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-10 | Plan created; CI + Pages scaffolds added in M0.                                                                                                                                                                                                                                                                    |
| 2026-07-10 | Synchronized with master roadmap 7.1: lean PR/main CI, deterministic Pages deployment, deployed smoke tests, and manual release gates made explicit.                                                                                                                                                               |
| 2026-07-11 | Pages deployment now exposes the deployed URL and runs Chromium Playwright smoke against that URL. Playwright supports `PLAYWRIGHT_BASE_URL` for deployed smoke and keeps the local web server path for development.                                                                                               |
| 2026-07-11 | Manual release-gate workflow added: strict pre-release checks run Python/frontend quality gates, contract drift checks, production build, release metadata checks, and source/artifact prohibited-file scans. Current local run allows provisional CITATION version until M10 finalization.                        |
| 2026-07-11 | Release metadata finalized locally for `0.1.0` and strict release gate passes. M9/M10 remain blocked on independent review, GitHub.com authentication/push, real Pages deployment, deployed smoke evidence, and release publication.                                                                               |
| 2026-07-11 | M9 deployment evidence completed: CI passed, Pages was enabled for GitHub Actions, production deploy succeeded, deployed smoke passed, full paper-default compute works on the live site, and all export paths were smoke-tested from the deployed URL. M10 release publication still awaits independent approval. |
| 2026-07-11 | Manual remote release-gate workflow passed on the current release-candidate source. Tagging and release notes publication remain held for independent approval.                                                                                                                                                    |
| 2026-07-12 UTC | Final pre-tag review tracking issues opened: scientific review #1 and accessibility review #2. |
| 2026-07-13 | GitHub-preserving Pages portability added: every build validates its artifact and base path, while an opt-in nested-path production smoke prepares GitLab layouts without adding `.gitlab-ci.yml`. |
| 2026-07-13 | Final portability validation passed for both GitHub and nested GitLab-style paths, including Pyodide computation, exports, runtime hashes, source-leak checks, and the strict release gate. |

## Final commits

—
