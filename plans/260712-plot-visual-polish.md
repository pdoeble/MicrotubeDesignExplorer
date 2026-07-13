# Plot visual polish — per-plot living checklist

> **Path:** `/plans/260712-plot-visual-polish.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8/M9 (review-finding closure), workstream W7 (Plots)
> **Status:** completed — reopened findings closed by exhaustive visual audit
> **Created:** 2026-07-12
> **Last updated:** 2026-07-13
> **Predecessor:** `/plans/260712-plot-fidelity-review.md` (completed)
> **Reference figures:** `source_materials/Waermedurchgang_V10_physical_exports/*.svg|pdf`
> **Reference script:** `source_materials/Waermedurchgang_V10_physical.m` (V10)

---

## 0. Reopened visual-validation workstream (feedback 2026-07-13)

The previous completion statement is no longer accepted as sufficient evidence.
The new review found cross-plot defects that were hidden by spot checks and by
the reduced 16×16 E2E sweep. Completion now requires a full-resolution visual
review of every registered plot, every material variant, every composite panel,
and every exported figure. A plot is not complete merely because Plotly renders
without a runtime error.

### 0.1 Binding feedback and acceptance criteria

1. **Color-scale collision freedom** — colorbar tick labels, bar frame, colorbar
   title, figure title, braces and plot axes must not overlap. Tick density must
   adapt to the available physical bar length. The reported failures include
   `tech-adjusted-delta-ka` and the over-dense vertical scale of
   `tube-count-map` for Aluminum.
2. **Comparison fill boundaries** — every comparison heatmap must terminate on
   the scientifically applicable comparison/feasibility boundary. Colored
   cells may neither protrude beyond nor leave a visible gap at the displayed
   boundary merely because the native sweep grid is coarse.
3. **Design-boundary geometry** — screen boundaries must be extracted from the
   continuous exported result fields at the active request thresholds, not
   drawn as contours of resampled binary masks. Hatches start exactly on the
   local boundary and extend at 45° relative to the local tangent into the
   rejected side. The angle is local; hatch strokes therefore need not be
   globally parallel.
4. **Uniform isolines** — every continuous scientific map receives readable
   isolines even when an older MATLAB diagnostic omitted them. The binary
   feasibility mask is the sole categorical exception. Every level selected
   for labelling is labelled once when drawable; dense fields may label a
   representative subset without removing contour paths.
5. **Uniform label dressing** — isoline labels are kept upright in the range
   −90°…+90°, follow the local tangent, and have an opaque/near-opaque clearance
   from the line. Automatic Plotly labels that can flip by 180° are not accepted.
6. **Paper-only Reynolds choice** — remove `reynolds-air-simple-map`; retain the
   VDI G7 convention described by the current paper. Record the conflict with
   the older MATLAB export explicitly.
7. **Scientific plot navigation** — dropdown groups describe physical content
   and interpretation, not rendering mechanics such as “log map” or “grid”.
8. **Evidence** — run a 250×250 paper-default sweep, render every remaining plot
   and both cooler variants where applicable, collect screenshots, run DOM/spec
   collision assertions, inspect the screenshot contact sheets, and repeat for
   PNG/SVG report/export paths.

### 0.2 Feature-level validation protocol

Every row in §0.3 is checked against the following feature vector. “N/A” must
be justified by plot semantics, never silently skipped.

| Code | Feature | Required evidence |
| --- | --- | --- |
| A | Axes | correct ranges, log/linear transform, units, tick density, no title collision |
| C | Color scale | correct domain/direction/ticks/title, collision-free at reference and responsive widths |
| F | Filled field | correct mask, finite extent and boundary alignment; no holes introduced by display interpolation |
| I | Isolines | present for continuous fields, meaningful levels, complete visible paths |
| L | Isoline labels | upright local orientation, line clearance, correct value/unit formatting, no marker/sketch collision |
| O | Overlays | correct technology/composite boundaries, reference/design markers and cross-section sketches |
| H | Hatching | design-boundary only: starts on line, local 45°, points into rejected region, stable spacing |
| X | Export/accessibility | PNG and SVG, provenance, alt text, description/table, no clipping at paper size |

### 0.3 Per-plot defect and validation matrix

Status vocabulary: **PASS** = the complete feature vector was reviewed in the
250×250 screenshot, passed the automated geometry audit, and was confirmed in
the contact sheets; **REMOVED** = intentionally absent under ADR-0011. For
cooler plots, “Al + PA” means both single views and tandem/shared-domain
behavior where available. Composite rows cover every panel.

| Plot ID / variants | Scientific statement | Reopened finding and implemented plot-specific resolution | Validated features | Status |
| --- | --- | --- | --- | --- |
| `inner-heat-transfer-map` — Al + PA | Tube-side VDI G1 coefficient | Missing isolines added from log 1/2/5 levels; four collision-placed labels; long scientific C-scale ticks thinned and the vertical title offset by measured extent. | A/C/F/I/L/O/X | PASS |
| `outer-heat-transfer-map` — Al + PA | Air-side VDI G7 coefficient | Missing isolines added; deterministic upright labels avoid sketches and edges; adaptive vertical log ticks verified for both materials. | A/C/F/I/L/O/X | PASS |
| `overall-coefficient-map` — Al + PA + tandem | Overall coefficient | All Plotly auto-labels replaced; short required Al contours retain explicit targets while generic labels use collision boxes; vertical titles and tandem cards no longer meet 100/200 ticks. | A/C/F/I/L/O/X | PASS |
| `bundle-conductance-map` — Al + PA + portrait | Package conductance | Shared top-bar ticks selected by physical width and separated from title/bar; portrait labels collision-placed while required 50/300/500 levels remain; both panels and singles checked. | A/C/F/I/L/O/X | PASS |
| `tube-count-map` — Al + PA | Continuous tube count | Aluminum log scale reduced from an over-dense tick list to collision-free representative ticks; meaningful isolines and upright labels added. | A/C/F/I/L/O/X | PASS |
| `bundle-area-map` — Al + PA | Bundle outer area | Missing isolines/labels added; vertical log tick capacity and title clearance enforced. | A/C/F/I/L/O/X | PASS |
| `burst-pressure-map` — Al + PA | Standard-tolerance burst pressure | Contour paths retained; labels are upright annotations with white clearance and avoid markers/sketches; reversed/physical tick semantics rechecked. | A/C/F/I/L/O/X | PASS |
| `burst-pressure-medical-map` — Al + PA | Medical-tolerance burst pressure | Same deterministic label and adaptive-scale policy as standard tolerance; both material extents and minimum-wall masks checked. | A/C/F/I/L/O/X | PASS |
| `reynolds-tube-side-map` — Al + PA | Tube-side flow regime | Full contour coverage and Re=2300 transition retained; representative labels moved away from transition, edges, markers and sketches. | A/C/F/I/L/O/X | PASS |
| `reynolds-air-simple-map` | Non-paper inlet-diameter diagnostic | Removed from registry, selector, presentation metadata and catalog; compatible core field retained. Paper/legacy conflict recorded in ADR-0011. | N/A | REMOVED |
| `reynolds-air-vdi-map` — Al + PA | Paper VDI G7 air-side regime | Retained as the sole public air Reynolds map; isolines, labels, VDI field extent and scale audited for both materials. | A/C/F/I/L/O/X | PASS |
| `friction-pressure-drop-map` — Al + PA | Tube-side pressure loss | Reversed color mapping preserved; scientific ticks made collision-safe; labels normalized upright and cleared from the line. | A/C/F/I/L/O/X | PASS |
| `hydraulic-power-map` — Al + PA | Hydraulic power | Missing isolines and labels added; adaptive log scale and both feasible extents checked. | A/C/F/I/L/O/X | PASS |
| `coolant-throughput-map` — Al + PA | Bundle coolant throughput | Automatic labels replaced by upright annotations; fixed reversed linear scale, contour spacing, masks and marker clearance checked. | A/C/F/I/L/O/X | PASS |
| `coolant-mass-flow-map` — Al + PA | Bundle coolant mass flow | Missing linear isolines/labels added; scale density, masks and overlays checked. | A/C/F/I/L/O/X | PASS |
| `tube-spacing-longitudinal-map` — Al + PA | Longitudinal clear gap | Flip-prone labels replaced; all gap contours, reversed scale and material-specific boundaries checked. | A/C/F/I/L/O/X | PASS |
| `tube-spacing-transverse-map` — Al + PA | Transverse clear gap | Deterministic upright labels and collision avoidance added; full contour/scale/overlay audit passed. | A/C/F/I/L/O/X | PASS |
| `tube-spacing-closest-inline-map` — Al + PA | Minimum inline gap | Automatic overprint removed; representative labels and all contours retained; both variants checked. | A/C/F/I/L/O/X | PASS |
| `tube-spacing-closest-staggered-map` — Al + PA | Minimum staggered gap | Automatic overprint removed; representative labels and all contours retained; both variants checked. | A/C/F/I/L/O/X | PASS |
| `capillary-rise-map` — Al + PA | Configured potting rise | Reversed spectral orientation retained; annotations, log ticks, masks and both variants checked. | A/C/F/I/L/O/X | PASS |
| `capillary-rise-1g-map` — Al + PA | Potting rise at 1 g | Collision-safe labels/ticks added under the shared capillary convention; both variants checked. | A/C/F/I/L/O/X | PASS |
| `capillary-rise-5g-map` — Al + PA | Potting rise at 5 g | Collision-safe labels/ticks added under the shared capillary convention; both variants checked. | A/C/F/I/L/O/X | PASS |
| `capillary-rise-10g-map` — Al + PA | Potting rise at 10 g | Collision-safe labels/ticks added under the shared capillary convention; both variants checked. | A/C/F/I/L/O/X | PASS |
| `tube-supply-cost-map` — Al + PA | Relative tube supply cost | Seven flip-prone labels replaced by a readable representative set while every cost contour remains; reversed scale and boundaries checked. | A/C/F/I/L/O/X | PASS |
| `resistance-inner-map` — Al + PA | Tube-side resistance | Missing log isolines added; long scientific tick strings use reduced vertical-bar font and measured title spacing; labels avoid sketches. | A/C/F/I/L/O/X | PASS |
| `resistance-wall-map` — Al + PA | Wall resistance | Missing log isolines added; exponential scale/title collision removed; top-edge labels moved inward where drawable. | A/C/F/I/L/O/X | PASS |
| `resistance-outer-map` — Al + PA | Air-side resistance | Missing log isolines added; adaptive scale and upright collision-aware labels verified. | A/C/F/I/L/O/X | PASS |
| `feasibility-mask-map` — Al + PA | Categorical all-screen feasibility | Confirmed as the sole I/L exception; exact categorical edge, two-tick scale, screen meaning and overlays checked for both variants. | A/C/F/O/X; I/L=N/A | PASS |
| `burst-tolerance-grid` — 4 panels | Standard/medical tolerance × material | Shared bar tick density/gaps corrected; every panel's contours, labels, masks, markers and titles checked. | A/C/F/I/L/O/X | PASS |
| `capillary-rise-grid` — 6 panels | Acceleration × material | Shared reversed top bar separated from values/title; every panel label orientation, missing-reference-X policy, mask and sketch checked. | A/C/F/I/L/O/X | PASS |
| `resistance-shares-grid` — 6 panels | Resistance attribution | All contours remain; label subset reduced to two per dense share panel and collision-placed, eliminating adjacent 0.18/0.3 and title conflicts; all six panels checked. | A/C/F/I/L/O/X | PASS |
| `design-boundary-lines` — Al + PA | Combined constraint-admitted conductance | Binary-mask contours replaced by continuous-field marching-squares paths at active thresholds; every hatch begins on the path, uses local 45° geometry and predicate-verified rejected side; labels/top bar/panels rechecked. | A/C/F/I/L/O/H/X | PASS |
| `tech-adjusted-delta-k` | Feasible coefficient difference | Raster clipped to exact exported PA comparison boundary with sub-cell edge closure; deterministic 0-% label and all comparison overlays checked. | A/C/F/I/L/O/X | PASS |
| `tech-adjusted-ratio-k` | Feasible coefficient ratio | Same exact boundary clipping; missing isolines added and all retained while two representative labels avoid the narrow left band. | A/C/F/I/L/O/X | PASS |
| `tech-adjusted-delta-ka` | Feasible conductance difference | Top-scale values now have physical gaps from title and bar; exact fill boundary applied; labels are upright/cleared. The +25-% line remains but is intentionally unlabelled because the narrow band cannot fit four inline texts. | A/C/F/I/L/O/X | PASS |
| `tech-adjusted-ratio-ka` | Feasible conductance ratio | Exact comparison clipping and isolines added; dense 1/1.2/1.6 cluster reduced to two collision-free representative labels without removing contour paths. | A/C/F/I/L/O/X | PASS |
| `same-geometry-ratio` | Same-geometry coefficient delta | Exact comparison clipping applied; missing percent isolines added, all paths retained and a collision-free representative label set used. | A/C/F/I/L/O/X | PASS |
| `same-geometry-ratio-value` | Same-geometry coefficient ratio | Exact comparison clipping applied; missing ratio isolines added, all paths retained and labels collision-placed. | A/C/F/I/L/O/X | PASS |

### 0.4 Implementation milestones

- [x] R0 — feedback transcribed into the exhaustive matrix above; old
  completion claim revoked.
- [x] R1 — scientific taxonomy and removal of the simple-Re diagnostic.
- [x] R2 — adaptive collision-free color-scale ticks and titles.
- [x] R3 — exact comparison display clipping against exported feasibility
  boundaries.
- [x] R4 — continuous-field design boundaries plus local 45° rejected-side
  hatching.
- [x] R5 — automatic meaningful isolines and deterministic, upright, cleared
  representative labels without removing dense contour paths.
- [x] R6 — 250×250 visual evidence for every row and variant; responsive,
  export and report checks.
- [x] R7 — wiki/ADR alignment, complete checks, final matrix set to PASS and
  plan returned to `completed` with commit links.

### 0.5 Initial evidence and root causes (closed)

- The prior E2E “all plots” loop used a 16×16 sweep and asserted only that an
  SVG existed. Its screenshots expose severe stair-stepping but cannot prove
  full-resolution fidelity.
- `colorbarSpec()` emitted every 1/2/5 log-decade tick without a
  physical-space capacity limit. Horizontal tick annotations are only 0.1 cm
  above the bar.
- `screenBoundaryTraces()` contoured nearest-neighbour binary masks on a
  resampled τ grid; `screenHatchTrace()` then draws fixed global diagonals at
  every 29th edge cell. Neither operation follows the continuous threshold
  contour used by the paper.
- `contourLevelsForData()` returned no levels for every plot that lacked an
  explicit per-ID list or step. Most app diagnostics therefore have no
  isolines.
- Plotly automatic contour labels were enabled for most levels. They have no
  cross-trace collision policy and may choose a 180°-reversed text direction.
- Comparison fields are finite on the native all-screen grid, while the
  displayed composite boundary is evaluated on a separate 600×2400 query
  grid. The presentation layer did not reconcile the cell-edge
  geometry, so the colored raster and the plotted boundary visibly diverge.

### 0.6 Reopened-workstream implementation and evidence

- `plotTopicGroups` gives every remaining ID exactly one scientific topic and
  drives the `<optgroup>` selector. Registry tests enforce coverage and order.
- `collisionFreeColorbarTicks()` selects values from physical bar length and
  rendered label estimates. Horizontal annotations reserve 0.30 cm above the
  bar; vertical titles use the widest selected tick and scientific labels use
  a smaller scale font where necessary.
- Comparison preparation clips every row to the interpolated exported
  `boundary_wall_ratio` / `boundary_right_diameter` curve. A nearest-neighbour
  extension closes only the sub-cell band to the first native finite sample;
  a white polygon cuts the raster at the exact curve.
- `boundaryGeometry.ts` implements continuous marching-squares path assembly,
  bilinear threshold checks and local 45° rejected-side hatches. Unit tests
  assert connected paths, exact hatch origins and rejection direction.
- Every continuous presentation receives contour levels. Plotly labels are
  disabled; deterministic annotations use upright local tangents, opaque
  clearance, physical text boxes and collision penalties for edges, other
  labels, markers and cross-section sketches. Dense fields retain all paths
  while labelling a representative subset.
- `tests/e2e/plot-visual-audit.spec.ts` renders the default 250×250 result and
  captures all 37 public plot IDs: 66 screenshots across Al, PA, tandem and
  composite variants. It rejects text/text collisions, colorbar/text
  intersections and clipped SVG text. The final Chromium run passed in
  4.7 minutes on 2026-07-13; all four 17-image contact sheets were then
  reviewed manually against A/C/F/I/L/O/H/X.
- ADR-0011 records both source conflicts: VDI G7 is paper-authoritative over
  the legacy simple-Re diagnostic, and the accepted local 45° hatch angle
  intentionally supersedes the MATLAB 35° parameter.

---

## 1. Scope (user findings 2026-07-12)

1. **Cross-section sketches distort** unless the HTML container happens to
   match the assumed aspect ratio.
2. **Spacing/typography drift** — margins, titles, colorbars, legends, axes
   not positioned/proportioned like the approved MATLAB figures.
3. **Colormap inexact** — old 60-color SVG-recovered sequence covered only
   ~27–100 % of `slanCM('spectral')`; the deep-red low end was missing.

Out of scope: physics, contracts, golden data, the parallel model-setup UX
work (`/plans/260712-model-setup-ux.md`).

## 2. What was implemented

- **A1 Exact colormap** — `src/features/plots/colormap.ts` now holds the
  exact 256×3 `slanCM('spectral')` table dumped from the local MATLAB R2024b
  (`matlab -batch "writematrix(slanCM('spectral'), ...)"`, CSV in scratchpad
  `slancm_spectral.csv`). Provenance comment in the file. VERIFIED r2/r3.
- **A2 cm-faithful scaled layout** — new `src/features/plots/paperLayout.ts`
  replicates every MATLAB figure geometry in cm (SINGLE_MAP 16.5×13.2,
  BURST_GRID, CAPILLARY_GRID (share-grid panel positions!), SHARES_GRID,
  BUNDLE_KA_PORTRAIT, DESIGN_BOUNDARY, TECH_KA_DELTA 19×17.9 for Fig. 22).
  `paperZoom` scales *every* px quantity (margins, fonts, line widths,
  marker sizes, colorbar thickness) by `containerWidth / referenceWidth`
  (96 dpi ⇒ 37.795 px/cm), so the plot-area aspect is invariant and sketch
  circles stay round at any width. VERIFIED r1–r3 at width 1200.
- **Sketch geometry** — `crossSectionTraces(paper)` in `plotSpec.ts` uses the
  panel's own axes aspect (`geometry.axesCm[0]`), matching MATLAB
  `plotCrossSectionSketches` incl. the grids' per-panel
  `cross_section_reference_axes_cm` override. VERIFIED round in r2/r3.
- **Typography/axes** — Times serif; ticks base pt (19 single / 15 grids),
  labels ×1.1, contour labels −2 pt; boxed axes, mirrored inside ticks,
  light solid major grid `#dfdfdf`, dotted minor grid `#c6c6c6` with
  `minor.dtick:"D1"`; single maps use power tick labels (10⁻¹/10⁰/10¹),
  grids use plain 0.1/1/10 (`paperAxisStyle(paper, axis, style)`).
- **Colorbars** — framed, inside ticks, 1/2/5-decade ticks
  (`makeLogColorbarTicks` port); vertical bar label = rotated annotation
  reading bottom-up (plotly's side-right title reads top-down — wrong);
  horizontal top bars via invisible **carrier trace**
  (`colorbarCarrierTrace`) because plotly cannot reverse a bar: negated
  color axis + mirrored scale reproduces MATLAB `Direction='reverse'`
  exactly. Tick labels of top bars are **annotations above the bar**
  (`horizontalBarTickAnnotations`) — plotly ignores `ticklabelposition` on
  carrier colorbars (tested, ineffective).
- **Contours** — drawn on linear display values (labels show physical
  levels); MATLAB label selection ported (`plain` 100·n, `bar` preferred
  sets, `cost` spread-7, `percent` explicit, shares dynamic
  `sparseShareLevels` incl. sub-percent steps); per-cooler burst steps
  Al 200 / PA 10 bar; percent labels via z/100 + d3 `"+.0%"`/`".0%"`
  (signed only when negative levels exist).
- **Color domains** — fixed caxis via `colorLimits`; robust shared limits
  (k, kA, burst) now apply in *single* mode too and collect values with the
  cooler's own `mask_below_min_wall` applied (MATLAB uses `*_plot` fields,
  l. 609–629). `zmid:0` only for auto-symmetric delta domains — explicit
  MATLAB caxis maps linearly (Fig. 22 was distorted before).
- **Overlays** — tech-limit curves (Al `#001999` dash / PA `#00801a` dot,
  2.6 pt, white underlay), validated-ref X (10 pt/2.2 pt, `x-thin`),
  comparison maps show only composite boundaries (+ ref X only per
  `showValidatedRef`), capillary maps/grid use flipped colormap
  (MATLAB `flipud`, l. 2080) and the capillary grid hides the ref X
  (burst + shares grids KEEP it — Fig. 15/12 show it).
- **Composites** (`compositePlotSpec.ts`) — full cm layout: panel domains
  from `paperMargins`, per-panel axes anchored (`anchor: "yN"` — without it
  tick labels leak between panels), panel titles at MATLAB y-norm 1.012,
  figure-wide axis labels + provenance as annotations, shared top colorbar
  carrier + tick annotations, extra 0.6 cm web-only bottom band so the
  provenance never collides with the x label. Design-boundary: continuous
  threshold contours on exported fields, locally spaced 45° rejected-side
  hatches, HTML legend under the figure (labels "Coolant throughput", "Tube
  cost" per Fig. 20_design), y-dtick 5, and collision-placed kA labels.
- **Fig. 22 dressing** — short label "Δ(k_oA_o)_feas", reversed top bar with
  tick annotations, simplified brace shapes + superiority labels,
  data-driven callouts (`percentCalloutAnnotations`) for +100/+150 that only
  appear when those levels exist in the data (current default data max is
  ~+76 %, so none appear — correct behavior; the paper reference was made
  from a different data state). The horizontal title is a separate annotation
  at the MATLAB position. The −25/0/+50 % contours use deterministic,
  data-interpolated annotations in the narrow feasible band; the +25 % line is
  retained without an inline label because a fourth text cannot fit cleanly.
- **Deterministic contour labels** — annotation targets reproduce the MATLAB
  label coverage where Plotly cannot place text reliably: k_o 300/400 W/m²K,
  bundle kA 50/300/500 W/K, all drawable aluminum design-boundary levels,
  and the 0 % Fig. 9 contour. Target points are interpolated on the computed
  contour and rotated from its local tangent; no scientific values are fitted
  or changed.
- **Components** — `PlotFigure`/`CompositePlotFigure` measure width via
  `useContainerWidth` (ResizeObserver, jsdom-guarded) and re-render at the
  paper zoom; exports render a fresh spec at reference size via
  `Plotly.downloadImage(figureObject, {width/height from geometry})`
  (single 624×499). CSS: `.plot-figure__frame` + legend styles in
  `styles.css` (min-heights removed).
- **Types** — `src/types/plotly.js-dist-min.d.ts` extended (axis style,
  minor, colorbar, marker colorbar, shapes, figure-object export).
- **Report capture** — `reportFigures.ts` uses `layout.width/height`.

## 3. Effective vs. ineffective measures (lessons)

Effective:

- Exact colormap via MATLAB dump (256 entries; old map lacked ~27 % low end).
- One zoom factor for *all* px quantities ⇒ round sketches at any width.
- `minor.dtick:"D1"` — without it plotly draws dense **linear** minor grid
  on log axes (was the mysterious stripe pattern in NaN regions; proven by
  hiding traces one-by-one, `scratchpad/.../shots/diag`).
- Carrier-trace colorbars for reversed bars; annotations for top tick labels
  and for the rotated vertical bar label.
- Axis `anchor` on composite subplots.
- Contours on linear display values (log z made labels show log10 numbers).
- Mask-aware robust percentiles (MATLAB `*_plot` semantics).

Ineffective / rejected:

- `colorbar.ticklabelposition:"outside top"` — ignored for carrier traces.
- `heatmap.zmid` with explicit caxis — distorts MATLAB linear mapping.
- `yaxis.scaleanchor` was rejected (breaks fixed ranges); CSS transform
  scaling rejected (breaks hover).
- plotly cannot place inline contour labels on short/steep segments (thin
  Fig. 22 band, some k_o 300/400 labels) — needs annotation-based labels.
- `crop.mjs` (screenshot crop via file:// in Chromium) renders black — use
  Playwright `clip` on the live page instead (see diagnose-pattern.mjs).

## 4. Per-plot checklist

Status: every remaining item is visually verified in the final 250×250 audit
against the corresponding MATLAB export or, for app-only plots, against the
shared approved conventions and ADR-0011.

### 4.1 Paper figures

- [x] `overall-coefficient-map` ↔ 01/02 — colors, ticks, contours including
  200/300/400 labels, sketches and both coolers.
- [x] `bundle-conductance-map` ↔ 20/21 (+ portrait via tandem) — both
  coolers, 50/300/500 labels and shared limits.
- [x] `burst-pressure-map` ↔ 03/04 — both coolers and 800/1200/1600 labels.
- [x] `reynolds-tube-side-map` ↔ 05 — levels and Re=2300 transition.
- [x] `reynolds-air-vdi-map` ↔ 08; legacy Figure 07 simple Re removed under
  the current-paper source priority (ADR-0011).
- [x] `friction-pressure-drop-map` ↔ 18 — reversed color orientation.
- [x] `coolant-throughput-map` ↔ 19 — reversed linear colorbar.
- [x] spacing maps ↔ 06/10/11/13.
- [x] `tube-supply-cost-map` ↔ 16/17 — both coolers and approved layering.
- [x] `tech-adjusted-delta-k` ↔ 09 — fixed ticks, annotated 0 % contour,
  no validated-reference marker.
- [x] `tech-adjusted-delta-ka` ↔ 22 — separate title, top ticks, braces and
  data-interpolated −25/0/+50 % labels; +25 % contour retained unlabelled.
- [x] `burst-tolerance-grid` ↔ 15 — layout, bar direction and reference X.
- [x] `capillary-rise-grid` ↔ 14 — flipped colormap, no reference X.
- [x] `resistance-shares-grid` ↔ 12 — sparse levels, ticks and figure label.
- [x] `design-boundary-lines` ↔ 20_design — anchored panels, 5 % y ticks,
  top bar, smoothed display boundary, labels, hatch and HTML legend.

### 4.2 App-only diagnostics (shared style)

- [x] `inner/outer-heat-transfer`, `tube-count`, `bundle-area`,
  `hydraulic-power`, `coolant-mass-flow`, `capillary-rise(-1g/-5g/-10g)`,
  `resistance-inner/wall/outer` — every Al/PA screenshot checked in the final
  audit; capillary singles deliberately use the flipped map.
- [x] `feasibility-mask-map` — binary white/accent with white infeasible.
- [x] `tech-adjusted-ratio-k/-ka`, `same-geometry-ratio(-value)` —
  composite boundaries only and both-feasible clipping.

### 4.3 Cross-cutting

- [x] Width sweep 700/1100/1600 px — invariant plot-area ratio and round
  cross-section circles at every width.
- [x] Tandem mode — two scaled panels, shared domains, no overlap.
- [x] PNG/SVG export — single-map reference size 624×499 and paper zoom 1,
  asserted from real Chromium downloads.
- [x] HTML report figure spot-check — same fixed-size specs captured as SVG;
  JSON sidecar remains embedded and machine-readable.
- [x] Colormap exactness (256-entry MATLAB dump).

## 5. Verification log

| Date | Round | Evidence |
| --- | --- | --- |
| 2026-07-12 | r1 | `scratchpad/shots/r1` — post A1–A3; findings F1–F10 |
| 2026-07-13 | diag | `scratchpad/shots/diag` — stripe pattern = plotly linear log-minor fallback |
| 2026-07-13 | r2 | `scratchpad/shots/r2` — F1–F9 verified; findings F11–F16 |
| 2026-07-13 | r3 | `scratchpad/shots/r3` — F10–F16 partially verified; Fig. 22 title/band labels still open |
| 2026-07-13 | r4 | `scratchpad/shots/r4`, `r4-target*`, `r4-final-labels` — all registered plots and both-cooler variants reviewed; F17–F19 closed |
| 2026-07-13 | width/tandem | `scratchpad/shots/r4-width-{700,1100,1600}`, `r4-tandem` — responsive geometry and tandem layout verified |
| 2026-07-13 | r5 exhaustive | Playwright `plot-visual-audit`: paper-default 250×250 sweep, 37 IDs, 66 variants/screenshots, zero DOM geometry findings; four contact sheets manually reviewed; reopened F20–F27 closed |

### Findings (all fixed)

- F1 robust/fixed shared color limits missing in single mode → always via
  `colorDomainForPlot`.
- F2 contour labels showed log10 values → contours on linear display values.
- F3 vertical colorbar label read top-down → rotated annotation.
- F4 x-title/provenance collision (single) → `title.standoff`.
- F5 composite axes unanchored → `anchor: "yN"/"xN"`.
- F6 `zmid` distorted explicit caxis → only for auto-symmetric domains.
- F7 stripe pattern = dense linear minor ticks on log axes → `dtick:"D1"`.
- F8 design-boundary y-dtick 5; legend wording per paper.
- F9 Fig. 22 short bar label.
- F10 top-bar tick labels below bar (plotly limitation) → annotations above.
- F11 robust percentiles must skip below-min-wall cells.
- F12 capillary flipped colormap + no ref X in capillary grid only.
- F13 composite footer band (+0.6 cm) against x-label collision.
- F14 shares grid: dynamic sparse/stepped levels, MATLAB ticks/label.
- F15 design-boundary labels all kA levels; screen lines initially smoothed
  on a display grid (later superseded by F22 continuous-field contours).
- F16 Fig. 22 braces + data-driven callouts.
- F17 Fig. 22 h-bar title collision → blank trace title plus annotation at
  the MATLAB 17.15 cm position.
- F18 missing thin-band percent labels → data-interpolated annotations at
  the MATLAB target positions for Fig. 9/22.
- F19 incomplete single-map label coverage → deterministic annotations along
  the actual k_o, kA and design-boundary contours.
- F20 over-dense/colliding C-scales → physical-length tick selection,
  scientific-label font adaptation and measured title offsets.
- F21 comparison fill/boundary mismatch → exported-boundary clipping,
  sub-cell edge closure and exact white display mask.
- F22 wavy screen contours → native continuous-field marching squares at
  active request thresholds.
- F23 detached/wrong-side hatches → exact contour origins, local 45° tangent
  geometry and predicate-tested rejected direction.
- F24 missing diagnostic isolines → automatic meaningful linear/log levels on
  every continuous map.
- F25 adjacent flipped labels → Plotly labels disabled; upright,
  collision-aware cleared annotations and sparse representative labelling.
- F26 obsolete simple air Re plot → removed from public registry under the
  paper's VDI G7 authority; ADR-0011 records the MATLAB conflict.
- F27 rendering-family dropdown → seven scientific topic groups with exact
  registry-coverage tests.

## 6. Completion evidence and reproducibility

- Exhaustive full-resolution audit:
  `$env:PLOT_VISUAL_AUDIT='1'; pnpm exec playwright test
  tests/e2e/plot-visual-audit.spec.ts --project=chromium`. The test computes
  the committed paper-default 250×250 request, renders all 37 public IDs and
  66 variants, captures each figure, and fails on annotation/colorbar
  collisions or clipped SVG text. Optional `PLOT_VISUAL_AUDIT_FILTER` accepts
  a comma-separated ID list for focused iteration. Final result: passed in
  4.7 minutes on 2026-07-13.
- Final screenshots and `plot-visual-audit.json` are written to Playwright's
  `test-results/plot-visual-audit-…-chromium` directory. Four temporary contact
  sheets covered all 66 screenshots and were manually checked using the
  feature vector in §0.2. As test output, these are reproducible evidence and
  are not committed.
- Dev server: `pnpm dev --host 127.0.0.1 --port 5199 --strictPort`
  (background task; port 5174 is used by Playwright/parallel worker).
- Screenshot round: `node <scratchpad>/shoot-plots.mjs r4 [plotId ...]`
  (env `BASE_URL`, `WIDTH`; full paper-default request via URL state; both
  coolers for overall/bundle/burst/cost; writes `<scratchpad>/shots/r4`).
  Scratchpad = `C:\Users\Doebler\AppData\Local\Temp\claude\c--Users-Doebler-Documents-Modelle-MicrotubeDesignExplorer\e8b1328e-f4c2-4696-8df4-7d2fdad5ffdd\scratchpad`.
- Trace-level diagnosis: `diagnose-pattern.mjs` (hides traces one by one,
  clipped screenshots; uses Vite `/@id/plotly.js-dist-min` import).
- Reference views: Read the export PDFs directly (14/15/12/22/19/09/01 and
  20_design were reviewed and their conventions are encoded above).
- Colormap regeneration: `matlab -batch "writematrix(slanCM('spectral'),
  '<out>.csv')"` then the node generator (see git diff of colormap.ts).

The r4 and final Playwright artifacts are scratch/test evidence, not
source-controlled deliverables. The durable reproduction inputs are the
immutable paper/MATLAB sources, the exact colormap table and provenance, the
cm geometry constants, boundary/annotation unit tests, and the exhaustive
Chromium visual-audit test.

## 7. Validation checklist

- [x] `pnpm test` (Vitest) green — 59 passed (2026-07-13).
- [x] `pnpm typecheck` green (2026-07-13).
- [x] `pnpm lint` (0 errors, 2 known generated-file warnings) and
  `pnpm format:check` green after `pnpm format` (2026-07-13).
- [x] `pnpm build` green (2026-07-13).
- [x] `pnpm test:e2e:chromium` green — 8 passed, opt-in exhaustive audit
  skipped as designed; every registered plot plus PNG/SVG, JSON/HTML report,
  worker parity, URL/reset and accessibility acceptance flows passed.
- [x] `PLOT_VISUAL_AUDIT=1` Chromium gate green — 37 plot IDs, 66 variants,
  250×250 request, 4.7 minutes, followed by four-sheet manual review.
- [x] Wiki: ADR-0007/0011, plot catalog and result-plot conventions describe
  exact colormap/cm layouts, adaptive scales, deterministic isolines/labels,
  exact comparison clipping, continuous boundaries, local 45° hatches,
  scientific navigation and export sizes.
- [x] Conventional Commits: predecessor `f14562c`; reopened completion work is
  recorded by the commit containing this completed living plan.

## 8. Status history

| Date | Change | Author/agent |
| --- | --- | --- |
| 2026-07-12 | Plan created from user findings; approach A1–A4 fixed | Claude (plot polish) |
| 2026-07-13 | A1–A3 implemented (exact colormap, cm layouts, typography, carrier colorbars, composites); visual rounds r1–r3 with findings F1–F19; F1–F16 fixed, F17–F19 open; handover notes in §2/§3/§6 | Claude (plot polish) |
| 2026-07-13 | F17–F19 closed with data-interpolated contour annotations; r4 covered all registered plots plus width sweep, tandem and export/report checks; validation and documentation completed | Codex |
| 2026-07-13 | Plan reopened after maintainer review; exhaustive per-plot matrix and 250×250 audit gate added; F20–F27 recorded | Codex |
| 2026-07-13 | F20–F27 closed; every matrix row PASS/REMOVED, 66 screenshots plus contact sheets reviewed, ADR-0011 and wiki aligned, full checks green; plan completed | Codex |
