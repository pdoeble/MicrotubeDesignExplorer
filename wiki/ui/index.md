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
- Model Setup contains two local steps: Design & operation, followed by
  Materials & fluids. One persistent comparison block owns all group-linking
  controls; linked right-hand forms are replaced by explicit status notices.
- Legacy `#/materials` URLs normalize to `#/input` so saved links remain usable.
- Tab navigation implements the WAI-ARIA Tabs pattern with roving tabindex,
  arrow keys, Home/End, and automatic activation (`src/components/Tabs.tsx`);
  panels are preloaded so activation is instantaneous.
- Focus indicators use a 3px high-contrast outline (`--color-focus`).
- Color is never the only carrier of feasibility/threshold meaning.
