# Master Roadmap — Interactive Microtube Paper Companion

> **Path:** `/plans/260710-master-roadmap.md`  
> **Type:** Master living document  
> **Status:** active  
> **Created:** 2026-07-10  
> **Last updated:** 2026-07-10  
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
| M0 | Repository and governance baseline | not-started | — |
| M1 | MATLAB inventory and golden references | not-started | M0 |
| M2 | Contracts, units, defaults, validity policy | not-started | M1 |
| M3 | Python scientific core parity | not-started | M2 |
| M4 | Pyodide worker and browser integration | not-started | M2, M3 |
| M5 | Application shell and input workflows | not-started | M2, M4 |
| M6 | Plot system and results experience | not-started | M3–M5 |
| M7 | Figure and report exports | not-started | M4, M6 |
| M8 | Validation, accessibility, performance | not-started | M3–M7 |
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

# 8. Milestones

## M0 — Repository and governance baseline

**Goal:** Make parallel work safe and reproducible.

### Major tasks

- [ ] Create the fixed repository structure from `/AGENTS.md`.
- [ ] Add wiki index and sections for decisions, model, interfaces, and UI.
- [ ] Add ADR and living-plan templates.
- [ ] Configure `pnpm`, `uv`, formatting, linting, typing, and baseline tests.
- [ ] Add initial CI and prohibited-file checks.
- [ ] Document branch, commit, merge, and ownership conventions.

### Exit gate

- [ ] Clean checkout builds and runs baseline CI.
- [ ] A new agent can locate architecture, commands, plans, and interfaces.
- [ ] No secret, proprietary PDF, cache, or unlicensed artifact is tracked.

---

## M1 — MATLAB inventory and golden references

**Goal:** Capture the complete approved legacy behavior before porting.

### Major tasks

- [ ] Inventory every input, default, unit, equation branch, mask, screen, and plot.
- [ ] Separate scientific logic from presentation-only or dead MATLAB code.
- [ ] Resolve paper/MATLAB ambiguities through ADRs.
- [ ] Create MATLAB-to-Python symbol glossary and plot catalog.
- [ ] Generate immutable scalar, grid, boundary, and transition references.
- [ ] Record MATLAB revision, input hashes, generation method, and provenance.

### Minimum golden coverage

- [ ] Default aluminum and PA cases.
- [ ] Equal geometry/different material comparison.
- [ ] Different geometry/same material comparison.
- [ ] Invalid inner diameter boundary.
- [ ] Reynolds transitions.
- [ ] Minimum-wall, throughput, pressure-drop, burst, capillary, and cost boundaries.
- [ ] Representative plot fields, masks, and contour-relevant boundaries.

### Exit gate

- [ ] Every planned input and output has an authoritative source.
- [ ] Golden references are reproducible and immutable.
- [ ] No scientific ambiguity remains undocumented.

---

## M2 — Contracts, units, defaults, and validity policy

**Goal:** Freeze interfaces so agents can implement independently.

### Major tasks

- [ ] Define versioned `SimulationRequest` and `SimulationResult`.
- [ ] Define two-cooler comparison structures.
- [ ] Define geometry representations and canonical conversion rules.
- [ ] Define group-level link/unlink semantics.
- [ ] Define separate air- and coolant-side operating-mode enums.
- [ ] Define material, fluid, screen, sweep, warning, and provenance schemas.
- [ ] Define SI units and display conversions.
- [ ] Define one versioned defaults source.
- [ ] Define slider ranges, scale type, precision, and reset behavior.
- [ ] Define URL serialization and worker protocol.
- [ ] Generate TypeScript types from Python schemas.

### Binding validity behavior

- Impossible geometry and malformed/non-finite input are rejected.
- Correlation-range violations may compute only when numerically safe.
- Such values are visibly marked `outside-validity`.
- Screened-out designs remain visible and distinguishable.
- Invalid cells are masked; no silent clipping or interpolation is allowed.
- User-entered values remain visible after validation errors.

### Exit gate

- [ ] Python, frontend, plot, export, and test agents share stable contracts.
- [ ] Example payloads validate in Python and TypeScript.
- [ ] Contract compatibility tests pass.

---

## M3 — Python scientific core parity

**Goal:** Port the complete approved MATLAB model into a pure Python package.

### Major tasks

- [ ] Implement geometry and discrete tube-count logic.
- [ ] Implement static fluid and material inputs.
- [ ] Implement all air- and coolant-side operating modes.
- [ ] Implement VDI G1, VDI G7, wall conduction, and resistance aggregation.
- [ ] Implement flow, pressure loss, hydraulic power, and diagnostics.
- [ ] Implement tolerance-adjusted pressure integrity.
- [ ] Implement capillary-rise and cost models.
- [ ] Implement all screens, masks, sweeps, warnings, and provenance.
- [ ] Implement comparison, delta, and ratio result generation.
- [ ] Add equation-level tests and golden regression tests.

### Numerical gate

