# Ported equations

M3 model equations implemented in `python/microtubes_core/models/` use SI
internally. MATLAB names and mm/bar conversions are kept only at golden-test
and display boundaries.

## VDI G7 inline tube bank

Implemented in `models.correlations.vdi_g7_inline_tube_bank_alpha`, ported
from `Waermedurchgang_V10_physical.m` line 3691. Source: VDI-Waermeatlas 2013,
chapter G7.

- characteristic length: `l = pi d_o / 2`
- void fraction: `c = 1 - pi/(4a)` for `b >= 1`, else `c = 1 - pi/(4ab)`
- Reynolds number: `Re_c,l = v_a l / (c nu)`
- laminar term: `Nu_lam = 0.664 Re^0.5 Pr^(1/3)`
- turbulent term:
  `Nu_turb = 0.037 Re^0.8 Pr / (1 + 2.443 Re^-0.1 (Pr^(2/3) - 1))`
- base Nusselt: `Nu_l,0 = 0.3 + sqrt(Nu_lam^2 + Nu_turb^2)`
- inline area factor:
  `f_A = 1 + 0.7 c^-1.5 ((b/a - 0.3)/(b/a + 0.7)^2)`
- many-row factor is `f_A`; finite-row factor is `(1 + (n - 1) f_A)/n`
- `alpha_o = Nu_bundle lambda / l`

Validity warnings are emitted by the later sweep/API layer; this function
preserves numerically safe MATLAB behavior and returns NaN for invalid
diameters.
The API marks VDI G7 values outside `10 <= Re_c,l <= 1e6` or
`0.6 <= Pr <= 1e3` with `W_OUTSIDE_VALIDITY`.

## VDI G1 internal tube flow

Implemented in `models.correlations.vdi_g1_internal_tube_alpha`, ported from
MATLAB line 3756. Source: VDI-Waermeatlas 2013, chapter G1.

- Reynolds number: `Re_i = v_i d_i / nu`
- heat-transfer coefficient: `alpha_i = Nu_i lambda / d_i`
- laminar branch: `Re < 2300`
- transition branch: linear interpolation from the dedicated VDI `Re=2300`
  anchor to the turbulent `Re=10000` value
- turbulent branch: `Re > 10000`, Gnielinski/Konakov expression
- boundary conditions: constant wall temperature and constant heat flux
- optional liquid Prandtl wall correction: `(Pr/Pr_wall)^0.11`

The `Re=2300` transition anchors intentionally differ from simply evaluating
the laminar all-Re expression at `Re=2300`, matching the MATLAB reference.
The API marks VDI G1 values outside `Re_i <= 1e6` or
`0.1 <= Pr <= 1e3` with `W_OUTSIDE_VALIDITY`.

## Pressure and burst integrity

Implemented in `models.pressure`, ported from MATLAB lines 3880-3933.

- effective burst diameter:
  `d_i,eff = d_o - 2 (t_nom - tolerance)`, NaN when `t_nom - tolerance <= 0`
- Lamé burst pressure:
  `p = Rm (d_o^2 - d_i,eff^2) / (d_o^2 + d_i,eff^2)`
- the sweep keeps `burst_pressure` as the configured design-screen value and
  additionally exports the MATLAB sensitivity tolerances `0.020 mm`
  (standard) and `0.005 mm` (medical) from lines 136-137
- Darcy-Weisbach straight-tube pressure drop:
  `Delta p = f_D (L/d_i) (rho v_i^2 / 2)`
- smooth-tube Darcy friction factor:
  `64/Re` for `Re < 2300`, turbulent
  `(1.8 log10(Re) - 1.5)^-2` for `Re > 10000`, and a linear blend between
  the two endpoint values through the transition interval

The pressure-drop model is only the approved straight-tube diagnostic; it
does not include headers, bends, distributors, maldistribution, or full
heat-exchanger pressure loss.

## Geometry, area, and count

Implemented in `models.geometry`, ported from MATLAB lines 489-575 and
3999-4037.

- inner diameter: `d_i = d_o - 2t`
- wall ratio: `tau = 100 t / d_o`
- continuous tube count in a fixed footprint:
  `N_cont = width depth / (a b d_o^2)`
- bundle outer area: `A_o = N_cont pi d_o L`
- transverse and longitudinal pitches: `S_T = a d_o`, `S_L = b d_o`
- clear spacings use the MATLAB operation order:
  `S_T - d_o`, `S_L - d_o`
- inline closest spacing: `min(s_T, s_L)`
- staggered closest spacing: `min(s_T, sqrt(S_L^2 + (S_T/2)^2) - d_o)`
- discrete footprint counts use direct floating-point `floor` for sweep
  points; see ADR-0004 for the cost-reference normalization rule

## Cost index

