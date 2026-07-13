import type {
  GridFieldRef,
  Provenance,
  SimulationResultPayload,
} from "../../contracts/generated/simulation-result";
import type { SimulationRequest } from "../../contracts/generated/simulation-request";
import type { PlotlyConfig, PlotlyData, PlotlyLayout } from "plotly.js-dist-min";
import {
  bilinearGridValue,
  localBoundaryHatches,
  marchingSquaresPaths,
  type BoundaryPath,
  type BoundaryPoint,
} from "./boundaryGeometry";
import { projectSpectral, projectSpectralReversed, type PlotlyColorScale } from "./colormap";
import { plotById, type PlotDefinition, type PlotId } from "./plotRegistry";
import { presentationForPlot, type PlotPresentation } from "./plotPresentation";
import {
  paperColorbarPlacement,
  paperMargins,
  paperZoom,
  referenceWidthPx,
  SINGLE_MAP,
  TECH_KA_DELTA,
  type PaperFigureGeometry,
  type PaperZoom,
} from "./paperLayout";

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
export type ComparisonBoundary = {
  diameterMillimeters: number[];
  wallRatioPercent: number[];
};

/**
 * Rendering context tying trace/layout pixel quantities to one MATLAB paper
 * geometry at one zoom. All fonts, line widths and marker sizes derive from
 * it so the figure scales as a whole, exactly like resizing the printed page.
 */
export type PaperContext = {
  geometry: PaperFigureGeometry;
  zoom: PaperZoom;
};

type PlotSpecInput = {
  colorDomain?: ColorDomain | undefined;
  comparisonBoundary?: ComparisonBoundary | undefined;
  cooler: CoolerKey;
  field: GridFieldRef;
  overlays?: PlotlyData[];
  paper?: PaperContext;
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
export const PLOT_FONT = "Times New Roman, STIXGeneral, serif";
// MATLAB axes/grid appearance: axis color [0.15 0.15 0.15]; major grid
// alpha 0.15 and minor grid (dotted) alpha 0.25 flattened onto white.
const AXIS_COLOR = "#262626";
const MAJOR_GRID_COLOR = "#dfdfdf";
const MINOR_GRID_COLOR = "#c6c6c6";

export const supportedImageFormats: readonly ImageFormat[] = ["png", "svg"] as const;

export function paperContext(geometry: PaperFigureGeometry, widthPx?: number): PaperContext {
  return { geometry, zoom: paperZoom(geometry, widthPx) };
}

const DEFAULT_PAPER = paperContext(SINGLE_MAP);

/** Geometry family used by a plot when rendered as its own figure. */
export function paperGeometryForPlot(plot: PlotDefinition): PaperFigureGeometry {
  return presentationForPlot(plot).paperVariant === "tech-ka-delta" ? TECH_KA_DELTA : SINGLE_MAP;
}

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
    comparisonBoundary,
    cooler,
    overlays = [],
    plot,
    provenance,
    statusValues,
    xValues,
    yValues,
    zValues,
  } = input;
  const paper = input.paper ?? paperContext(paperGeometryForPlot(plot));
  const presentation = presentationForPlot(plot);
  const preparedRaw = preparePlotData(xValues, yValues, zValues, plot, statusValues);
  const prepared =
    plot.source === "comparison" && comparisonBoundary
      ? clipComparisonToBoundary(preparedRaw, xValues, comparisonBoundary, presentation)
      : preparedRaw;
  const customdata = prepared.displayValues.map((row, rowIndex) =>
    row.map((value, columnIndex) => [
      value,
      prepared.statusValues?.[rowIndex]?.[columnIndex] ?? "",
    ]),
  );
  const domain = colorDomain ?? defaultColorDomain(plot, prepared.displayValues);
  const reversedColormap = presentation.colormapReversed === true;
  const heatmap: PlotlyData = {
    colorbar: colorbarSpec(plot, domain, paper),
    colorscale:
      presentation.colorScaleType === "binary"
        ? [
            [0, "#ffffff"],
            [1, "#3f7f93"],
          ]
        : reversedColormap
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

  // MATLAB reverseColorbarScale flips only the bar display, not the data
  // mapping. Plotly cannot reverse a colorbar, so the visible bar comes from
  // an invisible carrier trace with negated domain and mirrored ticks.
  const traces: PlotlyData[] = [heatmap];
  if (plot.source === "comparison" && comparisonBoundary) {
    traces.push(...comparisonBoundaryMaskTraces(comparisonBoundary));
  }
  if (presentation.colorbarReversed && domain && presentation.colorScaleType !== "binary") {
    heatmap.showscale = false;
    traces.push(
      reversedColorbarCarrier(
        domain,
        reversedColormap ? projectSpectralReversed : projectSpectral,
        colorbarSpec(plot, domain, paper),
      ),
    );
  }

  traces.push(
    ...isoContourTraces(plot, cooler, xValues, prepared.tauValues, prepared.displayValues, paper),
  );
  traces.push(...overlays);
  const layout = scientificLayout(provenance, plot, paper, domain);
  layout.annotations?.push(
    ...contourLabelAnnotationsForPlot(
      plot,
      cooler,
      xValues,
      prepared.tauValues,
      prepared.displayValues,
      paper,
    ),
  );
  if (presentation.paperVariant === "tech-ka-delta") {
    layout.annotations?.push(
      ...percentCalloutAnnotations(xValues, prepared.tauValues, prepared.displayValues, paper),
    );
  }
  return {
    data: traces,
    layout,
    config: {
      displaylogo: false,
      responsive: false,
      toImageButtonOptions: imageExportOptions(plot.id as PlotId, cooler, "png"),
    },
  };
}

type ContourLabelTarget = {
  level: number;
  targetTau: number;
  targetXNorm?: number;
};

type ContourCrossing = {
  logX: number;
  tau: number;
};

type ContourLabelBox = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type PositionedContourLabel = {
  angle: number;
  box: ContourLabelBox;
  crossing: ContourCrossing;
};

// MATLAB params_kA_delta.ratio_pct_label_* (V10 l. 918-920). The +100 %
// and +150 % contours use callouts below. The +25 % path remains drawn but is
// intentionally not labelled because four inline texts cannot fit in the
// narrow default feasible band without collision (ADR-0011).
const TECH_KA_INLINE_LABEL_TARGETS: readonly ContourLabelTarget[] = [
  { level: -25, targetTau: 15.5, targetXNorm: 0.7 },
  { level: 0, targetTau: 12.6 },
  { level: 50, targetTau: 17.4 },
];

// Figure 09's narrow comparison band requires an explicit 0 % label; the
// automatic Plotly label is rejected because the contour segment is short.
const TECH_K_INLINE_LABEL_TARGETS: readonly ContourLabelTarget[] = [
  { level: 0, targetTau: 14.5, targetXNorm: (Math.log10(0.5) + 1) / 2 },
];

// The approved MATLAB Figure 01 deliberately labels the short Al 300 and
// 400 W/(m2 K) contours. Plotly cannot place labels on those segments, so the
// adapter uses deterministic annotation targets read from that reference.
const OVERALL_AL_INLINE_LABEL_TARGETS: readonly ContourLabelTarget[] = [
  { level: 300, targetTau: 25 },
  { level: 400, targetTau: 35 },
];

// MATLAB manualContourLabelSpecs fixes the 50 W/K Al label near 3.3 mm,
// 29 %, while Figure 20 also requires the short 300 and 500 W/K segments.
const BUNDLE_AL_INLINE_LABEL_TARGETS: readonly ContourLabelTarget[] = [
  { level: 50, targetTau: 29, targetXNorm: (Math.log10(3.3) + 1) / 2 },
  { level: 300, targetTau: 27 },
  { level: 500, targetTau: 35 },
];

// Figure 20_design labels every drawable Al conductance isoline. Plotly's
// automatic labels reject the short clipped upper-panel segments, so the
// target tau values distribute the labels across the approved feasible band.
const DESIGN_AL_INLINE_LABEL_TARGETS: readonly ContourLabelTarget[] = [
  { level: 5, targetTau: 3 },
  { level: 10, targetTau: 5 },
  { level: 25, targetTau: 8 },
  { level: 50, targetTau: 10 },
  { level: 75, targetTau: 13 },
  { level: 100, targetTau: 15 },
  { level: 150, targetTau: 16 },
  { level: 200, targetTau: 14 },
  { level: 300, targetTau: 12 },
  { level: 500, targetTau: 10 },
];

