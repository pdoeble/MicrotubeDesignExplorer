# Plot catalog — approved plot families and stable IDs

Binding registry of every paper-approved plot and its approved web companion
(M1). Web plot IDs are stable kebab-case identifiers; the frontend plot
registry (M6) may only render IDs listed here. Display metadata
(contour levels, color limits) originates from the MATLAB `params` block and
is snapshotted in `reference/default_case/scalars.json`.

Axes for all design-space maps: x = outer diameter d_o [mm], log;
y = wall-thickness ratio τ = 100·t/d_o [%], linear. The paper defaults retain
0.1–10 mm and 0–40 %; changed requests use their active sweep and calculation
window under ADR-0015.
"Per material" in MATLAB becomes "per cooler" in the app (tandem view).

| Web plot ID | Family | MATLAB export(s) | Field | Scale | Notes / availability |
|---|---|---|---|---|---|
| `inner-heat-transfer-map` | log-map | diagnostic companion | α_i (W/m²K) | log color | VDI G1 tube-side coefficient |
| `graetz-tube-side-map` | log-map | diagnostic companion | Gz_i (–) | log color | exact finite-value domain shared by both coolers; dynamic Re_i=2300 contour |
| `g1-diameter-sensitivity-map` | linear-map | diagnostic companion | ∂ln(Nu_i)/∂ln(d_i) (–) | linear color | fixed-local-velocity pointwise stencil; dynamic S_i=2/3 and Re_i=2300 contours |
| `outer-heat-transfer-map` | log-map | diagnostic companion | α_o (W/m²K) | log color | VDI G7 air-side coefficient |
| `overall-coefficient-map` | log-map | 01, 02 | k (W/m²K) | log color | tandem per cooler; shared color limits across coolers |
| `tube-count-map` | log-map | diagnostic companion | N_tube (-) | log color | continuous tube count |
| `bundle-area-map` | log-map | diagnostic companion | A_o (m²) | log color | bundle area used for conductance |
| `bundle-conductance-map` | log-map | 20, 21, 20_portrait | kA (W/K) | log color | fixed package scaling; shared limits |
| `burst-pressure-map` | log-map | 03, 04 | p_b,tol (bar) | log color | tolerance-adjusted (standard tol) |
| `burst-pressure-medical-map` | log-map | 15 data companion | p_b,tol,med (bar) | log color | medical tolerance sensitivity companion |
| `burst-tolerance-grid` | log-map-grid | 15 | p_b,tol (bar) | log color | rows = tolerance {standard, medical} |
| `reynolds-tube-side-map` | log-map | 05 | Re_i (–) | log color | Re=2300 transition contour highlighted |
| `reynolds-air-vdi-map` | log-map | 08 | Re_c,l (–) | log color | VDI G7 convention (l=π·d_o/2, void factor) |
| `friction-pressure-drop-map` | log-map | 18 | Δp_i (bar) | log color, reversed | straight-tube diagnostic; PA min-wall clip |
| `hydraulic-power-map` | log-map | diagnostic companion | P_hyd (W) | log color | Δp_i · V̇ diagnostic |
| `coolant-throughput-map` | linear-map | 19 | V̇ (L/min) | linear color | continuous tube-count model; PA min-wall clip |
| `coolant-mass-flow-map` | linear-map | diagnostic companion | ṁ (kg/s) | linear color | coolant mass-flow companion |
| `tube-spacing-longitudinal-map` | log-map | 06 | s_L (mm) | log color | |
| `tube-spacing-transverse-map` | log-map | 10 | s_T (mm) | log color | |
| `tube-spacing-closest-inline-map` | log-map | 11 | s_min,inline (mm) | log color | |
| `tube-spacing-closest-staggered-map` | log-map | 13 | s_min,stag (mm) | log color | |
| `resistance-inner-map` | log-map | 12 data companion | R_i (m²K/W) | log color | resistance-share source component |
| `wall-biot-map` | log-map | diagnostic companion | Bi_w=k_o d_o/λ_w (–) | log color | overall-coefficient definition; dynamic Bi_w=1 scale contour; shared domain |
| `resistance-wall-map` | log-map | 12 data companion | R_w (m²K/W) | log color | resistance-share source component |
| `resistance-outer-map` | log-map | 12 data companion | R_o (m²K/W) | log color | resistance-share source component |
| `resistance-shares-grid` | share-grid | 12 | φ_i, φ_w, φ_o (%) | linear color 0–100 | 3 shares × 2 coolers, shared colorbar |
| `capillary-rise-map` | log-map | 14 data companion | h_cap (mm) | log color, reversed | configured acceleration; MATLAB `flipud` orientation |
| `capillary-rise-1g-map` | log-map | 14 data companion | h_cap,1g (mm) | log color, reversed | fixed sensitivity companion |
| `capillary-rise-5g-map` | log-map | 14 data companion | h_cap,5g (mm) | log color, reversed | fixed sensitivity companion |
| `capillary-rise-10g-map` | log-map | 14 data companion | h_cap,10g (mm) | log color, reversed | fixed sensitivity companion |
| `capillary-rise-grid` | log-map-grid | 14 | h_cap (mm) | log color, reversed | rows = acceleration {1g, 5g, 10g}; no validated-reference X |
| `tube-supply-cost-map` | log-map | 16, 17 | C_tube/C_fin (–) | log color, reversed | footprint cost orientation |
| `feasibility-mask-map` | linear-map | 20_design data companion | feasible (-) | binary linear | composite all-screen mask from `SimulationResult.masks` |
| `tech-adjusted-delta-k` | percent-delta | 09 | Δk_o,feas (%) | fixed spectral linear | PA vs nearest feasible Al reference; needs both coolers feasible |
| `tech-adjusted-ratio-k` | ratio-map | 09 data companion | k_o,B/k_o,A,feas (-) | linear color | ratio companion for `tech-adjusted-delta-k` |
| `tech-adjusted-delta-ka` | percent-delta | 22 | Δ(k_o·A_o)_feas (%) | fixed spectral linear | as above, bundle scale |
| `tech-adjusted-ratio-ka` | ratio-map | 22 data companion | (k_o·A_o)_B/(k_o·A_o)_A,feas (-) | linear color | ratio companion for `tech-adjusted-delta-ka` |
| `design-boundary-lines` | boundary-summary | 20_design | kA + 6 screen boundaries | log color + lines | one panel per cooler; legend explains all screens |
| `same-geometry-ratio` | percent-delta | (computed, not exported) | k_B/k_A − 1 (%) | diverging linear | approved diagnostic; masked below max(t_min) |
| `same-geometry-ratio-value` | ratio-map | (computed, not exported) | k_B/k_A (-) | linear color | ratio companion for `same-geometry-ratio` |

