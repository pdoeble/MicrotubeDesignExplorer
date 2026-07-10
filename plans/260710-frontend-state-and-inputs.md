# Frontend state and inputs — living plan

> **Path:** `/plans/260710-frontend-state-and-inputs.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M5
> **Workstream:** W5/W6 (Frontend state, Input UX)
> **Status:** completed
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

Two-cooler configuration workflow: five tabs (shell exists since M0),
two-column inputs with responsive fallback, group-level linking with
independent restoration, both geometry representations, per-side operating
modes, slider+numeric+unit+reset controls, editable static material/fluid
properties, paper defaults, versioned URL state, complete reset.

## Interfaces

- Consumes: contracts + parameter metadata (M2), defaults (M2).
- Produces: `src/features/input/**`, `src/features/materials/**`,
  `src/state/**`, `wiki/interfaces/url-state.md`, `wiki/ui/**`.

## Tasks

- [x] Global store (zustand) mirroring `SimulationRequest` pair + link groups.
- [x] Parameter control component (slider, numeric, unit, reset, error text).
- [x] Geometry mode toggle with canonical conversion.
- [x] Group link/unlink with restoration of previous independent values.
- [x] URL state (versioned) round-trip.
- [x] Keyboard-only operation checks.

## Risks

| Risk | Mitigation |
|---|---|
| Two-cooler state inconsistency | canonical state model + contract tests |
| Link semantics ambiguity | frozen in M2 contract doc before build |

## Tests / evidence

- 2026-07-10: M5 input workflow added:
  `src/state/simulationStore.ts`, `src/state/urlState.ts`,
  manifest-driven `ParameterControl`, two-cooler Input and Materials tabs,
  reset/settings summary, URL-state documentation.
- 2026-07-10: M5 gates:
  `pnpm typecheck`, `pnpm test` (18 passed), `pnpm lint` (0 errors; existing
  generated-file warnings only), `pnpm format:check`, `pnpm build`,
  `pnpm test:e2e` (1 passed), `python scripts/check_prohibited_files.py`.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | M5 completed: global SimulationRequest store, link/unlink restoration, geometry-mode conversion, URL state, manifest-driven controls, editable materials/fluids, settings reset, and tests added. |

## Final commits

- `feat(ui): add input state workflow`
