import type { PlotDefinition } from "./plotRegistry";

export type ColorScaleType = "binary" | "linear" | "log";
export type ClipMask =
  "all-screen-feasible" | "both-feasible" | "invalid-geometry" | "own-material" | "pa-min-wall";
export type TechLines = "both" | "none" | "own";

export type PlotPresentation = {
  colorLimits?: readonly [number, number];
  colorScaleType: ColorScaleType;
  colorbarLabel: string;
  colorbarReversed?: boolean;
  contourLevels?: readonly number[];
  displayFactor: number;
  displayUnit: string;
  clipMask: ClipMask;
  colormapReversed?: boolean;
  robustShared?: boolean;
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
const presentationById: Record<string, Partial<PlotPresentation>> = {
  "inner-heat-transfer-map": { colorbarLabel: "α_i [W/(m² K)]", displayUnit: "W/(m² K)" },
  "outer-heat-transfer-map": { colorbarLabel: "α_o [W/(m² K)]", displayUnit: "W/(m² K)" },
  "overall-coefficient-map": {
    colorbarLabel: "<i>k</i><sub>o</sub> [W/(m² K)]",
    contourLevels: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    displayUnit: "W/(m² K)",
    robustShared: true,
  },
  "bundle-conductance-map": {
    colorbarLabel: "Conductance, <i>k</i><sub>o</sub>·<i>A</i><sub>o</sub> [W K⁻¹]",
    contourLevels: [5, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000],
    displayUnit: "W K⁻¹",
    robustShared: true,
  },
  "tube-count-map": { colorbarLabel: "Continuous tube count, N [-]" },
  "bundle-area-map": { colorbarLabel: "Bundle outer area, A_o [m²]", displayUnit: "m²" },
  "burst-pressure-map": {
    colorbarLabel: "Tolerance-adjusted burst pressure, p_b,tol [bar]",
    displayFactor: 1e-5,
    displayUnit: "bar",
    robustShared: true,
  },
  "burst-pressure-medical-map": {
    colorbarLabel: "Medical-tolerance burst pressure, p_b,tol [bar]",
    displayFactor: 1e-5,
    displayUnit: "bar",
    robustShared: true,
  },
  "reynolds-tube-side-map": {
    clipMask: "pa-min-wall",
    colorLimits: [10, 5000],
    colorbarLabel: "Re_i [-]",
    contourLevels: [10, 20, 50, 100, 200, 500, 1000, 2300, 4000],
    techLines: "both",
    transitionLevel: 2300,
  },
  "reynolds-air-simple-map": {
    clipMask: "pa-min-wall",
    colorLimits: [10, 5000],
    colorbarLabel: "Re_a,d [-]",
    contourLevels: [20, 50, 100, 200, 500, 1000, 2300, 5000, 10000],
    techLines: "both",
    transitionLevel: 2300,
  },
  "reynolds-air-vdi-map": {
    clipMask: "pa-min-wall",
    colorLimits: [20, 10000],
    colorbarLabel: "Re_c,l [-]",
    contourLevels: [20, 50, 100, 200, 500, 1000, 2300, 5000, 10000],
    techLines: "both",
    transitionLevel: 2300,
  },
  "friction-pressure-drop-map": {
    clipMask: "pa-min-wall",
    colorLimits: [0.05, 5],
    colorbarLabel: "Friction pressure drop, Δp_i [bar]",
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
    colorbarLabel: "Coolant throughput, V̇_c,tot [L min⁻¹]",
    colorbarReversed: true,
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
    colorbarLabel: "s_L [mm]",
    contourLevels: spacingLevels,
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "tube-spacing-transverse-map": {
    colorLimits: [0.1, 30],
    colorbarLabel: "s_T [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20],
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "tube-spacing-closest-inline-map": {
    colorLimits: [0.1, 10],
    colorbarLabel: "s_min,inline [mm]",
    contourLevels: spacingLevels,
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "tube-spacing-closest-staggered-map": {
    colorLimits: [0.1, 20],
    colorbarLabel: "s_min,stag [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20],
    displayFactor: 1e3,
    displayUnit: "mm",
    techLines: "both",
  },
  "capillary-rise-map": {
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "capillary-rise-1g-map": {
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "capillary-rise-5g-map": {
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "capillary-rise-10g-map": {
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise [mm]",
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "tube-supply-cost-map": {
    colorLimits: [0.01, 100],
    colorbarLabel: "C_tube/C_fin [-]",
    colormapReversed: true,
    contourLevels: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
  },
  "resistance-inner-map": { colorbarLabel: "R_i [m² K W⁻¹]", displayUnit: "m² K W⁻¹" },
  "resistance-wall-map": { colorbarLabel: "R_w [m² K W⁻¹]", displayUnit: "m² K W⁻¹" },
  "resistance-outer-map": { colorbarLabel: "R_o [m² K W⁻¹]", displayUnit: "m² K W⁻¹" },
  "feasibility-mask-map": {
    clipMask: "invalid-geometry",
    colorLimits: [0, 1],
    colorScaleType: "binary",
    colorbarLabel: "All screens feasible [-]",
    techLines: "both",
  },
  "burst-tolerance-grid": {
    colorLimits: [1, 1000],
    colorbarLabel: "Tolerance-adjusted burst pressure [bar]",
    displayFactor: 1e-5,
    displayUnit: "bar",
  },
  "capillary-rise-grid": {
    colorLimits: [0.1, 150],
    colorbarLabel: "Capillary rise [mm]",
    colorbarReversed: true,
    contourLevels: [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
    displayFactor: 1e3,
    displayUnit: "mm",
  },
  "resistance-shares-grid": {
    colorLimits: [0, 100],
    colorScaleType: "linear",
    colorbarLabel: "Thermal-resistance share [%]",
    contourLevels: [10, 20, 30, 40, 50, 60, 70, 80, 90],
    displayUnit: "%",
  },
  "design-boundary-lines": {
    clipMask: "all-screen-feasible",
    colorLimits: [50, 500],
    colorbarLabel: "Conductance, k_o·A_o [W K⁻¹]",
    colorbarReversed: true,
    techLines: "none",
  },
  "tech-adjusted-delta-k": {
    clipMask: "both-feasible",
    colorLimits: [-20, 80],
    colorScaleType: "linear",
    colorbarLabel: "Feasible coefficient difference, Δk_o [%]",
    contourLevels: [-20, 0, 20, 40, 60, 80],
    displayUnit: "%",
    techLines: "both",
  },
  "tech-adjusted-delta-ka": {
    clipMask: "both-feasible",
    colorLimits: [-50, 200],
    colorScaleType: "linear",
    colorbarLabel:
      "Feasible conductance difference, Δ(<i>k</i><sub>o</sub>·<i>A</i><sub>o</sub>) [%]",
    colorbarReversed: true,
    contourLevels: [-25, 0, 25, 50, 100, 150],
    displayUnit: "%",
    techLines: "both",
    yTickStep: 5,
  },
  "tech-adjusted-ratio-k": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Feasible coefficient ratio [-]",
    techLines: "both",
  },
  "tech-adjusted-ratio-ka": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Feasible conductance ratio [-]",
    techLines: "both",
  },
  "same-geometry-ratio": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Same-geometry coefficient difference [%]",
    displayUnit: "%",
    techLines: "both",
  },
  "same-geometry-ratio-value": {
    clipMask: "both-feasible",
    colorScaleType: "linear",
    colorbarLabel: "Same-geometry coefficient ratio [-]",
    techLines: "both",
  },
};

export function presentationForPlot(plot: PlotDefinition): PlotPresentation {
  return { ...DEFAULT, ...presentationById[plot.id] };
}
