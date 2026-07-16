# MATLAB inventory — `Waermedurchgang_V10_physical.m`

Complete inventory of the authoritative executable reference (M1).
Line numbers refer to the read-only file `source_materials/Waermedurchgang_V10_physical.m`.

## 1. Fixed operating point and sweep definition

| Quantity | Symbol | Default | Unit | Source (line) |
|---|---|---|---|---|
| Air face velocity | `v_a_ms` | 5.0 | m/s | 49 |
| Coolant mean tube velocity | `v_i_ms` | 0.5 | m/s | 50 |
| Wall-thickness sweep | `t_mm` | logspace(0.001…max) | mm | 88–89, 459 |
| Outer-diameter sweep | `da_mm` | logspace(0.1…10) | mm | 90–91, 460 |
| Grid resolution | `N_t × N_da` | 250 × 250 | — | 94–95 |
| Y axis (wall ratio) | `Y_pct = 100·t/d_o` | — | % | 463 |
| Y calculation limit | `y_pct_calc_lim` | [0, 45] | % | 121 |
| Y plot limit | `y_pct_plot_lim` | [0, 40] | % | 120 |
| `t_mm_max` widening | `max(0.5, 10·45/100)` = 4.5 | — | mm | 123–124 |

The sweep grid is `meshgrid(da_mm, t_mm)` → arrays indexed `(i_t, i_da)`
(rows = wall thickness, columns = outer diameter), both axes log-spaced.

## 2. Materials and fluids (static property sets)

| Set | Field | Value | Unit |
|---|---|---|---|
| Aluminum | `lambda_WmK` | 220.0 | W/(m·K) |
| Aluminum | `Rm_MPa` | 200 | MPa |
| Polyamide (PA) | `lambda_WmK` | 0.25 | W/(m·K) |
| PA | `Rm_MPa` | 10 | MPa |
| Air 20 °C, 1 bar | ρ=1.189 kg/m³, cp=1006 J/(kg·K), λ=0.02587 W/(m·K), ν=15.32e-6 m²/s, μ=18.21548e-6 Pa·s, Pr=0.70834 | | |
| EGL5050 70 °C | ρ=1041.5 kg/m³, cp=3555 J/(kg·K), λ=0.423 W/(m·K), ν=1.23e-6 m²/s, μ=1.2825e-3 Pa·s, Pr=10.77846 | | |

Sources: Wenger Engineering / Stoffdaten Online (lines 380–408). No
temperature-dependent property models anywhere.

## 3. Model configuration

| Block | Field | Default | Notes |
|---|---|---|---|
| Outer (VDI G7 inline) | `a_pitch_transverse` | 3.28 | S_T/d_o |
| | `b_pitch_longitudinal` | 2.00 | S_L/d_o |
| | `n_rows` | 36 | many-row regime |
| | `use_finite_row_correction` | false | finite-row helper available |
| | `property_correction_K` | 1.0 | gas-side wall-T correction unused |
| Inner (VDI G1) | `length_m` | 0.160 | L=100 mm named sensitivity |
| | `boundary_condition` | constant_wall_temperature | conservative vs. heat flux |
| | `apply_liquid_Pr_wall_correction` | false | needs measured wall T |

## 4. Equation branches (scientific core)

All in local functions; extracted verbatim for golden generation (ADR-0002).

