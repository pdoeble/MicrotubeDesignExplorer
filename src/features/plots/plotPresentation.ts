import type { PlotDefinition } from "./plotRegistry";

export type ColorScaleType = "binary" | "linear" | "log";
export type ClipMask =
  "all-screen-feasible" | "both-feasible" | "invalid-geometry" | "own-material" | "pa-min-wall";
export type TechLines = "both" | "none" | "own";
export type ContourLabelMode = "all" | "bar" | "cost" | "percent" | "plain";
export type PaperVariant = "single" | "tech-ka-delta";

export type PlotPresentation = {
  colorLimits?: readonly [number, number];
  colorScaleType: ColorScaleType;
  colorbarLabel: string;
  /** Reverse only the visible bar (MATLAB reverseColorbarScale). */
  colorbarReversed?: boolean;
  /** Explicit log-scale colorbar tick values (subset of decades). */
  colorbarTicks?: readonly number[];
  /** Explicit linear colorbar tick values (e.g. MATLAB percent ticks). */
  colorbarTickValues?: readonly number[];
  /** Levels that receive inline labels in "percent" label mode. */
  contourLabelLevels?: readonly number[];
  /** MATLAB label-selection family; "all" labels every drawn level. */
  contourLabelMode?: ContourLabelMode;
  contourLevels?: readonly number[];
  /** Linear level step derived from the data range (MATLAB k_o style). */
  contourStep?: number;
  /** Per-cooler linear level step (MATLAB burst Al 200 / PA 10 bar). */
  contourStepByCooler?: { cooler_left: number; cooler_right: number };
  /** MATLAB contour LineWidth in pt (default 0.75). */
  contourWidthPt?: number;
  displayFactor: number;
  displayUnit: string;
  clipMask: ClipMask;
  /** Reverse the fill colormap itself (MATLAB flipud for cost/dp maps). */
  colormapReversed?: boolean;
  /** Figure geometry family; default is the shared single-map panel. */
  paperVariant?: PaperVariant;
  robustShared?: boolean;
  /**
   * MATLAB makeSparseShareContourLevels: pick a step from candidates so the
   * data range yields ~8-15 levels; label 4 evenly spread ones.
   */
  shareSparseLevels?: boolean;
  /** Show the validated aluminum reference marker even without Al tech line. */
  showValidatedRef?: boolean;
  techLines: TechLines;
  transitionLevel?: number;
  yTickStep?: number;
};

const DEFAULT: PlotPresentation = {
  clipMask: "own-material",
  colorScaleType: "log",
  colorbarLabel: "Value [-]",
  displayFactor: 1,
  displayUnit: "-",
  techLines: "own",
};

const spacingLevels = [0.1, 0.2, 0.5, 1, 2, 5, 10] as const;
const capillaryLevels = [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100] as const;
const kaContourLevels = [
  5, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000,
] as const;