function contourCrossings(
  xValues: number[],
  tauValues: number[],
  displayValues: number[][],
  level: number,
): ContourCrossing[] {
  const crossings: ContourCrossing[] = [];
  for (let row = 0; row < tauValues.length; row += 1) {
    const values = displayValues[row];
    const tau = tauValues[row];
    if (!values || tau === undefined || !Number.isFinite(tau)) continue;
    for (let column = 0; column + 1 < values.length; column += 1) {
      const left = values[column];
      const right = values[column + 1];
      const xLeft = xValues[column];
      const xRight = xValues[column + 1];
      if (
        left === undefined ||
        right === undefined ||
        xLeft === undefined ||
        xRight === undefined ||
        !Number.isFinite(left) ||
        !Number.isFinite(right) ||
        !(xLeft > 0) ||
        !(xRight > 0) ||
        (left - level) * (right - level) > 0 ||
        left === right
      )
        continue;
      const fraction = (level - left) / (right - left);
      if (fraction < 0 || fraction > 1) continue;
      const logLeft = Math.log10(xLeft);
      const logX = logLeft + fraction * (Math.log10(xRight) - logLeft);
      crossings.push({ logX, tau });
    }
  }
  return crossings;
}

function nearestContourCrossing(
  crossings: readonly ContourCrossing[],
  target: ContourLabelTarget,
): ContourCrossing | undefined {
  let best: { crossing: ContourCrossing; score: number } | undefined;
  for (const crossing of crossings) {
    const yDistance = Math.abs(crossing.tau - target.targetTau) / 40;
    const xDistance =
      target.targetXNorm === undefined ? 0 : Math.abs((crossing.logX + 1) / 2 - target.targetXNorm);
    const xNorm = (crossing.logX + 1) / 2;
    const yNorm = crossing.tau / 40;
    const edgeDistance = Math.min(xNorm, 1 - xNorm, yNorm, 1 - yNorm);
    const edgePenalty = edgeDistance < 0.055 ? 4 + (0.055 - edgeDistance) * 30 : 0;
    const score = yDistance + xDistance + edgePenalty;
    if (!best || score < best.score) best = { crossing, score };
  }
  return best?.crossing;
}

function boxesIntersect(left: ContourLabelBox, right: ContourLabelBox, gap = 0): boolean {
  return !(
    left.right + gap <= right.left ||
    right.right + gap <= left.left ||
    left.top + gap <= right.bottom ||
    right.top + gap <= left.bottom
  );
}

function contourLabelBox(
  crossing: ContourCrossing,
  angle: number,
  text: string,
  paper: PaperContext,
  percent: boolean,
): ContourLabelBox {
  const { plotAreaCm } = paperMargins(paper.geometry);
  const fontPt = paper.geometry.baseFontPt - (percent ? 3 : 2);
  const fontHeightCm = (fontPt * 2.54) / 72;
  const textWidthCm = Math.max(fontHeightCm, plainText(text).length * fontHeightCm * 0.52);
  const angleRadians = (Math.abs(angle) * Math.PI) / 180;
  const rotatedWidthCm =
    Math.abs(Math.cos(angleRadians)) * textWidthCm +
    Math.abs(Math.sin(angleRadians)) * fontHeightCm;
  const rotatedHeightCm =
    Math.abs(Math.sin(angleRadians)) * textWidthCm +
    Math.abs(Math.cos(angleRadians)) * fontHeightCm;
  const halfWidth = (rotatedWidthCm / plotAreaCm[0]) * 0.56 + 0.004;
  const halfHeight = (rotatedHeightCm / plotAreaCm[1]) * 0.56 + 0.004;
  const centerX = (crossing.logX + 1) / 2;
  const centerY = crossing.tau / 40;
  return {
    bottom: centerY - halfHeight,
    left: centerX - halfWidth,
    right: centerX + halfWidth,
    top: centerY + halfHeight,
  };
}

function crossSectionProtectionBoxes(paper: PaperContext): ContourLabelBox[] {
  const axesRef = paper.geometry.axesCm[0] ?? SINGLE_MAP.axesCm[0];
  const aspect = (axesRef?.[3] ?? 8.75) / (axesRef?.[2] ?? 9.7);
  const boxes: ContourLabelBox[] = [];
  for (const tau of [7.5, 20, 32.5]) {
    for (const diameter of [0.25, 1, 6]) {
      const rY = 1.2 * diameter;
      const rLog = rY * (2 / 40) * aspect;
      const centerX = (Math.log10(diameter) + 1) / 2;
      const centerY = tau / 40;
      boxes.push({
        bottom: centerY - rY / 40 - 0.009,
        left: centerX - rLog / 2 - 0.009,
        right: centerX + rLog / 2 + 0.009,
        top: centerY + rY / 40 + 0.009,
      });
    }
  }
  return boxes;
}

function positionedContourLabel(
  crossings: readonly ContourCrossing[],
  target: ContourLabelTarget,
  text: string,
  paper: PaperContext,
  percent: boolean,
  occupied: readonly ContourLabelBox[],
  protectedBoxes: readonly ContourLabelBox[],
): PositionedContourLabel | undefined {
  let best: { position: PositionedContourLabel; score: number } | undefined;
  for (const crossing of crossings) {
    const angle = contourTextAngle(crossing, crossings, paper);
    const box = contourLabelBox(crossing, angle, text, paper, percent);
    const xNorm = (crossing.logX + 1) / 2;
    const yDistance = Math.abs(crossing.tau - target.targetTau) / 40;
    const xDistance = target.targetXNorm === undefined ? 0 : Math.abs(xNorm - target.targetXNorm);
    const edgeDistance = Math.min(box.left, 1 - box.right, box.bottom, 1 - box.top);
    const edgePenalty = edgeDistance < 0.045 ? 8 + Math.max(0, 0.045 - edgeDistance) * 80 : 0;
    const labelCollisionPenalty = occupied.reduce(
      (penalty, other) => penalty + (boxesIntersect(box, other, 0.006) ? 40 : 0),
      0,
    );
    const overlayCollisionPenalty = protectedBoxes.reduce(
      (penalty, other) => penalty + (boxesIntersect(box, other, 0.004) ? 12 : 0),
      0,
    );
    const score =
      yDistance +
      xDistance +
      edgePenalty +
      labelCollisionPenalty +
      overlayCollisionPenalty +
      Math.abs(angle) / 900;
    if (!best || score < best.score) best = { position: { angle, box, crossing }, score };
  }
  return best?.position;
}

function contourTextAngle(
  crossing: ContourCrossing,
  crossings: readonly ContourCrossing[],
  paper: PaperContext,
): number {
  const { plotAreaCm } = paperMargins(paper.geometry);
  let neighbor: { crossing: ContourCrossing; score: number } | undefined;
  for (const candidate of crossings) {
    const deltaTau = candidate.tau - crossing.tau;
    if (Math.abs(deltaTau) < 1e-9) continue;
    const deltaLogX = candidate.logX - crossing.logX;
    const score = Math.abs(deltaTau) / 40 + Math.abs(deltaLogX) / 2;
    if (!neighbor || score < neighbor.score) neighbor = { crossing: candidate, score };
  }
  if (!neighbor) return 0;
  const angle =
    (Math.atan2(
      ((neighbor.crossing.tau - crossing.tau) / 40) * plotAreaCm[1],
      ((neighbor.crossing.logX - crossing.logX) / 2) * plotAreaCm[0],
    ) *
      180) /
    Math.PI;
  if (angle > 90) return angle - 180;
  if (angle < -90) return angle + 180;
  return angle;
}

function inlineContourAnnotations(
  xValues: number[],
  tauValues: number[],
  displayValues: number[][],
  targets: readonly ContourLabelTarget[],
  paper: PaperContext,
  percent: boolean,
  signedPercent = false,
  protectCrossSections = true,
): Array<Record<string, unknown>> {
  const annotations: Array<Record<string, unknown>> = [];
  const occupied: ContourLabelBox[] = [];
  const protectedBoxes = protectCrossSections ? crossSectionProtectionBoxes(paper) : [];
  for (const target of targets) {
    const crossings = contourCrossings(xValues, tauValues, displayValues, target.level);
    const text = percent
      ? signedPercent
        ? formatSignedPercent(target.level)
        : `${formatPlainNumber(target.level)} %`
      : formatPlainNumber(target.level);
    const position = positionedContourLabel(
      crossings,
      target,
      text,
      paper,
      percent,
      occupied,
      protectedBoxes,
    );
    if (!position) continue;
    occupied.push(position.box);
    annotations.push({
      bgcolor: "rgba(255,255,255,0.9)",
      borderpad: Math.max(0.5, paper.zoom.pt(0.35)),
      font: {
        color: "#1f1f1f",
        family: PLOT_FONT,
        size: paper.zoom.pt(paper.geometry.baseFontPt - (percent ? 3 : 2)),
      },
      showarrow: false,
      text,
      textangle: position.angle,
      // Plotly layout annotations on log axes use log10 axis coordinates.
      x: position.crossing.logX,
      xref: "x",
      y: position.crossing.tau,
      yref: "y",
    });
  }
  return annotations;
}

