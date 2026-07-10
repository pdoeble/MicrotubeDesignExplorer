/* eslint-disable */
/**
 * GENERATED FILE — do not edit.
 * Source of truth: python/microtubes_core/contracts.py
 * Regenerate: pnpm generate:contracts
 */

export type ContractVersion = "1.0.0";
export type Density = number;
export type DynamicViscosity = number;
export type KinematicViscosity = number;
export type Name = string;
export type Prandtl = number;
/**
 * Reference temperature of the property set
 */
export type ReferenceTemperature = number;
export type SpecificHeatCapacity = number;
export type ThermalConductivity = number;
/**
 * Air side: no pressure-drop physics in the approved model (ADR-0003).
 */
export type AirOperatingMode = "constant_velocity" | "constant_volume_flow" | "constant_mass_flow";
/**
 * Meaning depends on mode: constant_velocity → face velocity [m/s]; constant_volume_flow → volume flow [m^3/s]; constant_mass_flow → mass flow [kg/s]
 */
export type Value = number;
/**
 * VDI G1 thermal boundary condition of the inner tube wall.
 */
export type InnerBoundaryCondition = "constant_wall_temperature" | "constant_heat_flux";
export type CapillaryAccelerationOverG = number;
export type MaxCapillaryRise = number;
export type MaxCostIndex = number;
export type MaxTubePressureDrop = number;
export type MinBurstPressure = number;
export type MinCoolantVolumeFlow = number;
/**
 * Δt for the tolerance-adjusted Lamé screen (t_loc,min = t_nom − Δt)
 */
export type WallTolerance = number;
/**
 * Coolant side supports all five modes (ADR-0003).
 */
export type CoolantOperatingMode =
  | "constant_velocity"
  | "constant_volume_flow"
  | "constant_mass_flow"
  | "constant_pressure_drop"
  | "constant_hydraulic_power";
/**
 * Meaning depends on mode: constant_velocity → mean tube velocity [m/s]; constant_volume_flow → total bundle volume flow [m^3/s]; constant_mass_flow → total mass flow [kg/s]; constant_pressure_drop → tube friction pressure drop [Pa]; constant_hydraulic_power → hydraulic power [W]
 */
export type Value1 = number;
export type OuterDiameter = number;
export type WallThickness = number;
export type TubeArrangement = "inline" | "staggered";
/**
 * Package extent along the air flow (tube-bank depth)
 */
export type Depth = number;
/**
 * Active tube length L
 */
export type TubeLength = number;
/**
 * Package extent transverse to the air flow
 */
export type Width = number;
/**
 * User-facing geometry input representation. Canonical form: dimensions.
 */
export type GeometryMode = "dimensions" | "volume_aspect";
/**
 * b = S_L/d_o
 */
export type PitchLongitudinalRatio = number;
/**
 * a = S_T/d_o
 */
export type PitchTransverseRatio = number;
/**
 * VDI G7 finite-row factor (1+(n-1)·f_A)/n instead of many-row f_A
 */
export type UseFiniteRowCorrection = boolean;
export type AspectLengthOverDepth = number;
export type AspectWidthOverDepth = number;
export type Volume = number;
export type Label = string;
/**
 * C_cap of the potting capillary-rise screen (full-gap slit convention)
 */
export type CapillaryConstant = number;
/**
 * Material tube-supply cost index at the reference geometry
 */
export type CostReferenceIndex = number;
/**
 * Technology minimum wall thickness (screen boundary)
 */
export type MinWallThickness = number;
export type Name1 = string;
/**
 * Rm used by the Lamé burst screen
 */
export type TensileStrength = number;
export type ThermalConductivity1 = number;
export type NOuterDiameter = number;
export type NWallThickness = number;
export type OuterDiameterMax = number;
export type OuterDiameterMin = number;
/**
 * τ window upper bound (values outside are masked)
 */
export type WallRatioCalcMaxPct = number;
/**
 * τ window lower bound
 */
export type WallRatioCalcMinPct = number;
export type WallThicknessMax = number;
export type WallThicknessMin = number;

/**
 * Complete two-cooler design-space computation request.
 */
