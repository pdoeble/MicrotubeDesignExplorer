import type { GridFieldRef } from "../../contracts/generated/simulation-result";
import type { SimulationWorkerResult } from "../../workers/protocol";
import type { PlotlyData, PlotlyLayout } from "plotly.js-dist-min";
import { plotById, type PlotId } from "./plotRegistry";
import {
  axisMillimeters,
  colorDomainForPlot,
  createPlotSpec,
  maskMatrixForPlot,
  matrixFromArray,
  overlayTracesForPlot,
  provenanceFooter,
  type CoolerKey,
  type PlotSpec,
} from "./plotSpec";

type PanelDefinition = { cooler: CoolerKey; field: string; title: string };

const PANEL_DEFINITIONS: Record<string, readonly PanelDefinition[]> = {
  "bundle-conductance-map": [
    { cooler: "cooler_left", field: "bundle_conductance", title: "Aluminum" },
    { cooler: "cooler_right", field: "bundle_conductance", title: "PA" },
  ],
  "burst-tolerance-grid": [
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
  "capillary-rise-grid": [
    { cooler: "cooler_left", field: "capillary_rise_1g", title: "h_Al, 1g" },
    { cooler: "cooler_right", field: "capillary_rise_1g", title: "h_PA, 1g" },
    { cooler: "cooler_left", field: "capillary_rise_5g", title: "h_Al, 5g" },
    { cooler: "cooler_right", field: "capillary_rise_5g", title: "h_PA, 5g" },
    { cooler: "cooler_left", field: "capillary_rise_10g", title: "h_Al, 10g" },
    { cooler: "cooler_right", field: "capillary_rise_10g", title: "h_PA, 10g" },
  ],
  "resistance-shares-grid": [
    { cooler: "cooler_left", field: "resistance_share_inner", title: "φ<sub>i,Al</sub>" },
    { cooler: "cooler_right", field: "resistance_share_inner", title: "φ<sub>i,PA</sub>" },
    { cooler: "cooler_left", field: "resistance_share_wall", title: "φ<sub>w,Al</sub>" },
    { cooler: "cooler_right", field: "resistance_share_wall", title: "φ<sub>w,PA</sub>" },
    { cooler: "cooler_left", field: "resistance_share_outer", title: "φ<sub>o,Al</sub>" },
    { cooler: "cooler_right", field: "resistance_share_outer", title: "φ<sub>o,PA</sub>" },
  ],
  "design-boundary-lines": [
    { cooler: "cooler_left", field: "bundle_conductance", title: "Aluminum" },
    { cooler: "cooler_right", field: "bundle_conductance", title: "PA" },
  ],
};

export function isCompositePlot(plotId: PlotId): boolean {
  return [
    "burst-tolerance-grid",
    "capillary-rise-grid",
    "resistance-shares-grid",
    "design-boundary-lines",
  ].includes(plotId);
}

export function createCompositePlotSpec(
  result: SimulationWorkerResult,
  plotId: PlotId,
): PlotSpec | undefined {
  const panels = PANEL_DEFINITIONS[plotId];
  if (!panels) return undefined;
  const plot = plotById(plotId);
  const columns = ["design-boundary-lines", "bundle-conductance-map"].includes(plotId) ? 1 : 2;
  const rows = Math.ceil(panels.length / columns);
  const colorDomain = colorDomainForPlot(result.payload, result.arrays, plotId, [
    "cooler_left",
    "cooler_right",
  ]);
  const data: PlotlyData[] = [];
  const annotations: Array<Record<string, unknown>> = [];
  const layout: PlotlyLayout = {
    annotations,
    font: { color: "#1a1a1a", family: "Times New Roman, STIXGeneral, serif", size: 14 },
    height: rows * 390 + 120,
    legend: { orientation: "h", x: 0, y: -0.04 },
    margin: { b: plotId === "design-boundary-lines" ? 150 : 80, l: 80, r: 45, t: 90 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    showlegend: plotId === "design-boundary-lines",
  };
  const xValues = axisMillimeters(result.payload.outer_diameter_axis);
  const yValues = axisMillimeters(result.payload.wall_thickness_axis);

  panels.forEach((panel, index) => {
    const field = result.payload[panel.cooler].fields.find(
      (candidate) => candidate.name === panel.field,
    );
    const raw = field ? matrixFromArray(result.arrays[field.buffer_index], field) : undefined;
    if (!field || !raw) return;
    const masked = maskMatrixForPlot(result.payload, result.arrays, plot, panel.cooler, raw);
    const panelSpec = createPlotSpec({
      colorDomain,
      cooler: panel.cooler,
      field: gridField(field, plotId),
      overlays: overlayTracesForPlot(result.payload, result.arrays, plot, panel.cooler),
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
      trace.xaxis = `x${axisSuffix}`;
      trace.yaxis = `y${axisSuffix}`;
      const isFill = trace.type === "heatmap";
      if (isFill && index > 0) trace.showscale = false;
      if (index > 0) trace.showlegend = false;
      if (isFill && index === 0 && trace.colorbar) {
        trace.colorbar.orientation = "h";
        trace.colorbar.x = 0.5;
        trace.colorbar.y = 1.08;
        trace.colorbar.len = 0.82;
        trace.colorbar.thickness = 14;
      }
      data.push(trace);
    }
    const column = index % columns;
    const row = Math.floor(index / columns);
    const xDomain =
      columns === 1
        ? ([0.08, 0.96] as [number, number])
        : column === 0
          ? ([0.04, 0.47] as [number, number])
          : ([0.55, 0.98] as [number, number]);
    const rowHeight = 0.82 / rows;
    const top = 0.94 - row * rowHeight;
    const yDomain: [number, number] = [top - rowHeight + 0.055, top];
    const xAxis = {
      domain: xDomain,
      range: [-1, 1] as [number, number],
      tickmode: "array" as const,
      ticktext: ["0.1", "1", "10"],
      tickvals: [0.1, 1, 10],
      title: {
        text:
          plotId !== "design-boundary-lines" && row === rows - 1
            ? "Outer diameter, <i>d</i><sub>o</sub> [mm]"
            : "",
      },
      type: "log" as const,
    };
    const yAxis = {
      domain: yDomain,
      dtick: 10,
      range: [0, 40] as [number, number],
      tick0: 0,
      tickmode: "linear" as const,
      title: { text: column === 0 ? "Wall-thickness ratio, τ [%]" : "" },
      type: "linear" as const,
    };
    if (axisNumber === 1) {
      layout.xaxis = xAxis;
      layout.yaxis = yAxis;
    } else {
      layout[`xaxis${axisNumber}`] = xAxis;
      layout[`yaxis${axisNumber}`] = yAxis;
    }
    annotations.push({
      font: { family: "Times New Roman, STIXGeneral, serif", size: 15 },
      showarrow: false,
      text: panel.title,
      x: (xDomain[0] + xDomain[1]) / 2,
      xref: "paper",
      y: yDomain[1] + 0.012,
      yref: "paper",
    });
  });
  annotations.push({
    font: { color: "#444444", family: "Times New Roman, STIXGeneral, serif", size: 10 },
    showarrow: false,
    text: provenanceFooter(result.payload.provenance),
    x: 0,
    xanchor: "left",
    xref: "paper",
    y: -0.1,
    yref: "paper",
  });
  if (plotId === "design-boundary-lines") {
    annotations.push({
      font: { family: "Times New Roman, STIXGeneral, serif", size: 14 },
      showarrow: false,
      text: "Outer diameter, <i>d</i><sub>o</sub> [mm]",
      x: 0.52,
      xref: "paper",
      y: 0.1,
      yref: "paper",
    });
  }
  return {
    config: { displaylogo: false, responsive: true },
    data,
    layout,
  };
}

function gridField(field: GridFieldRef, plotId: PlotId): GridFieldRef {
  if (plotId === "burst-tolerance-grid") return { ...field, unit: "bar" };
  if (plotId === "capillary-rise-grid") return { ...field, unit: "mm" };
  return field;
}
