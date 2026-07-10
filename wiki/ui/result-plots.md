# Result plot conventions

Milestone M6 implements result plots as a frontend adapter over
`SimulationResult`. Plot code must not recompute physics, derive alternate
screen masks, or apply hidden calibration. Values come from registered result
fields and transferred `Float64Array` buffers produced by the Python worker.

## Current rendering slice

- `src/features/plots/plotRegistry.ts` owns stable plot IDs, display titles,
  field names, units, source (`cooler` or `comparison`), and family metadata.
- `src/features/plots/PlotFigure.tsx` renders heatmap traces with Plotly from
  `SimulationResult` field metadata and buffer indices.
- `src/features/plots/ResultPlotsTab.tsx` owns the user workflow for running the
  worker simulation, selecting a registered plot, selecting a cooler when the
  plot is cooler-scoped, and showing scalar KPI summaries.
- No WebGL trace family is allowed in the registry because SVG export is an M7
  requirement.

## Open M6 requirements

- Boundary overlays, minimum-wall lines, benchmark markers, tandem scaling, and
  full MATLAB plot-family coverage are still open.
- Current figure export uses Plotly's built-in PNG modebar path only. The M7
  export system must provide explicit PNG and SVG export with provenance.
- Detailed figure descriptions and tabular grid access remain part of the M6/M8
  accessibility work.
