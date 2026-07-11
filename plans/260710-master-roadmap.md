# Master Roadmap — Interactive Microtube Paper Companion

> **Path:** `/plans/260710-master-roadmap.md`  
> **Type:** Master living document  
> **Status:** active  
> **Created:** 2026-07-10  
> **Last updated:** 2026-07-11
> **Governing document:** `/AGENTS.md`  
> **Authoritative executable reference:** `Waermedurchgang_V10_physical.m`  
> **Deployment target:** static GitHub Pages

---

## 1. Role of this document

This plan stands above all implementation plans. It tracks the complete project,
major milestones, dependencies, release gates, and cross-agent coordination.
Detailed work belongs in dated subplans under `/plans/`.

Every subordinate plan must:

- start with `YYMMDD-`;
- link to this master plan;
- name its milestone and workstream;
- document scope, interfaces, risks, tests, and status;
- be updated while work is performed;
- link final commits when completed.

Before every commit, the active agent must verify and update as needed:

1. the relevant `/wiki` pages;
2. the active subplan;
3. this master roadmap if major status, dependencies, risks, or decisions changed.

---

## 2. Product objective

Build a fully static scientific web application that:

- accompanies the paper on microtube heat-exchanger design-space analysis;
- ports the complete approved MATLAB model to Python;
- runs locally in the browser without a backend;
- compares two heat exchangers;
- defaults to equal geometry and different materials as in the paper;
- also supports different geometry, materials, fluids, and operating conditions;
- exposes all scientifically meaningful MATLAB plots;
- exports PNG, SVG, standalone HTML reports, PDF reports, and JSON sidecars;
- makes assumptions, limits, warnings, screens, and provenance visible;
- deploys reproducibly to GitHub Pages.

Scientific fidelity and traceability take priority over visual convenience.

---

## 3. Binding technical decisions

Changes require an ADR under `/wiki/decisions/`.

- Frontend: React + TypeScript + Vite.
- Package management: `pnpm` and `uv`, both with committed lockfiles.
- Scientific core: pure typed Python package in `/python/microtubes_core/`.
- Browser execution: Pyodide in a dedicated Web Worker.
- Numerical backend: NumPy, `float64`.
- Plotting: Plotly.js through typed frontend adapters.
- Internal units: SI only; display conversion at boundaries.
- Validation: Pydantic in Python and generated TypeScript contracts.
- Public API: `SimulationRequest` → `SimulationResult`.
- State: versioned URL state for shareable scientific inputs.
- Deployment: GitHub Actions → GitHub Pages.
- No backend, database, account system, server session, or secret.
- Accessibility target: WCAG 2.2 AA.

---

## 4. Status vocabulary

Use only:

- `not-started`
- `ready`
- `in-progress`
- `blocked`
- `review`
- `completed`
- `superseded`

A milestone is `completed` only when all exit criteria and evidence are present.

---

## 5. Master milestone table

| ID | Milestone | Status | Primary dependency |
|---|---|---:|---|
| M0 | Repository and governance baseline | completed | — |
| M1 | MATLAB inventory and golden references | completed | M0 |
| M2 | Contracts, units, defaults, validity policy | completed | M1 |
| M3 | Python scientific core parity | completed | M2 |
| M4 | Pyodide worker and browser integration | completed | M2, M3 |
| M5 | Application shell and input workflows | completed | M2, M4 |
| M6 | Plot system and results experience | completed | M3–M5 |
| M7 | Figure and report exports | completed | M4, M6 |
| M8 | Validation, accessibility, performance | in-progress | M3–M7 |
| M9 | GitHub Pages release candidate | not-started | M8 |
| M10 | Scientific release and handover | not-started | M9 |

---

## 6. Workstreams and ownership boundaries

