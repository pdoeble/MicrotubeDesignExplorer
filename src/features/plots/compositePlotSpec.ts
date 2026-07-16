import type { SimulationWorkerResult } from "../../workers/protocol";
import type { SimulationRequest } from "../../contracts/generated/simulation-request";
import type { PlotlyData, PlotlyLayout } from "plotly.js-dist-min";
import { projectSpectral, projectSpectralReversed } from "./colormap";
import { plotById, type PlotId } from "./plotRegistry";
import { presentationForPlot } from "./plotPresentation";
import {
  BUNDLE_KA_PORTRAIT,
  BURST_GRID,
  CAPILLARY_GRID,
  DESIGN_BOUNDARY,
  paperMargins,
  SHARES_GRID,
  type PaperFigureGeometry,
} from "./paperLayout";
import {
  axisMillimeters,
  colorbarCarrierTrace,
  colorbarSpec,
  colorDomainForPlot,
  createPlotSpec,
  horizontalBarTickAnnotations,
  maskMatrixForPlot,
  matrixFromArray,
  overlayTracesForPlot,
  paperContext,
  plotDomainForRequest,
  PLOT_FONT,
  provenanceFooter,
  screenBoundaryDefinitions,
  type CoolerKey,
  type PlotSpec,
} from "./plotSpec";

type PanelDefinition = { cooler: CoolerKey; field: string; title: string };

type CompositeDefinition = {
  geometry: PaperFigureGeometry;
  panels: readonly PanelDefinition[];
  /** MATLAB reverseColorbarScale on the shared top bar. */
  reversedColorbar: boolean;
};

const COMPOSITE_DEFINITIONS: Partial<Record<string, CompositeDefinition>> = {
  "bundle-conductance-map": {
    geometry: BUNDLE_KA_PORTRAIT,
    panels: [
      { cooler: "cooler_left", field: "bundle_conductance", title: "Aluminum" },
      { cooler: "cooler_right", field: "bundle_conductance", title: "PA" },
    ],
    reversedColorbar: true,
  },
  "burst-tolerance-grid": {
    geometry: BURST_GRID,
    panels: [
      {
        cooler: "cooler_left",
        field: "burst_pressure_tolerance_standard",
        title: "Aluminum, standard",
      },
      { cooler: "cooler_right", field: "burst_pressure_tolerance_standard", title: "PA, standard" },
      {
        cooler: "cooler_left",
        field: "burst_pressure_tolerance_medical",
        title: "Aluminum, medical",
      },
      { cooler: "cooler_right", field: "burst_pressure_tolerance_medical", title: "PA, medical" },
    ],
    reversedColorbar: false,
  },
  "capillary-rise-grid": {
    geometry: CAPILLARY_GRID,
    panels: [
      { cooler: "cooler_left", field: "capillary_rise_1g", title: "<i>h</i><sub>Al,1 g</sub>" },
      { cooler: "cooler_right", field: "capillary_rise_1g", title: "<i>h</i><sub>PA,1 g</sub>" },
      { cooler: "cooler_left", field: "capillary_rise_5g", title: "<i>h</i><sub>Al,5 g</sub>" },
      { cooler: "cooler_right", field: "capillary_rise_5g", title: "<i>h</i><sub>PA,5 g</sub>" },
      { cooler: "cooler_left", field: "capillary_rise_10g", title: "<i>h</i><sub>Al,10 g</sub>" },
      { cooler: "cooler_right", field: "capillary_rise_10g", title: "<i>h</i><sub>PA,10 g</sub>" },
    ],
    reversedColorbar: true,
  },
  "resistance-shares-grid": {
    geometry: SHARES_GRID,
    panels: [
      { cooler: "cooler_left", field: "resistance_share_inner", title: "<i>φ</i><sub>i,Al</sub>" },
      { cooler: "cooler_right", field: "resistance_share_inner", title: "<i>φ</i><sub>i,PA</sub>" },
      { cooler: "cooler_left", field: "resistance_share_wall", title: "<i>φ</i><sub>w,Al</sub>" },
      { cooler: "cooler_right", field: "resistance_share_wall", title: "<i>φ</i><sub>w,PA</sub>" },
      { cooler: "cooler_left", field: "resistance_share_outer", title: "<i>φ</i><sub>o,Al</sub>" },
      { cooler: "cooler_right", field: "resistance_share_outer", title: "<i>φ</i><sub>o,PA</sub>" },
    ],
    reversedColorbar: false,
  },
  "design-boundary-lines": {
    geometry: DESIGN_BOUNDARY,
    panels: [
      { cooler: "cooler_left", field: "bundle_conductance", title: "Aluminum" },
      { cooler: "cooler_right", field: "bundle_conductance", title: "PA" },
    ],
    reversedColorbar: true,
  },
};