function contourLabelAnnotationsForPlot(
  plot: PlotDefinition,
  cooler: CoolerKey,
  xValues: number[],
  tauValues: number[],
  displayValues: number[][],
  paper: PaperContext,
): Array<Record<string, unknown>> {
  const presentation = presentationForPlot(plot);
  if (presentation.colorScaleType === "binary") return [];
  const levels = contourLevelsForData(presentation, cooler, displayValues);
  const initiallyLabelled = labelledContourLevels(presentation, levels);
  const labelled =
    plot.source === "comparison" && initiallyLabelled.length > 2
      ? spreadInteriorSelection(initiallyLabelled, 2)
      : initiallyLabelled;
  if (!labelled.length) return [];

  const explicit = new Map<number, ContourLabelTarget>();
  const addExplicit = (targets: readonly ContourLabelTarget[]) => {
    for (const target of targets) explicit.set(target.level, target);
  };
  if (presentation.paperVariant === "tech-ka-delta") addExplicit(TECH_KA_INLINE_LABEL_TARGETS);
  if (plot.id === "tech-adjusted-delta-k") addExplicit(TECH_K_INLINE_LABEL_TARGETS);
  if (cooler === "cooler_left" && plot.id === "overall-coefficient-map")
    addExplicit(OVERALL_AL_INLINE_LABEL_TARGETS);
  if (cooler === "cooler_left" && plot.id === "bundle-conductance-map")
    addExplicit(BUNDLE_AL_INLINE_LABEL_TARGETS);
  if (cooler === "cooler_left" && plot.id === "design-boundary-lines")
    addExplicit(DESIGN_AL_INLINE_LABEL_TARGETS);

  const targetTauSequence = [13, 27, 20, 33, 8, 24, 16, 30, 11, 36] as const;
  const targetXSequence = [0.58, 0.42, 0.68, 0.32, 0.52, 0.75, 0.25] as const;
  const labelLevels = [...new Set([...labelled, ...levels.filter((level) => explicit.has(level))])];
  const targets = labelLevels
    .filter(
      (level) =>
        !(presentation.paperVariant === "tech-ka-delta" && (level === 100 || level === 150)),
    )
    .map(
      (level, index): ContourLabelTarget =>
        explicit.get(level) ?? {
          level,
          targetTau: targetTauSequence[index % targetTauSequence.length] ?? 20,
          targetXNorm: targetXSequence[index % targetXSequence.length] ?? 0.5,
        },
    );
  const percent = presentation.displayUnit === "%";
  const signedPercent = levels.some((level) => level < 0);
  return inlineContourAnnotations(
    xValues,
    tauValues,
    displayValues,
    targets,
    paper,
    percent,
    signedPercent,
    plot.family !== "boundary-summary",
  );
}

// MATLAB Fig. 22 callout labels (+100 %, +150 %): the label sits at a fixed
// axes-normalized position and a thin leader line points to the nearest
// crossing of the contour level in the displayed field.
function percentCalloutAnnotations(
  xValues: number[],
  tauValues: number[],
  displayValues: number[][],
  paper: PaperContext,
): Array<Record<string, unknown>> {
  const { geometry, zoom } = paper;
  const { plotAreaCm } = paperMargins(geometry);
  const plotWidthPx = zoom.cm(plotAreaCm[0]);
  const plotHeightPx = zoom.cm(plotAreaCm[1]);
  const targets = [
    { labelXNorm: 0.14, labelYNorm: 0.385, level: 100 },
    { labelXNorm: 0.13, labelYNorm: 0.235, level: 150 },
  ];
  const annotations: Array<Record<string, unknown>> = [];
  for (const target of targets) {
    const labelTau = target.labelYNorm * 40;
    const best = nearestContourCrossing(
      contourCrossings(xValues, tauValues, displayValues, target.level),
      { level: target.level, targetTau: labelTau },
    );
    if (!best) continue;
    const targetXPaper = (best.logX + 1) / 2;
    const targetYPaper = best.tau / 40;
    annotations.push({
      arrowcolor: AXIS_COLOR,
      arrowhead: 0,
      arrowwidth: Math.max(1, zoom.pt(0.5)),
      ax: (target.labelXNorm - targetXPaper) * plotWidthPx,
      ay: (targetYPaper - target.labelYNorm) * plotHeightPx,
      font: { color: "#1f1f1f", family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt - 2) },
      showarrow: true,
      text: `+${target.level} %`,
      x: best.logX,
      xref: "x",
      y: best.tau,
      yref: "y",
    });
  }
  return annotations;
}

