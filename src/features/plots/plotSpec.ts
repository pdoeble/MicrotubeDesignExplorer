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

export type ColorDomain = {
  zmax: number;
  zmid?: number;
  zmin: number;
};

export type PlotSpec = {
  data: PlotlyData[];
  layout: PlotlyLayout;
  config: PlotlyConfig;
};

type PlotSpecInput = {
  colorDomain?: ColorDomain | undefined;
  cooler: CoolerKey;
  field: GridFieldRef;
  overlays?: PlotlyData[];
  plot: PlotDefinition;
  provenance: Provenance;
  statusValues?: string[][] | undefined;
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
  colorDomain,
  cooler,
  field,
  overlays = [],
  plot,
  provenance,
  statusValues,
  titleScope,
  xValues,
  yValues,
  zValues,
}: PlotSpecInput): PlotSpec {
  const heatmap: PlotlyData = {
    colorbar: { title: { text: field.unit } },
    colorscale: plot.family === "percent-delta" ? "RdBu" : "Viridis",
    customdata: statusValues,
    hovertemplate: heatmapHoverTemplate(field.unit, statusValues !== undefined),
    type: "heatmap",
    x: xValues,
    y: yValues,
    z: zValues,
  };

  if (colorDomain) {
    applyColorDomain(heatmap, colorDomain);
  } else if (plot.family === "percent-delta") {
    const colorLimit = symmetricFiniteLimit(zValues);
    if (colorLimit !== undefined) {
      applyColorDomain(heatmap, { zmax: colorLimit, zmid: 0, zmin: -colorLimit });
    }
  }

  return {
    data: [heatmap, ...overlays],
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
      legend: { orientation: "h", x: 0, y: -0.14 },
      margin: { b: 112, l: 70, r: 24, t: 48 },
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

export function overlayTracesForPlot(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  plot: PlotDefinition,
  cooler: CoolerKey,
): PlotlyData[] {
  const coolers =
    plot.source === "comparison" ? (["cooler_left", "cooler_right"] as const) : [cooler];
  const traces: PlotlyData[] = [];
  for (const current of coolers) {
    traces.push(...boundaryTraces(payload, arrays, current));
    const minWallTrace = minimumWallTrace(payload, current);
    if (minWallTrace) traces.push(minWallTrace);
    const markerTrace = designPointTrace(payload, current);
    if (markerTrace) traces.push(markerTrace);
  }
  return traces;
}

export function statusMatrixForPlot(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  plot: PlotDefinition,
  cooler: CoolerKey,
): string[][] | undefined {
  if (plot.source === "comparison") return undefined;

  const maskInvalid = matrixForField(payload[cooler].masks, arrays, "mask_invalid_geometry");
  const maskWallRatio = matrixForField(payload[cooler].masks, arrays, "mask_wall_ratio_range");
  const maskBelowMinWall = matrixForField(payload[cooler].masks, arrays, "mask_below_min_wall");
  const maskFeasible = matrixForField(payload[cooler].masks, arrays, "mask_all_screens_feasible");
  const maskOperating = matrixForField(payload[cooler].masks, arrays, "mask_operating_unsolvable");
  const required = [maskInvalid, maskWallRatio, maskBelowMinWall, maskFeasible, maskOperating];
  if (required.some((matrix) => matrix === undefined)) return undefined;

  const rows = maskInvalid?.length ?? 0;
  const columns = maskInvalid?.[0]?.length ?? 0;
  const statuses: string[][] = [];
  for (let row = 0; row < rows; row += 1) {
    const statusRow: string[] = [];
    for (let column = 0; column < columns; column += 1) {
      statusRow.push(
        statusAtCell(
          maskInvalid?.[row]?.[column],
          maskWallRatio?.[row]?.[column],
          maskBelowMinWall?.[row]?.[column],
          maskFeasible?.[row]?.[column],
          maskOperating?.[row]?.[column],
        ),
      );
    }
    statuses.push(statusRow);
  }
  return statuses;
}

export function colorDomainForPlot(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  plotId: PlotId,
  coolers: readonly CoolerKey[],
): ColorDomain | undefined {
  const plot = plotById(plotId);
  const values: number[] = [];

  if (plot.source === "comparison") {
    const field = fieldForPlot(payload, plotId, "cooler_left");
    collectFiniteValues(field ? arrays[field.buffer_index] : undefined, values);
  } else {
    for (const cooler of coolers) {
      const field = fieldForPlot(payload, plotId, cooler);
      collectFiniteValues(field ? arrays[field.buffer_index] : undefined, values);
    }
  }

  if (values.length === 0) return undefined;

  if (plot.family === "percent-delta") {
    const limit = Math.max(...values.map((value) => Math.abs(value)));
    return limit > 0 ? { zmax: limit, zmid: 0, zmin: -limit } : undefined;
  }

  const zmin = Math.min(...values);
  const zmax = Math.max(...values);
  if (zmin === zmax) {
    const padding = Math.max(Math.abs(zmin) * 0.01, 1);
    return { zmax: zmax + padding, zmin: zmin - padding };
  }
  return { zmax, zmin };
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

function applyColorDomain(trace: PlotlyData, domain: ColorDomain): void {
  trace.zauto = false;
  trace.zmin = domain.zmin;
  trace.zmax = domain.zmax;
  if (domain.zmid !== undefined) {
    trace.zmid = domain.zmid;
  }
}

function heatmapHoverTemplate(unit: string, includeStatus: boolean): string {
  const statusLine = includeStatus ? "<br>status=%{customdata}" : "";
  return `d_o=%{x:.4g} mm<br>t=%{y:.4g} mm<br>value=%{z:.4g} ${unit}${statusLine}<extra></extra>`;
}

function collectFiniteValues(array: Float64Array | undefined, values: number[]): void {
  if (!array) return;
  for (const value of array) {
    if (Number.isFinite(value)) values.push(value);
  }
}

function shortIdentifier(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}

function boundaryTraces(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  cooler: CoolerKey,
): PlotlyData[] {
  const ratio = vectorForField(payload.comparison.fields, arrays, "boundary_wall_ratio");
  const diameter = vectorForField(
    payload.comparison.fields,
    arrays,
    cooler === "cooler_left" ? "boundary_left_diameter" : "boundary_right_diameter",
  );
  if (!ratio || !diameter) return [];

  const x: number[] = [];
  const y: number[] = [];
  const count = Math.min(ratio.length, diameter.length);
  for (let index = 0; index < count; index += 1) {
    const ratioPercent = ratio[index];
    const diameterMeters = diameter[index];
    if (ratioPercent === undefined || diameterMeters === undefined) continue;
    if (Number.isFinite(ratioPercent) && Number.isFinite(diameterMeters) && diameterMeters > 0) {
      x.push(diameterMeters * 1000);
      y.push(diameterMeters * (ratioPercent / 100) * 1000);
    }
  }
  if (x.length === 0) return [];

  const label = payload[cooler].label;
  return [
    {
      hovertemplate: "d_o=%{x:.4g} mm<br>t=%{y:.4g} mm<extra>Feasible boundary</extra>",
      line: { color: coolerColor(cooler), width: 2 },
      mode: "lines",
      name: `Feasible boundary - ${label}`,
      showlegend: true,
      type: "scatter",
      x,
      y,
    },
  ];
}

function minimumWallTrace(
  payload: SimulationResultPayload,
  cooler: CoolerKey,
): PlotlyData | undefined {
  const minWall = finiteSummaryValue(payload, cooler, "material_min_wall_thickness");
  if (minWall === undefined || payload.outer_diameter_axis.length === 0) return undefined;
  const xValues = axisMillimeters(payload.outer_diameter_axis);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const label = payload[cooler].label;
  return {
    hovertemplate: "minimum wall=%{y:.4g} mm<extra></extra>",
    line: { color: coolerColor(cooler), dash: "dash", width: 1.5 },
    mode: "lines",
    name: `Minimum wall - ${label}`,
    showlegend: true,
    type: "scatter",
    x: [xMin, xMax],
    y: [minWall * 1000, minWall * 1000],
  };
}

function designPointTrace(
  payload: SimulationResultPayload,
  cooler: CoolerKey,
): PlotlyData | undefined {
  const diameter = finiteSummaryValue(payload, cooler, "design_outer_diameter");
  const wall = finiteSummaryValue(payload, cooler, "design_wall_thickness");
  if (diameter === undefined || wall === undefined) return undefined;
  const label = payload[cooler].label;
  return {
    hovertemplate: "d_o=%{x:.4g} mm<br>t=%{y:.4g} mm<extra>Design point</extra>",
    marker: {
      color: coolerColor(cooler),
      size: 10,
      symbol: cooler === "cooler_left" ? "circle" : "diamond",
    },
    mode: "markers",
    name: `Design point - ${label}`,
    showlegend: true,
    type: "scatter",
    x: [diameter * 1000],
    y: [wall * 1000],
  };
}

function finiteSummaryValue(
  payload: SimulationResultPayload,
  cooler: CoolerKey,
  key: string,
): number | undefined {
  const value = payload[cooler].summary.values[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function vectorForField(
  refs: GridFieldRef[],
  arrays: readonly Float64Array[],
  name: string,
): Float64Array | undefined {
  const ref = refs.find((field) => field.name === name);
  return ref ? arrays[ref.buffer_index] : undefined;
}

function matrixForField(
  refs: GridFieldRef[],
  arrays: readonly Float64Array[],
  name: string,
): number[][] | undefined {
  const ref = refs.find((field) => field.name === name);
  return ref ? matrixFromArray(arrays[ref.buffer_index], ref) : undefined;
}

function statusAtCell(
  invalid: number | undefined,
  wallRatio: number | undefined,
  belowMinWall: number | undefined,
  feasible: number | undefined,
  operating: number | undefined,
): string {
  if (isMasked(invalid)) return "invalid geometry";
  if (isMasked(wallRatio)) return "outside wall-ratio range";
  if (isMasked(operating)) return "operating point unsolved";
  if (isMasked(belowMinWall)) return "below minimum wall";
  if (!isMasked(feasible)) return "screened out";
  return "valid";
}

function isMasked(value: number | undefined): boolean {
  return value !== undefined && Number.isFinite(value) && value > 0.5;
}

function coolerColor(cooler: CoolerKey): string {
  return cooler === "cooler_left" ? "#00427e" : "#b35c00";
}
