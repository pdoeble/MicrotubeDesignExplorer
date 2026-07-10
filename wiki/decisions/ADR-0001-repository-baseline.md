# ADR-0001 — Repository baseline, toolchain, and provisional license

- **Status:** accepted
- **Date:** 2026-07-10
- **Workstream:** W1 (Governance)
- **Related plan:** /plans/260710-master-roadmap.md (M0)

## Context

`AGENTS.md` fixes the architecture (React/TS/Vite frontend at the repository
root, pure Python core under `/python/microtubes_core/`, Pyodide worker,
pnpm + uv with lockfiles). The earlier briefing
`wiki/Impementierungsreport.md` describes a different monorepo layout
(`app/frontend`, `python_core/paper_companion`, JSON-Schema-first contracts).
Both cannot hold simultaneously; a license choice and concrete tool versions
were still open.

## Decision

1. **Layout and precedence.** The repository follows `AGENTS.md` §4 exactly.
   Where `wiki/Impementierungsreport.md` conflicts with `AGENTS.md` or the
   master roadmap, `AGENTS.md` and the roadmap take precedence. The report
   remains as historical background.
2. **Toolchain versions (baseline).** Node 22.15 + pnpm 11.11 (lockfile
   committed), Python 3.12 + uv 0.11 (lockfile committed), TypeScript ~5.7
   strict, Vite 6, Vitest 2, ESLint 9 + typescript-eslint, Prettier 3;
   Python: NumPy ≥ 1.26, Pydantic ≥ 2.7, pytest 8, ruff, mypy (strict).
3. **Contracts direction.** Pydantic models in the Python core are the single
   source of truth; JSON Schema and TypeScript types are generated from them
   (details frozen in M2, `wiki/interfaces/contracts.md`).
4. **License (provisional).** MIT for the application source code. The paper
   sources and MATLAB reference under `/source_materials` and derived golden data
   under `/reference` are explicitly excluded. **This default requires
   confirmation by the paper authors before M10**; tracked in the master
   roadmap risks.
5. **State management.** Zustand for global simulation/result state; React
   local state for transient UI details (AGENTS §7).

## Consequences

- Parallel agents use the `AGENTS.md` layout without further negotiation.
- A later license change before any public release is cheap; after release it
  requires a version bump and release-note entry.
- The Implementierungsreport's `app/`-based structure is intentionally not
  created.

## Evidence

- `pnpm install` and `uv sync` produce committed lockfiles on Windows
  (Node v22.15.0, pnpm 11.11.0, Python 3.12.3, uv 0.11.28).
- Baseline CI (`.github/workflows/ci.yml`) runs lint, type checks, and tests
  for both stacks.