export function overlayTracesForPlot(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  plot: PlotDefinition,
  cooler: CoolerKey,
  paper: PaperContext = DEFAULT_PAPER,
  request?: SimulationRequest,
): PlotlyData[] {
  const presentation = presentationForPlot(plot);
  const traces: PlotlyData[] = [];
  if (plot.family === "boundary-summary") {
    traces.push(...screenBoundaryTraces(payload, arrays, cooler, paper, request));
    traces.push(...designPointTraces(payload, cooler, paper));
    if (cooler === "cooler_left") traces.push(validatedReferenceTrace(paper));
    return traces;
  }

  if (plot.source === "comparison") {
    traces.push(...boundaryTraces(payload, arrays, "cooler_left", paper));
    traces.push(...boundaryTraces(payload, arrays, "cooler_right", paper));
  }

  const techCoolers: readonly CoolerKey[] =
    presentation.techLines === "both"
      ? ["cooler_left", "cooler_right"]
      : presentation.techLines === "own"
        ? [cooler]
        : [];
  for (const current of techCoolers) traces.push(...minimumWallTraces(payload, current, paper));
  // MATLAB shows the validated Al reference wherever the Al tech line is
  // drawn, except in the small grid panels; explicit values override.
  const showReference = presentation.showValidatedRef ?? techCoolers.includes("cooler_left");
  if (showReference) traces.push(validatedReferenceTrace(paper));
  traces.push(...designPointTraces(payload, cooler, paper));
  traces.push(...crossSectionTraces(paper));
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
      // MATLAB robust limits run on the *_plot fields, which are NaN below
      // the cooler's own minimum-wall technology limit.
      const minWallMask = presentation.robustShared
        ? maskArrayForCooler(payload, arrays, current)
        : undefined;
      collectFiniteValues(
        field ? arrays[field.buffer_index] : undefined,
        values,
        presentation.displayFactor,
        minWallMask,
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

export function comparisonBoundaryForResult(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
): ComparisonBoundary | undefined {
  const wallRatioPercent = vectorForField(payload.comparison.fields, arrays, "boundary_wall_ratio");
  const diameterMeters = vectorForField(
    payload.comparison.fields,
    arrays,
    "boundary_right_diameter",
  );
  if (!wallRatioPercent || !diameterMeters) return undefined;
  return {
    diameterMillimeters: Array.from(diameterMeters, (value) =>
      Number.isFinite(value) ? value * 1000 : Number.NaN,
    ),
    wallRatioPercent: Array.from(wallRatioPercent),
  };
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

// Exports reproduce the MATLAB figure size (16.5 x 13.2 cm at 96 dpi) so an
// exported SVG drops into the manuscript at the reference geometry.
export function imageExportOptions(
  plotId: PlotId,
  cooler: CoolerKey,
  format: ImageFormat,
  pngScale = 2,
): PlotImageOptions {
  return {
    filename: `${plotId}-${cooler}`,
    format,
    height: Math.round(SINGLE_MAP.figureCm[1] * (96 / 2.54)),
    scale: format === "png" ? pngScale : 1,
    width: Math.round(referenceWidthPx(SINGLE_MAP)),
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

function clipComparisonToBoundary(
  prepared: PreparedPlotData,
  xValues: number[],
  boundary: ComparisonBoundary,
  presentation: PlotPresentation,
): PreparedPlotData {
  const displayValues = prepared.displayValues.map((row, rowIndex) => {
    const tau = prepared.tauValues[rowIndex];
    const minimumDiameter =
      tau === undefined ? Number.NaN : interpolateComparisonBoundary(boundary, tau);
    const firstFiniteIndex = row.findIndex(
      (value, column) =>
        Number.isFinite(value) && (xValues[column] ?? Number.NEGATIVE_INFINITY) >= minimumDiameter,
    );
    const boundaryValue =
      firstFiniteIndex >= 0 ? (row[firstFiniteIndex] ?? Number.NaN) : Number.NaN;
    return row.map((value, column) => {
      const diameter = xValues[column];
      if (diameter === undefined || !Number.isFinite(minimumDiameter) || diameter < minimumDiameter)
        return Number.NaN;
      // The composite boundary is evaluated on the core's denser query grid.
      // Close only the sub-cell display band up to the first finite native
      // comparison sample with nearest-neighbour edge extension; the white
      // boundary mask below then cuts the raster at the exact exported curve.
      if (Number.isFinite(value)) return value;
      return firstFiniteIndex >= 0 && column < firstFiniteIndex ? boundaryValue : Number.NaN;
    });
  });
  const plotValues = displayValues.map((row) =>
    row.map((value) =>
      presentation.colorScaleType === "log" && value > 0
        ? Math.log10(value)
        : presentation.colorScaleType === "log"
          ? Number.NaN
          : value,
    ),
  );
  return { ...prepared, displayValues, plotValues };
}

function interpolateComparisonBoundary(boundary: ComparisonBoundary, tau: number): number {
  const y = boundary.wallRatioPercent;
  const x = boundary.diameterMillimeters;
  if (
    y.length < 2 ||
    x.length !== y.length ||
    tau < (y[0] ?? Infinity) ||
    tau > (y.at(-1) ?? -Infinity)
  )
    return Number.NaN;
  let lower = 0;
  let upper = y.length - 1;
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2);
    if ((y[middle] ?? tau) <= tau) lower = middle;
    else upper = middle;
  }
  const y0 = y[lower];
  const y1 = y[upper];
  const x0 = x[lower];
  const x1 = x[upper];
  if (
    y0 === undefined ||
    y1 === undefined ||
    x0 === undefined ||
    x1 === undefined ||
    ![y0, y1, x0, x1].every(Number.isFinite)
  )
    return Number.NaN;
  if (y1 === y0) return x0;
  return x0 + ((tau - y0) / (y1 - y0)) * (x1 - x0);
}

function comparisonBoundaryMaskTraces(boundary: ComparisonBoundary): PlotlyData[] {
  const traces: PlotlyData[] = [];
  let x: number[] = [];
  let y: number[] = [];
  const flush = () => {
    if (x.length < 2 || y.length < 2) {
      x = [];
      y = [];
      return;
    }
    traces.push({
      fill: "toself",
      fillcolor: "#ffffff",
      hoverinfo: "skip",
      line: { color: "#ffffff", width: 0 },
      mode: "lines",
      name: "",
      showlegend: false,
      type: "scatter",
      x: [0.1, ...x, 0.1],
      y: [y[0] ?? 0, ...y, y.at(-1) ?? 0],
    });
    x = [];
    y = [];
  };
  for (let index = 0; index < boundary.wallRatioPercent.length; index += 1) {
    const tau = boundary.wallRatioPercent[index];
    const diameter = boundary.diameterMillimeters[index];
    if (
      tau === undefined ||
      diameter === undefined ||
      !Number.isFinite(tau) ||
      !Number.isFinite(diameter) ||
      tau < TAU_MIN ||
      tau > TAU_MAX
    ) {
      flush();
      continue;
    }
    x.push(diameter);
    y.push(tau);
  }
  flush();
  return traces;
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
  let centerZero = false;
  if (plot.family === "percent-delta" && !presentation.colorLimits) {
    const limit = Math.max(Math.abs(lower), Math.abs(upper));
    lower = -limit;
    upper = limit;
    centerZero = true;
  }
  return transformedDomain([lower, upper], presentation.colorScaleType, centerZero);
}

// MATLAB caxis maps colors linearly across the limits; zero-centering is only
// used for auto-symmetric delta domains without explicit paper limits.
function transformedDomain(
  bounds: readonly [number, number],
  type: "binary" | "linear" | "log",
  centerZero = false,
): ColorDomain {
  if (type === "log") return { zmin: Math.log10(bounds[0]), zmax: Math.log10(bounds[1]) };
  return {
    zmin: bounds[0],
    zmax: bounds[1],
    ...(centerZero && bounds[0] < 0 && bounds[1] > 0 ? { zmid: 0 } : {}),
  };
}

export function colorbarSpec(
  plot: PlotDefinition,
  domain: ColorDomain | undefined,
  paper: PaperContext = DEFAULT_PAPER,
): NonNullable<PlotlyData["colorbar"]> {
  const presentation = presentationForPlot(plot);
  const { geometry, zoom } = paper;
  const placement = paperColorbarPlacement(geometry, zoom);
  // The vertical bar label is drawn as a rotated layout annotation instead
  // (MATLAB reads it bottom-up; plotly's side-right title reads top-down).
  const spec: NonNullable<PlotlyData["colorbar"]> = {
    outlinecolor: AXIS_COLOR,
    outlinewidth: zoom.pt(geometry.baseFontPt >= 19 ? 1.3 : 1.0),
    tickfont: { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) },
    ticks: "inside",
    ticklen: zoom.cm(0.09),
    title: {
      font: { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) },
      side: "right",
      text: "",
    },
  };
  if (placement) {
    spec.len = placement.len;
    spec.lenmode = "fraction";
    spec.thickness = placement.thickness;
    spec.thicknessmode = "pixels";
    spec.x = placement.x;
    spec.xanchor = placement.xanchor;
    spec.y = placement.y;
    spec.yanchor = placement.yanchor;
    if (geometry.colorbarOrientation === "h") {
      spec.orientation = "h";
      // MATLAB top bars carry tick labels above the bar; plotly cannot move
      // carrier-trace tick labels there, so they are drawn as annotations
      // (horizontalBarTickAnnotations) and hidden on the bar itself.
      spec.showticklabels = false;
      spec.title = { ...spec.title, side: "top", text: "" };
    }
  }
  if (domain && presentation.colorScaleType === "log") {
    const ticks = presentation.colorbarTicks
      ? presentation.colorbarTicks.filter(
          (value) =>
            value >= 10 ** domain.zmin * (1 - 1e-10) && value <= 10 ** domain.zmax * (1 + 1e-10),
        )
      : logTicks(10 ** domain.zmin, 10 ** domain.zmax);
    const selected = collisionFreeColorbarTicks(
      ticks.map(Math.log10),
      ticks.map(formatPlainNumber),
      domain,
      paper,
    );
    spec.tickvals = selected.values;
    spec.ticktext = selected.labels;
  } else if (presentation.colorbarTickValues && presentation.colorScaleType === "linear") {
    const ticks = [...presentation.colorbarTickValues];
    // Delta maps sign their percent ticks ("+50 %"); share-style maps with a
    // non-negative caxis label plainly ("50 %"), matching MATLAB.
    const signed = (presentation.colorLimits?.[0] ?? 0) < 0;
    const labels = ticks.map((value) =>
      presentation.displayUnit === "%"
        ? signed
          ? formatSignedPercent(value)
          : `${formatPlainNumber(value)} %`
        : formatPlainNumber(value),
    );
    const selected = domain
      ? collisionFreeColorbarTicks(ticks, labels, domain, paper)
      : { labels, values: ticks };
    spec.tickvals = selected.values;
    spec.ticktext = selected.labels;
  } else if (domain && presentation.colorScaleType === "binary") {
    spec.tickvals = [0, 1];
    spec.ticktext = ["0", "1"];
  } else if (domain) {
    const ticks = niceLinearTicks(domain.zmin, domain.zmax, 7);
    const labels = ticks.map(formatPlainNumber);
    const selected = collisionFreeColorbarTicks(ticks, labels, domain, paper);
    spec.tickvals = selected.values;
    spec.ticktext = selected.labels;
  }
  if (
    geometry.colorbarOrientation === "v" &&
    (spec.ticktext as string[] | undefined)?.some((label) => plainText(label).length >= 6)
  ) {
    spec.tickfont = {
      color: AXIS_COLOR,
      family: PLOT_FONT,
      size: zoom.pt(geometry.baseFontPt - 1.5),
    };
  }
  return spec;
}

function collisionFreeColorbarTicks(
  values: readonly number[],
  labels: readonly string[],
  domain: ColorDomain,
  paper: PaperContext,
): { labels: string[]; values: number[] } {
  const colorbar = paper.geometry.colorbarCm;
  if (!colorbar || values.length <= 2 || !(domain.zmax > domain.zmin)) {
    return { labels: [...labels], values: [...values] };
  }
  const horizontal = paper.geometry.colorbarOrientation === "h";
  const lengthPx = paper.zoom.cm(horizontal ? colorbar[2] : colorbar[3]);
  const fontPx = paper.zoom.pt(paper.geometry.baseFontPt);
  const candidates = values
    .map((value, index) => {
      const label = labels[index] ?? formatPlainNumber(value);
      const center = ((value - domain.zmin) / (domain.zmax - domain.zmin)) * lengthPx;
      const extent = horizontal
        ? Math.max(fontPx * 0.8, plainText(label).length * fontPx * 0.54)
        : fontPx * 1.18;
      return { center, extent, label, value };
    })
    .filter((candidate) => candidate.center >= -1e-8 && candidate.center <= lengthPx + 1e-8)
    .sort((left, right) => left.center - right.center);
  if (candidates.length <= 2)
    return {
      labels: candidates.map((candidate) => candidate.label),
      values: candidates.map((candidate) => candidate.value),
    };

  const gapPx = Math.max(2, fontPx * (horizontal ? 0.18 : 0.32));
  const selected = [candidates[0]!];
  const last = candidates.at(-1)!;
  for (const candidate of candidates.slice(1, -1)) {
    const previous = selected.at(-1)!;
    const previousEnd = previous.center + previous.extent / 2;
    const candidateStart = candidate.center - candidate.extent / 2;
    const candidateEnd = candidate.center + candidate.extent / 2;
    const lastStart = last.center - last.extent / 2;
    if (candidateStart >= previousEnd + gapPx && candidateEnd + gapPx <= lastStart)
      selected.push(candidate);
  }
  while (selected.length > 1) {
    const previous = selected.at(-1)!;
    if (last.center - last.extent / 2 >= previous.center + previous.extent / 2 + gapPx) break;
    selected.pop();
  }
  selected.push(last);
  const selectedByInputOrder = selected.sort(
    (left, right) => values.indexOf(left.value) - values.indexOf(right.value),
  );
  return {
    labels: selectedByInputOrder.map((candidate) => candidate.label),
    values: selectedByInputOrder.map((candidate) => candidate.value),
  };
}

/**
 * Invisible trace that owns the visible colorbar. With `reversedBar`, the
 * color axis is negated and the scale mirrored, which shows the identical
 * color-to-value mapping with high values at the bar's start — MATLAB's
 * colorbar Direction = 'reverse' (bar display only, data mapping unchanged).
 */
export function colorbarCarrierTrace(
  domain: ColorDomain,
  scale: PlotlyColorScale,
  colorbar: NonNullable<PlotlyData["colorbar"]>,
  reversedBar: boolean,
): PlotlyData {
  const carrierTicks = tickTargets(colorbar, domain);
  const marker = reversedBar
    ? {
        cmax: -domain.zmin,
        cmin: -domain.zmax,
        color: [-domain.zmin, -domain.zmax],
        colorbar: {
          ...colorbar,
          tickvals: carrierTicks.map((tick) => -tick.value),
          ticktext: carrierTicks.map((tick) => tick.label),
        },
        colorscale: scale.map(([stop, color]) => [1 - stop, color]).reverse() as PlotlyColorScale,
        opacity: 0,
        showscale: true,
      }
    : {
        cmax: domain.zmax,
        cmin: domain.zmin,
        color: [domain.zmin, domain.zmax],
        colorbar,
        colorscale: scale,
        opacity: 0,
        showscale: true,
      };
  return {
    hoverinfo: "skip",
    marker,
    mode: "markers",
    name: "",
    showlegend: false,
    type: "scatter",
    x: [null],
    y: [null],
  };
}

function reversedColorbarCarrier(
  domain: ColorDomain,
  scale: PlotlyColorScale,
  colorbar: NonNullable<PlotlyData["colorbar"]>,
): PlotlyData {
  return colorbarCarrierTrace(domain, scale, colorbar, true);
}

/**
 * MATLAB top colorbars label above the bar; plotly keeps carrier-trace tick
 * labels below, so the labels are layout annotations at bar fractions.
 */
export function horizontalBarTickAnnotations(
  geometry: PaperFigureGeometry,
  zoom: PaperZoom,
  ticks: ReadonlyArray<{ fraction: number; label: string }>,
): Array<Record<string, unknown>> {
  if (!geometry.colorbarCm) return [];
  const { margin, plotAreaCm } = paperMargins(geometry);
  const [cbLeft, cbBottom, cbWidth, cbHeight] = geometry.colorbarCm;
  return ticks
    .filter((tick) => tick.fraction >= -1e-9 && tick.fraction <= 1 + 1e-9)
    .map((tick) => ({
      font: { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) },
      showarrow: false,
      text: tick.label,
      x: (cbLeft + cbWidth * tick.fraction - margin.l) / plotAreaCm[0],
      xanchor: "center",
      xref: "paper",
      y: (cbBottom + cbHeight + 0.3 - margin.b) / plotAreaCm[1],
      yanchor: "bottom",
      yref: "paper",
    }));
}

