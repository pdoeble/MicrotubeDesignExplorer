# ADR-0011: Scientific plot audit, boundary rendering, and navigation

- Status: accepted
- Date: 2026-07-13
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260712-plot-visual-polish.md`

## Context

The first plot-fidelity pass reproduced many details of the legacy MATLAB
figures but did not validate every registered plot at the production 250×250
sweep resolution. The follow-up review found color-scale collisions,
comparison rasters whose colored edge disagreed with the exported composite
boundary, stair-stepped design-screen lines, detached or incorrectly directed
hatches, missing isolines, and contour labels that Plotly could rotate by
180 degrees.

Two source conflicts require an explicit resolution:

- The current paper describes the air-side model consistently as VDI G7
  (`source_materials/main.tex`, `03_results.tex`, `05_discussion.tex`, and
  `06_conclusions.tex`). The legacy MATLAB source additionally exports a
  simple inlet-diameter Reynolds diagnostic as Figure 07 beside the VDI G7
  diagnostic as Figure 08. Under the repository source order, the paper's VDI
  G7 convention is authoritative for the public plot catalog.
- The legacy MATLAB design-boundary parameter specifies a local hatch angle of
  35 degrees (`Waermedurchgang_V10_physical.m`, parameter block around lines
  227–230). The maintainer's accepted visual requirement specifies 45 degrees
  relative to each local boundary tangent and requires every stroke to point
  into the rejected side.

The renderer's internal `PlotFamily` values remain useful adapter metadata,
but grouping the user-facing selector by heatmap/grid/ratio mechanics does not
express the scientific question answered by a plot.

## Decision

1. Remove `reynolds-air-simple-map` from the public frontend registry and
   catalog. Retain the existing core result field for contract compatibility;
   the only public air-side Reynolds plot is the paper-consistent VDI G7 map.
2. Group the result-plot selector by scientific topic: thermal performance,
   thermal-resistance attribution, geometry and tube packing, flow regimes and
   hydraulics, mechanical integrity, manufacturing limits and cost, and
   feasibility and material comparison. Rendering family never determines
   user-facing order.
3. Draw every active design-screen boundary from its continuous exported
   result field at the threshold in the current validated request. Extract the
   native-grid threshold contour with marching squares. Draw each hatch from
   its exact contour start point, at 45 degrees to the local tangent, toward a
   side verified by the corresponding rejected-side predicate. Do not contour
   resampled binary masks.
4. Clip all comparison rasters to the exported composite PA boundary
   (`boundary_wall_ratio` against `boundary_right_diameter`). A
   nearest-neighbour extension may close only the sub-cell band between that
   dense exported boundary and the first finite native comparison sample; an
   exact white boundary polygon then cuts the displayed raster. This policy is
   presentation-only and never modifies `SimulationResult` arrays or exported
   scientific data.
5. Draw isolines for every continuous map, including app-only diagnostic maps
   that the legacy MATLAB script left without explicit contour levels. The
   categorical feasibility mask remains the sole isoline exception.
6. Disable Plotly's automatic contour labels. Use deterministic annotations
   whose angle follows the local tangent and is normalized to the upright
   interval from −90 to +90 degrees. Give labels an opaque clearance and place
   them with collision checks against other labels, plot edges, reference
   markers, and cross-section sketches. Dense fields may label a representative
   subset while retaining every contour line. In the narrow Figure-22 band the
   +25-percent contour is intentionally unlabelled because four inline labels
   cannot fit without overlap; the line remains visible.
7. Select color-scale ticks by the bar's physical length and estimated label
   extent. Reserve explicit physical gaps between horizontal bars, ticks, and
   titles, and account for the width of scientific-notation ticks when placing
   vertical titles.
8. Treat an exhaustive full-resolution visual audit as an acceptance gate.
   The audit renders every registered plot and material/layout variant,
   captures screenshots, and rejects text collisions, colorbar intersections,
   or clipped SVG text. Contact-sheet review remains a required human check in
   addition to DOM geometry assertions.

## Consequences

- The public registry contains 37 plot IDs instead of 38. This is a
  presentation-catalog removal, not a breaking computation-contract change.
- User navigation describes physical meaning and remains independent of
  Plotly implementation details.
- Screen-line and comparison-edge rendering becomes more accurate without
  interpolating, clipping, or calibrating scientific values in the core.
- Isoline density and labelled-isoline density are deliberately separate.
  A readable representative label set is preferable to overlapping labels;
  every underlying selected contour path is still rendered.
- The local 45-degree hatch convention intentionally supersedes the legacy
  35-degree parameter. Any future change to this angle or rejected-side policy
  requires an ADR update.
- `tests/e2e/plot-visual-audit.spec.ts` is opt-in because one Chromium run at
  the paper-default 250×250 resolution takes about five minutes. CI or release
  validation enables it with `PLOT_VISUAL_AUDIT=1`.

## Evidence

- Current-paper model statements: `source_materials/main.tex:137-138`,
  `source_materials/03_results.tex:71`,
  `source_materials/05_discussion.tex:79-81`, and
  `source_materials/06_conclusions.tex:10`.
- Legacy conflict: `source_materials/Waermedurchgang_V10_physical.m:843-853`
  exports both Reynolds diagnostics; lines 227–230 configure 35-degree
  hatching.
- Geometry unit tests: `pnpm exec vitest run
  tests/frontend/boundary-geometry.test.ts tests/frontend/plot-spec.test.ts`.
- Exhaustive visual gate: `$env:PLOT_VISUAL_AUDIT='1'; pnpm exec playwright
  test tests/e2e/plot-visual-audit.spec.ts --project=chromium` — 37 IDs,
  66 screenshots, full 250×250 sweep, passed 2026-07-13 in 4.7 minutes.
- Manual review: four contact sheets assembled from those 66 screenshots and
  inspected for axes, color scales, fills, isolines, labels, overlays,
  hatching, and clipping.
