export type PlotFamily =
  "boundary-summary" | "linear-map" | "log-map" | "log-map-grid" | "percent-delta" | "share-grid";

export type PlotDefinition = {
  id: string;
  title: string;
  family: PlotFamily;
  field: string;
  unit: string;
  source: "cooler" | "comparison";
  description: string;
};

export const plotRegistry = [
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
    id: "burst-pressure-map",
    title: "Tolerance-adjusted burst pressure",
    family: "log-map",
    field: "burst_pressure_tolerance_standard",
    unit: "Pa",
    source: "cooler",
    description: "Lamé pressure integrity using the standard tolerance row.",
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
    id: "reynolds-air-simple-map",
    title: "Air-side simple Reynolds number",
    family: "log-map",
    field: "re_outer_simple",
    unit: "-",
    source: "cooler",
    description: "Inlet-velocity and outer-diameter convention.",
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
    id: "coolant-throughput-map",
    title: "Coolant throughput",
    family: "linear-map",
    field: "coolant_volume_flow",
    unit: "m^3/s",
    source: "cooler",
    description: "Total bundle volume flow implied by the operating mode.",
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
    id: "tube-supply-cost-map",
    title: "Tube supply cost index",
    family: "log-map",
    field: "cost_index",
    unit: "-",
    source: "cooler",
    description: "Relative tube-supply index normalized at the reference geometry.",
  },
  {
    id: "tech-adjusted-delta-k",
    title: "Tech-adjusted coefficient delta",
    family: "percent-delta",
    field: "delta_tech_adjusted_percent",
    unit: "%",
    source: "comparison",
    description: "Right cooler versus nearest feasible left reference.",
  },
  {
    id: "tech-adjusted-delta-ka",
    title: "Tech-adjusted conductance delta",
    family: "percent-delta",
    field: "delta_bundle_conductance_tech_adjusted_percent",
    unit: "%",
    source: "comparison",
    description: "Bundle-conductance delta against nearest feasible left reference.",
  },
  {
    id: "same-geometry-ratio",
    title: "Same-geometry coefficient delta",
    family: "percent-delta",
    field: "delta_same_geometry_percent",
    unit: "%",
    source: "comparison",
    description: "Right versus left coefficient delta at the same geometry.",
  },
] as const satisfies readonly PlotDefinition[];

export type PlotId = (typeof plotRegistry)[number]["id"];

export function plotById(id: PlotId): PlotDefinition {
  const found = plotRegistry.find((plot) => plot.id === id);
  if (!found) throw new Error(`Unknown plot id: ${id}`);
  return found;
}
