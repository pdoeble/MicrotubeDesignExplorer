# Contracts, units, and validity — living plan

> **Path:** `/plans/260710-contracts-units-and-validity.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M2
> **Workstream:** W4 (Contracts and bridge)
> **Status:** ready
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

- [ ] Pydantic request/result models with `contract_version`.
- [ ] Binding validity policy (reject / outside-validity / screened-out).
- [ ] Defaults = paper case, defined once, versioned.
- [ ] Parameter metadata (range, scale, step, unit, reset).
- [ ] JSON Schema export + TS type generation script.
- [ ] Contract round-trip tests (Python + Vitest/ajv).

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

## Final commits

—