export function isCompositePlot(plotId: PlotId): boolean {
  return [
    "burst-tolerance-grid",
    "capillary-rise-grid",
    "resistance-shares-grid",
    "design-boundary-lines",
  ].includes(plotId);
}

export function compositeGeometry(plotId: PlotId): PaperFigureGeometry | undefined {
  return COMPOSITE_DEFINITIONS[plotId]?.geometry;
}

export function createCompositePlotSpec(
  result: SimulationWorkerResult,
  plotId: PlotId,
  widthPx?: number,
  request?: SimulationRequest,
): PlotSpec | undefined {
  const definition = COMPOSITE_DEFINITIONS[plotId];
  if (!definition) return undefined;
  const plot = plotById(plotId);
  const presentation = presentationForPlot(plot);
  const paper = paperContext(definition.geometry, widthPx);
  const plotDomain = plotDomainForRequest(request);
  const { geometry, zoom } = paper;
  const { margin, panelDomains, plotAreaCm } = paperMargins(geometry);
  const columns = new Set(geometry.axesCm.map((rect) => rect[0])).size;
  const rows = geometry.axesCm.length / columns;

  const colorDomain = colorDomainForPlot(result.payload, result.arrays, plotId, [
    "cooler_left",
    "cooler_right",
  ]);
  const data: PlotlyData[] = [];
  const annotations: Array<Record<string, unknown>> = [];
  const paperX = (cm: number): number => (cm - margin.l) / plotAreaCm[0];
  const paperY = (cm: number): number => (cm - margin.b) / plotAreaCm[1];
  const baseFont = {
    color: "#262626",
    family: PLOT_FONT,
    size: zoom.pt(geometry.baseFontPt),
  };
  // Extra bottom band below the MATLAB geometry so the provenance footer
  // never collides with the figure-wide x label (the paper has no footer).
  const footerBandCm = 0.6;
  const layout: PlotlyLayout = {
    annotations,
    font: baseFont,
    height: Math.round(zoom.height + zoom.cm(footerBandCm)),
    margin: {
      b: Math.round(zoom.cm(margin.b + footerBandCm)),
      l: Math.round(zoom.cm(margin.l)),
      r: Math.round(zoom.cm(margin.r)),
      t: Math.round(zoom.cm(margin.t)),
    },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    showlegend: false,
    width: Math.round(zoom.width),
  };
  const xValues = axisMillimeters(result.payload.outer_diameter_axis);
  const yValues = axisMillimeters(result.payload.wall_thickness_axis);

  definition.panels.forEach((panel, index) => {
    const field = result.payload[panel.cooler].fields.find(
      (candidate) => candidate.name === panel.field,
    );
    const raw = field ? matrixFromArray(result.arrays[field.buffer_index], field) : undefined;
    const domains = panelDomains[index];
    if (!field || !raw || !domains) return;
    const masked = maskMatrixForPlot(result.payload, result.arrays, plot, panel.cooler, raw);
    const panelSpec = createPlotSpec({
      colorDomain,
      cooler: panel.cooler,
      domain: plotDomain,
      field,
      overlays: overlayTracesForPlot(
        result.payload,
        result.arrays,
        plot,
        panel.cooler,
        paper,
        request,
      ),
      paper,
      plot,
      provenance: result.payload.provenance,
      titleScope: panel.title,
      xValues,
      yValues,
      zValues: masked,
    });
    const axisNumber = index + 1;
    const axisSuffix = axisNumber === 1 ? "" : String(axisNumber);
    for (const trace of panelSpec.data) {
      // The shared colorbar is added once below; panel traces stay bare.
      if (trace.type === "heatmap") trace.showscale = false;
      if (trace.type === "scatter" && trace.marker && "showscale" in trace.marker) continue;
      trace.xaxis = `x${axisSuffix}`;
      trace.yaxis = `y${axisSuffix}`;
      trace.showlegend = false;
      data.push(trace);
    }
    // Preserve only data-bound annotations (manual contour labels/callouts)
    // from the single-panel adapter; figure labels and provenance are rebuilt
    // once below for the composite geometry.
    for (const annotation of panelSpec.layout.annotations ?? []) {
      if (annotation.xref !== "x" || annotation.yref !== "y") continue;
      annotations.push({
        ...annotation,
        xref: `x${axisSuffix}`,
        yref: `y${axisSuffix}`,
      });
    }
    const column = index % columns;
    const row = Math.floor(index / columns);
    const xAxis = {
      ...panelSpec.layout.xaxis,
      anchor: `y${axisSuffix}`,
      domain: [domains.x[0], domains.x[1]],
      showticklabels: row === rows - 1,
    };
    delete xAxis.title;
    const yAxis = {
      ...panelSpec.layout.yaxis,
      anchor: `x${axisSuffix}`,
      domain: [domains.y[0], domains.y[1]],
      showticklabels: column === 0,
    };
    delete yAxis.title;
    if (axisNumber === 1) {
      layout.xaxis = xAxis;
      layout.yaxis = yAxis;
    } else {
      layout[`xaxis${axisNumber}`] = xAxis;
      layout[`yaxis${axisNumber}`] = yAxis;
    }
    // MATLAB addPanelTitle at normalized y = 1.012 above each panel.
    annotations.push({
      font: baseFont,
      showarrow: false,
      text: panel.title,
      x: (domains.x[0] + domains.x[1]) / 2,
      xref: "paper",
      y: domains.y[1] + 0.012 * (domains.y[1] - domains.y[0]),
      yanchor: "bottom",
      yref: "paper",
    });
  });

  // Shared colorbar owned by an invisible carrier trace.
  if (colorDomain) {
    const bar = colorbarSpec(plot, colorDomain, paper);
    bar.title = { ...bar.title, text: "" };
    const scale = presentation.colormapReversed ? projectSpectralReversed : projectSpectral;
    data.push(colorbarCarrierTrace(colorDomain, scale, bar, definition.reversedColorbar));
    // MATLAB top bars carry their tick labels above the bar.
    const barTickValues = bar.tickvals ?? [colorDomain.zmin, colorDomain.zmax];
    const barTickLabels = bar.ticktext ?? barTickValues.map((value) => `${value}`);
    const span = colorDomain.zmax - colorDomain.zmin;
    annotations.push(
      ...horizontalBarTickAnnotations(
        geometry,
        zoom,
        barTickValues.map((value, index) => ({
          fraction: definition.reversedColorbar
            ? (colorDomain.zmax - value) / span
            : (value - colorDomain.zmin) / span,
          label: barTickLabels[index] ?? `${value}`,
        })),
      ),
    );
    // MATLAB writes the shared colorbar label as free figure text above the bar.
    const colorbarCm = geometry.colorbarCm;
    if (colorbarCm) {
      annotations.push({
        font: baseFont,
        showarrow: false,
        text: presentation.colorbarLabel,
        x: paperX(colorbarCm[0] + colorbarCm[2] / 2),
        xref: "paper",
        y: paperY(colorbarCm[1] + colorbarCm[3] + 0.9),
        yanchor: "bottom",
        yref: "paper",
      });
    }
  }

  // Figure-wide axis labels (MATLAB free text on an invisible axes layer).
  annotations.push(
    {
      font: baseFont,
      showarrow: false,
      text: "Outer diameter, <i>d</i><sub>o</sub> [mm]",
      x: 0.5,
      xref: "paper",
      y: -1.2 / plotAreaCm[1],
      yanchor: "middle",
      yref: "paper",
    },
    {
      font: baseFont,
      showarrow: false,
      text: "Wall-thickness ratio, <i>τ</i> = <i>t</i>/<i>d</i><sub>o</sub> [%]",
      textangle: -90,
      x: -1.5 / plotAreaCm[0],
      xref: "paper",
      y: 0.5,
      yanchor: "middle",
      yref: "paper",
    },
    {
      font: { color: "#666666", family: PLOT_FONT, size: zoom.pt(8) },
      showarrow: false,
      text: provenanceFooter(result.payload.provenance),
      x: -margin.l / plotAreaCm[0],
      xanchor: "left",
      xref: "paper",
      y: -(margin.b + footerBandCm - 0.12) / plotAreaCm[1],
      yanchor: "bottom",
      yref: "paper",
    },
  );

  return {
    config: { displaylogo: false, responsive: false },
    data,
    layout,
  };
}

/** Legend entries for the design-boundary screen lines (HTML block). */
export const designBoundaryLegendEntries = screenBoundaryDefinitions.map(({ color, label }) => ({
  color,
  label,
}));
