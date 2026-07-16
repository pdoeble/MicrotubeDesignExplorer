# Adaptive dimensionless diagnostic plots — living plan

> **Path:** `/plans/260716-dimensionless-diagnostic-plots.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M6/M8 scientific plot extension
> **Workstream:** W3/W6/W8
> **Status:** completed
> **Created:** 2026-07-16
> **Last updated:** 2026-07-16

## Scope

Archive the previous MATLAB master, accept the supplied diagnostic source
material, and add adaptive Graetz-number, wall-Biot-number, and local VDI-G1
diameter-sensitivity maps to the static application. Make all result-map axes
follow non-default sweep domains while preserving the established paper view
for the committed defaults.

Ridge/flip overlays, fixed default-case diagnostic annotations, updates to the
paper PDF/TeX, and expansion of the default report-figure selection are out of
scope. The existing resistance-share grid remains the public morphology view.

## Interfaces

- Additive `SimulationResult` fields per cooler: `graetz_inner`, `wall_biot`,
  and `g1_diameter_sensitivity`, all dimensionless.
- No `SimulationRequest`, schema-shape, URL-state, worker-envelope, or contract
  version change; contract 1.0.0 permits additive named result fields.
- New stable plot IDs: `graetz-tube-side-map`, `wall-biot-map`, and
  `g1-diameter-sensitivity-map`.
- The active plot domain derives from the request sweep. The unchanged
  calculation window 0–45 % retains the approved 0–40 % paper view.

## Tasks

- [x] Commit the supplied source-material archive and diagnostic references
  without editing them.
- [x] Thread adaptive diameter/τ domains through single and composite plot
  preparation, axes, overlays, comparison clipping, labels, and hatching.
- [x] Implement the three pure float64 diagnostic quantities and expose them
  through `SimulationResult`.
- [x] Extend MATLAB golden harvesting, regenerate provenance/manifest, and
  verify all pre-existing numerical arrays remain unchanged.
- [x] Register and render the three plots with dynamic `Re_i = 2300`, `Bi = 1`,
  and `S_i = 2/3` reference contours.
- [x] Update model, interface, UI, plot-catalog, decision, and roadmap docs.
- [x] Complete scientific, frontend, build, browser, visual, and release gates.
- [x] Commit coherent slices and fast-forward push `main` to GitHub and GitLab.

## Risks

| Risk | Mitigation |
|---|---|
| A numerical derivative silently depends on sweep resolution | Evaluate a pointwise central logarithmic stencil with documented `h = 1e-5` while holding local velocity and all other correlation inputs fixed |
| Default paper figures regress while domains become adaptive | Preserve the default x-domain and the special 0–40 % display window; run the exhaustive default visual audit |
| Non-default overlays retain hidden 0.1–10 mm assumptions | Pass one explicit domain through resampling, axes, labels, screen contours, hatches, markers, and composite panels |
| MATLAB diagnostic gradients disagree at correlation branch joins | Use strict laminar checks, documented transition tolerance away from the anchors, and separate branch/stencil tests at the joins |
| Golden regeneration changes existing physics | Compare every pre-existing binary hash and stop if any established numerical array changes |
| Remote histories diverge during implementation | Fetch both remotes before push, require both tips to be ancestors, and never force-push |

## Tests / evidence

- MATLAB R2024b master execution and golden-reference regeneration.
- Python golden, API, operating-mode, boundary-condition, convergence, pytest,
  ruff, mypy, and contract-drift checks.
- Frontend registry/spec/report tests, typecheck, lint, format check, production
  Pages build, Chromium app/worker/export checks, and nested-path smoke.
- Opt-in 40-ID visual audit plus manual contact-sheet inspection.
- Prohibited-file check, `git diff --check`, commit file-list review, and remote
  commit verification.

## Status log

| Date | Change |
|---|---|
| 2026-07-16 | Plan accepted; both remote `main` tips verified at `5d6b3ee`; historical MATLAB blob verified identical to the prior master. |
| 2026-07-16 | Supplied source material committed unchanged as `55f2922`. |
| 2026-07-16 | Adaptive domain threaded through single/composite specs, resampling, labels, comparison masks, screen contours, hatches, and exports; scoped frontend checks passed. |
| 2026-07-16 | Added pure pointwise Graetz, effective wall-Biot, and fixed-local-velocity G1 sensitivity fields; MATLAB R2024b regenerated four diagnostic goldens and all 276 pre-existing hashes remained unchanged. |
| 2026-07-16 | Registered the three public maps with exact two-cooler color domains and active-result Re/Bi/S reference contours; ADR-0015 records the older-paper conflict and excluded fixed MATLAB morphology annotations. |
| 2026-07-16 | Final gates passed: 73 pytest and 78 Vitest tests, ruff, mypy, contract drift, TypeScript, ESLint, Prettier, production/Pages-path builds, Chromium worker/app/export suite, all 40 opt-in visual-audit plot IDs with manual contact sheets, release/prohibited-file checks, and `git diff --check`. |
| 2026-07-16 | GitHub and Hochschule GitLab were fetched at `5d6b3ee`, verified as fast-forward ancestors, pushed without force, and verified at technical delivery commit `59a4e4e`. |

## Final commits

- `55f2922` — `docs(source): archive MATLAB baseline and add diagnostic references`
- `1103ed7` — `fix(plots): adapt result maps to configured sweep ranges`
- `1429f9b` — `feat(core): expose dimensionless diagnostic fields`
- `59a4e4e` — `feat(plots): add Graetz Biot and G1 sensitivity maps`
