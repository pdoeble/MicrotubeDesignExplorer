# UI conventions

Visual and accessibility conventions (AGENTS §8, §12). Target: WCAG 2.2 AA,
restrained Springer-like scientific visual language.

| Document | Content | Milestone |
|---|---|---|
| [visual-conventions.md](visual-conventions.md) | Typography, color tokens, spacing, table style | M5 |
| [accessibility.md](accessibility.md) | Tabs pattern, keyboard rules, focus, figure alt text | M5/M8 |
| [result-plots.md](result-plots.md) | Plot registry, result-source rules, current M6 rendering scope | M6 |

## Current application navigation

- Four workflow tabs: Start, Model Setup, Results, Settings (ADR-0008).
- Model Setup contains five local tabs: Geometry, Solid material, Air circuit,
  Coolant circuit, and Screens & boundaries (ADR-0009). Every category has a
  Reference/Comparison view switch and a Same values/Separate values switch;
  linked comparison forms are replaced by explicit status notices.
- Air and coolant tabs each contain their operating target and fluid-property
  set. The single global sweep editor appears in Screens & boundaries and is
  labelled as shared by both designs.
- Legacy `#/materials` URLs normalize to `#/input` so saved links remain usable.
- Main and Model Setup tab navigation implement the WAI-ARIA Tabs pattern with
  roving tabindex, arrow keys, Home/End, and automatic activation
  (`src/components/Tabs.tsx`); panels are preloaded so activation is
  instantaneous.
- Focus indicators use a 3px high-contrast outline (`--color-focus`).
- Color is never the only carrier of feasibility/threshold meaning.
