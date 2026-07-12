# Plot fidelity and export review — working document

> **Path:** `/plans/260712-plot-fidelity-review.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8/M9 (review-finding record), feeds W7 (Plots) and W8 (Reports)
> **Status:** completed — implementation, documentation and validation closed
> **Created:** 2026-07-12
> **Last updated:** 2026-07-12
> **Reference figures:** `source_materials/Waermedurchgang_V10_physical_exports/*.pdf|svg`
> **Reference script:** `source_materials/Waermedurchgang_V10_physical.m` (V10)

---

## 0. Living implementation tracker

**Owner:** Codex (`/root`)
**Scope:** Close findings G1–G14, figure-specific gaps in §5, export findings
E1–E7, documentation, tests, and release-quality validation.
**Interfaces:** Plot registry/spec factory, `SimulationResult` field catalog,
Pyodide worker payload, Plotly SVG/PNG rendering, standalone HTML/print report.
**Out of scope:** changes to accepted physical equations or golden MATLAB data.

### Decisions

- [x] D1 — use a documented display-only, column-wise linear transform from
  the native `(t, d_o)` grid to a regular τ grid; never interpolate across
  non-finite source cells and resample masks conservatively.
- [x] D2 — export resistance shares from the Python core as explicit result
  fields; do not perform resistance aggregation in the frontend.
- [x] D3 — keep descriptive titles in surrounding web/report UI and omit
  in-figure titles from scientific map exports; grid panels retain short panel
  labels.
- [x] D4 — derive the project spectral colors from the approved MATLAB SVG
  export and record provenance in the typed frontend constant.
- [x] Record D1–D4 in ADR-0007 and link it from the decisions index.

### Implementation checklist

- [x] G1/G4 — τ axis, fixed geometry ranges/ticks, display conversions and
  display-unit hover/table/KPI formatting.
- [x] G2/G3/G14 — project spectral colormap, reversed variants, log10 fills,
  fixed/robust shared color domains and colorbar variants.
- [x] G5 — own-material, PA-min-wall, both-feasible and all-screen masking.
- [x] G6/G10 — fixed iso-contours with labels and Re = 2300 transition lines.
- [x] G7/G8/G9/G13 — technology-limit curves, cross-section sketches,
  validated reference marker and per-family overlay whitelists.
- [x] G11/G12 — paper typography, geometry, margins, symbols and overlap-free
  legends/provenance.
- [x] §5.13 — dedicated two-panel design-boundary summary with feasible-only
  fill and fixed screen styles.
- [x] §5.14 — register and render burst-tolerance, capillary-rise and
  resistance-share grids with shared colorbars.
- [x] E1–E7 — paper-like report defaults, converted/rounded summary values,
  print-hidden JSON, compact print manifest, provenance/title polish and fixed
  figure aspect ratio.
- [x] Update plot catalog and UI/interface wiki pages.

### Validation checklist

- [x] Python regression tests, `pytest`, `ruff`, `mypy`, coverage-relevant
  assertions for new share fields.
- [x] Frontend registry/spec/report tests, `pnpm test`, `typecheck`, `lint`,
  `format:check`.
- [x] Production build and Pyodide asset preparation.
- [x] Chromium end-to-end acceptance including all registered plot IDs and
  PNG/SVG/JSON/HTML paths.
- [x] Visual spot comparison against the approved MATLAB SVG/PDF exports.
- [x] Review final diff, mark this plan completed, and create one coherent
  Conventional Commit with validation evidence (`feat(plots): reproduce paper
  figure conventions`).

Final validation evidence (2026-07-12):

- `uv run --project python pytest -q` — 58 passed.
- `uv run --project python ruff check python tests/python` — clean.
- `uv run --project python mypy python` — clean.
- `pnpm test` — 44 passed; `typecheck` and `format:check` clean.
- `pnpm lint` — 0 errors; only the two pre-existing generated-file warnings.
- `pnpm build` — production build and local Pyodide wheel successful.
- `pnpm test:e2e:chromium` — 7 passed, including all registered plot IDs,
  report/image paths, worker parity, accessibility and performance.

### Milestone status

| Milestone | Status | Evidence |
| --- | --- | --- |
| M1 — decisions and metadata | completed | ADR-0007; typed presentation metadata and SVG-derived spectral map |
| M2 — shared single-map fidelity | completed | τ transform, masks, units, contours, overlays, plot-spec regressions |
| M3 — special multi-panel figures | completed | kA, burst, capillary, resistance-share and boundary composite specs |
| M4 — report/export polish | completed | paper set, converted summaries, print-hidden JSON and compact print hashes |
| M5 — full validation and handoff | completed | full Python/frontend/build/Chromium gates green; final commit recorded above |

### Risks and controls

- Display resampling can visually invent continuity: interpolation is confined
  to adjacent finite source samples and is documented as display-only.
- Shared robust limits can drift if computed per figure: k, kA, and burst
  domains are computed once across both coolers with the MATLAB 1/99-percentile
  policy.
- Plotly SVG support varies by trace family: use SVG-compatible heatmap,
  contour, scatter and shape primitives only; no WebGL.
- Multi-panel figures can exhaust browser memory: reuse transferred arrays and
  avoid duplicating full-resolution buffers.

---

## 1. Scope and verdict

Detailed visual comparison of every registered web plot against the approved
MATLAB paper exports, plus a content/syntax check and an export-quality check.

**Initial review verdict (superseded by the completed implementation):**

- **Content/data:** correct. All Python golden/parity suites pass; the plotted
  arrays come from `SimulationResult` and match MATLAB references.
- **Syntax/quality gates:** green (see §6).
- **Exports:** structurally sound and traceable, no filler text; but not yet
  "paper-like" (§7).
- **Plot appearance:** **far from the MATLAB paper figures.** The divergence is
  systematic, not per-plot noise: wrong y-axis dimension, wrong colormap, wrong
  color scaling, missing masking, missing iso-lines, missing sketches/markers,
  and text overlap. Every map plot is affected (§4, §5).
- **Coverage:** 3 approved grid figures are missing entirely (§5.14).

The M6 exit-gate claim "paper plots reproduce from paper defaults" is **not
met visually**; it is met numerically only.

**Closure:** Findings G1–G14, §5.13–§5.14 and E1–E7 were implemented and
validated under the tracker in §0. The quoted M6 visual gap is therefore
closed; this initial verdict remains here as the provenance of the work.

---

## 2. Evidence

- MATLAB reference: plotting helpers `plotSingleLogMap` (l. 1007),
  `plotBundleKAGridAlPa` (l. 1124), `plotMapLinearIso` (l. 1275),
  `plotBurstToleranceGridAlPa` (l. 1347), `plotMapPercentIso` (l. 1569),
  `plotShareGridAlPa` (l. 1913), `plotCapillaryRiseGridAlPa` (l. 2068),
  `plotDesignBoundaryLinesAlPa` (l. 2935), `plotTechLimitLines` (l. 5252),
  `plotCrossSectionSketches` (l. 5308), `plotReTransitionContour` (l. 4398),
  `getProjectColormap` (l. 4288), params block l. 61–318.
- Web implementation: `src/features/plots/plotRegistry.ts`,
  `src/features/plots/plotSpec.ts`, `src/features/plots/PlotFigure.tsx`,
  `src/features/export/reportFigures.ts`, `src/features/export/reportExport.ts`.
- Full-default browser run on 2026-07-12 (local dev server, Chromium via
  Playwright): all 35 registered plots screenshotted for both coolers where
  applicable, plus tandem mode, JSON sidecar, and standalone HTML report.
  0 console errors.

---

## 3. Root cause overview

The web plots are generic Plotly heatmaps of the raw SI fields on the internal
t×d grid. The MATLAB paper figures are **log10-filled contour maps in
(d_o, τ) space** with fixed color limits, a project colormap, NaN-white
masking, labelled iso-lines, technology-limit lines, a validated reference
marker, and tube cross-section sketches. Almost every visual requirement
therefore fails for the same small set of reasons. Fixing the shared spec
factory (`createPlotSpec` + registry metadata) fixes most plots at once.

Key data fact (verified): MATLAB builds the same t×d meshgrid
(`t_mm = logspace(...)`, l. 459–461) and passes the **derived τ matrix
`Y_pct = 100·T./DA` as the 2-D y-coordinate to `contourf`**. The Python core
already exports identical grids/fields (golden-tested). The gap is purely in
the frontend rendering, so no physics or contract change is required — the
frontend can compute τ_ij = 100·t_i/d_j from the axes it already has.

---

## 4. Global findings (apply to all/most plots)

Each finding: problem → solution approach (bullets only, no implementation).

### G1 — Y-axis dimension: t [mm] instead of τ = t/d_o [%]  *(highest impact)*

- Web: `yaxis = "Wall thickness t [mm]"`, linear 0–4.5 mm; the data area
  collapses into a thin wedge, everything relevant is squeezed below ~0.5 mm.
- MATLAB/paper: y = "Wall-thickness ratio, τ = t/d_o [%]", linear, fixed
  range 0–40 %, ticks 0:10:40 (`params.y_pct_plot_lim`, l. 120).
- Solution approach:
  - compute τ_ij = 100·t_i/d_j in the plot layer (axes already in payload);
  - render as Plotly `contour`/`contourcarpet` (curvilinear y) or resample the
    field column-wise onto a regular τ axis for display (display-only,
    document it; masks resampled nearest-neighbour, no value interpolation
    across NaN);
  - fixed y-range [0, 40] %, x-range [0.1, 10] mm, x-ticks only at 0.1/1/10.

### G2 — Colormap: Viridis / RdBu instead of the project "spectral" map

- Web: Viridis for all maps, RdBu for percent-delta.
- MATLAB: `slanCM('spectral')` for **everything** including the percent-delta
  maps (fixed caxis instead of a diverging map), `flipud(...)` for the cost
  and friction-pressure-drop maps (l. 1028–1030).
- Solution approach:
  - snapshot the 256-entry spectral table once as a typed constant
    (e.g. `src/features/plots/colormap.ts`) + reversed variant;
  - registry flag `reversedColormap` for `tube-supply-cost-map` and
    `friction-pressure-drop-map`;
  - percent-delta plots switch from RdBu to the same spectral map with the
    fixed MATLAB caxis (see G3/§5.11–5.12).

### G3 — Color scaling: linear auto-range instead of fixed log10 limits

- Web: linear `zmin/zmax` from data (e.g. burst colorbar "150M" Pa,
  Reynolds 0–4000 linear).
- MATLAB: fill of `log10(Z)` with fixed `caxis` per figure; colorbar ticks at
  preferred decade values; NaN and Z ≤ 0 stay white.
  Fixed limits: Re_i [10, 5000]; Re_a,d [10, 5000]; Re_c,l [20, 10000];
  Δp_i [0.05, 5] bar; cost [0.01, 100]; capillary [0.1, 150] mm;
  s_L [0.1, 10] mm; s_T [0.1, 30] mm; s_min,inline [0.1, 10] mm;
  s_min,stag [0.1, 20] mm; design-boundary kA [50, 500] W/K;
  k / kA / burst limits from robust quantiles shared across Al+PA
  (`robustLogLimits`, l. 759–774).
- Solution approach:
  - plot `log10(value)` in display units; colorbar `tickvals=log10(v)`,
    `ticktext=v` with the MATLAB preferred tick lists;
  - add per-plot registry metadata: `colorLimits`, `colorScaleType`
    (log/linear), `sharedAcrossCoolers` (k, kA, burst are always shared, not
    only in tandem mode);
  - keep several colorbars **reversed** as in the paper: coolant throughput
    (0 top → 30 bottom), bundle-kA portrait top bar, tech-adjusted-kA top bar.

### G4 — Display units: raw SI instead of paper units

- Web colorbar/hover/summary: Pa, m, m³/s, K.
- Paper: bar (burst, Δp), mm (spacings, capillary rise), L/min (throughput),
  τ in %, contour labels like "800" bar.
- Solution approach:
  - display-conversion table in the plot layer (contracts stay SI):
    Pa→bar (1e-5), m→mm (1e3), m³/s→L/min (6e4);
  - apply consistently to colorbar title, hover, data summary table, KPI
    table, and report summary.

### G5 — Masking: inadmissible regions stay colored

- Web: full field is colored; "below minimum wall" and "screened out" cells
  are only distinguishable via hover status. Mask plots (feasibility) paint
  the whole rectangle purple/yellow.
- MATLAB: `*_plot` fields are NaN below the material tech limit → **white**;
  Reynolds/friction/throughput maps are white below the PA min-wall clip;
  percent-delta maps are colored **only** where both materials are feasible
  (sawtooth upper edge at τ ≈ 18.5 % in Fig. 9/22).
- Solution approach:
  - apply `mask_below_min_wall` (and the existing NaN masks) as display NaN
    per registry rule (`clipMask: "own-material" | "pa-min-wall" | "both-feasible"`),
    mirroring which MATLAB field (`*_plot` vs `*_raw`) fed each figure;
  - Plotly heatmap/contour: NaN cells transparent; figure background white.

### G6 — Iso-contour lines with inline labels are missing

- MATLAB: dark (0.12,0.12,0.12) 0.75 pt contour lines at fixed levels with
  inline labels ("200", "50 %", "0.2", "+25 %"); level lists per figure
  (params l. 61–80, §5 below).
- Solution approach:
  - add a `contour` trace (`contours.coloring:"none"`, `showlabels:true`) on
    top of each fill using the MATLAB level lists from registry metadata;
  - label formatting per family ("bar", "%", plain) like the MATLAB
    `labelMode`.

### G7 — Technology-limit lines wrong style/geometry

- Web: horizontal "Minimum wall" dash line at t = t_min (correct only in
  t-space), cooler-colored; composite "feasible boundary" in cooler colors;
  six screen boundaries in ad-hoc colors on **every** plot.
- MATLAB single maps: only the material tech-limit curve(s)
  τ = 100·t_min/d_o — Al: dark blue `[0 0.10 0.60]` **dashed**, PA: dark
  green `[0 0.50 0.10]` **dotted**, width 2.6, with a white underlay line;
  which lines appear is per-figure ("Al", "Poly", "both"). Screen boundaries
  appear **only** in the design-boundary figure.
- Solution approach:
  - draw tech-limit curves in τ-space with exact colors/dash/width + white
    underlay; registry metadata `techLines: "Al"|"Poly"|"both"` per plot
    (map cooler_left→Al-style, cooler_right→PA-style when materials differ);
  - remove per-screen boundary overlays from ordinary maps; keep them for
    `design-boundary-lines` only (see §5.13).

### G8 — Tube cross-section sketches missing  *(explicit user requirement)*

- MATLAB: grey (77,77,77)/255 annulus sketches at d_o ∈ {0.25, 1.0, 6.0} mm ×
  τ ∈ {7.5, 20, 32.5} %; radius 1.2 %·(d/1 mm) in y-units, aspect-corrected in
  log-x; quarter section for d_o ≥ 6 mm; inner radius scale = 1 − 2τ/100;
  drawn on every single map and grid panel (not on design-boundary figure).
- Solution approach:
  - port `plotCrossSectionSketches` as Plotly SVG shapes/scatter-fill traces
    in (log10 d_o, τ) coordinates using the same constants
    (`params.cross_section_*`, l. 262–270);
  - hover disabled, no legend entries.

### G9 — Validated reference marker missing

- MATLAB: blue "x" (`[0 0.10 0.90]`, size 10, line width 2.2) at
  d_o = 1.0 mm, τ = 10 %, shown on figures whose techLine includes Al.
- Web: only a cooler-colored design-point dot/diamond.
- Solution approach:
  - add the fixed reference marker as its own overlay (same symbol/color on
    all plots per AGENTS §8); keep the request design point as a separate,
    visually distinct marker.

### G10 — Re = 2300 transition contour missing

- MATLAB: black dashed contour (width 1.35) at Re = 2300 on all three
  Reynolds maps (`plotReTransitionContour`).
- Solution approach: dashed black contour trace at level 2300 for
  `reynolds-*` plots (plot catalog already promises this).

### G11 — Text overlap / readability  *(explicit user requirement)*

- Web: horizontal legend overlaps the provenance footer and (in tandem and in
  report figures) the x-axis title; log x-ticks label every minor digit
  (2,3,…,9 between decades) — cluttered and confusing; colorbar title
  "W/(m^2 K)" with literal caret.
- Solution approach:
  - reserve explicit bottom margin: legend and footer in separate bands, or
    drop the in-plot legend for single maps (MATLAB has none) and move line
    explanations to the caption;
  - x-ticks fixed to 0.1/1/10 (`tickvals`), minor ticks unlabeled;
  - proper unicode/HTML labels: "W/(m² K)", "L min⁻¹", subscripts d_o, τ.

### G12 — Typography and titles

- Web: sans-serif, in-plot title "«Family» - «Cooler»".
- Paper: Times New Roman (serif), no title on single maps (V8+), grid panels
  carry only short panel titles ("Aluminum", "PA", "Aluminum, standard",
  "h_Al,1 g", "φ_i,Al"); italic quantity symbols in axis/colorbar labels.
- Solution approach:
  - serif font family for plot text (e.g. "Times New Roman, STIXGeneral,
    serif");
  - keep interactive title in the app UI **outside** the figure element, so
    PNG/SVG exports match the paper (no title, or panel-title-only);
  - axis labels exactly: "Outer diameter, d_o [mm]",
    "Wall-thickness ratio, τ = t/d_o [%]" (italic symbols).

### G13 — Comparison plots draw both coolers' full overlay set

- Web: tech-adjusted/same-geometry maps show 14 legend entries (all screens ×
  both coolers) burying the actual field.
- MATLAB Fig. 9/22: only the composite feasible boundaries (green dotted PA,
  blue dashed Al), sketches, reference X, contour labels; no legend box.
- Solution approach: overlay whitelist per family in the registry;
  comparison maps get only composite boundaries + reference marker.

### G14 — Colorbar orientation/position variants missing

- MATLAB: vertical right bar for single maps; horizontal **top** bar for the
  portrait grids and Fig. 22, partially reversed, with "+x %" tick label
  formatting and the "PA superiority / Al superiority" brace annotation
  (Fig. 22).
- Solution approach: registry metadata for colorbar orientation, reversal,
  tick label format (`"+50 %"`), and optional annotation strings.

---

## 5. Per-figure findings (web plot vs MATLAB export)

Axis/colormap/mask/sketch issues from §4 apply everywhere; this section lists
only the figure-specific deltas. "cb" = colorbar label (TeX as in MATLAB).

### 5.1 `overall-coefficient-map` vs 01/02 (k_o Al/PA)

- cb must be "k_o [W/(m² K)]"; fixed shared log limits via robust quantiles
  over Al+PA (`robustLogLimits`); contour step 50 W/m²K, labels at 100·n.
- techLine: Al panel → Al line only; PA panel → PA line only. Reference X on
  Al panel only. Data masked below own tech limit (white).
- Web extras to remove: screen boundaries, feasible-boundary line, legend.

### 5.2 `bundle-conductance-map` vs 20/21 + 20_portrait

- cb "Conductance, k_o·A_o [W K⁻¹]"; shared log limits Al+PA; contour levels
  `[5 10 25 50 75 100 150 200 300 500 750 1000 1500 2000 3000]` W/K; panel
  titles "Aluminum"/"PA".
- Paper also has the stacked 2-panel portrait variant with one reversed
  horizontal top colorbar (ticks `[5 10 20 50 100 200 500 1000 2000]`) —
  covered by tandem mode **only if** tandem gets the shared top colorbar and
  stacked layout; currently tandem renders two independent side-by-side
  figures with duplicate colorbars and overlapping text.

### 5.3 `burst-pressure-map` (+ `burst-pressure-medical-map`) vs 03/04

- Unit bar (not Pa); cb "Tolerance-adjusted burst pressure, p_b,tol [bar]";
  shared log limits Al+PA; contour steps: Al 200 bar, PA 10 bar; bar-mode
  label selection (preferred {5,10,20,30,50,75,100} or {200,…,2000}).

### 5.4 `reynolds-tube-side-map` vs 05

- Fixed color limits [10, 5000] (log); contour levels
  `[10 20 50 100 200 500 1000 2300 4000]`, all labelled; black dashed
  Re = 2300 contour; techLine "both"; unit "[-]", cb "Re_i [-]".

### 5.5 `reynolds-air-simple-map` vs 07 / `reynolds-air-vdi-map` vs 08

- Limits [10, 5000] resp. [20, 10000]; levels
  `[20 50 100 200 500 1000 2300 5000 10000]`; cb "Re_a,d [-]" / "Re_c,l [-]";
  Re=2300 dashes; techLine "both".

### 5.6 `friction-pressure-drop-map` vs 18

- bar, fixed limits [0.05, 5] log, **reversed** spectral colormap; levels
  `[0.05 0.1 0.2 0.5 1 2 5]` all labelled; techLine "both" (white area below
  PA min-wall clip); cb "Friction pressure drop, Δp_i [bar]".

### 5.7 `coolant-throughput-map` vs 19

- L/min, **linear** fixed caxis [0, 30], colorbar **reversed** (0 at top);
  levels `[1 2 5 10 15 20 25 30 40]` (horizontal iso-lines in τ-space);
  cb "Coolant throughput, V̇_c,tot [L min⁻¹]"; techLine "both".

### 5.8 Spacing maps vs 06/10/11/13

- mm; fixed log limits (s_L [0.1,10]; s_T [0.1,30]; inline [0.1,10];
  staggered [0.1,20]); levels `[0.1 0.2 0.5 1 2 5 10]` (s_T/stag:
  `[0.2 0.5 1 2 5 10 20]`); mm-mode labels; cb "s_L [mm]" etc.

### 5.9 `tube-supply-cost-map` vs 16/17

- Fixed log limits [0.01, 100] (web data max 208 → clipped by caxis, not by
  data), **reversed** colormap; levels
  `[0.01 0.02 0.05 0.1 0.2 0.5 1 2 5 10 20 50 100]`; cb "C_tube/C_fin [-]";
  techLine per material; sketches semicircle-on-line style at panel right
  (same sketch routine; positions identical).

### 5.10 `capillary-rise-map` + 1g/5g/10g vs 14

- mm, fixed log limits [0.1, 150]; paper figure is a 3×2 grid (rows 1g/5g/10g
  × columns Al/PA) with one reversed horizontal top colorbar
  (100 … 0.1 mm) and panel titles "h_Al,1 g" …; single-map companions are
  fine as app extras but the grid itself is missing (§5.14).

### 5.11 `tech-adjusted-delta-k` vs 09

- Fixed caxis **[-20, +80] %** (not symmetric ±max), spectral colormap (not
  RdBu), tick labels "+20 %"-style; colored only where both feasible
  (sawtooth edge); composite feasible boundaries (blue dashed Al, green
  dotted PA) instead of screen-line spaghetti; "0 %" labelled contour;
  cb "Feasible coefficient difference, Δk_o [%]".

### 5.12 `tech-adjusted-delta-ka` vs 22

- Fixed caxis **[-50, +200] %**, ticks −50:50:200, horizontal **top**
  colorbar, **reversed** (+200 left … −50 right), brace labels
  "PA superiority" / "Al superiority"; contour levels
  `[-25 0 25 50 100 150]` with callout labels; reference X shown; sketches
  shown; y-ticks 0:5:40 in this figure.

### 5.13 `design-boundary-lines` vs 20_design

- MATLAB: kA fill **clipped to the all-screen feasible region only**, fixed
  caxis [50, 500] W/K, reversed top colorbar (500 left … 50 right); six screen
  boundary lines with fixed colors (min-wall black, flow blue [0 .32 .74],
  Δp orange [.90 .55 0], cost purple [.58 0 .83], burst green [0 .58 .20],
  capillary red [.80 0 0]), width 1.45, **hatch ticks on the violating side**;
  two stacked panels (Aluminum, PA); legend in a dedicated box **below** the
  panels; no sketches; blue X on Al panel.
- Web: identical to a normal map + generic overlays; colorbar to 5000+ W/K;
  no hatching, wrong colors, no feasible-only fill, no legend box.
- Solution approach: dedicated `boundary-summary` spec builder (feasible-mask
  clip, fixed caxis, screen-line color table from
  `params.design_boundary_color_*`, hatch ticks as short line segments,
  legend as separate HTML block under the figure).

### 5.14 Missing approved figures (plot-catalog rows without registry entry)

- `burst-tolerance-grid` (Fig. 15: 2×2, rows standard/medical tolerance ×
  Al/PA, shared top colorbar 1–1000 bar log).
- `capillary-rise-grid` (Fig. 14: 3×2, see §5.10).
- `resistance-shares-grid` (Fig. 12: 3×2, φ_i/φ_w/φ_o × Al/PA, shared top
  colorbar 0–100 %, per-panel stepped contour levels; note the φ fields
  (shares in %) are not exported by `SimulationResult` — only absolute
  resistances; either export φ_j from Python (preferred, keeps physics out of
  plots) or document the share division as display-only arithmetic).
- Solution approach: implement a generic multi-panel grid family
  (subplot grid + one shared colorbar) and register the three IDs; the
  catalog's "log-map-grid"/"share-grid" families exist in the family labels
  but have no members.

### 5.15 Diagnostic companions without MATLAB export

`inner/outer-heat-transfer-map`, `tube-count-map`, `bundle-area-map`,
`hydraulic-power-map`, `coolant-mass-flow-map`, `resistance-*-map`,
`feasibility-mask-map`, ratio companions, `same-geometry-*`: no 1:1 paper
target, but they must follow the same shared style (G1–G12) so the app looks
coherent; `feasibility-mask-map` should render invalid geometry white, not
purple.

---

## 6. Content and syntax verification (2026-07-12, local)

- `uv run pytest` — all tests passed (full golden/contract/API suite).
- `uv run mypy .` — no issues in 20 source files.
- `uv run ruff check .` — clean.
- `pnpm typecheck` — clean.
- `pnpm lint` — 0 errors; 2 known unused-directive warnings in generated
  contract files.
- `pnpm test` (Vitest) — 41 passed / 8 files.
- Full-default browser compute (not the reduced CI request) — succeeds,
  0 console errors; hover, tandem, PNG/SVG/JSON/HTML export paths exercised.
- Spot checks: request hash, provenance footer, axis values (m→mm), status
  mask counts, KPI values consistent with `SimulationResult`; no physics in
  plot code found; no hidden clipping/interpolation found in the data path.

Content caveats (display semantics, not numerics):

- Registry `unit` strings are raw SI and disagree with the plot catalog's
  display units (bar/mm/L/min) — same root cause as G4.
- `colorDomainForPlot` shares color limits across coolers only in tandem
  mode; catalog requires always-shared limits for k, kA, burst (G3).
- Hover reports t in mm only; τ missing (G1).

---

## 7. Export review (JSON / HTML / print-PDF / PNG / SVG)

Positive: reports are generated from one immutable `SimulationResult`;
provenance, screens, warnings and SHA-256 array manifest are complete; JSON
sidecar is canonical, compact (~54 kB), machine-readable, image-free; HTML
uses clean serif headings and bordered tables; **no AI-slop or filler text
found in any export**.

Findings toward a "LaTeX-like" report:

- **E1 — Figures:** report embeds the current (wrong-styled) figures incl.
  legend/footer overlap; fixed automatically once §4 lands; default figure
  selection (`defaultReportFigureSelections`) should then mirror the paper
  set (k_o, kA portrait, boundary summary, Δ(k_oA_o), shares, burst grid,
  capillary grid).
- **E2 — Numbers/units:** design-point summary prints raw SI with up to 8
  significant digits ("34525830 Pa", "0.00027142768 m³/s"). → display units
  (bar, L/min, mm) and 3–4 significant digits; unit column per row is fine.
- **E3 — Raw JSON dumps in the printable report:** "Validated request JSON"
  and the full "Canonical sidecar JSON" are inlined as `<pre>` blocks — in
  print this is dozens of pages of JSON and the main reason the HTML is
  1.7 MB. → keep in the HTML behind `<details>` (screen only), exclude from
  `@media print`; the sidecar file is the canonical machine artifact anyway.
- **E4 — Array manifest in print:** 90 rows × full SHA-256 is valuable for
  traceability but overwhelming in a printed report. → keep on screen,
  shorten hashes in print or move to an appendix page.
- **E5 — Provenance "Golden reference" row renders empty** when the value is
  an empty string (`?? "n/a"` misses `""`). Minor.
- **E6 — Report title/header:** "Microtube design-space report" + raw
  64-char hash in the subtitle; paper-like would be a short header with
  request hash truncated (12 chars, as in filenames) and app version.
- **E7 — PNG/SVG figure exports:** inherit all §4 issues; after the restyle
  they should match the paper geometry (fixed cm-based aspect ratio ≈
  16.5:13.2 for single maps) so exported SVGs drop into LaTeX unchanged.

---

## 8. Suggested implementation order (for the follow-up plan)

1. **G1 τ-axis transform** + fixed ranges/ticks (unblocks everything else).
2. **G2/G3** spectral colormap + fixed log/linear color limits + display
   units (G4) via registry metadata table (one commit per concern).
3. **G5 masking** (white inadmissible regions; feasible-only fill for delta
   maps).
4. **G7/G9/G10 line & marker overlays** (tech-limit curves, reference X,
   Re=2300) and removal of overlay spaghetti (G13).
5. **G6 iso-lines with labels**; **G11/G12** layout, fonts, titles.
6. **§5.13 design-boundary rebuild**; **§5.14 grid figures** (+ φ-share
   export decision, needs a small contract/ADR touch if fields are added).
7. **§7 report polish** (E1–E6).
8. Refresh acceptance tests/screenshot baselines; update plot catalog notes
   (cross-section sketches are **not** "excluded decoration" anymore — the
   catalog exclusion table must be corrected, user requirement 2026-07-12).

Completed in the listed order, with the shared plot pipeline preceding the
special grids and report polish. Validation evidence is recorded in §0.

## 9. Resolved decisions

- [x] D1: regular τ display grid with finite-adjacent interpolation only.
- [x] D2: export φ_i/φ_w/φ_o from Python as additive named fields.
- [x] D3: web/report captions keep titles; scientific figures omit them;
  multi-panel figures retain short panel labels.
- [x] D4: recover and snapshot the ordered spectral RGB sequence from the
  approved MATLAB SVG export.

All four decisions and consequences are recorded in ADR-0007.

---

## 10. Status history

| Date | Change | Author/agent |
| --- | --- | --- |
| 2026-07-12 | Full visual review of all 35 registered plots vs MATLAB paper exports; content/syntax gates re-run (all green); export review; findings G1–G14, per-figure §5, export E1–E7 recorded. No implementation. | review agent (Claude) |
| 2026-07-12 | Converted to a living checklist; implemented shared paper-fidelity pipeline, three missing grids, boundary summary, report polish and share fields; resolved D1–D4 in ADR-0007; full validation green. | Codex (`/root`) |
