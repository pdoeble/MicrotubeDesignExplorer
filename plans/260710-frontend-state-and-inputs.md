# Frontend state and inputs — living plan

> **Path:** `/plans/260710-frontend-state-and-inputs.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M5
> **Workstream:** W5/W6 (Frontend state, Input UX)
> **Status:** ready
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

- [ ] Global store (zustand) mirroring `SimulationRequest` pair + link groups.
- [ ] Parameter control component (slider, numeric, unit, reset, error text).
- [ ] Geometry mode toggle with canonical conversion.
- [ ] Group link/unlink with restoration of previous independent values.
- [ ] URL state (versioned) round-trip.
- [ ] Keyboard-only operation checks.

## Risks

| Risk | Mitigation |
|---|---|
| Two-cooler state inconsistency | canonical state model + contract tests |
| Link semantics ambiguity | frozen in M2 contract doc before build |

## Tests / evidence

- Vitest component/state tests; URL round-trip tests.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |

## Final commits

—
