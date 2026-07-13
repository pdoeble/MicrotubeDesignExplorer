# Paper-repository application wiki page

> **Path:** `/plans/260713-paper-repository-app-wiki.md`
> **Status:** completed
> **Created:** 2026-07-13
> **Owner:** Codex
> **Workstream:** Documentation / paper companion handover

## Scope

Create one detailed, self-contained German wiki page that can serve as the
authoritative application overview in the paper repository. It must explain
the scientific role of the app, source hierarchy, model scope, architecture,
contracts, browser execution, user workflow, plots, exports, reproducibility,
validation, deployment, maintenance, limitations, licensing and citation.

The page supplements rather than replaces the specialized pages under
`wiki/model/`, `wiki/interfaces/`, `wiki/ui/` and `wiki/decisions/`.

## Interfaces and source material

- Application metadata: `README.md`, `package.json`, `python/pyproject.toml`,
  `CITATION.cff`, `CHANGELOG.md`, `LICENSE`.
- Scientific documentation: `wiki/model/`, current paper LaTeX and the
  read-only MATLAB reference under `source_materials/`.
- Runtime/contracts: `python/microtubes_core/`, `src/contracts/`,
  `src/workers/`, `wiki/interfaces/`.
- UI/plots/exports: `src/features/`, `wiki/ui/`, ADR-0007 and ADR-0011.
- Operations: `.github/workflows/`, `wiki/release-and-maintenance.md`.

## Milestones

- [x] Inventory current implementation and durable wiki sources.
- [x] Draft the complete application overview with a paper-repository reader
  as the primary audience.
- [x] Cross-check every command, version, plot count and limitation against
  the repository.
- [x] Link the page from `wiki/index.md` and document its maintenance role.
- [x] Validate Markdown links/format, mark this plan completed and commit.

## Risks and controls

- **Duplication drift:** summarize stable concepts and link to specialized
  binding pages for detailed contracts/equations.
- **Paper/MATLAB conflict:** state the repository source hierarchy and link the
  relevant ADR instead of silently selecting a source.
- **Overclaiming release status:** distinguish implemented/validated behavior
  from the still-open independent scientific and accessibility approvals.
- **Deployment assumptions:** describe the static GitHub Pages path and
  same-origin Pyodide assets exactly as implemented.

## Validation

- Inspect all relative Markdown targets referenced by the new page.
- Run `git diff --check` and a deterministic link-target check.
- Re-read the final page against README, contracts, runtime, plot catalog,
  release handover and current ADRs.

Validation completed on 2026-07-13:

- all 25 relative Markdown targets resolve to repository files or directories;
- all 37 public plot IDs occur exactly once in the seven documented topic
  groups and match `plotRegistry.ts` without additions or omissions;
- all documented `pnpm` commands exist in `package.json`;
- application, Core, contract, defaults, worker, URL-state, report and Pyodide
  versions were checked against their defining source files;
- `git diff --check` reports no whitespace errors.

## Status history

| Date | Change |
| --- | --- |
| 2026-07-13 | Plan created; repository/application inventory started. |
| 2026-07-13 | Detailed German paper-companion overview completed, linked and validated. |

## Deliverables

- [`wiki/paper-companion-application.md`](../wiki/paper-companion-application.md)
- [`wiki/index.md`](../wiki/index.md)

## Commits

- Documentation implementation: commit containing this completed plan; the
  exact hash is recorded after creation.
