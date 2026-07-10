# Contracts, units, and validity — living plan

> **Path:** `/plans/260710-contracts-units-and-validity.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M2
> **Workstream:** W4 (Contracts and bridge)
> **Status:** completed
> **Created:** 2026-07-10
> **Last updated:** 2026-07-10

## Scope

Freeze `SimulationRequest`/`SimulationResult` (Pydantic source of truth),
two-cooler comparison structures, geometry representations and conversions,
group link semantics, per-side operating-mode enums (ADR-0003), SI units and
display conversions, one versioned defaults source, slider/range/precision
metadata, URL serialization, worker protocol, and TypeScript generation.

## Interfaces

- Produces: `python/microtubes_core/contracts.py`,
  `python/microtubes_core/defaults.py`, generated JSON Schemas,
  `src/contracts/**`, `wiki/interfaces/contracts.md`.
- Consumes: M1 inventory (authoritative names/units/defaults).

## Tasks

- [x] Pydantic request/result models with `contract_version`
      (`python/microtubes_core/contracts.py`, v1.0.0, strict extra="forbid").
- [x] Binding validity policy incl. error/warning catalog
      (`wiki/interfaces/contracts.md`).
- [x] Defaults = paper case, defined once, versioned
      (`microtubes_core/defaults.py`, cross-checked against
      `reference/default_case/scalars.json`).
- [x] Parameter metadata: 47 specs with SI range/scale/step/display unit
      (`microtubes_core/parameter_manifest.py`).
- [x] JSON Schema export + TS type generation
      (`scripts/export_contracts.py`, `scripts/generate-contract-types.mjs`,
      CI drift gates in both jobs).
- [x] Contract round-trip tests (11 pytest + 5 Vitest/ajv tests).

Deferred to later milestones (tracked there): URL serialization (M5,
`wiki/interfaces/url-state.md`), worker protocol details (M4,
`wiki/interfaces/worker-protocol.md`) — both build on this contract without
changing it.

## Risks

| Risk | Mitigation |
|---|---|
| Contract drift between stacks | generation from Pydantic + CI contract tests |
| Premature freeze before inventory done | M1 exit gate is a hard dependency |

## Tests / evidence

- `tests/python/test_contracts.py`, `tests/frontend/contracts.test.ts`.

## Status log

| Date | Change |
|---|---|
| 2026-07-10 | Plan created (M0). |
| 2026-07-10 | Contracts frozen (v1.0.0): models, defaults, manifest, generated schemas/TS, tests, wiki doc. Plan completed. |

## Final commits

- `feat(contracts): M2 frozen contracts, defaults, and validity policy` (this commit)
