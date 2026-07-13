# Result plot conventions

Result figures are presentation adapters over one immutable
`SimulationResult`. No physical correlation, empirical fit, screen derivation,
or calibration is implemented in TypeScript.

## Rendering pipeline

- `plotRegistry.ts` owns stable approved IDs and field bindings.
- `plotPresentation.ts` owns display units, fixed limits, contour levels,
  masking policies, line policies and reversed variants from the MATLAB
  `params` block.
- `colormap.ts` contains the exact provenance-documented 256×3
  `slanCM('spectral')` table dumped from MATLAB R2024b.
- `paperLayout.ts` records each MATLAB figure and axes rectangle in
  centimetres and derives one paper-zoom factor from the available width.
- `plotSpec.ts` converts SI values at the display boundary, applies exported
  masks, performs the ADR-0007 τ display transform, and builds SVG-compatible
  heatmap, contour and scatter traces.
- `compositePlotSpec.ts` builds the shared-colorbar kA portrait, burst-
  tolerance grid, capillary-rise grid, resistance-share grid and two-panel
  design-boundary summary.

The result selector is grouped by scientific question rather than adapter
family: thermal performance, resistance attribution, geometry and tube
packing, flow regimes and hydraulics, mechanical integrity, manufacturing
limits and cost, and feasibility/material comparison. The simple
inlet-diameter air Reynolds diagnostic is not public; the current paper's VDI
G7 Reynolds map is the sole air-side regime plot (ADR-0011).

All design-space maps use `d_o` from 0.1 to 10 mm on a logarithmic x-axis and
τ from 0 to 40 % on a linear y-axis. Only 0.1, 1 and 10 are labelled on x.
Map values are interpolated only between adjacent finite native-grid samples;
binary masks and statuses use nearest-neighbour display placement.

## Figure semantics

- Log families plot `log10` of positive display-unit values and label the
  colorbar in physical values. NaN and non-positive log cells remain white.
- k, kA and burst domains are shared across both coolers using the MATLAB
  1/99-percentile robust-limit policy. Fixed paper domains are registry data.
- Ordinary maps show only their approved technology curves, a distinct request
  design point, the validated aluminum X where applicable, labelled iso-lines
  and the nine tube cross-section sketches. Screen contours are restricted to
  the design-boundary summary.
- Reynolds maps include a black dashed Re = 2300 transition.
- Design-boundary fill is clipped to all-screen-feasible cells. Active screen
  contours are extracted from continuous exported fields at the current
  request thresholds instead of resampled binary masks. Fixed-color hatch
  strokes start exactly on each contour, form 45 degrees with the local
  tangent, and point into the predicate-verified rejected side. The legend is
  separated below the panels; values, fills and result masks are unchanged.
- Every continuous map receives isolines, including app-only diagnostics that
  old MATLAB exports omitted. The binary feasibility mask is the sole
  categorical exception.
- Capillary-rise maps and their grid use the MATLAB `flipud` spectral
  orientation. The capillary grid omits the validated-reference X; burst and
  resistance-share grids retain it according to their approved exports.
- Plotly automatic contour labels are disabled. Deterministic annotations are
  interpolated on the displayed contour, normalized to an upright local
  tangent, cleared from the line, and placed against label/edge/marker/sketch
  collision boxes. Dense fields retain all isolines but label only a readable
  subset; they never change field values.
- Vertical colorbar labels read bottom-up. Reversed horizontal bars use an
  invisible carrier trace, with their title and tick labels drawn as figure
  annotations. Tick selection adapts to physical bar length and label extent;
  reserved gaps prevent values, bars, titles and axes from colliding.
- Comparison heatmaps terminate at the dense exported composite PA boundary.
  A nearest-neighbour edge extension closes only a sub-cell display gap, and
  a white polygon cuts the raster at the exact curve. Result arrays and data
  exports remain untouched.
- Figure canvases use Times-compatible serif typography and omit descriptive
  in-figure titles. The accessible HTML heading/caption supplies the title and
  detailed description.
- Every canvas keeps the source figure's centimetre geometry. Margins, fonts,
  strokes, markers and bars share the same responsive scale, preserving axes
  aspect ratios and round cross-section sketches at narrow and wide layouts.

## Accessibility and export

Every figure has an accessible image label, detailed caption, tabular numeric
summary where applicable, and explicit PNG/SVG controls. Provenance is placed
in a dedicated footer band. Report capture uses the same tested specs and a
paper-like fixed geometry; standalone HTML keeps machine JSON available on
screen but excludes it from print. Image export renders a fresh zoom-1 spec;
the standard 16.5×13.2 cm single map is therefore 624×499 px at 96 dpi, while
grids and portrait figures retain their own MATLAB-derived dimensions.

An opt-in Chromium audit (`PLOT_VISUAL_AUDIT=1`) runs the paper-default 250×250
sweep, captures every registered plot/material/layout variant, and rejects
text collisions, colorbar intersections, and clipped SVG text. Completion of
visual plot work additionally requires manual review of the resulting contact
sheets rather than relying on spot checks.
