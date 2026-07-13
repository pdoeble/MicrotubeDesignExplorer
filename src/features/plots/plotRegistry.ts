export type PlotFamily =
  | "boundary-summary"
  | "linear-map"
  | "log-map"
  | "log-map-grid"
  | "percent-delta"
  | "ratio-map"
  | "share-grid";

export type PlotVariantKind = "delta" | "ratio";
export type PlotFieldGroup = "fields" | "masks";

export type PlotDefinition = {
  id: string;
  title: string;
  family: PlotFamily;
  field: string;
  fieldGroup?: PlotFieldGroup;
  unit: string;
  source: "cooler" | "comparison";
  description: string;
  variantGroup?: string;
  variantKind?: PlotVariantKind;
};

export const plotRegistry = [
  {
    id: "inner-heat-transfer-map",
    title: "Tube-side heat-transfer coefficient",
    family: "log-map",
    field: "alpha_inner",
    unit: "W/(m^2 K)",
    source: "cooler",
    description: "VDI G1 tube-side heat-transfer coefficient.",
  },
  {
    id: "outer-heat-transfer-map",
    title: "Air-side heat-transfer coefficient",
    family: "log-map",
    field: "alpha_outer",
    unit: "W/(m^2 K)",
    source: "cooler",
    description: "VDI G7 tube-bank heat-transfer coefficient.",
  },
  {
    id: "overall-coefficient-map",
    title: "Overall heat-transfer coefficient",
    family: "log-map",
    field: "overall_coefficient",
    unit: "W/(m^2 K)",
    source: "cooler",
    description: "VDI G1/G7 plus wall-conduction resistance aggregation.",
  },
  {
    id: "bundle-conductance-map",
    title: "Bundle conductance",
    family: "log-map",
    field: "bundle_conductance",
    unit: "W/K",
    source: "cooler",
    description: "Overall coefficient scaled by continuous tube-bank outer area.",
  },
  {
    id: "tube-count-map",
    title: "Continuous tube count",
    family: "log-map",
    field: "tube_count_continuous",
    unit: "-",
    source: "cooler",
    description: "Continuous tube-count model over the package footprint.",
  },
  {
    id: "bundle-area-map",
    title: "Bundle outer area",
    family: "log-map",
    field: "bundle_outer_area",
    unit: "m^2",
    source: "cooler",
    description: "Tube-bank outer area used to scale package conductance.",
  },
  {
    id: "burst-pressure-map",
    title: "Tolerance-adjusted burst pressure",
    family: "log-map",
    field: "burst_pressure_tolerance_standard",
    unit: "Pa",
    source: "cooler",
    description: "Lamé pressure integrity using the standard tolerance row.",
  },
  {
    id: "burst-pressure-medical-map",
    title: "Medical-tolerance burst pressure",
    family: "log-map",
    field: "burst_pressure_tolerance_medical",
    unit: "Pa",
    source: "cooler",
    description: "Lamé pressure integrity using the medical tolerance row.",
  },
  {
    id: "reynolds-tube-side-map",
    title: "Tube-side Reynolds number",
    family: "log-map",
    field: "re_inner",
    unit: "-",
    source: "cooler",
    description: "VDI G1 internal-flow Reynolds field.",
  },
  {
    id: "reynolds-air-vdi-map",
    title: "Air-side VDI G7 Reynolds number",
    family: "log-map",
    field: "re_outer_vdi",
    unit: "-",
    source: "cooler",
    description: "VDI G7 characteristic-length and void-fraction convention.",
  },
  {
    id: "friction-pressure-drop-map",
    title: "Tube-side friction pressure drop",
    family: "log-map",
    field: "tube_pressure_drop",
    unit: "Pa",
    source: "cooler",
    description: "Straight-tube Darcy-Weisbach diagnostic.",
  },
  {
    id: "hydraulic-power-map",
    title: "Hydraulic power",
    family: "log-map",
    field: "hydraulic_power",
    unit: "W",
    source: "cooler",
    description: "Tube-side hydraulic power diagnostic, pressure drop times volume flow.",
  },
  {
    id: "coolant-throughput-map",
    title: "Coolant throughput",
    family: "linear-map",
    field: "coolant_volume_flow",
    unit: "m^3/s",
    source: "cooler",
    description: "Total bundle volume flow implied by the operating mode.",
  },
  {
    id: "coolant-mass-flow-map",
    title: "Coolant mass flow",
    family: "linear-map",
    field: "coolant_mass_flow",
    unit: "kg/s",
    source: "cooler",
    description: "Total bundle mass flow implied by the coolant operating mode.",
  },
  {
    id: "tube-spacing-longitudinal-map",
    title: "Longitudinal clear spacing",
    family: "log-map",
    field: "clear_spacing_longitudinal",
    unit: "m",
    source: "cooler",
    description: "Clear spacing in the tube-bank longitudinal direction.",
  },
  {
    id: "tube-spacing-transverse-map",
    title: "Transverse clear spacing",
    family: "log-map",
    field: "clear_spacing_transverse",
    unit: "m",
    source: "cooler",
    description: "Clear spacing in the transverse tube-bank direction.",
  },
  {
    id: "tube-spacing-closest-inline-map",
    title: "Closest inline spacing",
    family: "log-map",
    field: "clear_spacing_closest_inline",
    unit: "m",
    source: "cooler",
    description: "Minimum of transverse and longitudinal clear spacing.",
  },
  {
    id: "tube-spacing-closest-staggered-map",
    title: "Closest staggered spacing",
    family: "log-map",
    field: "clear_spacing_closest_staggered",
    unit: "m",
    source: "cooler",
    description: "Closest center-to-center staggered spacing minus outer diameter.",
  },
  {
    id: "capillary-rise-map",
    title: "Configured capillary rise",
    family: "log-map",
    field: "capillary_rise",
    unit: "m",
    source: "cooler",
    description: "Capillary-rise screen metric at the configured acceleration.",
  },
  {
    id: "capillary-rise-1g-map",
    title: "Capillary rise at 1g",
    family: "log-map",
    field: "capillary_rise_1g",
    unit: "m",
    source: "cooler",
    description: "Fixed capillary-rise sensitivity field at 1g.",
  },
  {
    id: "capillary-rise-5g-map",
    title: "Capillary rise at 5g",
    family: "log-map",
    field: "capillary_rise_5g",
    unit: "m",
    source: "cooler",
    description: "Fixed capillary-rise sensitivity field at 5g.",
  },
  {
    id: "capillary-rise-10g-map",
    title: "Capillary rise at 10g",
    family: "log-map",
    field: "capillary_rise_10g",
    unit: "m",
    source: "cooler",
    description: "Fixed capillary-rise sensitivity field at 10g.",
  },
  {
    id: "tube-supply-cost-map",
    title: "Tube supply cost index",
    family: "log-map",
    field: "cost_index",
    unit: "-",
    source: "cooler",
    description: "Relative tube-supply index normalized at the reference geometry.",
  },
  {
    id: "resistance-inner-map",
    title: "Tube-side thermal resistance",
    family: "log-map",
    field: "resistance_inner",
    unit: "m^2 K/W",
    source: "cooler",
    description: "Tube-side convective resistance component.",
  },
  {
    id: "resistance-wall-map",
    title: "Wall thermal resistance",
    family: "log-map",
    field: "resistance_wall",
    unit: "m^2 K/W",
    source: "cooler",
    description: "Cylindrical wall-conduction resistance component.",
  },
  {
    id: "resistance-outer-map",
    title: "Air-side thermal resistance",
    family: "log-map",
    field: "resistance_outer",
    unit: "m^2 K/W",
    source: "cooler",
    description: "Air-side convective resistance component.",
  },
  {
    id: "feasibility-mask-map",
    title: "All-screen feasibility mask",
    family: "linear-map",
    field: "mask_all_screens_feasible",
    fieldGroup: "masks",
    unit: "-",
    source: "cooler",
    description: "Composite feasibility mask after all active design screens.",
  },
  {
    id: "burst-tolerance-grid",
    title: "Burst-pressure tolerance grid",
    family: "log-map-grid",
    field: "burst_pressure_tolerance_standard",
    unit: "bar",
    source: "cooler",
    description:
      "Standard and medical wall-tolerance burst pressure for both coolers in the approved 2×2 paper layout.",
  },
  {
    id: "capillary-rise-grid",
    title: "Capillary-rise acceleration grid",
    family: "log-map-grid",
    field: "capillary_rise_1g",
    unit: "mm",
    source: "cooler",
    description:
      "Capillary-rise sensitivity at 1g, 5g and 10g for both coolers in the approved 3×2 paper layout.",
  },
  {
    id: "resistance-shares-grid",
    title: "Thermal-resistance shares",
    family: "share-grid",
    field: "resistance_share_inner",
    unit: "%",
    source: "cooler",
    description:
      "Tube-side, wall and air-side resistance shares for both coolers in the approved 3×2 paper layout.",
  },
  {
    id: "design-boundary-lines",
    title: "Design boundary lines",
    family: "boundary-summary",
    field: "bundle_conductance",
    unit: "W/K",
    source: "cooler",
    description:
      "Bundle conductance with composite feasibility, individual screen boundaries, minimum-wall line, and design-point marker.",
  },
  {
    id: "tech-adjusted-delta-k",
    title: "Tech-adjusted coefficient delta",
    family: "percent-delta",
    field: "delta_tech_adjusted_percent",
    unit: "%",
    source: "comparison",
    description: "Right cooler versus nearest feasible left reference.",
    variantGroup: "tech-adjusted-k",
    variantKind: "delta",
  },
  {
    id: "tech-adjusted-ratio-k",
    title: "Tech-adjusted coefficient ratio",
    family: "ratio-map",
    field: "ratio_tech_adjusted",
    unit: "-",
    source: "comparison",
    description: "Right cooler coefficient divided by nearest feasible left reference.",
    variantGroup: "tech-adjusted-k",
    variantKind: "ratio",
  },
  {
    id: "tech-adjusted-delta-ka",
    title: "Tech-adjusted conductance delta",
    family: "percent-delta",
    field: "delta_bundle_conductance_tech_adjusted_percent",
    unit: "%",
    source: "comparison",
    description: "Bundle-conductance delta against nearest feasible left reference.",
    variantGroup: "tech-adjusted-ka",
    variantKind: "delta",
  },
  {
    id: "tech-adjusted-ratio-ka",
    title: "Tech-adjusted conductance ratio",
    family: "ratio-map",
    field: "ratio_bundle_conductance_tech_adjusted",
    unit: "-",
    source: "comparison",
    description: "Right cooler bundle conductance divided by nearest feasible left reference.",
    variantGroup: "tech-adjusted-ka",
    variantKind: "ratio",
  },
  {
    id: "same-geometry-ratio",
    title: "Same-geometry coefficient delta",
    family: "percent-delta",
    field: "delta_same_geometry_percent",
    unit: "%",
    source: "comparison",
    description: "Right versus left coefficient delta at the same geometry.",
    variantGroup: "same-geometry-k",
    variantKind: "delta",
  },
  {
    id: "same-geometry-ratio-value",
    title: "Same-geometry coefficient ratio",
    family: "ratio-map",
    field: "ratio_same_geometry",
    unit: "-",
    source: "comparison",
    description:
      "Right cooler coefficient divided by left cooler coefficient at the same geometry.",
    variantGroup: "same-geometry-k",
    variantKind: "ratio",
  },
] as const satisfies readonly PlotDefinition[];

