# Wiki — Microtube Design Explorer

Durable project knowledge. `AGENTS.md` is binding; the master living plan is
[`/plans/260710-master-roadmap.md`](../plans/260710-master-roadmap.md).

## Sections

| Section | Content |
|---|---|
| [decisions/](decisions/index.md) | Architecture Decision Records (ADRs) and resolved source conflicts |
| [model/](model/index.md) | Equations, assumptions, validity limits, provenance of the scientific model |
| [interfaces/](interfaces/index.md) | Contracts (`SimulationRequest`/`SimulationResult`), worker protocol, export payloads |
| [ui/](ui/index.md) | Visual conventions, accessibility rules, tab/control patterns |

## Key documents

- [Impementierungsreport.md](Impementierungsreport.md) — original implementation
  briefing (historical input; where it conflicts with `AGENTS.md` or the master
  roadmap, those take precedence — see ADR-0001).
- [model/matlab-inventory.md](model/matlab-inventory.md) — complete inventory of
  the authoritative MATLAB reference (M1).
- [model/symbol-glossary.md](model/symbol-glossary.md) — MATLAB → Python symbol map (M1).
- [model/plot-catalog.md](model/plot-catalog.md) — approved plot families and IDs (M1).
- [interfaces/contracts.md](interfaces/contracts.md) — frozen data contracts (M2).
- [interfaces/worker-protocol.md](interfaces/worker-protocol.md) — Pyodide worker
  messages, transferables, caching, and cancellation boundary (M4).

## Conventions for contributors

- Before every commit: verify the wiki pages touched by your change are still
  correct, update the active plan, and follow the commit gate in the master
  roadmap §13.
- New decisions go to `decisions/` using `_adr-template.md`; never silently
  resolve a source conflict.
