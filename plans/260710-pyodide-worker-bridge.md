# Pyodide worker bridge — living plan

> **Path:** `/plans/260710-pyodide-worker-bridge.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M4
> **Workstream:** W4 (Contracts and bridge)
> **Status:** completed
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

- [x] Wheel build step and self-hosted wheel in `public/wheels/`.
- [x] Pyodide loading strategy (+ ADR for asset hosting).
- [x] Message protocol (init/compute/cancel/progress/error) with versions.
- [x] Request hash cache; supersession of stale requests.
- [x] Direct-Python vs browser parity integration test.

## Risks

| Risk | Mitigation |
|---|---|
| Pyodide startup time | lazy init, measured budget, cached wheel |
| CDN dependency | pinned versions; ADR documents hosting decision |

## Tests / evidence

- 2026-07-10: M4 foundation added:
  `scripts/prepare_pyodide_assets.mjs` builds `public/wheels/` and copies
  same-origin Pyodide assets; `src/workers/protocol.ts`,
  `src/workers/pyodide.worker.ts`, and
  `src/features/simulation/client.ts` define typed worker transport.
- 2026-07-10: unit coverage added for protocol envelopes, stable client cache
  keys, worker initialization handling, progress forwarding, result array
  conversion, and cache reuse (`tests/frontend/worker-protocol.test.ts`,
  `tests/frontend/simulation-client.test.ts`).
- 2026-07-10: M4 foundation gates:
  `pnpm prepare:pyodide`, `pnpm typecheck`, `pnpm test` (12 passed),
  `pnpm lint` (0 errors; existing generated-file warnings only),
  `pnpm format:check`, `pnpm build`, `python scripts/check_prohibited_files.py`.
- 2026-07-10: browser parity and recovery gates:
  `pnpm test:e2e` (1 Playwright test passed; reduced paper-default request
  through browser Pyodide worker matched direct Python request hash, result
  metadata, and scalar summaries), `pnpm test` (14 passed),
  `pnpm typecheck`, `pnpm lint` (0 errors; existing generated-file warnings
  only), `pnpm format:check`, `pnpm build`,
  `python scripts/check_prohibited_files.py`.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | M4 started: pinned Pyodide NPM runtime, same-origin asset preparation, core wheel build, typed worker protocol, Pyodide worker, and simulation client cache/supersession implemented. ADR-0006 records asset hosting. |
| 2026-07-10 | M4 completed: Pyodide package-wheel preparation, Playwright browser parity against direct Python, structured worker errors, startup retry, and supersession/cancellation tests added and verified. |

## Final commits

- `feat(worker): add Pyodide simulation bridge`
- `test(worker): add browser parity coverage`
