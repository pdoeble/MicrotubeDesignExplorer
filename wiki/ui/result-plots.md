# Result plot conventions

Result figures are presentation adapters over one immutable
`SimulationResult`. No physical correlation, empirical fit, screen derivation,
or calibration is implemented in TypeScript.

## Rendering pipeline

- `plotRegistry.ts` owns stable approved IDs and field bindings.
- `plotPresentation.ts` owns display units, fixed limits, contour levels,
  masking policies, line policies and reversed variants from the MATLAB
  `params` block.
- `colormap.ts` contains the provenance-documented project spectral colors
  recovered from the approved MATLAB SVG.
- `plotSpec.ts` converts SI values at the display boundary, applies exported
  masks, performs the ADR-0007 τ display transform, and builds SVG-compatible
  heatmap, contour and scatter traces.
- `compositePlotSpec.ts` builds the shared-colorbar kA portrait, burst-
  tolerance grid, capillary-rise grid, resistance-share grid and two-panel
  design-boundary summary.

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
- Design-boundary fill is clipped to all-screen-feasible cells. Its six screen
  contours use fixed colors and short hatch strokes on the violating side; its
  legend is separated below the panels.
- Figure canvases use Times-compatible serif typography and omit descriptive
  in-figure titles. The accessible HTML heading/caption supplies the title and
  detailed description.

## Accessibility and export

Every figure has an accessible image label, detailed caption, tabular numeric
summary where applicable, and explicit PNG/SVG controls. Provenance is placed
in a dedicated footer band. Report capture uses the same tested specs and a
paper-like fixed geometry; standalone HTML keeps machine JSON available on
screen but excludes it from print.
