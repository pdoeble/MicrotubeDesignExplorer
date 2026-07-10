# Branch, commit, merge, and ownership conventions

Binding for all contributors and agents (complements AGENTS.md §14–§16).

## Branches

- `main` is always releasable; CI must be green.
- Work happens on short-lived branches `feat/<topic>`, `fix/<topic>`,
  `docs/<topic>`; merge via PR or fast-forward after green CI.
- Single-agent sequential work may commit directly to `main` only while the
  project has no external contributors, and only with the commit gate
  (roadmap §13) satisfied.

## Commits

- Conventional Commits with scope, e.g. `feat(core): port VDI G1 laminar Nu`.
- Scopes: `governance`, `core`, `contracts`, `worker`, `ui`, `plots`,
  `reports`, `golden`, `ci`, `wiki`.
- One coherent technical change per commit; generated artifacts are committed
  separately from unrelated source changes.
- Validation evidence in the body (test commands and results) or a link to
  the living plan section that records it.

## Merge rules

- No merge while code, tests, wiki, plans, and acceptance criteria disagree.
- Breaking contract changes require an ADR *before* implementation.

## Ownership

Workstream ownership boundaries are defined in the master roadmap §6.
Cross-boundary changes require coordination through a shared-interface ADR.
