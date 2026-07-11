import type { PlotlyConfig, PlotlyData, PlotlyLayout } from "plotly.js-dist-min";
import type { SimulationWorkerResult } from "../../workers/protocol";
import type { EmbeddedReportFigure } from "./reportExport";
import { plotById, type PlotId } from "../plots/plotRegistry";
import {
  axisMillimeters,
  colorDomainForPlot,
  createPlotSpec,
  fieldForPlot,
  matrixFromArray,
  overlayTracesForPlot,
  statusMatrixForPlot,
  titleScopeForPlot,
  type CoolerKey,
} from "../plots/plotSpec";

export type ReportFigureSelection = {
  plotId: PlotId;
  cooler: CoolerKey;
};

export type ReportFigureSpec = {
  figure: Omit<EmbeddedReportFigure, "data_uri" | "format">;
  spec: {
    config: PlotlyConfig;
    data: PlotlyData[];
    layout: PlotlyLayout;
  };
};

export const defaultReportFigureSelections = [
  { cooler: "cooler_left", plotId: "overall-coefficient-map" },
  { cooler: "cooler_right", plotId: "overall-coefficient-map" },
  { cooler: "cooler_left", plotId: "design-boundary-lines" },
  { cooler: "cooler_right", plotId: "design-boundary-lines" },
  { cooler: "cooler_left", plotId: "friction-pressure-drop-map" },
  { cooler: "cooler_right", plotId: "friction-pressure-drop-map" },
  { cooler: "cooler_right", plotId: "same-geometry-ratio-value" },
] as const satisfies readonly ReportFigureSelection[];

export async function captureReportFigures(
  result: SimulationWorkerResult,
  selections: readonly ReportFigureSelection[] = defaultReportFigureSelections,
): Promise<EmbeddedReportFigure[]> {
  const { default: Plotly } = await import("plotly.js-dist-min");
  const element = document.createElement("div");
  element.id = "microtube-report-figure-capture";
  element.style.cssText = "position:fixed;left:-10000px;top:0;width:900px;height:650px;";
  document.body.append(element);
  const figures: EmbeddedReportFigure[] = [];

  try {
    for (const selection of selections) {
      const reportSpec = createReportFigureSpec(result, selection);
      if (!reportSpec) continue;
      await Plotly.newPlot(element, reportSpec.spec.data, reportSpec.spec.layout, {
        ...reportSpec.spec.config,
        responsive: false,
      });
      const dataUri = await Plotly.toImage(element, {
        format: "svg",
        height: 650,
        scale: 1,
        width: 900,
      });
      figures.push({
        ...reportSpec.figure,
        data_uri: dataUri,
        format: "svg",
      });
      Plotly.purge(element);
    }
  } finally {
    Plotly.purge(element);
    element.remove();
  }

  return figures;
}

export function createReportFigureSpec(
  result: SimulationWorkerResult,
  selection: ReportFigureSelection,
): ReportFigureSpec | undefined {
  const plot = plotById(selection.plotId);
  const field = fieldForPlot(result.payload, selection.plotId, selection.cooler);
  const array = field ? result.arrays[field.buffer_index] : undefined;
  const zValues = matrixFromArray(array, field);
  if (!field || !array || !zValues) return undefined;

  const titleScope = titleScopeForPlot(result.payload, plot, selection.cooler);
  const sharedColorDomain =
    plot.source === "comparison"
      ? undefined
      : colorDomainForPlot(result.payload, result.arrays, selection.plotId, [
          "cooler_left",
          "cooler_right",
        ]);
  const statusValues = statusMatrixForPlot(result.payload, result.arrays, plot, selection.cooler);
  const spec = createPlotSpec({
    colorDomain: sharedColorDomain,
    cooler: selection.cooler,
    field,
    overlays: overlayTracesForPlot(result.payload, result.arrays, plot, selection.cooler),
    plot,
    provenance: result.payload.provenance,
    statusValues,
    titleScope,
    xValues: axisMillimeters(result.payload.outer_diameter_axis),
    yValues: axisMillimeters(result.payload.wall_thickness_axis),
    zValues,
  });

  return {
    figure: {
      alt: plot.description,
      description: `${plot.description} Values are read from SimulationResult and exported as SVG.`,
      plot_id: plot.id,
      scope: titleScope,
      title: `${plot.title} - ${titleScope}`,
    },
    spec,
  };
}
