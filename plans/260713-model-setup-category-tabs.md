# Model setup category tabs — living plan

> **Path:** `/plans/260713-model-setup-category-tabs.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8/M9 UX refinement
> **Workstream:** W6/W7
> **Status:** completed
> **Created:** 2026-07-13
> **Last updated:** 2026-07-13

## Scope

Replace the two-step Model Setup form with five category tabs: Geometry, Solid
material, Air circuit, Coolant circuit, and Screens & boundaries. Each category
exposes a Reference/Comparison view switch and a Same values/Separate values
switch. Preserve the existing scientific request contract, URL persistence,
linked-group snapshot restoration, and global sweep semantics.

This change reorganizes presentation only. It does not change equations,
defaults, units, validation, or the Python/worker contract.

## Interfaces

- `ModelSetupTab` owns local category and visible-design state.
- `SimulationStore.setLinkedGroup` remains the sole link/unlink mutation and
  continues restoring the last independent comparison snapshot.
- Input and material controls remain manifest-driven and write to the existing
  `SimulationRequest` paths.
- The nested navigation follows the WAI-ARIA tabs pattern; the two switches use
  labelled, pressed-state buttons.

## Tasks

- [x] Audit the existing two-step setup, grouped inputs, link behavior, tests,
  and accessibility guidance.
- [x] Add the five category tabs and per-category design/link switches.
- [x] Recompose geometry, material, circuit, boundary, and sweep controls into
  the corresponding panels without duplicating scientific state.
- [x] Add responsive styling and update frontend/E2E assertions.
- [x] Update UI/accessibility knowledge and supersede the affected ADR-0008
  navigation details explicitly.
- [x] Run scoped formatting, lint, Vitest, production bundling, and Chromium
  E2E; audit global gates and record unrelated concurrent failures.
- [x] Mark this plan completed and commit the coherent UI change.

## Risks

| Risk | Mitigation |
|---|---|
| Nested tabs have ambiguous names or keyboard behavior | Use unique IDs, a labelled local tablist, roving tabindex, and role-based tests |
| Linking a group destroys independent comparison values | Reuse `setLinkedGroup` and test unlink restoration through the new switch |
| Air/coolant properties become separated from operating targets | Render both control sets in the respective circuit tab |
| The global sweep is mistaken for a per-design input | Keep one sweep editor in Screens & boundaries and label it as shared |
| Five tabs overflow narrow viewports | Allow wrapping and verify mobile/200% zoom without horizontal document overflow |

## Tests / evidence

- Frontend: five local tabs, category content isolation, Reference/Comparison
  switching, same/separate state, and linked-value restoration.
- E2E Chromium: legacy route, keyboard navigation, responsive reflow, labelled
  controls, and continuation to Results.
- Standard frontend formatting, lint, type, unit, and production-build gates.

Validation completed on 2026-07-13:

- targeted Prettier check: passed;
- ESLint: 0 errors (2 existing generated-file warnings);
- Model Setup Vitest: 4/4 passed, including keyboard navigation and independent
  comparison-value restoration;
- Chromium E2E: 8/8 passed, including all three Model Setup/mobile/zoom checks;
- Vite production bundle: passed independently.

The repository-wide `tsc`/Vitest/build wrapper was also run, but concurrent,
uncommitted plot-fidelity work outside this plan left one plot-registry type
error and two plot-spec expectation failures. No plot file is part of this
change. The Model Setup tests and full Chromium acceptance suite remained green.

## Status log

| Date | Change |
|---|---|
| 2026-07-13 | Existing setup and link snapshot behavior audited; implementation started. |
| 2026-07-13 | Five category tabs, contextual switches, responsive styles, tests, UI guidance and ADR-0009 completed. |
| 2026-07-13 | Scoped checks and all Chromium E2E tests passed; unrelated concurrent plot-test failures recorded. |

## Final commits

`feat(ui): organize model setup into category tabs`
