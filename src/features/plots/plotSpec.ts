import type {
  GridFieldRef,
  Provenance,
  SimulationResultPayload,
} from "../../contracts/generated/simulation-result";
import type { PlotlyConfig, PlotlyData, PlotlyLayout } from "plotly.js-dist-min";
import { projectSpectral, projectSpectralReversed } from "./colormap";
import { plotById, type PlotDefinition, type PlotId } from "./plotRegistry";
import { presentationForPlot } from "./plotPresentation";

export type CoolerKey = "cooler_left" | "cooler_right";
export type ImageFormat = "png" | "svg";

export type PlotImageOptions = {
  filename: string;
  format: ImageFormat;
  height: number;
  scale: number;
  width: number;
};
export type ColorDomain = { zmax: number; zmid?: number; zmin: number };
export type PlotSpec = { data: PlotlyData[]; layout: PlotlyLayout; config: PlotlyConfig };
export type PlotDataSummary = {
  finiteCells: number;
  maximum: number | null;
  minimum: number | null;
  statusCounts: Record<string, number>;
  totalCells: number;
};
export type PreparedPlotData = {
  displayValues: number[][];
  plotValues: number[][];
  statusValues?: string[][];
  tauValues: number[];
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

const TAU_MIN = 0;
const TAU_MAX = 40;
const TAU_STEP = 0.25;
const PLOT_FONT = "Times New Roman, STIXGeneral, serif";

export const supportedImageFormats: readonly ImageFormat[] = ["png", "svg"] as const;

export function fieldForPlot(
  payload: SimulationResultPayload,
  plotId: PlotId,
  cooler: CoolerKey,
): GridFieldRef | undefined {
  const plot = plotById(plotId);
  const fields =
    plot.source === "comparison"
      ? payload.comparison.fields
      : plot.fieldGroup === "masks"
        ? payload[cooler].masks
        : payload[cooler].fields;
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

export function maskMatrixForPlot(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  plot: PlotDefinition,
  cooler: CoolerKey,
  values: number[][],
): number[][] {
  const rule = presentationForPlot(plot).clipMask;
  const masks: Array<{ matrix: number[][] | undefined; keepWhenOne: boolean }> = [];
  if (rule === "own-material") {
    masks.push({
      matrix: matrixForField(payload[cooler].masks, arrays, "mask_below_min_wall"),
      keepWhenOne: false,
    });
  } else if (rule === "pa-min-wall") {
    masks.push({
      matrix: matrixForField(payload.cooler_right.masks, arrays, "mask_below_min_wall"),
      keepWhenOne: false,
    });
  } else if (rule === "both-feasible") {
    masks.push({
      matrix: matrixForField(payload.cooler_left.masks, arrays, "mask_below_min_wall"),
      keepWhenOne: false,
    });
    masks.push({
      matrix: matrixForField(payload.cooler_right.masks, arrays, "mask_below_min_wall"),
      keepWhenOne: false,
    });
  } else if (rule === "all-screen-feasible") {
    masks.push({
      matrix: matrixForField(payload[cooler].masks, arrays, "mask_all_screens_feasible"),
      keepWhenOne: true,
    });
  } else if (rule === "invalid-geometry") {
    masks.push({
      matrix: matrixForField(payload[cooler].masks, arrays, "mask_invalid_geometry"),
      keepWhenOne: false,
    });
  }

  return values.map((row, rowIndex) =>
    row.map((value, columnIndex) => {
      for (const mask of masks) {
        const maskValue = mask.matrix?.[rowIndex]?.[columnIndex];
        if (maskValue === undefined || !Number.isFinite(maskValue)) continue;
        const one = maskValue > 0.5;
        if ((mask.keepWhenOne && !one) || (!mask.keepWhenOne && one)) return Number.NaN;
      }
      return value;
    }),
  );
}

export function preparePlotData(
  xValues: number[],
  yValues: number[],
  zValues: number[][],
  plot: PlotDefinition,
  statusValues?: string[][],
): PreparedPlotData {
  const presentation = presentationForPlot(plot);
  const tauValues = regularTauAxis();
  const displayNative = zValues.map((row) =>
    row.map((value) => (Number.isFinite(value) ? value * presentation.displayFactor : Number.NaN)),
  );
  const displayValues = resampleNumericToTau(
    xValues,
    yValues,
    displayNative,
    tauValues,
    presentation.colorScaleType === "binary",
  );
  const plotValues = displayValues.map((row) =>
    row.map((value) =>
      presentation.colorScaleType === "log" && value > 0
        ? Math.log10(value)
        : presentation.colorScaleType === "log"
          ? Number.NaN
          : value,
    ),
  );
  const resampledStatus = statusValues
    ? resampleStatusToTau(xValues, yValues, statusValues, tauValues)
    : undefined;
  return {
    displayValues,
    plotValues,
    ...(resampledStatus ? { statusValues: resampledStatus } : {}),
    tauValues,
  };
}

export function createPlotSpec(input: PlotSpecInput): PlotSpec {
  const {
    colorDomain,
    cooler,
    overlays = [],
    plot,
    provenance,
    statusValues,
    xValues,
    yValues,
    zValues,
  } = input;
  const presentation = presentationForPlot(plot);
  const prepared = preparePlotData(xValues, yValues, zValues, plot, statusValues);
  const customdata = prepared.displayValues.map((row, rowIndex) =>
    row.map((value, columnIndex) => [
      value,
      prepared.statusValues?.[rowIndex]?.[columnIndex] ?? "",
    ]),
  );
  const domain = colorDomain ?? defaultColorDomain(plot, prepared.displayValues);
  const heatmap: PlotlyData = {
    colorbar: colorbarSpec(plot, domain),
    colorscale:
      presentation.colorScaleType === "binary"
        ? [
            [0, "#ffffff"],
            [1, "#3f7f93"],
          ]
        : presentation.colormapReversed || presentation.colorbarReversed
          ? projectSpectralReversed
          : projectSpectral,
    customdata,
    hovertemplate: heatmapHoverTemplate(
      presentation.displayUnit,
      prepared.statusValues !== undefined,
    ),
    type: "heatmap",
    x: xValues,
    y: prepared.tauValues,
    z: prepared.plotValues,
    zsmooth: false,
  };
  if (domain) applyColorDomain(heatmap, domain);

  const contourTraces = isoContourTraces(plot, xValues, prepared.tauValues, prepared.plotValues);
  const traces = [heatmap, ...contourTraces, ...overlays];
  return {
    data: traces,
    layout: scientificLayout(provenance, plot),
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
  const presentation = presentationForPlot(plot);
  const traces: PlotlyData[] = [];
  if (plot.family === "boundary-summary") {
    traces.push(...screenBoundaryTraces(payload, arrays, cooler));
    traces.push(...designPointTraces(payload, cooler));
    if (cooler === "cooler_left") traces.push(validatedReferenceTrace());
    return traces;
  }

  if (plot.source === "comparison") {
    traces.push(...boundaryTraces(payload, arrays, "cooler_left"));
    traces.push(...boundaryTraces(payload, arrays, "cooler_right"));
  }

  const techCoolers: readonly CoolerKey[] =
    presentation.techLines === "both"
      ? ["cooler_left", "cooler_right"]
      : presentation.techLines === "own"
        ? [cooler]
        : [];
  for (const current of techCoolers) traces.push(...minimumWallTraces(payload, current));
  if (techCoolers.includes("cooler_left")) traces.push(validatedReferenceTrace());
  traces.push(...designPointTraces(payload, cooler));
  traces.push(...crossSectionTraces());
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
  if (
    [maskInvalid, maskWallRatio, maskBelowMinWall, maskFeasible, maskOperating].some(
      (value) => value === undefined,
    )
  )
    return undefined;
  return (maskInvalid ?? []).map((row, rowIndex) =>
    row.map((_, columnIndex) =>
      statusAtCell(
        maskInvalid?.[rowIndex]?.[columnIndex],
        maskWallRatio?.[rowIndex]?.[columnIndex],
        maskBelowMinWall?.[rowIndex]?.[columnIndex],
        maskFeasible?.[rowIndex]?.[columnIndex],
        maskOperating?.[rowIndex]?.[columnIndex],
      ),
    ),
  );
}

export function colorDomainForPlot(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  plotId: PlotId,
  coolers: readonly CoolerKey[],
): ColorDomain | undefined {
  const plot = plotById(plotId);
  const presentation = presentationForPlot(plot);
  if (presentation.colorLimits)
    return transformedDomain(presentation.colorLimits, presentation.colorScaleType);
  const useCoolers = presentation.robustShared
    ? (["cooler_left", "cooler_right"] as const)
    : coolers;
  const values: number[] = [];
  if (plot.source === "comparison") {
    const field = fieldForPlot(payload, plotId, "cooler_left");
    collectFiniteValues(
      field ? arrays[field.buffer_index] : undefined,
      values,
      presentation.displayFactor,
    );
  } else {
    for (const current of useCoolers) {
      const field = fieldForPlot(payload, plotId, current);
      collectFiniteValues(
        field ? arrays[field.buffer_index] : undefined,
        values,
        presentation.displayFactor,
      );
    }
  }
  const filtered = values
    .filter((value) => presentation.colorScaleType !== "log" || value > 0)
    .sort((a, b) => a - b);
  if (filtered.length === 0) return undefined;
  const bounds: readonly [number, number] = presentation.robustShared
    ? [percentile(filtered, 1), percentile(filtered, 99)]
    : [filtered[0] ?? 0, filtered.at(-1) ?? 1];
  return transformedDomain(bounds, presentation.colorScaleType);
}

export function summarizePlotData(zValues: number[][], statusValues?: string[][]): PlotDataSummary {
  let finiteCells = 0;
  let totalCells = 0;
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  const statusCounts: Record<string, number> = {};
  for (let row = 0; row < zValues.length; row += 1) {
    for (let column = 0; column < (zValues[row]?.length ?? 0); column += 1) {
      totalCells += 1;
      const value = zValues[row]?.[column];
      if (value !== undefined && Number.isFinite(value)) {
        finiteCells += 1;
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
      }
      const status = statusValues?.[row]?.[column];
      if (status) statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }
  }
  return {
    finiteCells,
    maximum: finiteCells ? maximum : null,
    minimum: finiteCells ? minimum : null,
    statusCounts,
    totalCells,
  };
}

export function imageExportOptions(
  plotId: PlotId,
  cooler: CoolerKey,
  format: ImageFormat,
  pngScale = 2,
): PlotImageOptions {
  return {
    filename: `${plotId}-${cooler}`,
    format,
    height: 660,
    scale: format === "png" ? pngScale : 1,
    width: 825,
  };
}

export function provenanceFooter(provenance: Provenance): string {
  const parts = [
    `contract ${provenance.contract_version}`,
    `core ${provenance.core_version}`,
    `request ${shortIdentifier(provenance.request_hash)}`,
    `generated ${provenance.generated_utc}`,
  ];
  if (provenance.golden_reference)
    parts.push(`golden ${shortIdentifier(provenance.golden_reference)}`);
  return parts.join(" | ");
}

function regularTauAxis(): number[] {
  return Array.from(
    { length: Math.round((TAU_MAX - TAU_MIN) / TAU_STEP) + 1 },
    (_, index) => TAU_MIN + index * TAU_STEP,
  );
}

function resampleNumericToTau(
  xValues: number[],
  yValues: number[],
  values: number[][],
  tauValues: number[],
  nearest: boolean,
): number[][] {
  return tauValues.map((tau) =>
    xValues.map((diameter, column) => {
      if (!(diameter > 0)) return Number.NaN;
      const nativeTau = yValues.map((wall) => (100 * wall) / diameter);
      const upper = nativeTau.findIndex((value) => value >= tau);
      if (upper < 0) return Number.NaN;
      if (upper === 0)
        return Math.abs((nativeTau[0] ?? 0) - tau) < 1e-12
          ? (values[0]?.[column] ?? Number.NaN)
          : Number.NaN;
      const lower = upper - 1;
      const lowerValue = values[lower]?.[column];
      const upperValue = values[upper]?.[column];
      if (
        lowerValue === undefined ||
        upperValue === undefined ||
        !Number.isFinite(lowerValue) ||
        !Number.isFinite(upperValue)
      )
        return Number.NaN;
      const lowerTau = nativeTau[lower] ?? 0;
      const upperTau = nativeTau[upper] ?? lowerTau;
      if (nearest || upperTau === lowerTau)
        return tau - lowerTau <= upperTau - tau ? lowerValue : upperValue;
      const fraction = (tau - lowerTau) / (upperTau - lowerTau);
      return lowerValue + fraction * (upperValue - lowerValue);
    }),
  );
}

function resampleStatusToTau(
  xValues: number[],
  yValues: number[],
  statuses: string[][],
  tauValues: number[],
): string[][] {
  return tauValues.map((tau) =>
    xValues.map((diameter, column) => {
      const nativeTau = yValues.map((wall) => (100 * wall) / diameter);
      const upper = nativeTau.findIndex((value) => value >= tau);
      if (upper < 0) return "outside plotted source grid";
      if (upper === 0) return statuses[0]?.[column] ?? "outside plotted source grid";
      const lower = upper - 1;
      return tau - (nativeTau[lower] ?? 0) <= (nativeTau[upper] ?? 0) - tau
        ? (statuses[lower]?.[column] ?? "")
        : (statuses[upper]?.[column] ?? "");
    }),
  );
}

function defaultColorDomain(plot: PlotDefinition, values: number[][]): ColorDomain | undefined {
  const presentation = presentationForPlot(plot);
  if (presentation.colorLimits)
    return transformedDomain(presentation.colorLimits, presentation.colorScaleType);
  const finite = values
    .flat()
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!finite.length) return undefined;
  let lower = finite[0] ?? 0;
  let upper = finite.at(-1) ?? 1;
  if (plot.family === "percent-delta" && !presentation.colorLimits) {
    const limit = Math.max(Math.abs(lower), Math.abs(upper));
    lower = -limit;
    upper = limit;
  }
  return transformedDomain([lower, upper], presentation.colorScaleType);
}

function transformedDomain(
  bounds: readonly [number, number],
  type: "binary" | "linear" | "log",
): ColorDomain {
  if (type === "log") return { zmin: Math.log10(bounds[0]), zmax: Math.log10(bounds[1]) };
  return {
    zmin: bounds[0],
    zmax: bounds[1],
    ...(bounds[0] < 0 && bounds[1] > 0 ? { zmid: 0 } : {}),
  };
}

function colorbarSpec(
  plot: PlotDefinition,
  domain: ColorDomain | undefined,
): NonNullable<PlotlyData["colorbar"]> {
  const presentation = presentationForPlot(plot);
  const spec: NonNullable<PlotlyData["colorbar"]> = { title: { text: presentation.colorbarLabel } };
  if (domain && presentation.colorScaleType === "log") {
    const ticks = logTicks(10 ** domain.zmin, 10 ** domain.zmax);
    spec.tickvals = ticks.map(Math.log10);
    spec.ticktext = ticks.map(formatPlainNumber);
  } else if (presentation.colorLimits) {
    const [minimum, maximum] = presentation.colorLimits;
    const step =
      plot.id === "tech-adjusted-delta-ka"
        ? 50
        : plot.id === "tech-adjusted-delta-k"
          ? 20
          : undefined;
    if (step) {
      const ticks = Array.from(
        { length: Math.floor((maximum - minimum) / step) + 1 },
        (_, index) => minimum + index * step,
      );
      spec.tickvals = ticks;
      spec.ticktext = ticks.map((value) => `${value > 0 ? "+" : ""}${value} %`);
    }
  }
  if (plot.id === "tech-adjusted-delta-ka") {
    spec.title = { text: "" };
    spec.orientation = "h";
    spec.x = 0.5;
    spec.y = 1.1;
    spec.len = 0.78;
    spec.thickness = 14;
  }
  return spec;
}

function isoContourTraces(
  plot: PlotDefinition,
  x: number[],
  y: number[],
  z: number[][],
): PlotlyData[] {
  const presentation = presentationForPlot(plot);
  const traces: PlotlyData[] = [];
  for (const level of presentation.contourLevels ?? []) {
    if (presentation.colorScaleType === "log" && level <= 0) continue;
    const transformed = presentation.colorScaleType === "log" ? Math.log10(level) : level;
    traces.push({
      contours: {
        coloring: "none",
        end: transformed,
        showlabels: true,
        size: 1,
        start: transformed,
      },
      hoverinfo: "skip",
      labelfont: { color: "#1f1f1f", family: PLOT_FONT, size: 11 },
      line: { color: "#1f1f1f", width: 0.75 },
      name: `${formatPlainNumber(level)} ${presentation.displayUnit}`,
      showlegend: false,
      showscale: false,
      type: "contour",
      x,
      y,
      z,
    });
  }
  if (presentation.transitionLevel) {
    const level =
      presentation.colorScaleType === "log"
        ? Math.log10(presentation.transitionLevel)
        : presentation.transitionLevel;
    traces.push({
      contours: { coloring: "none", end: level, showlabels: false, size: 1, start: level },
      hoverinfo: "skip",
      line: { color: "#000000", dash: "dash", width: 1.35 },
      name: "Re = 2300 transition",
      showlegend: false,
      showscale: false,
      type: "contour",
      x,
      y,
      z,
    });
  }
  return traces;
}

function scientificLayout(provenance: Provenance, plot: PlotDefinition): PlotlyLayout {
  const yStep = presentationForPlot(plot).yTickStep ?? 10;
  const annotations: Array<Record<string, unknown>> = [
    {
      font: { color: "#444444", family: PLOT_FONT, size: 10 },
      showarrow: false,
      text: provenanceFooter(provenance),
      x: 0,
      xanchor: "left",
      xref: "paper",
      y: -0.19,
      yanchor: "top",
      yref: "paper",
    },
  ];
  if (plot.id === "tech-adjusted-delta-ka") {
    annotations.push(
      {
        font: { family: PLOT_FONT, size: 14 },
        showarrow: false,
        text: presentationForPlot(plot).colorbarLabel,
        x: 0.5,
        xref: "paper",
        y: 1.34,
        yref: "paper",
      },
      {
        font: { family: PLOT_FONT, size: 12 },
        showarrow: false,
        text: "PA superiority",
        x: 0.24,
        xref: "paper",
        y: 1.26,
        yref: "paper",
      },
      {
        font: { family: PLOT_FONT, size: 12 },
        showarrow: false,
        text: "Al superiority",
        x: 0.76,
        xref: "paper",
        y: 1.26,
        yref: "paper",
      },
    );
  }
  return {
    annotations,
    font: { family: PLOT_FONT, color: "#1a1a1a", size: 15 },
    legend: { orientation: "h", x: 0, y: -0.11 },
    margin: { b: 100, l: 88, r: 120, t: plot.id === "tech-adjusted-delta-ka" ? 155 : 26 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    xaxis: {
      range: [-1, 1],
      tickmode: "array",
      ticktext: ["0.1", "1", "10"],
      tickvals: [0.1, 1, 10],
      title: { text: "Outer diameter, <i>d</i><sub>o</sub> [mm]" },
      type: "log",
    },
    yaxis: {
      range: [0, 40],
      tickmode: "linear",
      tick0: 0,
      dtick: yStep,
      title: { text: "Wall-thickness ratio, τ = <i>t</i>/<i>d</i><sub>o</sub> [%]" },
    },
  };
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
  for (let index = 0; index < Math.min(ratio.length, diameter.length); index += 1) {
    const tau = ratio[index];
    const diameterMeters = diameter[index];
    if (
      tau !== undefined &&
      diameterMeters !== undefined &&
      Number.isFinite(tau) &&
      diameterMeters > 0
    ) {
      x.push(diameterMeters * 1000);
      y.push(tau);
    }
  }
  return x.length
    ? [
        {
          hovertemplate: "d_o=%{x:.4g} mm<br>τ=%{y:.3g} %<extra>Feasible boundary</extra>",
          line: techLineStyle(cooler),
          mode: "lines",
          name: `Feasible boundary - ${payload[cooler].label}`,
          showlegend: false,
          type: "scatter",
          x,
          y,
        },
      ]
    : [];
}

const screenBoundaryDefinitions = [
  { color: "#000000", label: "Minimum wall", mask: "mask_screen_min_wall" },
  { color: "#005294", label: "Coolant flow", mask: "mask_screen_coolant_flow" },
  { color: "#e68c00", label: "Pressure drop", mask: "mask_screen_pressure_drop" },
  { color: "#9400d4", label: "Cost", mask: "mask_screen_cost" },
  { color: "#009433", label: "Burst pressure", mask: "mask_screen_burst_pressure" },
  { color: "#cc0000", label: "Capillary rise", mask: "mask_screen_capillary" },
] as const;

function screenBoundaryTraces(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  cooler: CoolerKey,
): PlotlyData[] {
  const x = axisMillimeters(payload.outer_diameter_axis);
  const t = axisMillimeters(payload.wall_thickness_axis);
  const tau = regularTauAxis();
  const traces: PlotlyData[] = [];
  for (const boundary of screenBoundaryDefinitions) {
    const matrix = matrixForField(payload[cooler].masks, arrays, boundary.mask);
    if (!matrix || !hasBinaryTransition(matrix)) continue;
    const resampled = resampleNumericToTau(x, t, matrix, tau, true);
    traces.push({
      contours: { coloring: "none", end: 0.5, showlabels: false, size: 1, start: 0.5 },
      hoverinfo: "skip",
      line: { color: boundary.color, width: 1.45 },
      name: boundary.label,
      showlegend: true,
      showscale: false,
      type: "contour",
      x,
      y: tau,
      z: resampled,
    });
    const hatch = screenHatchTrace(x, tau, resampled, boundary.color);
    if (hatch) traces.push(hatch);
  }
  return traces;
}

function screenHatchTrace(
  xValues: number[],
  tauValues: number[],
  mask: number[][],
  color: string,
): PlotlyData | undefined {
  const x: Array<number | null> = [];
  const y: Array<number | null> = [];
  let candidateIndex = 0;
  for (let row = 1; row < mask.length - 1; row += 1) {
    for (let column = 1; column < (mask[row]?.length ?? 0) - 1; column += 1) {
      const value = mask[row]?.[column];
      if (!(value !== undefined && value > 0.5)) continue;
      const neighbours = [
        mask[row - 1]?.[column],
        mask[row + 1]?.[column],
        mask[row]?.[column - 1],
        mask[row]?.[column + 1],
      ];
      if (!neighbours.some((neighbour) => neighbour !== undefined && neighbour <= 0.5)) continue;
      candidateIndex += 1;
      if (candidateIndex % 7 !== 0) continue;
      const centerX = xValues[column];
      const centerY = tauValues[row];
      if (centerX === undefined || centerY === undefined) continue;
      x.push(centerX / 10 ** 0.012, centerX * 10 ** 0.012, null);
      y.push(centerY - 0.45, centerY + 0.45, null);
    }
  }
  return x.length
    ? {
        hoverinfo: "skip",
        line: { color, width: 1 },
        mode: "lines",
        name: "",
        showlegend: false,
        type: "scatter",
        x,
        y,
      }
    : undefined;
}

function minimumWallTraces(payload: SimulationResultPayload, cooler: CoolerKey): PlotlyData[] {
  const minWall = finiteSummaryValue(payload, cooler, "material_min_wall_thickness");
  const x = axisMillimeters(payload.outer_diameter_axis);
  if (minWall === undefined || x.length === 0) return [];
  const y = x.map((diameter) => (100 * minWall * 1000) / diameter);
  const style = techLineStyle(cooler);
  return [
    {
      hoverinfo: "skip",
      line: { color: "#ffffff", width: 5 },
      mode: "lines",
      name: "",
      showlegend: false,
      type: "scatter",
      x,
      y,
    },
    {
      hovertemplate: "minimum wall τ=%{y:.3g} %<extra></extra>",
      line: style,
      mode: "lines",
      name: `Technology limit - ${payload[cooler].label}`,
      showlegend: false,
      type: "scatter",
      x,
      y,
    },
  ];
}

function designPointTraces(payload: SimulationResultPayload, cooler: CoolerKey): PlotlyData[] {
  const diameter = finiteSummaryValue(payload, cooler, "design_outer_diameter");
  const wall = finiteSummaryValue(payload, cooler, "design_wall_thickness");
  if (diameter === undefined || wall === undefined || diameter <= 0) return [];
  return [
    {
      hovertemplate: "d_o=%{x:.4g} mm<br>τ=%{y:.3g} %<extra>Request design point</extra>",
      marker: {
        color: cooler === "cooler_left" ? "#00427e" : "#b35c00",
        line: { color: "#ffffff", width: 1 },
        size: 8,
        symbol: cooler === "cooler_left" ? "circle" : "diamond",
      },
      mode: "markers",
      name: `Request design point - ${payload[cooler].label}`,
      showlegend: false,
      type: "scatter",
      x: [diameter * 1000],
      y: [(100 * wall) / diameter],
    },
  ];
}

function validatedReferenceTrace(): PlotlyData {
  return {
    hovertemplate: "d_o=1 mm<br>τ=10 %<extra>Validated aluminum reference</extra>",
    marker: { color: "#001ae6", line: { color: "#001ae6", width: 2.2 }, size: 12, symbol: "x" },
    mode: "markers",
    name: "Validated aluminum reference",
    showlegend: false,
    type: "scatter",
    x: [1],
    y: [10],
  };
}

function crossSectionTraces(): PlotlyData[] {
  const traces: PlotlyData[] = [];
  const thetaFull = Array.from({ length: 80 }, (_, index) => (2 * Math.PI * index) / 79);
  const thetaQuarter = Array.from(
    { length: 40 },
    (_, index) => Math.PI / 2 + ((Math.PI / 2) * index) / 39,
  );
  for (const tau of [7.5, 20, 32.5]) {
    const innerScale = Math.max(0, 1 - (2 * tau) / 100);
    for (const diameter of [0.25, 1, 6]) {
      const rY = 1.2 * diameter;
      const rLog = rY * (2 / 40) * (8.75 / 9.7);
      const quarter = diameter >= 6;
      const theta = quarter ? thetaQuarter : thetaFull;
      const outerX = theta.map((angle) => 10 ** (Math.log10(diameter) + rLog * Math.cos(angle)));
      const outerY = theta.map((angle) => tau + rY * Math.sin(angle));
      const innerX = theta.map(
        (angle) => 10 ** (Math.log10(diameter) + rLog * innerScale * Math.cos(angle)),
      );
      const innerY = theta.map((angle) => tau + rY * innerScale * Math.sin(angle));
      if (quarter) {
        outerX.unshift(diameter);
        outerY.unshift(tau);
        outerX.push(diameter);
        outerY.push(tau);
        innerX.unshift(diameter);
        innerY.unshift(tau);
        innerX.push(diameter);
        innerY.push(tau);
      }
      traces.push({
        fill: "toself",
        fillcolor: "#4d4d4d",
        hoverinfo: "skip",
        line: { color: "#4d4d4d", width: 0.7 },
        mode: "lines",
        name: "",
        showlegend: false,
        type: "scatter",
        x: outerX,
        y: outerY,
      });
      traces.push({
        fill: "toself",
        fillcolor: "#ffffff",
        hoverinfo: "skip",
        line: { color: "#4d4d4d", width: 0.5 },
        mode: "lines",
        name: "",
        showlegend: false,
        type: "scatter",
        x: innerX,
        y: innerY,
      });
    }
  }
  return traces;
}

function applyColorDomain(trace: PlotlyData, domain: ColorDomain): void {
  trace.zauto = false;
  trace.zmin = domain.zmin;
  trace.zmax = domain.zmax;
  if (domain.zmid !== undefined) trace.zmid = domain.zmid;
}

function heatmapHoverTemplate(unit: string, includeStatus: boolean): string {
  return `d_o=%{x:.4g} mm<br>τ=%{y:.3g} %<br>value=%{customdata[0]:.4g} ${unit}${includeStatus ? "<br>status=%{customdata[1]}" : ""}<extra></extra>`;
}

function collectFiniteValues(
  array: Float64Array | undefined,
  values: number[],
  factor: number,
): void {
  if (!array) return;
  for (const value of array) if (Number.isFinite(value)) values.push(value * factor);
}

function percentile(sorted: number[], percent: number): number {
  if (sorted.length === 1) return sorted[0] ?? 0;
  const position = (percent / 100) * (sorted.length - 1);
  const lower = Math.floor(position);
  const fraction = position - lower;
  return (
    (sorted[lower] ?? 0) +
    fraction * ((sorted[lower + 1] ?? sorted[lower] ?? 0) - (sorted[lower] ?? 0))
  );
}

function logTicks(minimum: number, maximum: number): number[] {
  const ticks: number[] = [];
  for (
    let exponent = Math.floor(Math.log10(minimum));
    exponent <= Math.ceil(Math.log10(maximum));
    exponent += 1
  ) {
    for (const multiple of [1, 2, 5]) {
      const value = multiple * 10 ** exponent;
      if (value >= minimum * (1 - 1e-10) && value <= maximum * (1 + 1e-10)) ticks.push(value);
    }
  }
  return ticks;
}

function formatPlainNumber(value: number): string {
  return Math.abs(value) >= 1
    ? value.toFixed(0)
    : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function shortIdentifier(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
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
function finiteSummaryValue(
  payload: SimulationResultPayload,
  cooler: CoolerKey,
  key: string,
): number | undefined {
  const value = payload[cooler].summary.values[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function hasBinaryTransition(matrix: number[][]): boolean {
  let zero = false;
  let one = false;
  for (const row of matrix)
    for (const value of row) {
      if (!Number.isFinite(value)) continue;
      if (value > 0.5) one = true;
      else zero = true;
      if (zero && one) return true;
    }
  return false;
}
function techLineStyle(cooler: CoolerKey): { color: string; dash: string; width: number } {
  return cooler === "cooler_left"
    ? { color: "#001a99", dash: "dash", width: 2.6 }
    : { color: "#00801a", dash: "dot", width: 2.6 };
}
function statusAtCell(
  invalid?: number,
  wallRatio?: number,
  belowMinWall?: number,
  feasible?: number,
  operating?: number,
): string {
  if (isOne(invalid)) return "invalid geometry";
  if (isOne(wallRatio)) return "outside wall-ratio range";
  if (isOne(operating)) return "operating point unsolved";
  if (isOne(belowMinWall)) return "below minimum wall";
  if (!isOne(feasible)) return "screened out";
  return "valid";
}
function isOne(value?: number): boolean {
  return value !== undefined && Number.isFinite(value) && value > 0.5;
}