/** Simplified downward summary brace under a horizontal bar segment. */
export function braceShape(
  x0: number,
  x1: number,
  yTop: number,
  yTip: number,
  widthPx: number,
): Record<string, unknown> {
  const xm = (x0 + x1) / 2;
  return {
    line: { color: AXIS_COLOR, width: widthPx },
    path:
      `M ${x0},${yTop} L ${x0},${(yTop + yTip) / 2} L ${xm - (x1 - x0) * 0.02},${(yTop + yTip) / 2} ` +
      `L ${xm},${yTip} L ${xm + (x1 - x0) * 0.02},${(yTop + yTip) / 2} ` +
      `L ${x1},${(yTop + yTip) / 2} L ${x1},${yTop}`,
    type: "path",
    xref: "paper",
    yref: "paper",
  };
}

function tickTargets(
  colorbar: NonNullable<PlotlyData["colorbar"]>,
  domain: ColorDomain,
): Array<{ label: string; value: number }> {
  const values = (colorbar.tickvals as number[] | undefined) ?? [domain.zmin, domain.zmax];
  const labels = (colorbar.ticktext as string[] | undefined) ?? values.map(formatPlainNumber);
  return values.map((value, index) => ({
    label: labels[index] ?? formatPlainNumber(value),
    value,
  }));
}