| ID | Workstream | Owns |
|---|---|---|
| W1 | Governance | AGENTS, wiki structure, ADRs, plans, release notes |
| W2 | MATLAB reference | inventory, provenance, golden datasets, plot catalog |
| W3 | Python core | physics, sweeps, screens, results, warnings |
| W4 | Contracts and bridge | schemas, generated types, worker protocol |
| W5 | Frontend state | navigation, URL state, comparison and link logic |
| W6 | Input UX | geometry, materials, fluids, operating controls |
| W7 | Plots | registry, tandem/delta plots, figure exports |
| W8 | Reports | HTML/PDF/JSON report generation |
| W9 | Quality | tests, parity, accessibility, performance evidence |
| W10 | CI and release | builds, checks, Pages deployment, versioning |

Agents must remain inside their workstream boundary unless a shared-interface
change is explicitly coordinated.

---

## 7. Parallelization rules

### Safe before contract freeze

- W1 repository and documentation setup
- W2 MATLAB inventory and reference generation
- W9 test-harness scaffolding
- W10 CI scaffolding
- W5 visual application shell without scientific bindings

### Must wait for M2

- production worker protocol
- final input binding
- URL schema
- plot/result adapters
- report payloads

### Must wait for M3

- final plot validation
- final summaries and reports
- complete end-to-end acceptance tests

### Shared-interface changes

A breaking change requires:

1. ADR;
2. contract version increment;
3. update to `/wiki/interfaces/`;
4. update to affected subplans;
5. update to this roadmap when milestone scope or dependencies change.

---

## 7.1 Lean CI/CD operating model

**Goal:** keep every pull request cheap to validate while making every deployed
GitHub Pages build reproducible, traceable, and scientifically reviewable.

### Required workflows

| Workflow | Trigger | Required gates | Output |
|---|---|---|---|
| PR/main CI | `pull_request`, `push` to `main` | prohibited-file check; locked `uv` sync; `ruff`; `ruff format --check`; `mypy`; `pytest`; Python contract export drift check; frozen `pnpm` install; generated TypeScript contract drift check; `typecheck`; `lint`; `format:check`; Vitest; production build | merge/block signal |
| Pages deployment | `push` to `main`, manual dispatch | prohibited-file check; frozen install; frontend type/unit test gate; deterministic Vite build with version and commit metadata; Pages artifact upload; GitHub Pages deployment | live static review candidate |
| Deployed smoke | after Pages deployment, manual fallback | Playwright against the deployed URL: app loads, Pyodide worker starts, reduced paper-default request completes, at least one result plot renders, export/report smoke path is checked once M7 exists, no fatal console errors | deployment evidence |
| Release gate | manual before tag/release | green CI; deployed smoke evidence; no contract/default drift; license and `CITATION.cff` reviewed; changelog/release notes prepared; prohibited-source check on source and `dist` artifact | releasable tag candidate |

### Operating rules

- Keep PR CI to deterministic quality and build checks; do not add broad OS,
  browser, or dependency matrices unless a release-blocking defect proves the
  need.
- Cache package downloads only through lockfile-aware actions; never use cache
  hits as evidence of correctness.
- Deployment uses the built static `dist` artifact only; no backend, secret, or
  runtime network dependency may be introduced.
- Pages permissions stay minimal: read repository contents, write Pages, and
  request the OIDC token required by GitHub Pages.
- Contract, defaults, golden references, and generated artifacts are drift
  gates. A drift failure must be fixed by updating the source of truth and
  documenting the reason, not by editing generated files by hand.
- Full scientific parity, accessibility, performance, report/export, and
  deployed smoke suites are release-candidate gates under M8/M9, not mandatory
  for every small PR unless that PR touches the affected surface.

---

# 8. Milestones

## M0 — Repository and governance baseline

**Goal:** Make parallel work safe and reproducible.

### Major tasks

- [x] Create the fixed repository structure from `/AGENTS.md`.
- [x] Add wiki index and sections for decisions, model, interfaces, and UI.
- [x] Add ADR and living-plan templates.
- [x] Configure `pnpm`, `uv`, formatting, linting, typing, and baseline tests.
- [x] Add initial CI and prohibited-file checks.
- [x] Document branch, commit, merge, and ownership conventions (`wiki/conventions.md`).

### Exit gate

