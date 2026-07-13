# Microtube Design Explorer

Interactive, fully static companion web application for the paper
**"Local Resistance-Based Design-Space Analysis of Polyamide Microtubes for
Compact Heat Exchangers"** (Döbler, Henzler, Auerbach et al., Esslingen
University of Applied Sciences).

The application ports the complete approved MATLAB screening model
(`source_materials/Waermedurchgang_V10_physical.m`) to Python, runs it in the
browser through Pyodide inside a Web Worker, and renders the design-space
maps with Plotly.js. It compares two heat-exchanger configurations
(default: equal geometry, aluminum vs. polyamide as in the paper) and
exports figures and reproducible reports without any backend.

## Governance

- `AGENTS.md` — binding rules for all contributors and agents.
- `plans/260710-master-roadmap.md` — master living roadmap (milestones M0–M10).
- `wiki/` — durable knowledge: decisions (ADRs), model documentation,
  interfaces, UI conventions.
- `source_materials/` — **read-only** paper sources and the authoritative MATLAB
  reference. Never write there.
- `reference/` — immutable MATLAB-derived golden datasets with provenance.

## Repository layout

| Path | Content |
|---|---|
| `src/` | React + TypeScript application (Vite) |
| `src/workers/` | Pyodide worker bootstrap and message protocol |
| `src/contracts/` | TypeScript contracts (generated + handwritten) |
| `python/microtubes_core/` | Pure typed Python scientific core |
| `tests/` | Python, frontend, and integration tests |
| `source_materials/` | Read-only paper, LaTeX, MATLAB source, and MATLAB exports |
| `reference/` | Golden datasets generated from the MATLAB model |
| `scripts/` | Deterministic maintenance scripts (golden generation, checks) |
| `wiki/`, `plans/` | Documentation and living plans |

## Toolchain

- Node ≥ 22, [pnpm](https://pnpm.io) (lockfile committed)
- Python ≥ 3.12, [uv](https://docs.astral.sh/uv/) (lockfile committed)
- MATLAB R2024b is only required to regenerate golden references.

## Commands

```bash
# Frontend
pnpm install
pnpm dev          # local dev server
pnpm build        # static production build (dist/)
pnpm test         # Vitest unit tests
pnpm typecheck    # strict TypeScript
pnpm lint         # ESLint
pnpm test:e2e:pages-path  # production smoke at a nested static Pages path

# Python core (run inside python/)
uv sync           # create venv from lockfile
uv run pytest     # scientific tests incl. golden parity
uv run ruff check .
uv run mypy .
```

`pnpm build` also verifies the static Pages artifact, including its resolved
base path, Pyodide/core-wheel hashes, size/file budgets, and prohibited source
formats or source-path tokens.

## Deployment

GitHub Pages remains the mandatory public production host. The static build is
also prepared for a future access-controlled GitLab Pages deployment on the
Hochschule Self-Managed instance, but no `.gitlab-ci.yml` or GitLab deployment
is active yet. See
`plans/260713-gitlab-pages-migration.md` and ADR-0012 for the staged migration
and GitHub-continuity requirements.

## Scientific fidelity

Numerical fidelity, traceability, and reproducibility outrank UI
convenience. Golden parity against the MATLAB reference is enforced at
`rtol=1e-8`, `atol=1e-10` (documented exceptions only). See
`wiki/model/` for equations, sources, and validity limits.

## License and citation

See `LICENSE` and `CITATION.cff`.