Implemented in `models.cost.tube_supply_cost_index`, ported from MATLAB line
3966.

- effective raw length:
  `L_raw = N_tubes (active_length + overhang_total) scrap_factor`
- cost index:
  `cost = L_raw * material_reference_index / L_raw,ref`

The model is a relative tube-supply index normalized at the reference
geometry. It is not a market price fit.

## Operating modes

Implemented in `models.operating`. Air-side modes follow ADR-0003 and do not
include pressure-drop or hydraulic-power inversion:

- constant velocity: `v_a = value`
- constant volume flow: `v_a = Vdot / (width * tube_length)`
- constant mass flow: `v_a = mdot / (rho * width * tube_length)`

Coolant-side velocity modes:

- constant velocity: `v_i = value`
- constant volume flow: `v_i = Vdot / (N pi d_i^2 / 4)`
- constant mass flow: `v_i = mdot / (rho N pi d_i^2 / 4)`
- constant pressure drop: solve
  `tube_friction_pressure_drop(v_i, d_i) = target`
- constant hydraulic power: solve
  `tube_friction_pressure_drop(v_i, d_i) * Vdot(v_i) = target`
- exported hydraulic power diagnostic: `P_hyd = Delta p * Vdot`

The inversion is deterministic bisection over `[1e-6, 100] m/s` for 80
iterations. Cells outside the bracket or with invalid geometry return NaN
velocity plus an explicit `unsolvable` flag for the sweep/API layer.

## Sweep grid and masks

Implemented in `sweeps.design_space` and `sweeps.screens`.

The design grid follows the MATLAB reference orientation:

- `d_o` columns and `t` rows;
- array shape `(n_wall_thickness, n_outer_diameter)`;
- `np.meshgrid(d_axis, t_axis)` default `xy` indexing;
- logspace axes are generated using the MATLAB millimetre exponent convention
  and immediately converted back to SI; see ADR-0005.

Mask order:

1. invalid geometry: `d_i <= 0`, applied before correlations by replacing
   `d_i` with NaN;
2. wall-ratio calculation range: `tau < tau_min` or `tau > tau_max`, applied
   to screen-input fields but not to `alpha_o` or `alpha_i`;
3. material technology mask: `t < t_min`, stored separately;
4. all-screen feasibility, stored separately.

All-screen feasibility ports MATLAB `maskDesignBoundaryKAMap`:

- finite positive `kA`;
- `t >= t_min`;
- configured tolerance-adjusted burst pressure above threshold;
- coolant volume flow above threshold;
- tube pressure drop below threshold;
- cost index strictly below threshold;
- capillary rise below threshold.

## Comparison and boundaries

Implemented in `sweeps.comparison`, porting MATLAB
`nearestFeasibleAlReference`, `compositeFeasibleDiameterBoundary`, and
`evaluateDesignScreenAtQueries`.

Native-grid queries use bilinear interpolation in linear coordinates on the
log-spaced design grid:

- `x_vec = d_o` axis;
- `t_vec = t` axis;
- outside-grid queries return NaN;
- any NaN interpolation corner returns NaN.

Same-geometry ratio is `k_right / k_left`, with cells below the larger
material minimum-wall threshold masked.

Tech-adjusted comparison uses the left cooler as the reference set. For each
feasible right-cooler cell, candidate left-cooler points are scanned at equal
wall ratio and equal-or-larger diameter. The first candidate passing all
screens supplies `k_left,ref`, `kA_left,ref`, and `d_left,ref`.

Percent-delta comparison fields use the MATLAB plot convention
`Delta [%] = 100 (ratio - 1)`, after the ratio masks have been applied.

Composite feasible boundaries sample 600 wall-ratio values from `0.05 %` to
the plot limit `40 %`, and scan `4 * 600` log-spaced diameter candidates over
the sweep diameter range.

## Capillary rise

Implemented in `models.capillary.capillary_rise`, ported from MATLAB lines
649-669.

- `h = C_cap / (s G)`
- the sweep keeps `capillary_rise` as the configured design-screen value and
  additionally exports the MATLAB acceleration sensitivity cases `1g`, `5g`,
  and `10g` from line 309

`s` is the closest inline full clear spacing in the paper model, and `G` is
the acceleration multiplier opposing the rise.

## Thermal resistance aggregation

Implemented in `models.resistances`, ported from MATLAB lines 506-509 and
729-732.

- inner resistance on outer-area basis: `R_i = d_o / (d_i alpha_i)`
- wall resistance: `R_w = d_o ln(d_o/d_i) / (2 lambda_wall)`
- outer resistance: `R_o = 1 / alpha_o`
- overall coefficient: `k = 1 / (R_i + R_w + R_o)`
- resistance shares: `R_part / (R_i + R_w + R_o)`