export type PlotId = (typeof plotRegistry)[number]["id"];

export type PlotTopic =
  | "feasibility-comparison"
  | "flow-hydraulics"
  | "geometry-packing"
  | "manufacturing-cost"
  | "mechanical-integrity"
  | "resistance-attribution"
  | "thermal-performance";

export type PlotTopicGroup = {
  id: PlotTopic;
  label: string;
  plotIds: readonly PlotId[];
};

/**
 * Scientific navigation order. Rendering families remain adapter metadata;
 * users choose figures by the physical question that each figure answers.
 */
export const plotTopicGroups = [
  {
    id: "thermal-performance",
    label: "Thermal performance",
    plotIds: [
      "overall-coefficient-map",
      "bundle-conductance-map",
      "inner-heat-transfer-map",
      "outer-heat-transfer-map",
    ],
  },
  {
    id: "resistance-attribution",
    label: "Thermal resistance attribution",
    plotIds: [
      "resistance-shares-grid",
      "resistance-inner-map",
      "resistance-wall-map",
      "resistance-outer-map",
    ],
  },
  {
    id: "geometry-packing",
    label: "Geometry and tube packing",
    plotIds: [
      "tube-count-map",
      "bundle-area-map",
      "tube-spacing-longitudinal-map",
      "tube-spacing-transverse-map",
      "tube-spacing-closest-inline-map",
      "tube-spacing-closest-staggered-map",
    ],
  },
  {
    id: "flow-hydraulics",
    label: "Flow regimes and hydraulics",
    plotIds: [
      "coolant-throughput-map",
      "coolant-mass-flow-map",
      "friction-pressure-drop-map",
      "hydraulic-power-map",
      "reynolds-tube-side-map",
      "reynolds-air-vdi-map",
    ],
  },
  {
    id: "mechanical-integrity",
    label: "Mechanical integrity",
    plotIds: ["burst-tolerance-grid", "burst-pressure-map", "burst-pressure-medical-map"],
  },
  {
    id: "manufacturing-cost",
    label: "Manufacturing limits and cost",
    plotIds: [
      "capillary-rise-grid",
      "capillary-rise-map",
      "capillary-rise-1g-map",
      "capillary-rise-5g-map",
      "capillary-rise-10g-map",
      "tube-supply-cost-map",
    ],
  },
  {
    id: "feasibility-comparison",
    label: "Feasibility and material comparison",
    plotIds: [
      "design-boundary-lines",
      "feasibility-mask-map",
      "tech-adjusted-delta-k",
      "tech-adjusted-ratio-k",
      "tech-adjusted-delta-ka",
      "tech-adjusted-ratio-ka",
      "same-geometry-ratio",
      "same-geometry-ratio-value",
    ],
  },
] as const satisfies readonly PlotTopicGroup[];

export function plotById(id: PlotId): PlotDefinition {
  const found = plotRegistry.find((plot) => plot.id === id);
  if (!found) throw new Error(`Unknown plot id: ${id}`);
  return found;
}

export function variantPlot(
  plot: PlotDefinition,
  variantKind: PlotVariantKind,
): PlotDefinition | undefined {
  if (!plot.variantGroup) return undefined;
  return (plotRegistry as readonly PlotDefinition[]).find(
    (candidate) =>
      candidate.variantGroup === plot.variantGroup && candidate.variantKind === variantKind,
  );
}