- [x] Clean checkout builds and runs baseline CI (pnpm install/test/build,
      uv sync/pytest/ruff/mypy verified locally 2026-07-10; workflows in `.github/workflows/`).
- [x] A new agent can locate architecture, commands, plans, and interfaces
      (README §Governance, wiki/index.md).
- [x] No secret, proprietary PDF, cache, or unlicensed artifact is tracked
      outside the read-only `source_materials/` area (`scripts/check_prohibited_files.py`;
      the paper PDF lives in user-provided `source_materials/` by design).

---

## M1 — MATLAB inventory and golden references

**Goal:** Capture the complete approved legacy behavior before porting.

### Major tasks

- [x] Inventory every input, default, unit, equation branch, mask, screen, and plot
      (`wiki/model/matlab-inventory.md`).
- [x] Separate scientific logic from presentation-only or dead MATLAB code (inventory §7).
- [x] Resolve paper/MATLAB ambiguities through ADRs (ADR-0002 golden generation,
      ADR-0003 operating-mode scope).
- [x] Create MATLAB-to-Python symbol glossary and plot catalog
      (`wiki/model/symbol-glossary.md`, `wiki/model/plot-catalog.md`).
- [x] Generate immutable scalar, grid, boundary, and transition references
      (`/reference`, MATLAB R2024b Update 1, ADR-0002).
- [x] Record MATLAB revision, input hashes, generation method, and provenance
      (`reference/provenance.json`, `reference/manifest.json`).

### Minimum golden coverage

- [x] Default aluminum and PA cases (`reference/default_case/`).
- [x] Equal geometry/different material comparison (`ratio_same_geometry`,
      tech-adjusted ratios, `dAlNearest_mm`).
- [x] Different geometry/same material comparison (app-level arithmetic over
      per-case results; physics pinned by function-level goldens — see
      `wiki/model/golden-data.md` §Comparison-mode note).
- [x] Invalid inner diameter boundary (invalid mask; d ≤ 0 rows; t_loc ≤ 0 NaN region).
- [x] Reynolds transitions (exact Re = 2300/10000 anchor points in G1/friction sweeps).
- [x] Minimum-wall, throughput, pressure-drop, burst, capillary, and cost boundaries
      (screen masks + composite boundary vectors).
- [x] Representative plot fields, masks, and contour-relevant boundaries
      (36 grid fields + 6 masks + boundary vectors).

### Exit gate

- [x] Every planned input and output has an authoritative source (inventory tables).
- [x] Golden references are reproducible and immutable (regeneration procedure +
      SHA-256 manifest; AGENTS §10 rules restated in `wiki/model/golden-data.md`).
- [x] No scientific ambiguity remains undocumented (ADR-0002, ADR-0003; open
      geometry-representation semantics are an M2 contract topic, not a MATLAB ambiguity).

---

## M2 — Contracts, units, defaults, and validity policy

**Goal:** Freeze interfaces so agents can implement independently.

### Major tasks

- [x] Define versioned `SimulationRequest` and `SimulationResult` (v1.0.0).
- [x] Define two-cooler comparison structures (`cooler_left/right`, `comparison`).
- [x] Define geometry representations and canonical conversion rules
      (dimensions canonical; exact volume/aspect conversion).
- [x] Define group-level link/unlink semantics (5 groups, equality-validated).
- [x] Define separate air- and coolant-side operating-mode enums (ADR-0003).
- [x] Define material, fluid, screen, sweep, warning, and provenance schemas.
- [x] Define SI units and display conversions (SI in contracts; display only
      in parameter manifest).
- [x] Define one versioned defaults source (`microtubes_core.defaults`, 1.0.0).
- [x] Define slider ranges, scale type, precision, and reset behavior
      (parameter manifest, 47 specs; reset = manifest default).
- [x] Define URL serialization and worker protocol — schema-level contract
      frozen here; transport details documented in M4/M5 wiki pages on top of
      this contract (no contract change).
- [x] Generate TypeScript types from Python schemas (json-schema-to-typescript,
      CI drift gates).

### Binding validity behavior

