# Symbol glossary — MATLAB → Python

Binding name map for the port (M1). Python code uses SI internally
(AGENTS §3); the `_mm`/`_bar` suffixes of the MATLAB reference are kept only
at the golden-comparison boundary and in display conversions.

## Grid and geometry

| MATLAB | Python (`microtubes_core`) | Unit (Py) | Meaning |
|---|---|---|---|
| `da_mm`, `DA_mm` | `d_o` (axis `d_o_axis`) | m | outer tube diameter |
| `t_mm`, `T_mm` | `t_wall` (axis `t_wall_axis`) | m | nominal wall thickness |
| `DI_mm` | `d_i` | m | inner diameter `d_o − 2 t` |
| `Y_pct` | `wall_ratio_pct` | % | τ = 100·t/d_o (display axis) |
| `S_T_mm`, `S_L_mm` | `pitch_transverse`, `pitch_longitudinal` | m | tube pitches a·d_o, b·d_o |
| `clearSpacing…_mm` | `clear_spacing_transverse` … | m | pitch − d_o variants |
| `N_tubes_raw` | `tube_count_continuous` | — | N_ref·(d_ref/d_o)² |
| `calcTubeCountInFootprint` | `tube_count_in_footprint` | — | floored discrete counts |

## Correlations and results

| MATLAB | Python | Meaning |
|---|---|---|
| `vdiG7InlineTubeBankAlpha` | `models.correlations.vdi_g7_inline_tube_bank_alpha` | air-side α_o and Re_c,l |
| `vdiG1InternalTubeAlpha` | `models.correlations.vdi_g1_internal_tube_alpha` | coolant-side α_i |
| `vdiG1LaminarMeanNu` | `models.correlations.vdi_g1_laminar_mean_nu` | laminar mean Nu |
| `vdiG1LaminarTransitionAnchorNu` | `models.correlations.vdi_g1_laminar_transition_anchor_nu` | Re=2300 anchor |
| `vdiG1TurbulentMeanNu` | `models.correlations.vdi_g1_turbulent_mean_nu` | Gnielinski |
| `calcDarcyFrictionFactorSmoothTube` | `models.pressure.darcy_friction_factor_smooth_tube` | f_D |
| `calcTubeFrictionPressureDropBar` | `models.pressure.tube_friction_pressure_drop` | Δp (Pa) |
| `calcEffectiveInnerDiameterForBurst` | `models.pressure.effective_inner_diameter_for_burst` | d_i,eff (m) |
| `calcPburstBar` | `models.pressure.lame_burst_pressure` | p_burst (Pa) |
| `calcTubeSupplyCostIndex` | `models.cost.tube_supply_cost_index` | cost index (–) |
| capillary block | `models.capillary.capillary_rise` | h_cap (m) |
| `compute_k` | `models.resistances.overall_coefficient_outer` | k (W/(m²K)) |
| `compute_Rparts` | `models.resistances.resistance_parts_outer` | R_i, R_w, R_o (m²K/W) |
| `alpha_a`, `alpha_i` | `alpha_outer`, `alpha_inner` | heat-transfer coefficients |
| `Re_i`, `Re_o_simple`, `Re_o_vdi` | `re_inner`, `re_outer_simple`, `re_outer_vdi` | Reynolds numbers |
| `k_Al_raw` / `k_Poly_raw` | per-cooler `overall_coefficient` field | material-agnostic in port |
| `kA_*_WK` | `bundle_conductance` (W/K) | k·A_o at fixed package |
| `pB_*_bar` | `burst_pressure` (Pa) | tolerance-adjusted Lamé |
| `coolant_Vdot_Lmin_raw` | `coolant_volume_flow` (m³/s) | bundle throughput |
| `coolant_mdot_kg_s_raw` | `coolant_mass_flow` (kg/s) | — |
| `dp_i_fric_bar_raw` | `tube_friction_pressure_drop` (Pa) | — |

## Masks and screens

| MATLAB | Python | Meaning |
|---|---|---|
| `invalid` | `mask_invalid_geometry` | d_i ≤ 0 |
| `Y_calc_mask` | `mask_wall_ratio_range` | τ outside calc window |
| `techMaskAl/Poly` | `mask_below_min_wall` | t < t_min(material) |
| `makeDesignScreenData` | `sweeps.screens.ScreenInputs` | screen field bundle |
| `maskDesignBoundaryKAMap` → `ok` | `mask_all_screens_feasible` | all-screen feasibility |
| `nearestFeasibleAlReference` | `sweeps.comparison.nearest_feasible_reference` | tech-adjusted reference |
| `compositeFeasibleDiameterBoundary` | `sweeps.comparison.composite_feasible_boundary` | min feasible d_o(τ) |
| `evaluateDesignScreenAtQueries` | `sweeps.comparison.evaluate_screens_at_queries` | bilinear screen queries |
| `nativeDesignGridVectors` | (implicit: axes of `DesignGrid`) | linear-coordinate bilinear interp |

## Naming rules applied

- No units in Python core variable names (SI everywhere); conversion helpers
  live at the contract boundary (`display_units`).
- Material-specific MATLAB duplicates (`*_Al_*` / `*_Poly_*`) become one
  material-agnostic code path evaluated per cooler configuration.
- MATLAB `params.*` display settings map to the frontend plot catalog, not to
  the Python core.
