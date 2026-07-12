# Model setup UX consolidation — living plan

> **Path:** `/plans/260712-model-setup-ux.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8/M9 UX refinement
> **Workstream:** W6/W7
> **Status:** completed
> **Created:** 2026-07-12
> **Last updated:** 2026-07-12

## Scope

Remove duplicated configuration affordances between the Input and Materials
top-level tabs and suppress redundant right-cooler editors while a group is
linked. Preserve every scientific input, URL request state, independent-right
snapshots, keyboard navigation and the legacy `#/materials` route.

## Interfaces

- React tab shell and local setup-step state.
- Zustand `SimulationRequest` mutations and linked-group snapshots.
- Parameter-manifest-driven controls; no contract or physics changes.
- URL hash aliases and versioned scientific query state.

## Tasks

- [x] Confirm duplication: two top-level configuration tabs, repeated
  air/coolant link toggles, and fully duplicated linked right-hand editors.
- [x] Replace Input + Materials top-level tabs with one `Model Setup` workflow.
- [x] Add clear Design & operation / Materials & fluids substeps and forward/
  backward workflow actions.
- [x] Own all five reference/comparison link toggles in one comparison-settings block.
- [x] Hide linked right-hand group editors and offer contextual “Edit
  separately” actions without losing the stored independent values.
- [x] Separate cooler labels from material-link semantics.
- [x] Preserve `#/materials` as a redirect/alias to `#/input`.
- [x] Update Start guidance, responsive styles, frontend/E2E tests and UI wiki.
- [x] Run format, lint, typecheck, Vitest, build and Chromium E2E.
- [x] Mark completed and commit with validation evidence.

## Risks

| Risk | Mitigation |
|---|---|
| Hidden controls make linked behavior unclear | Persistent central link block plus contextual right-panel notices |
| Unlink loses the right-hand values | Reuse the existing snapshot restoration path and regression-test it |
| Old shared URLs open a removed tab | Normalize legacy `#/materials` to stable `#/input` |
| Long forms become harder to scan | Two explicit local workflow steps and one consistent footer action row |

## Tests / evidence

- Frontend assertions for four top-level tabs, setup-step navigation, one link
  control per group, hidden linked editors and label independence.
- Chromium acceptance for legacy route, keyboard tabs, responsive reflow and
  setup continuation into Results.
- Standard frontend lint/type/test/build gates.

## Status log

| Date | Change |
|---|---|
| 2026-07-12 | Duplication audited; consolidated workflow selected. |
| 2026-07-12 | Model Setup, linked-group notices, route alias, responsive styles and ADR-0008 implemented; visual review and all gates green. |

## Final commits

`feat(ui): consolidate model setup workflow`

Validation: 47 Vitest assertions, TypeScript, Prettier, ESLint (0 errors),
production build and 8 Chromium E2E tests passed.