- Impossible geometry and malformed/non-finite input are rejected.
- Correlation-range violations may compute only when numerically safe.
- Such values are visibly marked `outside-validity`.
- Screened-out designs remain visible and distinguishable.
- Invalid cells are masked; no silent clipping or interpolation is allowed.
- User-entered values remain visible after validation errors.

### Exit gate

- [x] Python, frontend, plot, export, and test agents share stable contracts
      (single Pydantic source; generated JSON Schema + TS).
- [x] Example payloads validate in Python and TypeScript (paper defaults
      fixture validated by pytest and Ajv).
- [x] Contract compatibility tests pass (11 pytest, 5 Vitest — 2026-07-10).

---

## M3 — Python scientific core parity

**Goal:** Port the complete approved MATLAB model into a pure Python package.

### Major tasks

- [x] Implement geometry and discrete tube-count logic.
- [x] Implement static fluid and material inputs.
- [x] Implement all air- and coolant-side operating modes.
- [x] Implement VDI G1, VDI G7, wall conduction, and resistance aggregation.
- [x] Implement flow, pressure loss, hydraulic power, and diagnostics.
- [x] Implement tolerance-adjusted pressure integrity.
- [x] Implement capillary-rise and cost models.
- [x] Implement all screens, masks, sweeps, warnings, and provenance.
- [x] Implement comparison, delta, and ratio result generation.
- [x] Add equation-level tests and golden regression tests.

### Numerical gate

- Default tolerance: `rtol=1e-8`, `atol=1e-10`.
- Any exception must be quantity-specific and documented.
- Mask topology and screen transitions must match the reference.
- Golden files may not be changed merely to make tests pass.

### Exit gate

- [x] All approved MATLAB outputs are implemented.
- [x] Golden tests pass.
- [x] Core code is deterministic, side-effect free, and UI independent.
- [x] Every public model function has source and validity documentation.

---

## M4 — Pyodide worker and browser integration

**Goal:** Run the Python model reliably in a static browser application.

### Major tasks

- [x] Build and load the project wheel in Pyodide.
- [x] Run Python only in a dedicated Web Worker.
- [x] Implement typed request/response and transferable array transport.
- [x] Implement initialization, progress, cancellation, and supersession.
- [x] Implement stable request hashing and safe caching.
- [x] Transport structured warnings and exceptions.
- [x] Handle startup, worker, memory, and recovery failures.
- [x] Add direct-Python versus browser integration tests.

### Exit gate

- [x] Default computation does not block the UI.
- [x] Browser and direct Python results are identical.
- [x] Cancellation and failure recovery are deterministic.

---

## M5 — Application shell and input workflows

**Goal:** Provide a complete two-cooler configuration workflow.

### Required pages

- [x] Start
- [x] Input
- [x] Materials
- [x] Result Plots
- [x] Settings

### Major tasks

- [x] Build Springer-like scientific visual system.
- [x] Implement two-column cooler inputs with responsive fallback.
- [x] Implement group-level linking and independent restoration.
- [x] Support width/height/depth geometry input.
- [x] Support volume/aspect-ratio geometry input.
- [x] Support constant velocity, volume flow, mass flow, pressure drop, and hydraulic power.
- [x] Allow independent air- and coolant-side operating modes.
- [x] Implement slider, numeric entry, unit display, validation, and per-field reset.
- [x] Implement editable static material and fluid properties.
- [x] Default all values to the approved paper case.
- [x] Implement versioned URL state and complete reset behavior.

### Exit gate

- [x] Paper defaults are reproducible without manual transcription.
- [x] Two fully different heat exchangers can be configured.
- [x] Every control has model impact and documented meaning.
- [x] Keyboard-only operation works.

---

## M6 — Plot system and results experience

**Goal:** Reproduce all approved MATLAB plot families coherently.

### Major tasks

- [x] Create stable plot IDs and typed plot registry.
- [x] Implement grouped plot selector.
- [x] Implement tandem mode with common comparison scales where required.
- [x] Implement approved delta and ratio plots.
- [x] Cover thermal, resistance, Reynolds, flow, pressure, conductance, burst,
      spacing, capillary, cost, and feasibility plots.