| Function (line) | Physics | Branches |
|---|---|---|
| `vdiG7InlineTubeBankAlpha` (3928) | VDI 2013 G7 inline bank: l=π·d_o/2; c=1−π/(4a) if b≥1 else 1−π/(4ab); Re_c,l=v·l/(c·ν); Nu_lam=0.664·√Re·Pr^⅓; Nu_turb=0.037·Re^0.8·Pr/(1+2.443·Re^−0.1·(Pr^⅔−1)); Nu_l0=0.3+√(Nu_lam²+Nu_turb²); f_A=1+0.7·c^−1.5·(b/a−0.3)/(b/a+0.7)²; α=f_A·Nu_l0·K·λ/l | b≥1 vs b<1; many-row vs finite-row `(1+(n−1)f_A)/n`; K correction |
| `vdiG1InternalTubeAlpha` (3993) | VDI 2013 G1: Re=v·d_i/ν; α=Nu·λ/d_i | laminar Re<2300; transition 2300–10000 (linear blend of dedicated anchors); turbulent >10000; CWT vs CHF; optional (Pr/Pr_wall)^0.11 |
| `vdiG1LaminarMeanNu` (4057) | CWT: (3.66³+0.7³+(Nu₂−0.7)³+Nu₃³)^⅓, Nu₂=1.615·X^⅓, Nu₃=(2/(1+22Pr))^⅙·√X, X=Re·Pr·d/L; CHF analog (4.364, 0.6, 1.953, 0.924·Pr^⅓·√(Re·d/L)) | CWT/CHF |
| `vdiG1LaminarTransitionAnchorNu` (4080) | Re=2300 anchors: CWT (4.9³+…)^⅓; CHF (8.3³+…)^⅓ — **not** identical to the laminar formula at 2300 | CWT/CHF |
| `vdiG1TurbulentMeanNu` (4106) | Gnielinski: ξ=(1.8·log₁₀Re−1.5)^−2; Nu=(ξ/8)(Re−1000)Pr/(1+12.7√(ξ/8)(Pr^⅔−1))·(1+(d/L)^⅔) | — |
| `calcEffectiveInnerDiameterForBurst` (4117) | t_loc,min=t_nom−Δt; d_i,eff=d_o−2·t_loc,min; NaN if t_loc≤0 | tolerance rows: standard 0.020 mm, medical 0.005 mm |
| `calcPburstBar` (4124) | Lamé: p=Rm·(d_o²−d_i²)/(d_o²+d_i²); valid d_o>d_i>0 | — |
| `calcTubeFrictionPressureDropBar` (4135) | Darcy–Weisbach straight tube: Δp=f_D·(L/d)·½ρv²; diagnostic only (no headers/bends) | via friction factor branches |
| `calcDarcyFrictionFactorSmoothTube` (4170) | laminar 64/Re; turbulent (1.8·log₁₀Re−1.5)^−2; linear blend 2300–10000 | 3 branches |
| `calcTubeSupplyCostIndex` (4203) | cost ∝ N_tubes·L_eff, normalized by material reference index at d_ref | material Al/Poly |
| `calcTubeCountInFootprint` (4236) | footprint 30·a·d_ref × 36·b·d_ref; N_T=floor(fp_T/S_T), N_L=floor(fp_L/S_L) | inline vs staggered (staggered: alternating rows, shifted count) |
| Overall k (506–509) | k=1/(d_o/(d_i·α_i) + d_o/(2λ)·ln(d_o/d_i) + 1/α_o), outer-surface reference | per material λ |
| Resistance parts (729–732) | R_i=d_o/(d_i·α_i); R_w=d_o/(2λ)·ln(d_o/d_i); R_o=1/α_o; shares φ=R/(R_i+R_w+R_o) | — |
| Continuous tube count (489–498) | N=N_ref·(d_ref/d_o)², N_ref=1080 @ d_ref=1 mm; V̇=N·v_i·(π/4)d_i²; ṁ=V̇·ρ | diagnostic (continuous, not floored) |
| Bundle conductance (516–529) | kA=k·A_o, A_o=N·π·d_o·L (L=0.160 m) | per material |
| Clear spacings (569–575) | s_T=(a−1)d_o; s_L=(b−1)d_o; s_min,inline=min(s_T,s_L); s_min,stag=min(s_T, √(S_L²+(S_T/2)²)−d_o) | — |
| Capillary rise (649–669) | h=C_cap/(s_min,inline·G); C_cap,PA=5.4 mm² (process proxy); C_cap,Al=2γcosθ/(ρg)·10⁶ with γ=45.6 mN/m, θ=41.39°, ρ=1110 kg/m³; G∈{1,5,10} | per material C_cap, per acceleration |
| Diagnostic fields (754–786) | `Gz=Re_i Pr_i d_i/L`; MATLAB G1 sensitivity from a 4000-point 1D log-gradient/interpolation; `Bi=k_o d_o/lambda_w`; morphology helper fields | material-independent Gz/S; material-specific Bi/morphology |

## 5. Masks and validity (order of application)

1. `invalid` = d_i ≤ 0 (line 466–469) → NaN before any correlation.
2. `Y_calc_mask` = Y_pct outside [0, 45] % (577) → NaN on all screen inputs.
3. `techMaskAl` = t < 0.07 mm; `techMaskPoly` = t < 0.025 mm (606–607) →
   plot-state masking per material (`*_plot` variables).
4. Ratio same geometry masked at t < max(t_min,Al, t_min,PA) (750–751).

Golden `default_case` fields are harvested **after step 2** (the state that
feeds screens), with all masks stored separately.

## 6. Design screens (feasibility, lines 219–224, 3070–3096)

| Screen | Threshold | Direction |
|---|---|---|
| Minimum wall | t ≥ t_min (material) | ≥ |
| Burst pressure (tolerance-adjusted, standard tol) | ≥ 6 bar | ≥ |
| Coolant throughput | ≥ 10 L/min | ≥ |
| Tube friction Δp | ≤ 0.5 bar | ≤ |
| Cost index | < 5 | < |
| Capillary rise @ G=10 | ≤ 2 mm | ≤ |
| Finiteness | k, kA finite and > 0 | — |

Derived comparison quantities:
- `nearestFeasibleAlReference` (3132): for each all-screen-feasible PA point,
  the nearest feasible aluminum reference **at equal wall ratio τ and equal or
  larger d_o**, evaluated by bilinear `interp2` on the native (d_o, t) grid in
  **linear** coordinates (`nativeDesignGridVectors`, 3383).
- `compositeFeasibleDiameterBoundary` (3167): per τ-sample (600 samples,
  0.05…40 %), the smallest feasible d_o on a 4×-oversampled log axis.
- `ratio_tech_adjusted = k_PA/k_Al,ref`, `ratio_kA_tech_adjusted = kA_PA/kA_Al,ref`.

## 7. Scientific vs. presentation-only code

**Scientific (ported):** everything in §4–§6, the sweep setup (§1), and the
in-script sanity asserts (441–450).

**Presentation-only (not ported; replaced by the web plot system):**
`plotSingleLogMap`, `plotBundleKAGridAlPa`, `plotMapLinearIso`,
`plotBurstToleranceGridAlPa`, `plotShareGridAlPa`, `plotMapPercentIso`,
`plotCapillaryRiseGridAlPa`, `plotTripleShareMap`,
`plotDesignBoundaryLinesAlPa` and all contour-label/colorbar/hatching/
cross-section-sketch helpers, figure layout constants (lines 143–277),
`setPresentationDefaults`, `exportGeneratedFigures`. The *thresholds* drawn
by boundary plots come from §6 and are part of the model; the drawing code is
not. Contour level lists (lines 59–85) are display metadata reused by the
web plot catalog.

**Dead/optional in current paper:** single share maps, same-geometry-change
map (computed, not exported), k_o slices, 3D plot (`make_3d_plot=false`),
finite-row correction path (helper retained, off by default).

## 8. Console diagnostics

`printDesignBoundaryDiagnostics` (3099) prints feasible counts and boundary
ranges; captured as scalars in `reference/default_case/scalars.json`.
