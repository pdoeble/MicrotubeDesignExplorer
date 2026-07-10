# Pyodide worker bridge — living plan

> **Path:** `/plans/260710-pyodide-worker-bridge.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M4
> **Workstream:** W4 (Contracts and bridge)
> **Status:** ready
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

Build and load the `microtubes_core` wheel in Pyodide inside a dedicated
module Web Worker; typed request/response with transferable arrays;
initialization, progress, cancellation, supersession; stable request hashing
and caching; structured warnings/exceptions; startup/OOM/recovery handling.

## Interfaces

- Consumes: contracts (M2), Python core (M3), wheel build (`uv build`).
- Produces: `src/workers/pyodide.worker.ts`, `src/workers/protocol.ts`,
  `src/features/simulation/` client, `wiki/interfaces/worker-protocol.md`.

## Tasks

- [ ] Wheel build step and self-hosted wheel in `public/wheels/`.
- [ ] Pyodide loading strategy (+ ADR for asset hosting).
- [ ] Message protocol (init/compute/cancel/progress/error) with versions.
- [ ] Request hash cache; supersession of stale requests.
- [ ] Direct-Python vs browser parity integration test.

## Risks

| Risk | Mitigation |
|---|---|
| Pyodide startup time | lazy init, measured budget, cached wheel |
| CDN dependency | pinned versions; ADR documents hosting decision |

## Tests / evidence

- Worker protocol unit tests; Playwright smoke (M8).

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |

## Final commits

—
