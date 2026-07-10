# Plot catalog — approved plot families and stable IDs

Binding registry of every scientifically approved MATLAB plot and its web
equivalent (M1). Web plot IDs are stable kebab-case identifiers; the frontend
plot registry (M6) may only render IDs listed here. Display metadata
(contour levels, color limits) originates from the MATLAB `params` block and
is snapshotted in `reference/default_case/scalars.json`.

Axes for all design-space maps: x = outer diameter d_o [mm], log;
y = wall-thickness ratio τ = 100·t/d_o [%], linear, 0–40 %.
"Per material" in MATLAB becomes "per cooler" in the app (tandem view).

| Web plot ID | Family | MATLAB export(s) | Field | Scale | Notes / availability |
|---|---|---|---|---|---|
| `overall-coefficient-map` | log-map | 01, 02 | k (W/m²K) | log color | tandem per cooler; shared color limits across coolers |
| `bundle-conductance-map` | log-map | 20, 21, 20_portrait | kA (W/K) | log color | fixed package scaling; shared limits |
| `burst-pressure-map` | log-map | 03, 04 | p_b,tol (bar) | log color | tolerance-adjusted (standard tol) |
| `burst-tolerance-grid` | log-map-grid | 15 | p_b,tol (bar) | log color | rows = tolerance {standard, medical} |
| `reynolds-tube-side-map` | log-map | 05 | Re_i (–) | log color | Re=2300 transition contour highlighted |
| `reynolds-air-simple-map` | log-map | 07 | Re_a,d (–) | log color | inlet/d_o convention |
| `reynolds-air-vdi-map` | log-map | 08 | Re_c,l (–) | log color | VDI G7 convention (l=π·d_o/2, void factor) |
| `friction-pressure-drop-map` | log-map | 18 | Δp_i (bar) | log color, reversed | straight-tube diagnostic; PA min-wall clip |
| `coolant-throughput-map` | linear-map | 19 | V̇ (L/min) | linear color | continuous tube-count model; PA min-wall clip |
| `tube-spacing-longitudinal-map` | log-map | 06 | s_L (mm) | log color | |
| `tube-spacing-transverse-map` | log-map | 10 | s_T (mm) | log color | |
| `tube-spacing-closest-inline-map` | log-map | 11 | s_min,inline (mm) | log color | |
| `tube-spacing-closest-staggered-map` | log-map | 13 | s_min,stag (mm) | log color | |
| `resistance-shares-grid` | share-grid | 12 | φ_i, φ_w, φ_o (%) | linear color 0–100 | 3 shares × 2 coolers, shared colorbar |
| `capillary-rise-grid` | log-map-grid | 14 | h_cap (mm) | log color | rows = acceleration {1g, 5g, 10g} |
| `tube-supply-cost-map` | log-map | 16, 17 | C_tube/C_fin (–) | log color, reversed | footprint cost orientation |
| `tech-adjusted-delta-k` | percent-delta | 09 | Δk_o,feas (%) | diverging linear | PA vs nearest feasible Al reference; needs both coolers feasible |
| `tech-adjusted-delta-ka` | percent-delta | 22 | Δ(k_o·A_o)_feas (%) | diverging linear | as above, bundle scale |
| `design-boundary-lines` | boundary-summary | 20_design | kA + 6 screen boundaries | log color + lines | one panel per cooler; legend explains all screens |
| `same-geometry-ratio` | percent-delta | (computed, not exported) | k_B/k_A − 1 (%) | diverging linear | approved diagnostic; masked below max(t_min) |

## Excluded MATLAB figures (documented exclusions, M6 exit gate)

| MATLAB item | Reason |
|---|---|
| single-share maps (`share Ri/Rw/Ro`) | superseded by `resistance-shares-grid` (same data) |
| `same geometry change` map export | same data as `same-geometry-ratio`; kept as web plot, MATLAB export was disabled |
| k_o slices (`plotSlices2D_from3D`) | disabled in reference; presentation variant of `overall-coefficient-map` |
| 3D ratio plot | `make_3d_plot=false`; not used by the manuscript |
| cross-section sketches, contour-label placement, hatching | presentation decoration, replaced by web hover/legend |

## Non-negotiable rendering rules (from AGENTS §8)

- No WebGL traces (SVG export fidelity).
- Screen boundaries, minimum-wall lines, and the validated reference marker
  (d_o=1 mm, τ=10 %) use fixed symbols/colors across all plots.
- Every figure: units, validity limits, alt text, PNG + SVG export,
  provenance footer.