function isoContourTraces(
  plot: PlotDefinition,
  cooler: CoolerKey,
  x: number[],
  y: number[],
  z: number[][],
  paper: PaperContext,
): PlotlyData[] {
  const presentation = presentationForPlot(plot);
  const { geometry, zoom } = paper;
  const traces: PlotlyData[] = [];
  // Contours are drawn on the linear display values so plotly's inline
  // labels show the physical level (MATLAB labels), not a log10 transform.
  const levels = contourLevelsForData(presentation, cooler, z);
  for (const level of levels) {
    traces.push({
      contours: {
        coloring: "none",
        end: level,
        labelfont: {
          color: "#1f1f1f",
          family: PLOT_FONT,
          size: zoom.pt(geometry.baseFontPt - 2),
        },
        // All labels are deterministic layout annotations. Plotly's automatic
        // path direction can rotate neighboring labels by 180 degrees and it
        // offers no reliable cross-trace collision policy.
        showlabels: false,
        size: 1,
        start: level,
      },
      hoverinfo: "skip",
      line: { color: "#1f1f1f", width: zoom.pt(presentation.contourWidthPt ?? 0.75) },
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
    const level = presentation.transitionLevel;
    traces.push({
      contours: { coloring: "none", end: level, showlabels: false, size: 1, start: level },
      hoverinfo: "skip",
      line: { color: "#000000", dash: "dash", width: zoom.pt(1.35) },
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

function contourLevelsForData(
  presentation: PlotPresentation,
  cooler: CoolerKey,
  z: number[][],
): number[] {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const row of z)
    for (const value of row)
      if (Number.isFinite(value)) {
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
      }
  if (!(maximum > minimum)) return [];
  if (presentation.shareSparseLevels) return sparseShareLevels(minimum, maximum);
  if (presentation.contourLevels)
    return presentation.contourLevels.filter((level) => level > minimum && level < maximum);
  const step = presentation.contourStepByCooler?.[cooler] ?? presentation.contourStep;
  if (step) return steppedLevels(minimum, maximum, step);
  if (presentation.colorScaleType === "log") {
    const levels = logTicks(Math.max(minimum, Number.MIN_VALUE), maximum);
    return spreadSelection(levels, 11);
  }
  return niceLinearTicks(minimum, maximum, 9).filter((level) => level > minimum && level < maximum);
}

function steppedLevels(minimum: number, maximum: number, step: number): number[] {
  const levels: number[] = [];
  for (let index = Math.ceil(minimum / step); index * step < maximum; index += 1) {
    const level = index * step;
    if (level > minimum) levels.push(Number(level.toPrecision(12)));
  }
  return levels;
}

// MATLAB makeSparseShareContourLevels: choose the candidate step whose level
// count is closest to 11 (preferring 8..15). Small steps serve sub-percent
// share panels (phi_w,Al).
function sparseShareLevels(minimum: number, maximum: number): number[] {
  const candidates =
    maximum - minimum < 1.5 ? [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5] : [1, 2, 5, 10, 20, 25];
  let best: number[] = [];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const step of candidates) {
    const levels = steppedLevels(Math.max(minimum, 0), Math.min(maximum, 100), step);
    if (!levels.length) continue;
    const count = levels.length;
    const inRange = count >= 8 && count <= 15;
    const score =
      (inRange ? 0 : 100 + Math.min(Math.abs(count - 8), Math.abs(count - 15))) +
      Math.abs(count - 11);
    if (score < bestScore) {
      bestScore = score;
      best = levels;
    }
  }
  return best;
}

// MATLAB label selection: selectSingleMapContourLabels / selectBarContourLabels /
// selectCostContourLabels; reynolds/mm/pressuredrop label every drawn level.
function labelledContourLevels(presentation: PlotPresentation, levels: number[]): number[] {
  if (!levels.length) return [];
  if (presentation.shareSparseLevels) return spreadInteriorSelection(levels, 2);
  const mode = presentation.contourLabelMode ?? "all";
  if (mode === "all") return levels;
  if (mode === "plain") {
    const preferred = levels.filter((level) => level >= 100 && level % 100 === 0);
    return preferred.length ? spreadSelection(preferred, 4) : spreadSelection(levels, 4);
  }
  if (mode === "bar") {
    const preferred =
      Math.max(...levels) <= 120 ? [5, 10, 20, 30, 50, 75, 100] : [200, 400, 800, 1200, 1600, 2000];
    const chosen = levels.filter((level) => preferred.includes(level));
    return chosen.length ? chosen : spreadSelection(levels, 7);
  }
  if (mode === "cost") return spreadSelection(levels, 7);
  if (mode === "percent") {
    const preferred = presentation.contourLabelLevels ?? [];
    const chosen = levels.filter((level) => preferred.includes(level));
    return chosen.length ? chosen : levels;
  }
  return levels;
}

function spreadSelection(levels: number[], count: number): number[] {
  if (levels.length <= count) return levels;
  const indices = new Set<number>();
  for (let index = 0; index < count; index += 1)
    indices.add(Math.round((index * (levels.length - 1)) / (count - 1)));
  return [...indices].map((index) => levels[index] ?? 0);
}

function spreadInteriorSelection(levels: number[], count: number): number[] {
  const pool = levels.length > count + 2 ? levels.slice(1, -1) : levels;
  return spreadSelection(pool, count);
}

function scientificLayout(
  provenance: Provenance,
  plot: PlotDefinition,
  paper: PaperContext,
  colorDomain?: ColorDomain,
): PlotlyLayout {
  const presentation = presentationForPlot(plot);
  const { geometry, zoom } = paper;
  const { margin } = paperMargins(geometry);
  const yStep = presentation.yTickStep ?? 10;
  const labelFont = {
    color: AXIS_COLOR,
    family: PLOT_FONT,
    size: zoom.pt(geometry.baseFontPt * 1.1),
  };
  const marginPx = {
    b: zoom.cm(margin.b),
    l: zoom.cm(margin.l),
    r: zoom.cm(margin.r),
    t: zoom.cm(margin.t),
  };
  const plotHeightCm = geometry.figureCm[1] - margin.t - margin.b;
  const annotations: Array<Record<string, unknown>> = [
    {
      font: { color: "#666666", family: PLOT_FONT, size: zoom.pt(8) },
      showarrow: false,
      text: provenanceFooter(provenance),
      x: -margin.l / (geometry.figureCm[0] - margin.l - margin.r),
      xanchor: "left",
      xref: "paper",
      y: -(margin.b - 0.12) / plotHeightCm,
      yanchor: "bottom",
      yref: "paper",
    },
  ];
  if (geometry.colorbarOrientation === "v" && geometry.colorbarCm) {
    // MATLAB colorbar label: rotated, reading bottom-up, right of the ticks.
    const { plotAreaCm } = paperMargins(geometry);
    const tickLabels = colorbarSpec(plot, colorDomain, paper).ticktext as string[] | undefined;
    const maxTickCharacters = Math.max(
      1,
      ...(tickLabels ?? []).map((text) => plainText(text).length),
    );
    const fontHeightCm = geometry.baseFontPt * (2.54 / 72);
    const estimatedTickWidthCm = maxTickCharacters * fontHeightCm * 0.52;
    const colorbarRightCm = geometry.colorbarCm[0] + geometry.colorbarCm[2];
    const maximumOffsetCm = geometry.figureCm[0] - colorbarRightCm - fontHeightCm / 2 - 0.1;
    const labelOffsetCm = Math.min(
      maximumOffsetCm,
      Math.max(1.85, 0.58 + estimatedTickWidthCm + fontHeightCm / 2),
    );
    const labelXCm = colorbarRightCm + labelOffsetCm;
    annotations.push({
      font: { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) },
      showarrow: false,
      text: presentation.colorbarLabel,
      textangle: -90,
      x: (labelXCm - margin.l) / plotAreaCm[0],
      xanchor: "center",
      xref: "paper",
      y: 0.5,
      yanchor: "middle",
      yref: "paper",
    });
  }
  const shapes: Array<Record<string, unknown>> = [];
  if (presentation.paperVariant === "tech-ka-delta" && presentation.colorLimits) {
    // MATLAB Fig. 22 top-bar dressing: tick labels above the reversed bar,
    // superiority braces below it (params.ratio_pct_brace_*).
    const [minimum, maximum] = presentation.colorLimits;
    const tickValues = presentation.colorbarTickValues ?? [minimum, maximum];
    annotations.push(
      ...horizontalBarTickAnnotations(
        geometry,
        zoom,
        tickValues.map((value) => ({
          fraction: (maximum - value) / (maximum - minimum),
          label: formatSignedPercent(value),
        })),
      ),
    );
    const zeroFraction = maximum / (maximum - minimum);
    const { plotAreaCm } = paperMargins(geometry);
    const paperXFromCm = (cm: number): number => (cm - margin.l) / plotAreaCm[0];
    const paperYFromCm = (cm: number): number => (cm - margin.b) / plotHeightCm;
    const cb = geometry.colorbarCm;
    if (cb) {
      // MATLAB params_kA_delta.ratio_pct_colorbar_label_y_cm = 17.15.
      annotations.push({
        font: { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) },
        showarrow: false,
        text: presentation.colorbarLabel,
        x: paperXFromCm(cb[0] + cb[2] / 2),
        xanchor: "center",
        xref: "paper",
        y: paperYFromCm(17.15),
        yanchor: "middle",
        yref: "paper",
      });
      const braceTop = paperYFromCm(15.09);
      const braceTip = paperYFromCm(14.86);
      const barX = (fraction: number): number => paperXFromCm(cb[0] + cb[2] * fraction);
      shapes.push(
        braceShape(barX(0.005), barX(zeroFraction - 0.005), braceTop, braceTip, zoom.pt(0.9)),
        braceShape(barX(zeroFraction + 0.005), barX(0.995), braceTop, braceTip, zoom.pt(0.9)),
      );
    }
    const labelY = paperYFromCm(14.74);
    const braceFont = { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) };
    annotations.push(
      {
        font: braceFont,
        showarrow: false,
        text: "PA superiority",
        x: zeroFraction / 2,
        xref: "paper",
        y: labelY,
        yanchor: "top",
        yref: "paper",
      },
      {
        font: braceFont,
        showarrow: false,
        text: "Al superiority",
        x: zeroFraction + (1 - zeroFraction) / 2,
        xref: "paper",
        y: labelY,
        yanchor: "top",
        yref: "paper",
      },
    );
  }
  return {
    annotations,
    ...(shapes.length ? { shapes } : {}),
    font: { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) },
    height: Math.round(zoom.height),
    margin: {
      b: Math.round(marginPx.b),
      l: Math.round(marginPx.l),
      r: Math.round(marginPx.r),
      t: Math.round(marginPx.t),
    },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    showlegend: false,
    width: Math.round(zoom.width),
    xaxis: {
      ...paperAxisStyle(paper, "x"),
      range: [-1, 1],
      title: {
        font: labelFont,
        standoff: zoom.cm(0.18),
        text: "Outer diameter, <i>d</i><sub>o</sub> [mm]",
      },
      type: "log",
    },
    yaxis: {
      ...paperAxisStyle(paper, "y"),
      dtick: yStep,
      range: [0, 40],
      tick0: 0,
      tickmode: "linear",
      title: {
        font: labelFont,
        text: "Wall-thickness ratio, <i>τ</i> = <i>t</i>/<i>d</i><sub>o</sub> [%]",
      },
    },
  };
}