- Default tolerance: `rtol=1e-8`, `atol=1e-10`.
- Any exception must be quantity-specific and documented.
- Mask topology and screen transitions must match the reference.
- Golden files may not be changed merely to make tests pass.

### Exit gate

- [ ] All approved MATLAB outputs are implemented.
- [ ] Golden tests pass.
- [ ] Core code is deterministic, side-effect free, and UI independent.
- [ ] Every public model function has source and validity documentation.

---

## M4 — Pyodide worker and browser integration

**Goal:** Run the Python model reliably in a static browser application.

### Major tasks

- [ ] Build and load the project wheel in Pyodide.
- [ ] Run Python only in a dedicated Web Worker.
- [ ] Implement typed request/response and transferable array transport.
- [ ] Implement initialization, progress, cancellation, and supersession.
- [ ] Implement stable request hashing and safe caching.
- [ ] Transport structured warnings and exceptions.
- [ ] Handle startup, worker, memory, and recovery failures.
- [ ] Add direct-Python versus browser integration tests.

### Exit gate

- [ ] Default computation does not block the UI.
- [ ] Browser and direct Python results are identical.
- [ ] Cancellation and failure recovery are deterministic.

---

## M5 — Application shell and input workflows

**Goal:** Provide a complete two-cooler configuration workflow.

### Required pages

- [ ] Start
- [ ] Input
- [ ] Materials
- [ ] Result Plots
- [ ] Settings

### Major tasks

- [ ] Build Springer-like scientific visual system.
- [ ] Implement two-column cooler inputs with responsive fallback.
- [ ] Implement group-level linking and independent restoration.
- [ ] Support width/height/depth geometry input.
- [ ] Support volume/aspect-ratio geometry input.
- [ ] Support constant velocity, volume flow, mass flow, pressure drop, and hydraulic power.
- [ ] Allow independent air- and coolant-side operating modes.
- [ ] Implement slider, numeric entry, unit display, validation, and per-field reset.
- [ ] Implement editable static material and fluid properties.
- [ ] Default all values to the approved paper case.
- [ ] Implement versioned URL state and complete reset behavior.

### Exit gate

- [ ] Paper defaults are reproducible without manual transcription.
- [ ] Two fully different heat exchangers can be configured.
- [ ] Every control has model impact and documented meaning.
- [ ] Keyboard-only operation works.

---

## M6 — Plot system and results experience

**Goal:** Reproduce all approved MATLAB plot families coherently.

### Major tasks

- [ ] Create stable plot IDs and typed plot registry.
- [ ] Implement grouped plot selector.
- [ ] Implement tandem mode with common comparison scales where required.
- [ ] Implement approved delta and ratio plots.
- [ ] Cover thermal, resistance, Reynolds, flow, pressure, conductance, burst,
      spacing, capillary, cost, and feasibility plots.
- [ ] Show screen boundaries, minimum-wall lines, and benchmark markers consistently.
- [ ] Provide hover values with units and validity status.
- [ ] Provide tabular access, alt text, and detailed descriptions.
- [ ] Keep physics out of plotting code.
- [ ] Export every figure as PNG and SVG.

### Exit gate

- [ ] Every approved MATLAB plot has a web equivalent or documented exclusion.
- [ ] Paper plots reproduce from paper defaults.
- [ ] Plot values come only from `SimulationResult`.
- [ ] Legends explain every non-obvious marker and line.

---

## M7 — Figure and report exports

**Goal:** Produce complete reproducible outputs without a server.

### Major tasks

- [ ] Export individual figures as PNG with selectable resolution.
- [ ] Export individual figures as SVG.
- [ ] Generate standalone HTML report.
- [ ] Generate client-side PDF report.
- [ ] Generate machine-readable JSON sidecar.
- [ ] Include both coolers' inputs, materials, fluids, assumptions, warnings,
      summaries, screens, figures, versions, timestamp, and provenance.
- [ ] Generate reports from one immutable `SimulationResult`.

### Exit gate

- [ ] Same request and software version regenerate the same report content.
- [ ] No server is required.
- [ ] PDF remains readable in print and grayscale.
- [ ] Warnings and provenance cannot be omitted accidentally.

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
- [ ] Add build, test, license, and deployment gates.
- [ ] Deploy through GitHub Actions.
- [ ] Add deployed-site smoke tests.
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

- [ ] `YYMMDD-matlab-inventory-and-golden-data.md`
- [ ] `YYMMDD-contracts-units-and-validity.md`
- [ ] `YYMMDD-python-core-port.md`
- [ ] `YYMMDD-pyodide-worker-bridge.md`
- [ ] `YYMMDD-frontend-state-and-inputs.md`
- [ ] `YYMMDD-plot-registry-and-rendering.md`
- [ ] `YYMMDD-report-and-export-system.md`
- [ ] `YYMMDD-validation-accessibility-performance.md`
- [ ] `YYMMDD-ci-pages-release.md`

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
- [ ] All approved plot families are available.
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