- [x] Show screen boundaries, minimum-wall lines, and benchmark markers consistently.
- [x] Provide hover values with units and validity status.
- [x] Provide tabular access, alt text, and detailed descriptions.
- [x] Keep physics out of plotting code.
- [x] Export every registered figure as PNG and SVG with provenance footer.

### Exit gate

- [x] Every approved MATLAB plot has a web equivalent or documented exclusion.
- [x] Paper plots reproduce from paper defaults.
- [x] Plot values come only from `SimulationResult`.
- [x] Legends explain every non-obvious marker and line.

---

## M7 — Figure and report exports

**Goal:** Produce complete reproducible outputs without a server.

### Major tasks

- [x] Export individual figures as PNG with selectable resolution.
- [x] Export individual figures as SVG.
- [x] Generate standalone HTML report.
- [x] Generate client-side PDF report.
- [x] Generate machine-readable JSON sidecar.
- [x] Include both coolers' inputs, materials, fluids, assumptions, warnings,
      summaries, screens, figures, versions, timestamp, and provenance.
- [x] Generate reports from one immutable `SimulationResult`.

### Exit gate

- [x] Same request and software version regenerate the same report content.
- [x] No server is required.
- [x] PDF remains readable in print and grayscale.
- [x] Warnings and provenance cannot be omitted accidentally.

---

## M8 — Validation, accessibility, and performance

**Goal:** Prove production readiness.

### Major tasks

- [ ] Run complete golden and contract regression suites.
- [ ] Validate geometry-mode equivalence and operating-mode cross-checks.
- [ ] Validate links, resets, URL round-trips, plots, and report regeneration.
- [ ] Complete keyboard, screen-reader, contrast, zoom, and plot-description review.
- [ ] Define and meet Pyodide startup, default sweep, memory, and cancellation budgets.
- [ ] Test worker failure, invalid input, export failure, and non-finite results.
- [ ] Perform independent scientific and accessibility review.

### Exit gate

- [ ] No open critical or high-severity defect.
- [ ] CI acceptance suites pass.
- [ ] WCAG 2.2 AA target is met or exceptions are documented and approved.
- [ ] Performance budgets are met on the reference device class.
- [ ] Scientific validation report is approved.

---

## M9 — GitHub Pages release candidate

**Goal:** Deploy a complete reviewable release candidate.

### Major tasks

- [ ] Configure production base path and deterministic Vite build.
- [ ] Keep PR/main CI aligned with the required lean CI gates in section 7.1.
- [ ] Gate Pages deployment on prohibited-file checks, frozen installs,
      type/unit tests, deterministic build metadata, and artifact upload.
- [ ] Add release gates for license, citation, changelog, contract/default
      freeze, and source/artifact prohibited-file checks.
- [ ] Deploy through GitHub Actions.
- [ ] Add deployed-site Playwright smoke tests for app load, worker startup,
      reduced paper-default computation, plot rendering, and M7 export/report
      smoke paths.
- [ ] Verify direct navigation, reloads, assets, and exports.
- [ ] Verify no prohibited source material ships.
- [ ] Freeze release-candidate contracts and defaults.
- [ ] Close findings from independent review.

### Exit gate

- [ ] Release candidate is live on GitHub Pages.
- [ ] Paper default reproduces approved results on the deployed site.
- [ ] All export formats work from the deployed site.
- [ ] Review findings are closed or formally accepted.

---

## M10 — Scientific release and handover

**Goal:** Publish and make future maintenance safe.

### Major tasks

- [ ] Tag the release and publish release notes.
- [ ] Archive validation evidence and exact version metadata.
- [ ] Mark completed plans and milestones.
- [ ] Finalize wiki navigation and known limitations.
- [ ] Document golden-data regeneration.
- [ ] Document adding plots, modes, fields, and contract versions.
- [ ] Define maintenance ownership and issue severity policy.
- [ ] Create dated post-release backlog plan.

### Exit gate

