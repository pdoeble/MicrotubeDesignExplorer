# ADR-0008: Consolidated model-setup navigation

- Status: accepted
- Date: 2026-07-12
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260712-model-setup-ux.md`

## Context

The original UI baseline fixed separate top-level Input and Materials tabs.
Both tabs configure the same `SimulationRequest`, repeat air/coolant linking,
and show complete right-hand forms even when those groups are linked to the
left design. The result is duplicate controls, unclear ownership and a long
workflow without a visible completion path. The maintainer explicitly asked
to remove this duplication and provide a continuous user experience.

## Decision

- Replace the Input and Materials top-level tabs with one stable `Model Setup`
  tab. Retain the `input` route ID so existing `#/input` links continue to
  work; normalize legacy `#/materials` links to `#/input`.
- Within Model Setup, use two local workflow steps: `Design & operation` and
  `Materials & fluids`. Local step selection is transient UI state; the
  scientific request remains in the versioned query state.
- Own all five linked-group toggles in one persistent comparison-settings
  block. Air and coolant labels explicitly state that linking covers both
  properties and operating targets.
- When a right-hand group is linked, replace its duplicate form with a status
  notice and an `Edit separately` action. Unlinking uses the existing snapshot
  restoration semantics.
- Treat design labels as independent presentation identifiers, not part of the
  solid-material link group.

## Consequences

- Top-level navigation has four workflow tabs: Start, Model Setup, Results and
  Settings.
- Every scientific field remains editable; linked fields become visible again
  when the comparison group is unlinked.
- UI and E2E tests must assert one linking control per group, legacy-route
  normalization, hidden linked duplicates, restored independent editors and a
  forward path from setup to results.