/**
 * Shared MATLAB axis appearance: boxed axes with mirrored inside ticks,
 * light solid major grid, dotted minor grid (log x only), Times fonts.
 * `tickLabelStyle` "power" shows 10^n labels (MATLAB log default, single
 * maps); "plain" shows 0.1/1/10 (grid figures).
 */
export function paperAxisStyle(
  paper: PaperContext,
  axis: "x" | "y",
  tickLabelStyle: "plain" | "power" = "power",
): Record<string, unknown> {
  const { geometry, zoom } = paper;
  const base: Record<string, unknown> = {
    gridcolor: MAJOR_GRID_COLOR,
    gridwidth: Math.max(1, zoom.pt(0.5)),
    linecolor: AXIS_COLOR,
    linewidth: zoom.pt(geometry.baseFontPt >= 19 ? 1.3 : 1.0),
    mirror: "ticks",
    showgrid: true,
    showline: true,
    tickcolor: AXIS_COLOR,
    tickfont: { color: AXIS_COLOR, family: PLOT_FONT, size: zoom.pt(geometry.baseFontPt) },
    ticklen: zoom.cm(0.097),
    ticks: "inside",
    tickwidth: zoom.pt(geometry.baseFontPt >= 19 ? 1.3 : 1.0),
    zeroline: false,
  };
  if (axis === "x") {
    base.tickmode = "array";
    base.tickvals = [0.1, 1, 10];
    base.ticktext =
      tickLabelStyle === "power"
        ? ["10<sup>−1</sup>", "10<sup>0</sup>", "10<sup>1</sup>"]
        : ["0.1", "1", "10"];
    base.minor = {
      // "D1" = log-decade minors at 2..9 (matches MATLAB log minor grid);
      // without it plotly falls back to dense linear minor ticks.
      dtick: "D1",
      gridcolor: MINOR_GRID_COLOR,
      griddash: "dot",
      gridwidth: Math.max(1, zoom.pt(0.5)),
      showgrid: true,
      tickcolor: AXIS_COLOR,
      ticklen: zoom.cm(0.055),
      ticks: "inside",
      tickwidth: Math.max(1, zoom.pt(0.5)),
    };
  }
  return base;
}