- [ ] Release builds reproducibly from a clean checkout.
- [ ] Deployed site matches tagged source.
- [ ] No active plan lacks a current status.
- [ ] A new agent can maintain the project without oral handover.

---

## 9. Required result summaries

Where applicable, expose in the UI and reports:

- canonical geometry and discrete tube counts;
- diameters, wall thickness, wall ratio, pitch, and clear spacing;
- air and coolant velocities, volume flows, and mass flows;
- Reynolds, Prandtl, and Nusselt numbers;
- inner and outer heat-transfer coefficients;
- individual thermal resistances and resistance shares;
- overall coefficient and package-scaled conductance;
- pressure loss and hydraulic power;
- burst, capillary, cost, and every other screen metric;
- per-screen pass/fail and overall feasibility;
- validity status, warnings, provenance, and comparison values.

---

## 10. Required subordinate plans

Create before substantial work begins:

- [x] `260710-matlab-inventory-and-golden-data.md`
- [x] `260710-contracts-units-and-validity.md`
- [x] `260710-python-core-port.md`
- [x] `260710-pyodide-worker-bridge.md`
- [x] `260710-frontend-state-and-inputs.md`
- [x] `260710-plot-registry-and-rendering.md`
- [x] `260710-report-and-export-system.md`
- [x] `260710-validation-accessibility-performance.md`
- [x] `260710-ci-pages-release.md`

---

## 11. Global risks

| Risk | Required mitigation |
|---|---|
| Ambiguous MATLAB behavior | ADR before implementation |
| Incomplete golden coverage | Scalar, grid, mask, and transition references |
| Slow Pyodide startup | Lazy loading, minimized dependencies, measured budget |
| Physics duplicated in plots | Plot only from `SimulationResult` |
| Inconsistent two-cooler state | Canonical state model and contract tests |
| Misleading discrete transitions | Show discrete values and explain discontinuities |
| Outside-validity results appear authoritative | Explicit warnings and visual state |
| Parallel contract drift | ADR and semantic contract versioning |
| Wiki/plan drift | Mandatory pre-commit documentation review |
| CI/CD becomes too slow for regular PRs | Keep PR CI to lean deterministic gates; reserve full deployed smoke, accessibility, performance, and release evidence for M8/M9 gates unless directly affected |
| Deployed artifact differs from validated source | Build and deploy only from locked installs, deterministic Vite metadata, generated-contract drift checks, and the uploaded Pages artifact |
| Provisional MIT license not confirmed by authors | Confirm before M10 (ADR-0001 §4) |

---

## 12. Master completion criteria

The project is complete only when:

### Scientific

- [ ] The approved MATLAB model is fully represented in Python.
- [ ] Golden parity is demonstrated.
- [ ] Assumptions, constants, equations, screens, and validity limits are documented.
- [ ] No hidden fit, clipping, smoothing, or extrapolation exists.

### Functional

- [ ] Two linked or independent coolers can be configured.
- [ ] Both geometry input representations work.
- [ ] Materials, fluids, and all approved operating modes are editable.
- [x] All approved plot families are available.
- [ ] PNG, SVG, HTML, PDF, and JSON exports work.
- [ ] Scientific state can be shared through a versioned URL.

### Technical

- [ ] Application is fully static and deployed on GitHub Pages.
- [ ] Heavy computation runs outside the main thread.
- [ ] Contracts are typed, tested, and versioned.
- [ ] Clean checkout builds deterministically.
- [ ] CI enforces quality and release gates.

### Quality and governance

- [ ] WCAG 2.2 AA target is met.
- [ ] Performance budgets are met.
- [ ] Every bug fix has a regression test.
- [ ] Wiki, plans, code, tests, exports, and deployed behavior agree.
- [ ] All completed work is committed independently using Conventional Commits.

---

## 13. Commit gate

Before every commit:

- [ ] Run relevant formatters, linters, type checks, and tests.
- [ ] Verify `/wiki` is current and update it where needed.
- [ ] Update the active living plan.
- [ ] Update this master plan if milestone state, dependencies, risks, or scope changed.
- [ ] Confirm no prohibited or unintended generated file is staged.
- [ ] Commit one coherent change independently.
- [ ] Record validation evidence in the commit body or linked plan.

