# Result plot conventions

Milestone M6 implements result plots as a frontend adapter over
`SimulationResult`. Plot code must not recompute physics, derive alternate
screen masks, or apply hidden calibration. Values come from registered result
fields and transferred `Float64Array` buffers produced by the Python worker.

## Current rendering slice

- `src/features/plots/plotRegistry.ts` owns stable plot IDs, display titles,
  field names, units, source (`cooler` or `comparison`), and family metadata.
- `src/features/plots/plotSpec.ts` owns testable Plotly trace/layout/config
  generation, row-major `Float64Array` to matrix conversion, compact
  provenance footer text, composite feasible-boundary overlays, design-point
  markers, minimum-wall lines, and image export options.
- `src/features/plots/PlotFigure.tsx` renders heatmap traces with Plotly from
  `SimulationResult` field metadata and buffer indices, then exposes explicit
  PNG and SVG figure export buttons.
- `src/features/plots/ResultPlotsTab.tsx` owns the user workflow for running the
  worker simulation, selecting a registered plot, selecting a cooler when the
  plot is cooler-scoped, switching cooler-scoped plots between single and
  tandem display, and showing scalar KPI summaries.
- No WebGL trace family is allowed in the registry because SVG export is an M7
  requirement.
- Exported figures include a provenance footer with contract version, core
  version, request hash, generation timestamp, and golden-reference identifier
  when present.
- Overlay traces are drawn only from `SimulationResult`: comparison boundary
  vectors plus cooler summary geometry/minimum-wall fields. For comparison
  plots, both coolers' overlays are shown; for cooler-scoped plots, only the
  selected cooler's overlays are shown.
- Tandem display renders the left and right cooler with a shared finite color
  domain computed from the selected `SimulationResult` fields. Comparison
  percent-delta plots use a symmetric diverging color domain around zero.

## Open M6 requirements

- Individual screen-boundary line families and full MATLAB plot-family coverage
  are still open.
- Detailed figure descriptions and tabular grid access remain part of the M6/M8
  accessibility work.
