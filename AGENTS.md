# AGENTS.md
## 1. Mission
- Build a static scientific web application for microtube heat-exchanger design-space analysis as a companion to the paper.
- The complete physics of `Waermedurchgang_V10_physical.m` must be ported to Python.
- Numerical fidelity, traceability, and reproducibility outrank UI convenience.
- Never introduce undocumented empirical fits or hidden calibration factors.
## 2. Source-of-truth order
1. Accepted equations, assumptions, and values in the current paper `source_materials\Paper.pdf`.
2. `/source_materials/Waermedurchgang_V10_physical.m` as the executable legacy reference.
3. `/source_materials` contains the Master Paper, LaTeX sources, MATLAB source, and MATLAB exports, DO NOT WRITE
4. `/wiki` decisions, interfaces, terminology, and scientific explanations.
5. `/plans` living implementation plans.
6. Code comments and issue text.
- Resolve conflicts explicitly; never silently choose one source.
- Record each resolved conflict in `/wiki/decisions/`.
## 3. Fixed architecture
- Mandatory deployment target: static GitHub Pages. A static, access-controlled
  GitLab Pages deployment on the Hochschule Self-Managed instance may run in
  parallel after its external prerequisites and deployment ADR are satisfied.
  Every hosting change must remain available and compatible on GitHub Pages;
  removing or redirecting GitHub Pages requires a separate explicit ADR.
- No production backend, database, application server session, or runtime
  secret is permitted on either Pages host.
- Frontend: React, TypeScript, and Vite.
- Scientific core: pure Python package under `python/microtubes_core/`.
- Browser execution: Pyodide inside a dedicated Web Worker.
- Numerical arrays: NumPy.
- Interactive plots: Plotly.js through typed frontend adapters.
- Unit handling: explicit SI internally; display conversions only at boundaries.
- Schema validation: Pydantic in Python and generated TypeScript types.
- Environments: `pnpm` and `uv`, each with a committed lockfile.
## 4. Repository layout
- `/src/`: React application and presentation logic.
- `/src/components/` and `/src/features/`: reusable UI and feature-specific presentation logic.
- `/src/workers/`: Pyodide worker bootstrap and message protocol.
- `/src/contracts/`: generated and handwritten TypeScript contracts.
- `/python/microtubes_core/`: domain model and numerical implementation.
- `/python/microtubes_core/models/`: equations and physical submodels.
- `/python/microtubes_core/sweeps/`: grids, masks, and design-space evaluation.
- `/python/microtubes_core/exports/`: data and report payload generation.
- `/tests/`: Python, frontend, integration, and regression tests.
- `/source_materials/`: read-only paper, LaTeX, MATLAB source, and MATLAB exports.
- `/reference/`: immutable MATLAB-derived golden datasets and metadata.
- `/wiki/`: durable project knowledge and current decisions.
- `/plans/`: dated living plans named `YYMMDD-topic.md`.
- `/public/` and `/scripts/`: static assets and deterministic maintenance scripts.
## 5. Scientific-core rules
- Keep domain functions pure, deterministic, and side-effect free.
- Separate geometry, fluid properties, correlations, resistances, screens, and aggregation.
- Preserve all model assumptions and validity limits as explicit fields.
- Return values together with status, warnings, and validity flags.
- Never encode units in variable names inside the core.
- Never mix nominal and tolerance-adjusted geometry silently.
- Use `float64` throughout unless a documented exception is approved.
- Avoid interpolation, clipping, smoothing, or extrapolation without an explicit policy.
- Mark invalid geometry before evaluating logarithms, divisions, or correlations.
- Keep correlation branch logic readable and directly testable.
- Every equation implementation must cite its source in docstrings or `/wiki/model/`.
## 6. Public computation contract
- Public objects: `SimulationRequest` input and `SimulationResult` output.
- Sweep input: parameter ranges, grid resolution, material, operating point, and screens.
- Sweep output: coordinates, fields, masks, metadata, warnings, and provenance.
- Contract version is mandatory and follows semantic versioning.
- Breaking contract changes require an ADR and coordinated migration.
- Worker messages use JSON metadata plus transferable typed arrays.
- Never pass Plotly-specific or UI-state objects across the Python boundary.
## 7. State management
- URL query parameters store shareable scientific inputs.
- Local state stores transient UI details; global state stores simulation configuration, results, and export state.
- Derived quantities must be recomputed, not duplicated in state.
- Persisted state must include a schema version.
- New URL-state encodings must continue to read all previously published
  versions or provide an explicit, documented migration.