A task is not complete while code, tests, wiki, plans, and acceptance criteria disagree.

---

## 14. Status history

| Date | Change | Author/agent |
|---|---|---|
| 2026-07-10 | Initial master roadmap created | planning agent |
| 2026-07-10 | M0 completed: layout, toolchain (pnpm 11/uv 0.11, lockfiles), wiki sections, templates, 9 subplans, CI + Pages scaffold, prohibited-file gate, ADR-0001..0003. MATLAB R2024b found on dev machine → golden data will come from real MATLAB (ADR-0002). M1 started. | implementation agent (Claude) |
| 2026-07-10 | M1 completed: MATLAB inventory/glossary/plot catalog in wiki; golden references generated from unmodified reference script with MATLAB R2024b (278 files, default case + 24 function-level branch sweeps, SHA-256 manifest). M2 started. | implementation agent (Claude) |
| 2026-07-10 | M2 completed: contracts v1.0.0 frozen (Pydantic → JSON Schema → TS with CI drift gates), paper defaults cross-checked against MATLAB snapshot, parameter manifest (47 specs), validity policy + error/warning catalog in wiki/interfaces/contracts.md. M3 started. | implementation agent (Claude) |
| 2026-07-10 | M3 first core slice completed: pure model modules for G1/G7 correlations, Darcy pressure drop, Lamé burst, geometry/counts, operating modes, capillary, cost, and resistance aggregation; function-level MATLAB golden parity and operating inversion tests pass (41 pytest) with mypy and ruff green. ADR-0004 added for cost count floor/reference normalization. | Codex |
| 2026-07-10 | M3 sweep slice added: single-cooler grid pipeline, invalid/Y/tech masks, operating-mode integration, raw field generation, screen inputs, and all-screen feasibility masks; default-case sweep parity passes (45 pytest). ADR-0005 added for MATLAB-compatible sweep-axis generation. | Codex |
| 2026-07-10 | M3 comparison slice added: interp2-style screen queries, nearest feasible reference, same-geometry ratio, tech-adjusted ratios, and composite feasible boundaries; default comparison golden parity passes (47 pytest). | Codex |
| 2026-07-10 | M3 API slice added: `simulate(request)` now returns contract payload plus C-order float64 array registry, request hash, provenance, scalar summaries, cooler fields/masks, and comparison fields; API golden checks pass (50 pytest). | Codex |
| 2026-07-10 | M3 burst-tolerance slice added: standard and medical Lamé sensitivity grids are exported through sweep/API and checked against default-case MATLAB goldens. | Codex |
| 2026-07-10 | M3 capillary-sensitivity slice added: 1g, 5g, and 10g capillary-rise grids are exported through sweep/API and checked against default-case MATLAB goldens. | Codex |
| 2026-07-10 | M3 comparison-delta slice added: same-geometry and tech-adjusted percent-delta fields are exported through comparison/API and tested from MATLAB ratio goldens. | Codex |
| 2026-07-10 | M3 validity-warning slice added: API emits `W_OUTSIDE_VALIDITY` for VDI G1/G7 Reynolds and Prandtl range violations while preserving computed values. | Codex |
| 2026-07-10 | M3 completed: Python scientific core parity, sweep/comparison/API payloads, warnings, provenance, equation docs, and golden regression suite verified (`uv run pytest` 51 passed, `uv run mypy .`, `uv run ruff check ..`, `uv run ruff format --check ..`, prohibited-file gate). | Codex |
| 2026-07-10 | M4 started: Pyodide `314.0.2` pinned via `pnpm`, same-origin Pyodide assets and `microtubes_core` wheel generated at build time, typed worker protocol/client added with transferable float64 array transport and cache/supersession unit tests. | Codex |
| 2026-07-10 | M4 completed: same-origin Pyodide runtime plus required package wheels are generated with SHA-256 verification; Playwright browser worker parity against direct Python passes for a reduced default request; structured worker errors, startup retry, cancellation, and client cache behavior are unit-tested. | Codex |
| 2026-07-10 | M5 completed: manifest-driven two-cooler input workflow, editable materials/fluids, geometry representation conversion, group linking/restoration, versioned URL state, complete reset, and responsive scientific form styling added and validated. | Codex |
| 2026-07-10 | M6 started: typed Plotly heatmap registry, result-run workflow, KPI summary table, and initial thermal/flow/pressure/Reynolds/spacing/cost/delta plot selection render from `SimulationResult`; export, boundaries, tandem scaling, and full MATLAB plot coverage remain open. | Codex |
| 2026-07-10 | Roadmap CI/CD operating model added: lean PR/main CI, deterministic Pages deployment, deployed smoke evidence, and manual release gates are now explicit W10/M9 requirements. | Codex |
| 2026-07-10 | M6 figure-export slice completed: Plotly specs are tested outside React; registered plots now export PNG and SVG with compact contract/core/request/golden provenance in the figure footer. | Codex |
| 2026-07-10 | M6 overlay slice completed: cooler summaries expose plot-marker geometry; registered plots draw composite feasible boundaries, minimum-wall lines, and design-point markers from `SimulationResult`; individual screen-boundary family remains open. | Codex |
| 2026-07-10 | M6 tandem slice completed: cooler-scoped plots now support single/tandem display with shared finite color domains; percent-delta comparison maps use symmetric zero-centered domains. | Codex |
| 2026-07-10 | M6 delta/ratio slice completed: registry variants now expose exported ratio fields next to approved percent-delta maps, and the Result Plots tab switches comparison groups between delta and ratio. | Codex |
| 2026-07-10 | M6 hover-status slice completed: cooler heatmap hover now reports value, unit, and validity/screening state from exported masks; comparison plots remain direct exported fields. | Codex |
| 2026-07-10 | M6 plot-family coverage slice completed: registry entries now cover the remaining thermal, resistance, flow, burst, capillary, hydraulic-power, geometry, and feasibility fields already exported by `SimulationResult`. | Codex |
| 2026-07-10 | M6 plot data summary slice completed: figure canvases now reference tabular summaries with field, unit, finite-cell count, min/max, and status counts for non-visual inspection. | Codex |
| 2026-07-10 | M6 screen-boundary slice completed: per-screen failure masks are exported from Python and rendered as SVG-compatible contour lines for minimum-wall, burst, flow, pressure-drop, cost, and capillary screens. | Codex |
| 2026-07-10 | M6 completed: plot registry, grouped selection, tandem scales, delta/ratio variants, exported-value-only Plotly specs, screen/benchmark overlays, hover status, tabular summaries, PNG/SVG figure export, plot catalog coverage, and browser worker parity are verified. M7 is ready. | Codex |
| 2026-07-10 | M7 started: Python ReportPayload and canonical JSON sidecar basis added with request/result provenance, summaries, warnings, and SHA-256 array manifests. | Codex |
| 2026-07-10 | M7 browser export slice completed: current `SimulationResult` can be exported as canonical JSON sidecar, standalone HTML report, and print/PDF report path; report figure embedding and PNG resolution selection remain open. | Codex |
| 2026-07-11 | M7 completed: individual PNG export now supports selectable 1x/2x/3x resolution, registered Plotly specs are captured as SVG report figures for standalone HTML and print/PDF reports, JSON sidecars remain canonical and image-free, and report content is generated from one immutable `SimulationResult`. Validation: `pnpm test` (39 passed), `pnpm typecheck`, `pnpm lint` (generated-contract warnings only), `pnpm format:check`, `pnpm build`, prohibited-file check, and `git diff --check`. M8 is ready. | Codex |
| 2026-07-11 | M8 automation slice started: Python API geometry-representation equivalence, worker-crash failure handling, Chromium E2E compute/export/URL/reset/accessibility smoke, and reduced-sweep worker performance budgets are now covered. Independent scientific/accessibility review remains open. | Codex |