const presentationById: Record<string, Partial<PlotPresentation>> = {
  "inner-heat-transfer-map": {
    colorbarLabel: "<i>α</i><sub>i</sub> [W/(m² K)]",
    contourLabelMode: "plain",
    displayUnit: "W/(m² K)",
  },
  "outer-heat-transfer-map": {
    colorbarLabel: "<i>α</i><sub>o</sub> [W/(m² K)]",
    contourLabelMode: "plain",
    displayUnit: "W/(m² K)",
  },
  "overall-coefficient-map": {
    colorbarLabel: "<i>k</i><sub>o</sub> [W/(m² K)]",
    contourLabelMode: "plain",
    contourStep: 50,
    displayUnit: "W/(m² K)",
    robustShared: true,
  },
  "bundle-conductance-map": {
    colorbarLabel: "Conductance, <i>k</i><sub>o</sub><i>A</i><sub>o</sub> [W K<sup>−1</sup>]",
    contourLabelMode: "plain",
    contourLevels: kaContourLevels,
    displayUnit: "W K⁻¹",
    robustShared: true,
  },
  "tube-count-map": { colorbarLabel: "Continuous tube count, <i>N</i> [-]" },
  "bundle-area-map": {
    colorbarLabel: "Bundle outer area, <i>A</i><sub>o</sub> [m²]",
    displayUnit: "m²",
  },
  "burst-pressure-map": {
    colorbarLabel: "Tolerance-adjusted burst pressure, <i>p</i><sub>b,tol</sub> [bar]",
    contourLabelMode: "bar",
    contourStepByCooler: { cooler_left: 200, cooler_right: 10 },
    displayFactor: 1e-5,
    displayUnit: "bar",
    robustShared: true,
  },
  "burst-pressure-medical-map": {
    colorbarLabel: "Medical-tolerance burst pressure, <i>p</i><sub>b,tol</sub> [bar]",
    contourLabelMode: "bar",
    contourStepByCooler: { cooler_left: 200, cooler_right: 10 },
    displayFactor: 1e-5,
    displayUnit: "bar",
    robustShared: true,
  },
  "reynolds-tube-side-map": {
    clipMask: "pa-min-wall",
    colorLimits: [10, 5000],
    colorbarLabel: "<i>Re</i><sub>i</sub> [-]",
    contourLevels: [10, 20, 50, 100, 200, 500, 1000, 2300, 4000],
    techLines: "both",
    transitionLevel: 2300,
  },
  "reynolds-air-simple-map": {
    clipMask: "pa-min-wall",
    colorLimits: [10, 5000],
    colorbarLabel: "<i>Re</i><sub>a,d</sub> [-]",
    contourLevels: [20, 50, 100, 200, 500, 1000, 2300, 5000, 10000],
    techLines: "both",
    transitionLevel: 2300,
  },
  "reynolds-air-vdi-map": {
    clipMask: "pa-min-wall",
    colorLimits: [20, 10000],
    colorbarLabel: "<i>Re</i><sub>c,l</sub> [-]",
    contourLevels: [20, 50, 100, 200, 500, 1000, 2300, 5000, 10000],
    techLines: "both",
    transitionLevel: 2300,
  },
  "friction-pressure-drop-map": {
    clipMask: "pa-min-wall",
    colorLimits: [0.05, 5],
    colorbarLabel: "Friction pressure drop, Δ<i>p</i><sub>i</sub> [bar]",
    colormapReversed: true,
    contourLevels: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    displayFactor: 1e-5,
    displayUnit: "bar",
    techLines: "both",
  },
  "hydraulic-power-map": { colorbarLabel: "Hydraulic power [W]", displayUnit: "W" },
  "coolant-throughput-map": {
    clipMask: "pa-min-wall",
    colorLimits: [0, 30],
    colorScaleType: "linear",
    colorbarLabel: "Coolant throughput, <i>V̇</i><sub>c,tot</sub> [L min<sup>−1</sup>]",
    colorbarReversed: true,
    colorbarTickValues: [0, 5, 10, 15, 20, 25, 30],
    contourLevels: [1, 2, 5, 10, 15, 20, 25, 30, 40],
    displayFactor: 6e4,
    displayUnit: "L min⁻¹",
    techLines: "both",
  },
  "coolant-mass-flow-map": {
    colorScaleType: "linear",
    colorbarLabel: "Coolant mass flow [kg s⁻¹]",
    displayUnit: "kg s⁻¹",
  },
  "tube-spacing-longitudinal-map": {
    colorLimits: [0.1, 10],
    colorbarLabel: "<i>s</i><sub>L</sub> [mm]",
    contourLevels: spacingLevels,
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "tube-spacing-transverse-map": {
    colorLimits: [0.1, 30],
    colorbarLabel: "<i>s</i><sub>T</sub> [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20],
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "tube-spacing-closest-inline-map": {
    colorLimits: [0.1, 10],
    colorbarLabel: "<i>s</i><sub>min,inline</sub> [mm]",
    contourLevels: spacingLevels,
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "tube-spacing-closest-staggered-map": {
    colorLimits: [0.1, 20],
    colorbarLabel: "<i>s</i><sub>min,stag</sub> [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20],
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "capillary-rise-map": {
    colormapReversed: true,
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise, <i>h</i> [mm]",
    contourLevels: capillaryLevels,
    contourWidthPt: 0.7,
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "capillary-rise-1g-map": {
    colormapReversed: true,
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise, <i>h</i> [mm]",
    contourLevels: capillaryLevels,
    contourWidthPt: 0.7,
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "capillary-rise-5g-map": {
    colormapReversed: true,
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise, <i>h</i> [mm]",
    contourLevels: capillaryLevels,
    contourWidthPt: 0.7,
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "capillary-rise-10g-map": {
    colormapReversed: true,
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise, <i>h</i> [mm]",
    contourLevels: capillaryLevels,
    contourWidthPt: 0.7,
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "tube-supply-cost-map": {
    colorLimits: [0.01, 100],
    colorbarLabel: "<i>C</i><sub>tube</sub>/<i>C</i><sub>fin</sub> [-]",
    colormapReversed: true,
    contourLabelMode: "cost",
    contourLevels: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
  },
  "resistance-inner-map": {
    colorbarLabel: "<i>R</i><sub>i</sub> [m² K W⁻¹]",
    displayUnit: "m² K W⁻¹",
  },
  "resistance-wall-map": {
    colorbarLabel: "<i>R</i><sub>w</sub> [m² K W⁻¹]",
    displayUnit: "m² K W⁻¹",
  },
  "resistance-outer-map": {
    colorbarLabel: "<i>R</i><sub>o</sub> [m² K W⁻¹]",
    displayUnit: "m² K W⁻¹",
  },
  "feasibility-mask-map": {
    clipMask: "invalid-geometry",
    colorLimits: [0, 1],
    colorScaleType: "binary",
    colorbarLabel: "All screens feasible [-]",
    techLines: "both",
  },
  "burst-tolerance-grid": {
    colorLimits: [1, 1000],
    colorbarLabel: "Tolerance-adjusted burst pressure, <i>p</i><sub>b,tol</sub> [bar]",
    contourLabelMode: "bar",
    contourStepByCooler: { cooler_left: 200, cooler_right: 10 },
    displayFactor: 1e-5,
    displayUnit: "bar",
  },
  "capillary-rise-grid": {
    showValidatedRef: false,
    colormapReversed: true,
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise, <i>h</i> [mm]",
    colorbarReversed: true,
    contourLevels: capillaryLevels,
    contourWidthPt: 0.7,
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "resistance-shares-grid": {
    colorLimits: [0, 100],
    colorScaleType: "linear",
    colorbarLabel: "Resistance share, <i>φ</i><sub>j</sub> [%]",
    colorbarTickValues: [0, 10, 25, 50, 75, 90, 100],
    contourWidthPt: 0.65,
    displayUnit: "%",
    shareSparseLevels: true,
  },
  "design-boundary-lines": {
    clipMask: "all-screen-feasible",
    colorLimits: [50, 500],
    colorbarLabel: "Conductance, <i>k</i><sub>o</sub><i>A</i><sub>o</sub> [W K<sup>−1</sup>]",
    colorbarReversed: true,
    colorbarTicks: [50, 75, 100, 150, 200, 300, 500],
    contourLabelMode: "all",
    contourLevels: kaContourLevels,
    techLines: "none",
    yTickStep: 5,
  },
  "tech-adjusted-delta-k": {
    clipMask: "both-feasible",
    colorLimits: [-20, 80],
    colorScaleType: "linear",
    colorbarLabel: "Feasible coefficient difference, Δ<i>k</i><sub>o</sub> [%]",
    colorbarTickValues: [-20, -10, 0, 20, 40, 60, 80],
    contourLabelLevels: [0, 20, 40],
    contourLabelMode: "percent",
    contourStep: 20,
    contourWidthPt: 0.6,
    displayUnit: "%",
    techLines: "none",
  },
  "tech-adjusted-delta-ka": {
    clipMask: "both-feasible",
    colorLimits: [-50, 200],
    colorScaleType: "linear",
    colorbarLabel: "Δ(<i>k</i><sub>o</sub><i>A</i><sub>o</sub>)<sub>feas</sub>",
    colorbarReversed: true,
    colorbarTickValues: [-50, 0, 50, 100, 150, 200],
    contourLevels: [-25, 0, 25, 50, 100, 150],
    contourWidthPt: 1.0,
    displayUnit: "%",
    paperVariant: "tech-ka-delta",
    showValidatedRef: true,
    techLines: "none",
    yTickStep: 5,
  },
  "tech-adjusted-ratio-k": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Feasible coefficient ratio [-]",
    techLines: "none",
  },
  "tech-adjusted-ratio-ka": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Feasible conductance ratio [-]",
    techLines: "none",
  },
  "same-geometry-ratio": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Same-geometry coefficient difference [%]",
    displayUnit: "%",
    techLines: "none",
  },
  "same-geometry-ratio-value": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Same-geometry coefficient ratio [-]",
    techLines: "none",
  },
};

export function presentationForPlot(plot: PlotDefinition): PlotPresentation {
  return { ...DEFAULT, ...presentationById[plot.id] };
}