export interface SimulationRequest {
  contract_version?: ContractVersion;
  cooler_left: CoolerConfiguration;
  cooler_right: CoolerConfiguration;
  linked_groups: LinkedGroups;
  sweep: SweepSettings;
}
export interface CoolerConfiguration {
  air_side: AirSide;
  boundary_conditions: BoundaryConditions;
  coolant_side: CoolantSide;
  design_point: DesignPoint;
  geometry: BundleGeometry;
  label: Label;
  material: SolidMaterial;
}
/**
 * Air-side fluid and operating point.
 */
export interface AirSide {
  fluid: FluidProperties;
  mode?: AirOperatingMode;
  value: Value;
}
/**
 * Static fluid property set (no temperature-dependent models).
 */
export interface FluidProperties {
  density: Density;
  dynamic_viscosity: DynamicViscosity;
  kinematic_viscosity: KinematicViscosity;
  name: Name;
  prandtl: Prandtl;
  reference_temperature: ReferenceTemperature;
  specific_heat_capacity: SpecificHeatCapacity;
  thermal_conductivity: ThermalConductivity;
}
/**
 * Model boundary conditions and production tolerance settings.
 */
export interface BoundaryConditions {
  inner_boundary_condition?: InnerBoundaryCondition;
  screens: ScreenThresholds;
  wall_tolerance: WallTolerance;
}
/**
 * All-screen feasibility thresholds (paper design-boundary settings).
 */
export interface ScreenThresholds {
  capillary_acceleration_over_g: CapillaryAccelerationOverG;
  max_capillary_rise: MaxCapillaryRise;
  max_cost_index: MaxCostIndex;
  max_tube_pressure_drop: MaxTubePressureDrop;
  min_burst_pressure: MinBurstPressure;
  min_coolant_volume_flow: MinCoolantVolumeFlow;
}
/**
 * Coolant-side fluid and operating point (all five modes, ADR-0003).
 */
export interface CoolantSide {
  fluid: FluidProperties;
  mode?: CoolantOperatingMode;
  value: Value1;
}
/**
 * Point in the design space used for the scalar KPI summary.
 */
export interface DesignPoint {
  outer_diameter: OuterDiameter;
  wall_thickness: WallThickness;
}
/**
 * Tube-bank geometry. Exactly one representation must match `mode`.
 */
export interface BundleGeometry {
  arrangement?: TubeArrangement;
  dimensions?: GeometryDimensions | null;
  mode?: GeometryMode;
  pitch_longitudinal_ratio: PitchLongitudinalRatio;
  pitch_transverse_ratio: PitchTransverseRatio;
  use_finite_row_correction?: UseFiniteRowCorrection;
  volume_aspect?: GeometryVolumeAspect | null;
}
/**
 * Canonical package representation: transverse × longitudinal × tube length.
 */
export interface GeometryDimensions {
  depth: Depth;
  tube_length: TubeLength;
  width: Width;
}
/**
 * Alternative representation; converted exactly to dimensions.
 *
 * width = aspect_width_over_depth · depth,
 * tube_length = aspect_length_over_depth · depth,
 * depth = (volume / (aspect_width_over_depth · aspect_length_over_depth))^(1/3).
 */
export interface GeometryVolumeAspect {
  aspect_length_over_depth: AspectLengthOverDepth;
  aspect_width_over_depth: AspectWidthOverDepth;
  volume: Volume;
}
/**
 * Tube material incl. manufacturing/process screening properties.
 */
export interface SolidMaterial {
  capillary_constant: CapillaryConstant;
  cost_reference_index: CostReferenceIndex;
  min_wall_thickness: MinWallThickness;
  name: Name1;
  tensile_strength: TensileStrength;
  thermal_conductivity: ThermalConductivity1;
}
/**
 * Group-level linking left↔right; linked groups must be equal
 */
export interface LinkedGroups {
  [k: string]: boolean;
}
/**
 * Design-space grid definition (log-spaced axes as in the reference).
 */
export interface SweepSettings {
  n_outer_diameter: NOuterDiameter;
  n_wall_thickness: NWallThickness;
  outer_diameter_max: OuterDiameterMax;
  outer_diameter_min: OuterDiameterMin;
  wall_ratio_calc_max_pct: WallRatioCalcMaxPct;
  wall_ratio_calc_min_pct?: WallRatioCalcMinPct;
  wall_thickness_max: WallThicknessMax;
  wall_thickness_min: WallThicknessMin;
}
