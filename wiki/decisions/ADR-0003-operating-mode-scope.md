# ADR-0003 — Operating-mode scope: no air-side pressure-drop modes without a model basis

- **Status:** accepted
- **Date:** 2026-07-10
- **Workstream:** W3/W4 (Python core, contracts)
- **Related plan:** /plans/260710-contracts-units-and-validity.md

## Context

The roadmap requires operating modes *constant velocity, volume flow, mass
flow, pressure drop, hydraulic power* selectable per side. The MATLAB
reference contains a coolant-side (tube-side) friction pressure-drop model
(`calcTubeFrictionPressureDropBar`, straight-tube Darcy–Weisbach) but **no
air-side pressure-drop correlation** of any kind. AGENTS §1 forbids
introducing undocumented empirical models.

## Decision

- **Coolant side** supports all five modes. Pressure-drop and
  hydraulic-power modes invert the monotonic straight-tube Darcy–Weisbach
  relation Δp(v) (resp. P(v) = Δp(v)·V̇(v)) for the mean tube velocity using
  deterministic bracketed bisection; the solution is then fed into the same
  fixed-velocity model as `constant_velocity`.
- **Air side** supports `constant_velocity`, `constant_volume_flow`, and
  `constant_mass_flow` (flow modes convert to face velocity through the
  bundle frontal area and air density). `constant_pressure_drop` and
  `constant_hydraulic_power` on the air side are **rejected** with error code
  `E_MODE_UNSUPPORTED_AIR_SIDE`, because the approved model has no air-side
  pressure-drop physics. No silent substitute correlation is added.

## Consequences

- The contract enums differ per side (`AirSideMode` ⊂ `CoolantSideMode`);
  the UI only offers supported modes per side.
- If a future paper revision adds an air-side Δp model, this ADR is
  superseded and the enum is extended (additive, non-breaking).

## Evidence

- `source_materials/Waermedurchgang_V10_physical.m` contains no air-side pressure
  drop: the only pressure-drop function is
  `calcTubeFrictionPressureDropBar` (currently line 4135), documented as
  "coolant-side … straight-tube friction".