- Defaults must be defined once in a versioned configuration file.
## 8. Plot and visual conventions
- All plots must expose units, validity limits, and active assumptions.
- Use one shared plot-spec factory per plot family.
- Keep scientific values separate from visual styling.
- Use colorblind-safe, print-safe palettes and sufficient contrast.
- Do not rely on color alone for feasibility or threshold meaning.
- Reference points, minimum-wall lines, and screen boundaries use fixed symbols.
- Legends and captions must explain every non-obvious marker and line style.
- Axes, contours, and color bars must use stable ranges where comparison matters.
- Provide PNG and SVG export for every figure.
- Exported figures must include title, axes, units, legend, and provenance footer.
## 9. Report export
- A complete report must be reproducible from one `SimulationResult`.
- Report contents: inputs, assumptions, warnings, summary tables, figures, and provenance.
- Supported outputs: standalone HTML and PDF.
- PDF generation is client-side and must not require a server.
- Embed SVG figures in PDF where technically reliable; otherwise document rasterization.
- Include application/core/contract versions, timestamp, and a machine-readable JSON sidecar.
## 10. Validation and tests
- Python checks: `pytest`, `ruff`, `mypy`, and coverage.
- Frontend checks: Vitest, Testing Library, and Playwright end-to-end tests.
- Contract tests must cover Python-to-TypeScript serialization.
- Golden tests compare Python outputs against MATLAB-derived references.
- Validate scalars, grids, masks, contour-relevant boundaries, and screen transitions.
- Default tolerance: `rtol=1e-8`, `atol=1e-10` unless justified per quantity.
- Plot snapshots are secondary; numerical assertions are primary.
- Every bug fix requires a regression test.
- Never update golden files merely to make tests pass.
- Golden-file changes require provenance notes and review of the MATLAB reference.
## 11. Performance and robustness
- Run all heavy Python work outside the main UI thread.
- Debounce interactive updates; do not recompute on every keystroke.
- Cache only by a stable hash of validated scientific inputs.
- Provide cancellation for superseded simulations.
- Show progress for long sweeps.
- Handle Pyodide startup, worker failure, and out-of-memory conditions explicitly.
- Resolve the static base path from the deployment environment; never hardcode
  a GitHub, GitLab, namespace, or project path in runtime asset URLs.
- The default sweep must remain usable on a typical current laptop.
- Performance optimizations may not change numerical results without approval.
## 12. Accessibility and scientific UX
- Target WCAG 2.2 AA.
- All controls require labels, keyboard access, focus states, and error text.
- Every figure requires a concise alt text and a detailed description.
- Tables must be usable without the plot.
- Warnings must state impact, affected quantity, and recommended action.
- Distinguish invalid, outside-validity, screened-out, and merely non-optimal states.
- Use a restrained Springer-like scientific visual language.
## 13. Documentation rules
- Document all important decisions and stable knowledge in `/wiki`.
- Use `/wiki/decisions/` for ADRs and architectural choices.
- Use `/wiki/model/` for equations, assumptions, validity, and provenance.
- Use `/wiki/interfaces/` for schemas, worker protocol, and export contracts.
- Use `/wiki/ui/` for visual and accessibility conventions.
- Prefer living plans for non-trivial work.
- Every living plan starts with `YYMMDD` and is stored in `/plans`.
- Plans contain scope, owner, interfaces, milestones, risks, tests, and status.
- Update the plan while working; do not leave it as a historical proposal.
- When implementation ends, mark the plan `completed` and link final commits.
## 14. Parallel-agent coordination
- Work within the assigned module boundary.
- Do not perform broad refactors outside the task scope.
- Shared contracts are coordination points and must remain backward compatible.
- Reserve breaking changes through an ADR before implementation.
- Prefer additive changes over cross-cutting rewrites.
- Keep commits small enough to cherry-pick independently.
- Do not modify another agent's active plan without recording why.
- Surface blocked dependencies in the relevant living plan immediately.
## 15. Coding conventions
- Python: typed public APIs, NumPy docstrings, snake_case, no hidden globals.
- TypeScript: strict mode, explicit exported types, no `any` without justification.
- React: functional components, hooks, and composition over inheritance.
- Avoid duplicated constants, magic numbers, and unit conversions.
- Errors must be actionable and preserve underlying context.
- Comments explain why, assumptions, or provenance; not obvious syntax.
- Public functions require tests and concise documentation.
## 16. Commit and completion protocol
- Before every commit, run the relevant formatters, linters, type checks, and tests.
- Before every commit, verify that `/wiki` is still correct and update it if needed.
- Before every commit, update the active living plan and milestone status.
- Commit all completed work independently; do not leave finished changes uncommitted.
- Use Conventional Commits with a clear scope.
- One commit should represent one coherent technical change.
- Do not mix generated artifacts with unrelated source changes.
- Record validation evidence in the commit body or linked plan.
- Never commit secrets, proprietary PDFs, local caches, or unlicensed dependencies.
- A task is complete only when code, tests, wiki, plan, and acceptance criteria agree.
