# ADR-0009: Model-setup category tabs and comparison switches

- Status: accepted
- Date: 2026-07-13
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260713-model-setup-category-tabs.md`
- Supersedes: ADR-0008 internal two-step navigation and central link controls

## Context

ADR-0008 consolidated the scientific inputs into one top-level Model Setup tab,
but arranged the long form as two broad steps and placed all five link controls
in a separate persistent block. The maintainer subsequently requested five
domain-oriented tabs—Geometry, Solid material, Air circuit, Coolant circuit,
and Screens & boundaries—with Reference/Comparison and same/separate switching
inside every tab.

This conflicts with ADR-0008 only at the internal-navigation and link-control
presentation level. It does not conflict with the public request contract,
scientific grouping, URL state, or link snapshot behavior.

## Decision

- Keep one top-level Model Setup route and replace its two local steps with five
  WAI-ARIA category tabs.
- Put a Reference/Comparison view switch and a Same values/Separate values
  switch at the top of every category panel.
- Continue to use the five existing `linked_groups` fields. `Same values` copies
  the reference category to the comparison design; `Separate values` restores
  the last independent comparison snapshot through `setLinkedGroup`.
- Show only the selected design editor. If Comparison is selected while the
  category is linked, show a linked-state notice instead of duplicate controls.
- Keep operating targets and fluid properties together in each Air/Coolant
  category.
- Keep the sweep coordinates and resolution global. Display their single editor
  in Screens & boundaries and label it as shared by both designs.
- Keep category selection and visible-design selection transient; scientific
  inputs remain in the versioned URL query state.

## Consequences

- All five scientific groups are directly reachable without scanning unrelated
  fields or moving between broad workflow steps.
- Link ownership is contextual to the category being edited.
- The visible design switch reduces horizontal duplication while retaining an
  explicit role and design name above each editor.
- Nested tabs and switches require role-, keyboard-, zoom-, and mobile-overflow
  coverage in frontend and E2E tests.
- No schema, physics, default, worker, or numerical behavior changes.
