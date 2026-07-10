import type {
  GridFieldRef,
  Provenance,
  SimulationResultPayload,
} from "../../contracts/generated/simulation-result";
import type { PlotlyConfig, PlotlyData, PlotlyLayout } from "plotly.js-dist-min";
import { plotById, type PlotDefinition, type PlotId } from "./plotRegistry";

export type CoolerKey = "cooler_left" | "cooler_right";
export type ImageFormat = "png" | "svg";

export type PlotImageOptions = {
  filename: string;
  format: ImageFormat;
  scale: number;
};

export type PlotSpec = {
  data: PlotlyData[];
  layout: PlotlyLayout;
  config: PlotlyConfig;
};

type PlotSpecInput = {
  cooler: CoolerKey;
  field: GridFieldRef;
  plot: PlotDefinition;
  provenance: Provenance;
  titleScope: string;
  xValues: number[];
  yValues: number[];
  zValues: number[][];
};

export const supportedImageFormats: readonly ImageFormat[] = ["png", "svg"] as const;

export function fieldForPlot(
  payload: SimulationResultPayload,
  plotId: PlotId,
  cooler: CoolerKey,
): GridFieldRef | undefined {
  const plot = plotById(plotId);
  const fields = plot.source === "comparison" ? payload.comparison.fields : payload[cooler].fields;
  return fields.find((field) => field.name === plot.field);
}

export function matrixFromArray(
  array: Float64Array | undefined,
  field: GridFieldRef | undefined,
): number[][] | undefined {
  if (!array || !field) return undefined;
  const [rowsRaw, columnsRaw] = field.shape;
  const rows = Number(rowsRaw);
  const columns = Number(columnsRaw);
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows * columns !== array.length) {
    return undefined;
  }
  const matrix: number[][] = [];
  for (let row = 0; row < rows; row += 1) {
    const offset = row * columns;
    matrix.push(Array.from(array.slice(offset, offset + columns)));
  }
  return matrix;
}

export function axisMillimeters(axisMeters: number[]): number[] {
  return axisMeters.map((value) => value * 1000);
}

export function titleScopeForPlot(
  payload: SimulationResultPayload,
  plot: PlotDefinition,
  cooler: CoolerKey,
): string {
  return plot.source === "comparison" ? "Comparison" : payload[cooler].label;
}

export function createPlotSpec({
  cooler,
  field,
  plot,
  provenance,
  titleScope,
  xValues,
  yValues,
  zValues,
}: PlotSpecInput): PlotSpec {
  const heatmap: PlotlyData = {
    colorbar: { title: { text: field.unit } },
    colorscale: plot.family === "percent-delta" ? "RdBu" : "Viridis",
    hovertemplate:
      "d_o=%{x:.4g} mm<br>t=%{y:.4g} mm<br>value=%{z:.4g} " + field.unit + "<extra></extra>",
    type: "heatmap",
    x: xValues,
    y: yValues,
    z: zValues,
  };

  if (plot.family === "percent-delta") {
    const colorLimit = symmetricFiniteLimit(zValues);
    if (colorLimit !== undefined) {
      heatmap.zauto = false;
      heatmap.zmid = 0;
      heatmap.zmin = -colorLimit;
      heatmap.zmax = colorLimit;
    }
  }

  return {
    data: [heatmap],
    layout: {
      annotations: [
        {
          font: { color: "#444444", size: 10 },
          showarrow: false,
          text: provenanceFooter(provenance),
          x: 0,
          xanchor: "left",
          xref: "paper",
          y: -0.24,
          yanchor: "top",
          yref: "paper",
        },
      ],
      margin: { b: 86, l: 70, r: 24, t: 48 },
      title: { text: `${plot.title} - ${titleScope}` },
      xaxis: { title: { text: "Outer diameter d_o [mm]" }, type: "log" },
      yaxis: { title: { text: "Wall thickness t [mm]" } },
    },
    config: {
      displaylogo: false,
      responsive: true,
      toImageButtonOptions: imageExportOptions(plot.id as PlotId, cooler, "png"),
    },
  };
}

export function imageExportOptions(
  plotId: PlotId,
  cooler: CoolerKey,
  format: ImageFormat,
): PlotImageOptions {
  return {
    filename: `${plotId}-${cooler}`,
    format,
    scale: format === "png" ? 2 : 1,
  };
}

export function provenanceFooter(provenance: Provenance): string {
  const parts = [
    `contract ${provenance.contract_version}`,
    `core ${provenance.core_version}`,
    `request ${shortIdentifier(provenance.request_hash)}`,
    `generated ${provenance.generated_utc}`,
  ];
  if (provenance.golden_reference) {
    parts.push(`golden ${shortIdentifier(provenance.golden_reference)}`);
  }
  return parts.join(" | ");
}

function symmetricFiniteLimit(values: number[][]): number | undefined {
  let limit = 0;
  for (const row of values) {
    for (const value of row) {
      if (Number.isFinite(value)) {
        limit = Math.max(limit, Math.abs(value));
      }
    }
  }
  return limit > 0 ? limit : undefined;
}

function shortIdentifier(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}
