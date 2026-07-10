# UI conventions

Visual and accessibility conventions (AGENTS §8, §12). Target: WCAG 2.2 AA,
restrained Springer-like scientific visual language.

| Document | Content | Milestone |
|---|---|---|
| [visual-conventions.md](visual-conventions.md) | Typography, color tokens, spacing, table style | M5 |
| [accessibility.md](accessibility.md) | Tabs pattern, keyboard rules, focus, figure alt text | M5/M8 |

## Already fixed in M0

- Five fixed tabs: Start, Input, Materials, Result Plots, Settings.
- Tab navigation implements the WAI-ARIA Tabs pattern with roving tabindex,
  arrow keys, Home/End, and automatic activation (`src/components/Tabs.tsx`);
  panels are preloaded so activation is instantaneous.
- Focus indicators use a 3px high-contrast outline (`--color-focus`).
- Color is never the only carrier of feasibility/threshold meaning.
