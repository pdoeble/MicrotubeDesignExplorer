import type { PlotlyConfig, PlotlyData, PlotlyLayout } from "plotly.js-dist-min";
import type { SimulationRequest } from "../../contracts/generated/simulation-request";
import type { SimulationWorkerResult } from "../../workers/protocol";
import type { EmbeddedReportFigure } from "./reportExport";
import { createCompositePlotSpec, isCompositePlot } from "../plots/compositePlotSpec";
import { plotById, type PlotId } from "../plots/plotRegistry";
import {
  axisMillimeters,
  colorDomainForPlot,
  comparisonBoundaryForResult,
  createPlotSpec,
  fieldForPlot,
  maskMatrixForPlot,
  matrixFromArray,
  overlayTracesForPlot,
  plotDomainForRequest,
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
  { cooler: "cooler_left", plotId: "bundle-conductance-map" },
  { cooler: "cooler_left", plotId: "design-boundary-lines" },
  { cooler: "cooler_right", plotId: "tech-adjusted-delta-ka" },
  { cooler: "cooler_left", plotId: "resistance-shares-grid" },
  { cooler: "cooler_left", plotId: "burst-tolerance-grid" },
  { cooler: "cooler_left", plotId: "capillary-rise-grid" },
] as const satisfies readonly ReportFigureSelection[];

export async function captureReportFigures(
  result: SimulationWorkerResult,
  selections: readonly ReportFigureSelection[] = defaultReportFigureSelections,
  request?: SimulationRequest,
): Promise<EmbeddedReportFigure[]> {
  const { default: Plotly } = await import("plotly.js-dist-min");
  const element = document.createElement("div");
  element.id = "microtube-report-figure-capture";
  element.style.cssText = "position:fixed;left:-10000px;top:0;width:900px;height:650px;";
  document.body.append(element);
  const figures: EmbeddedReportFigure[] = [];

  try {
    for (const selection of selections) {
      const reportSpec = createReportFigureSpec(result, selection, request);
      if (!reportSpec) continue;
      await Plotly.newPlot(element, reportSpec.spec.data, reportSpec.spec.layout, {
        ...reportSpec.spec.config,
        responsive: false,
      });
      const dataUri = await Plotly.toImage(element, {
        format: "svg",
        height: reportSpec.spec.layout.height ?? 720,
        scale: 1,
        width: reportSpec.spec.layout.width ?? 900,
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
  request?: SimulationRequest,
): ReportFigureSpec | undefined {
  const plot = plotById(selection.plotId);
  const composite = createCompositePlotSpec(result, selection.plotId, undefined, request);
  if (
    composite &&
    (isCompositePlot(selection.plotId) || selection.plotId === "bundle-conductance-map")
  ) {
    return {
      figure: {
        alt: plot.description,
        description: `${plot.description} Values use the units shown on the axes and color scale.`,
        plot_id: plot.id,
        scope: "Both coolers",
        title: plot.title,
      },
      spec: composite,
    };
  }
  const field = fieldForPlot(result.payload, selection.plotId, selection.cooler);
  const array = field ? result.arrays[field.buffer_index] : undefined;
  const rawValues = matrixFromArray(array, field);
  if (!field || !array || !rawValues) return undefined;
  const zValues = maskMatrixForPlot(
    result.payload,
    result.arrays,
    plot,
    selection.cooler,
    rawValues,
  );

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
    comparisonBoundary:
      plot.source === "comparison"
        ? comparisonBoundaryForResult(result.payload, result.arrays)
        : undefined,
    cooler: selection.cooler,
    domain: plotDomainForRequest(request),
    field,
    overlays: overlayTracesForPlot(
      result.payload,
      result.arrays,
      plot,
      selection.cooler,
      undefined,
      request,
    ),
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
      description: `${plot.description} Values use the units shown on the axes and color scale.`,
      plot_id: plot.id,
      scope: titleScope,
      title: `${plot.title} - ${titleScope}`,
    },
    spec,
  };
}