function boundaryTraces(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  cooler: CoolerKey,
  paper: PaperContext,
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
          hoverinfo: "skip",
          line: { color: "#ffffff", width: paper.zoom.pt(3.6) },
          mode: "lines",
          name: "",
          showlegend: false,
          type: "scatter",
          x,
          y,
        },
        {
          hovertemplate: "d_o=%{x:.4g} mm<br>τ=%{y:.3g} %<extra>Feasible boundary</extra>",
          line: techLineStyle(cooler, paper),
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

// MATLAB design-boundary screen-line colors and legend wording
// (params.design_boundary_color_*, addDesignBoundaryLegend).
export const screenBoundaryDefinitions = [
  {
    color: "#000000",
    field: null,
    label: "Minimum wall",
    mask: "mask_screen_min_wall",
    threshold: "min-wall",
    violation: "less",
  },
  {
    color: "#0052bd",
    field: "coolant_volume_flow",
    label: "Coolant throughput",
    mask: "mask_screen_coolant_flow",
    threshold: "min_coolant_volume_flow",
    violation: "less",
  },
  {
    color: "#e68c00",
    field: "tube_pressure_drop",
    label: "Pressure drop",
    mask: "mask_screen_pressure_drop",
    threshold: "max_tube_pressure_drop",
    violation: "greater",
  },
  {
    color: "#9400d4",
    field: "cost_index",
    label: "Tube cost",
    mask: "mask_screen_cost",
    threshold: "max_cost_index",
    violation: "greater-equal",
  },
  {
    color: "#009433",
    field: "burst_pressure",
    label: "Burst pressure",
    mask: "mask_screen_burst_pressure",
    threshold: "min_burst_pressure",
    violation: "less",
  },
  {
    color: "#cc0000",
    field: "capillary_rise",
    label: "Capillary rise",
    mask: "mask_screen_capillary",
    threshold: "max_capillary_rise",
    violation: "greater",
  },
] as const;

type ScreenBoundaryDefinition = (typeof screenBoundaryDefinitions)[number];
type BoundaryViolation = ScreenBoundaryDefinition["violation"];

function screenBoundaryTraces(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  cooler: CoolerKey,
  paper: PaperContext,
  request?: SimulationRequest,
): PlotlyData[] {
  const xAxis = axisMillimeters(payload.outer_diameter_axis);
  const tAxis = axisMillimeters(payload.wall_thickness_axis);
  const traces: PlotlyData[] = [];
  for (const boundary of screenBoundaryDefinitions) {
    const geometry = designBoundaryGeometry(
      payload,
      arrays,
      cooler,
      boundary,
      xAxis,
      tAxis,
      request,
    );
    if (!geometry || geometry.paths.length === 0) continue;
    traces.push(boundaryLineTrace(geometry.paths, boundary.color, boundary.label, paper));
    const hatch = screenHatchTrace(geometry.paths, geometry.isRejected, boundary.color, paper);
    if (hatch) traces.push(hatch);
  }
  return traces;
}

function designBoundaryGeometry(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  cooler: CoolerKey,
  boundary: ScreenBoundaryDefinition,
  xAxis: number[],
  tAxis: number[],
  request?: SimulationRequest,
): { isRejected: (point: BoundaryPoint) => boolean; paths: BoundaryPath[] } | undefined {
  if (boundary.field === null) {
    const thresholdMeters =
      request?.[cooler].material.min_wall_thickness ??
      finiteSummaryValue(payload, cooler, "material_min_wall_thickness");
    if (thresholdMeters !== undefined && thresholdMeters > 0) {
      const thresholdMillimeters = thresholdMeters * 1000;
      const path = Array.from({ length: 500 }, (_, index) => {
        const fraction = index / 499;
        const x = 10 ** (-1 + 2 * fraction);
        return { x, y: (100 * thresholdMillimeters) / x };
      });
      return {
        isRejected: (point) => (point.x * point.y) / 100 < thresholdMillimeters,
        paths: clipBoundaryPaths([path]),
      };
    }
  }

  const threshold = request ? screenBoundaryThreshold(request, cooler, boundary) : undefined;
  const continuous =
    boundary.field === null
      ? undefined
      : matrixForField(payload[cooler].fields, arrays, boundary.field);
  if (continuous && threshold !== undefined && Number.isFinite(threshold)) {
    const paths = marchingSquaresPaths(xAxis, tAxis, continuous, threshold).map((path) =>
      path.map((point) => ({ x: point.x, y: (100 * point.y) / point.x })),
    );
    return {
      isRejected: (point) => {
        const value = bilinearGridValue(
          xAxis,
          tAxis,
          continuous,
          point.x,
          (point.x * point.y) / 100,
        );
        return !Number.isFinite(value) || violatesThreshold(value, threshold, boundary.violation);
      },
      paths: clipBoundaryPaths(paths),
    };
  }

  // Backward-compatible fallback for result fixtures without a request. It
  // still contours the native mask grid directly; production rendering uses
  // the continuous field and active request threshold above.
  const mask = matrixForField(payload[cooler].masks, arrays, boundary.mask);
  if (!mask) return undefined;
  const paths = marchingSquaresPaths(xAxis, tAxis, mask, 0.5).map((path) =>
    path.map((point) => ({ x: point.x, y: (100 * point.y) / point.x })),
  );
  return {
    isRejected: (point) => {
      const value = bilinearGridValue(xAxis, tAxis, mask, point.x, (point.x * point.y) / 100);
      return !Number.isFinite(value) || value > 0.5;
    },
    paths: clipBoundaryPaths(paths),
  };
}

function screenBoundaryThreshold(
  request: SimulationRequest,
  cooler: CoolerKey,
  boundary: ScreenBoundaryDefinition,
): number | undefined {
  const configuration = request[cooler];
  const screens = configuration.boundary_conditions.screens;
  switch (boundary.threshold) {
    case "min-wall":
      return configuration.material.min_wall_thickness;
    case "min_coolant_volume_flow":
      return screens.min_coolant_volume_flow;
    case "max_tube_pressure_drop":
      return screens.max_tube_pressure_drop;
    case "max_cost_index":
      return screens.max_cost_index;
    case "min_burst_pressure":
      return screens.min_burst_pressure;
    case "max_capillary_rise":
      return screens.max_capillary_rise;
  }
}

function violatesThreshold(
  value: number,
  threshold: number,
  violation: BoundaryViolation,
): boolean {
  if (violation === "less") return value < threshold;
  if (violation === "greater") return value > threshold;
  return value >= threshold;
}

function clipBoundaryPaths(paths: readonly BoundaryPath[]): BoundaryPath[] {
  const clipped: BoundaryPath[] = [];
  for (const path of paths) {
    let current: BoundaryPath = [];
    for (const point of path) {
      const visible =
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        point.x >= 0.1 &&
        point.x <= 10 &&
        point.y >= TAU_MIN &&
        point.y <= TAU_MAX;
      if (visible) current.push(point);
      else if (current.length) {
        if (current.length >= 2) clipped.push(current);
        current = [];
      }
    }
    if (current.length >= 2) clipped.push(current);
  }
  return clipped;
}

function boundaryLineTrace(
  paths: readonly BoundaryPath[],
  color: string,
  label: string,
  paper: PaperContext,
): PlotlyData {
  const x: Array<number | null> = [];
  const y: Array<number | null> = [];
  for (const path of paths) {
    for (const point of path) {
      x.push(point.x);
      y.push(point.y);
    }
    x.push(null);
    y.push(null);
  }
  return {
    hoverinfo: "skip",
    line: { color, width: paper.zoom.pt(1.45) },
    mode: "lines",
    name: label,
    showlegend: false,
    type: "scatter",
    x,
    y,
  };
}

function screenHatchTrace(
  paths: readonly BoundaryPath[],
  isRejected: (point: BoundaryPoint) => boolean,
  color: string,
  paper: PaperContext,
): PlotlyData | undefined {
  const hatches = localBoundaryHatches(paths, {
    angleDegrees: 45,
    isRejected,
    length: 0.026,
    spacing: 0.055,
    xLogRange: [-1, 1],
    yRange: [TAU_MIN, TAU_MAX],
  });
  const x: Array<number | null> = [];
  const y: Array<number | null> = [];
  for (const hatch of hatches) {
    x.push(hatch.start.x, hatch.end.x, null);
    y.push(hatch.start.y, hatch.end.y, null);
  }
  return x.length
    ? {
        hoverinfo: "skip",
        line: { color, width: Math.max(1, paper.zoom.pt(0.75)) },
        mode: "lines",
        name: "",
        showlegend: false,
        type: "scatter",
        x,
        y,
      }
    : undefined;
}

function minimumWallTraces(
  payload: SimulationResultPayload,
  cooler: CoolerKey,
  paper: PaperContext,
): PlotlyData[] {
  const minWall = finiteSummaryValue(payload, cooler, "material_min_wall_thickness");
  const x = axisMillimeters(payload.outer_diameter_axis);
  if (minWall === undefined || x.length === 0) return [];
  const y = x.map((diameter) => (100 * minWall * 1000) / diameter);
  const style = techLineStyle(cooler, paper);
  return [
    {
      hoverinfo: "skip",
      line: { color: "#ffffff", width: paper.zoom.pt(3.6) },
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

function designPointTraces(
  payload: SimulationResultPayload,
  cooler: CoolerKey,
  paper: PaperContext,
): PlotlyData[] {
  const diameter = finiteSummaryValue(payload, cooler, "design_outer_diameter");
  const wall = finiteSummaryValue(payload, cooler, "design_wall_thickness");
  if (diameter === undefined || wall === undefined || diameter <= 0) return [];
  return [
    {
      hovertemplate: "d_o=%{x:.4g} mm<br>τ=%{y:.3g} %<extra>Request design point</extra>",
      marker: {
        color: cooler === "cooler_left" ? "#00427e" : "#b35c00",
        line: { color: "#ffffff", width: Math.max(1, paper.zoom.pt(0.75)) },
        size: paper.zoom.pt(6),
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

// MATLAB params.validated_ref: blue x, size 10 pt, line width 2.2 pt at
// d_o = 1 mm, tau = 10 %.
function validatedReferenceTrace(paper: PaperContext): PlotlyData {
  return {
    hovertemplate: "d_o=1 mm<br>τ=10 %<extra>Validated aluminum reference</extra>",
    marker: {
      color: "#001ae6",
      line: { color: "#001ae6", width: paper.zoom.pt(2.2) },
      size: paper.zoom.pt(10),
      symbol: "x-thin",
    },
    mode: "markers",
    name: "Validated aluminum reference",
    showlegend: false,
    type: "scatter",
    x: [1],
    y: [10],
  };
}

/**
 * Tube cross-section sketches (MATLAB plotCrossSectionSketches). The log-x
 * half width follows rLog = rY * (xLogRange/yRange) * (axesH/axesW) with the
 * panel's own axes size, so the ring is a circle whenever the panel renders
 * at its cm aspect ratio — which the paper layout guarantees at every zoom.
 */
export function crossSectionTraces(paper: PaperContext = DEFAULT_PAPER): PlotlyData[] {
  const { geometry, zoom } = paper;
  const axesRef = geometry.axesCm[0] ?? SINGLE_MAP.axesCm[0];
  const aspect = (axesRef?.[3] ?? 8.75) / (axesRef?.[2] ?? 9.7);
  const traces: PlotlyData[] = [];
  const thetaFull = Array.from({ length: 120 }, (_, index) => (2 * Math.PI * index) / 119);
  const thetaQuarter = Array.from(
    { length: 60 },
    (_, index) => Math.PI / 2 + ((Math.PI / 2) * index) / 59,
  );
  for (const tau of [7.5, 20, 32.5]) {
    const innerScale = Math.max(0, 1 - (2 * tau) / 100);
    for (const diameter of [0.25, 1, 6]) {
      const rY = 1.2 * diameter;
      const rLog = rY * (2 / 40) * aspect;
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
        line: { color: "#4d4d4d", width: Math.max(0.5, zoom.pt(0.7)) },
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
        line: { color: "#4d4d4d", width: Math.max(0.5, zoom.pt(0.5)) },
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

function maskArrayForCooler(
  payload: SimulationResultPayload,
  arrays: readonly Float64Array[],
  cooler: CoolerKey,
): Float64Array | undefined {
  const ref = payload[cooler].masks.find((field) => field.name === "mask_below_min_wall");
  return ref ? arrays[ref.buffer_index] : undefined;
}

function collectFiniteValues(
  array: Float64Array | undefined,
  values: number[],
  factor: number,
  skipMask?: Float64Array,
): void {
  if (!array) return;
  for (let index = 0; index < array.length; index += 1) {
    const value = array[index] ?? Number.NaN;
    if (!Number.isFinite(value)) continue;
    const masked = skipMask?.[index];
    if (masked !== undefined && Number.isFinite(masked) && masked > 0.5) continue;
    values.push(value * factor);
  }
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

// MATLAB makeLogColorbarTicks: 1/2/5-decade values inside the caxis.
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

function niceLinearTicks(minimum: number, maximum: number, targetCount: number): number[] {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || !(maximum > minimum)) return [];
  const roughStep = (maximum - minimum) / Math.max(1, targetCount - 1);
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const error = roughStep / power;
  const multiple = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1;
  const step = multiple * power;
  const first = Math.ceil((minimum - Math.abs(step) * 1e-10) / step) * step;
  const last = Math.floor((maximum + Math.abs(step) * 1e-10) / step) * step;
  const ticks: number[] = [];
  for (let value = first; value <= last + Math.abs(step) * 1e-10; value += step) {
    ticks.push(Number(value.toPrecision(12)));
    if (ticks.length > 100) break;
  }
  return ticks;
}

function formatPlainNumber(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 10_000 || magnitude < 0.001)) {
    const exponent = Math.floor(Math.log10(magnitude));
    const coefficient = value / 10 ** exponent;
    const coefficientText =
      Math.abs(coefficient - 1) < 1e-10 ? "" : `${Number(coefficient.toPrecision(2))}×`;
    return `${coefficientText}10<sup>${exponent < 0 ? "−" : ""}${Math.abs(exponent)}</sup>`;
  }
  return magnitude >= 1
    ? Number(value.toPrecision(6)).toString()
    : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

function formatSignedPercent(value: number): string {
  if (value > 0) return `+${value.toFixed(0)} %`;
  if (value < 0) return `${value.toFixed(0)} %`;
  return "0 %";
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
// MATLAB tech-limit styles: Al dark blue dashed, Poly dark green dotted,
// width 2.6 pt with white underlay.
function techLineStyle(
  cooler: CoolerKey,
  paper: PaperContext,
): { color: string; dash: string; width: number } {
  return cooler === "cooler_left"
    ? { color: "#001999", dash: "dash", width: paper.zoom.pt(2.6) }
    : { color: "#00801a", dash: "dot", width: paper.zoom.pt(2.6) };
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
