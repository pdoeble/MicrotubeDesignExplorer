# Contracts — SimulationRequest / SimulationResult (frozen M2)

**Contract version: 1.0.0** (semantic versioning; breaking changes require an
ADR and a coordinated migration, AGENTS §6).

Source of truth: `python/microtubes_core/contracts.py` (Pydantic v2).
Generated artifacts (never edit by hand; CI enforces zero drift):

| Artifact | Generator |
|---|---|
| `src/contracts/schema/*.schema.json` | `scripts/export_contracts.py` |
| `src/contracts/defaults.json` | same (from `microtubes_core.defaults`) |
| `src/contracts/parameter-manifest.json` | same (from `microtubes_core.parameter_manifest`) |
| `src/contracts/generated/*.ts` | `pnpm generate:contracts` (json-schema-to-typescript) |

## Units

Strict SI in every contract value (m, s, kg, Pa, W, K, m³/s). Display
conversions live **only** in the parameter manifest
(`display_unit`, `display_factor`). No units in core variable names.

## Request structure

`SimulationRequest`
- `contract_version` (literal "1.0.0")
- `sweep: SweepSettings` — log-spaced d_o × t grid, τ calculation window
- `cooler_left`, `cooler_right: CoolerConfiguration`
  - `geometry: BundleGeometry` — `mode` ∈ {dimensions, volume_aspect};
    canonical form is **dimensions** (width transverse × depth along air flow
    × tube length). Conversion rule (exact):
    `depth = (V/(r_w·r_l))^(1/3)`, `width = r_w·depth`, `tube_length = r_l·depth`
    with `r_w = width/depth`, `r_l = tube_length/depth`.
    Pitch ratios a = S_T/d_o, b = S_L/d_o; arrangement fixed `inline` in v1
    (the approved G7 correlation is inline-only; `staggered` is reserved).
  - `material: SolidMaterial` — λ, Rm, technology min wall, capillary
    constant C_cap, cost reference index. A "material" bundles all
    material/process screening properties.
  - `air_side: AirSide` — fluid + mode ∈ {constant_velocity,
    constant_volume_flow, constant_mass_flow} + value (ADR-0003: no air-side
    Δp modes). Face velocity convention: `v_a = V̇/(width · tube_length)`.
  - `coolant_side: CoolantSide` — fluid + all five modes + value.
    Δp/hydraulic-power modes invert the monotonic straight-tube
    Darcy–Weisbach relation for the mean tube velocity (deterministic
    bisection, M3).
  - `boundary_conditions: BoundaryConditions` — inner thermal BC (CWT/CHF),
    wall tolerance Δt, `ScreenThresholds` (burst ≥, flow ≥, Δp ≤, cost <,
    capillary ≤ at acceleration G).
  - `design_point: DesignPoint` — KPI evaluation point (d_o, t).
- `linked_groups: {geometry, materials, air_side, coolant_side,
  boundary_conditions} → bool` — **validated**: a linked group must be
  byte-equal between the coolers, otherwise `E_SCHEMA_INVALID`.

## Result payload

`SimulationResultPayload` is JSON metadata; 2D float64 grids travel as
transferable ArrayBuffers referenced by `GridFieldRef {name, unit, shape,
buffer_index}` (row-major C order, shape `[n_wall_thickness,
n_outer_diameter]`). Per cooler: `fields`, `masks`, `ScalarSummary`
(KPI values + per-screen pass/fail + feasibility), `warnings`.
`comparison` carries right-vs-left delta/ratio and tech-adjusted fields.
`Provenance` records core/contract versions, request hash (SHA-256 over the
canonical request JSON), timestamp, and the golden-manifest reference.

## Binding validity policy

| Condition | Behavior | Code |
|---|---|---|
| Unknown fields, wrong types, NaN/Inf | rejected, no computation | `E_SCHEMA_INVALID` / `E_NON_FINITE_INPUT` |
| Impossible geometry (d_i ≤ 0 at design point, a ≤ 1, …) | rejected | `E_GEOMETRY_IMPOSSIBLE` |
| Air-side Δp / hydraulic-power mode | rejected | `E_MODE_UNSUPPORTED_AIR_SIDE` |
| Operating-point inversion has no solution in bracket | rejected | `E_OPERATING_POINT_UNSOLVABLE` |
| Correlation validity range exceeded but numerically safe | computed + marked | `W_OUTSIDE_VALIDITY` |
| Design screened out | visible + distinguishable, never deleted | `W_SCREENED_OUT` |
| Grid cells with invalid geometry / outside τ window | masked NaN, no clipping/interpolation | masks |
| Discrete tube-count steps cause jumps | value shown + explanation | `W_DISCRETE_TRANSITION` |

User-entered values remain visible after validation errors (UI rule, M5).

## Error and warning catalog

`ErrorCode`: `E_SCHEMA_INVALID`, `E_NON_FINITE_INPUT`,
`E_GEOMETRY_IMPOSSIBLE`, `E_VALUE_OUT_OF_RANGE`,
`E_MODE_UNSUPPORTED_AIR_SIDE`, `E_OPERATING_POINT_UNSOLVABLE`,
`E_CONTRACT_VERSION_MISMATCH`, `E_INTERNAL`.

`WarningCode`: `W_OUTSIDE_VALIDITY`, `W_SCREENED_OUT`,
`W_DISCRETE_TRANSITION`, `W_PHYSICALLY_UNUSUAL`, `W_NO_FEASIBLE_REFERENCE`.

Warnings must state impact, affected quantity, and recommendation
(fields on `WarningItem`; AGENTS §12).

## Defaults

One versioned source: `microtubes_core.defaults` (DEFAULTS_VERSION 1.0.0) —
the approved paper case (equal geometry, Aluminum vs PA, groups linked
except materials). Every value carries a line reference to the MATLAB
script and is cross-checked against `reference/default_case/scalars.json`
by `tests/python/test_contracts.py::test_defaults_match_matlab_snapshot`.

## Parameter manifest

`microtubes_core.parameter_manifest` freezes per-field UI metadata: SI
ranges, log/linear scale, display unit + factor, step, integer flag, link
group, per-mode operating-value entries (UI seeds for non-default modes).
Consistency (min < default < max, log ⇒ min > 0) is test-enforced in both
stacks.

## Compatibility tests

- Python: `tests/python/test_contracts.py` (round-trip, link semantics,
  geometry-mode equivalence, MATLAB snapshot match, artifact sync).
- TypeScript: `tests/frontend/contracts.test.ts` (Ajv 2020-12 validation of
  defaults, rejection of unknown fields/non-positive properties, manifest
  consistency).