## Excluded MATLAB figures (documented exclusions, M6 exit gate)

| MATLAB item | Reason |
|---|---|
| Figure 07 simple inlet-diameter air Reynolds map | superseded by the current paper's VDI G7 convention; the compatible core field remains but the diagnostic is not public (ADR-0011) |
| single-share maps (`share Ri/Rw/Ro`) | superseded by `resistance-shares-grid` (same data) |
| `same geometry change` map export | same data as `same-geometry-ratio`; kept as web plot, MATLAB export was disabled |
| k_o slices (`plotSlices2D_from3D`) | disabled in reference; presentation variant of `overall-coefficient-map` |
| 3D ratio plot | `make_3d_plot=false`; not used by the manuscript |
| fixed Gz=11.7/33/877, ridge and flip overlays | default-case explanatory values do not generalize to editable requests; dynamic Re/Bi/S references and the resistance-share grid provide the robust web interpretation (ADR-0015) |

Cross-section sketches, labelled iso-contours, technology-limit lines,
validated-reference markers and design-boundary hatching are required figure
semantics and are implemented by the shared SVG-compatible plot adapters.

The spectral scale is the exact 256×3 `slanCM('spectral')` table dumped from
the local MATLAB R2024b installation. Figure and axes rectangles are specified
in the MATLAB source's centimetre geometry. A single paper-zoom factor scales
the whole figure—including margins, fonts, strokes, markers and colorbars—so
axes ratios and circular cross-section sketches remain invariant as the HTML
container changes width. Single-map exports use the paper geometry 16.5×13.2
cm, rendered as 624×499 px at 96 dpi; other families use their own recorded
MATLAB geometry.

Every continuous plot has isolines; the categorical feasibility mask is the
only exception. Plotly's automatic contour labels are disabled because they
can flip adjacent labels by 180 degrees. The adapter interpolates label
positions on the displayed contour, derives an upright angle from the local
tangent, adds an opaque clearance, and avoids other labels, axes, markers and
cross-section sketches. Dense plots label a readable representative subset
while retaining every contour line. These annotations select label positions
only; they do not alter, smooth or fit the scientific field.

## Non-negotiable rendering rules (from AGENTS §8)

- No WebGL traces (SVG export fidelity).
- Screen boundaries, minimum-wall lines, and the validated reference marker
  (d_o=1 mm, τ=10 %) use fixed symbols/colors across all plots.
- Every figure: units, validity limits, alt text, PNG + SVG export,
  provenance footer.
- Native `(t, d_o)` results are transformed for display only to a regular τ
  grid under ADR-0007. The adapter never interpolates across non-finite cells;
  masks use nearest-neighbour display resampling.
- Every transform and overlay uses the active request domain. The default
  0–45 % calculation window alone keeps the 0–40 % paper view; non-default
  windows use their own bounds and omit fixed paper cross-section sketches.
- Design-screen lines are marching-squares contours of continuous exported
  fields at the thresholds in the active request. Their hatches start on the
  contour and extend at a local 45-degree angle into the rejected side. The
  feasible fill, values and exported scientific masks remain unchanged.
- Comparison rasters close only the sub-cell gap to the dense exported PA
  boundary and are then cut by an exact display mask. Scientific comparison
  arrays are never mutated or exported from this presentation operation.
- Horizontal shared colorbars use an invisible carrier trace to reproduce
  MATLAB's reversed top-bar direction. Their titles and tick labels are
  positioned as figure annotations with collision-tested physical spacing.
