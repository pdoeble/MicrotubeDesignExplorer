/* eslint-disable */
/**
 * GENERATED FILE — do not edit.
 * Source of truth: python/microtubes_core/contracts.py
 * Regenerate: pnpm generate:contracts
 */

export type BufferIndex = number;
export type Description = string;
export type Name = string;
/**
 * @minItems 2
 * @maxItems 2
 */
export type Shape = [unknown, unknown];
export type Unit = string;
export type Fields = GridFieldRef[];
export type AffectedQuantity = string;
export type WarningCode =
  | "W_OUTSIDE_VALIDITY"
  | "W_SCREENED_OUT"
  | "W_DISCRETE_TRANSITION"
  | "W_PHYSICALLY_UNUSUAL"
  | "W_NO_FEASIBLE_REFERENCE";
export type Message = string;
export type Recommendation = string;
export type Warnings = WarningItem[];
export type ContractVersion = "1.0.0";
export type Fields1 = GridFieldRef[];
export type Label = string;
export type Masks = GridFieldRef[];
export type IsFeasible = boolean;
export type Warnings1 = WarningItem[];
export type ErrorCode =
  | "E_SCHEMA_INVALID"
  | "E_NON_FINITE_INPUT"
  | "E_GEOMETRY_IMPOSSIBLE"
  | "E_VALUE_OUT_OF_RANGE"
  | "E_MODE_UNSUPPORTED_AIR_SIDE"
  | "E_OPERATING_POINT_UNSOLVABLE"
  | "E_CONTRACT_VERSION_MISMATCH"
  | "E_INTERNAL";
/**
 * JSON path of the offending input
 */
export type FieldPath = string;
export type Message1 = string;
export type Errors = ErrorItem[];
export type OuterDiameterAxis = number[];
export type ContractVersion1 = string;
export type CoreVersion = string;
export type GeneratedUtc = string;
/**
 * Manifest hash of the golden dataset the core was validated against
 */
export type GoldenReference = string;
/**
 * SHA-256 over the canonical request JSON
 */
export type RequestHash = string;
export type RequestHash1 = string;
export type WallThicknessAxis = number[];

export interface SimulationResultPayload {
  comparison: ComparisonResultPayload;
  contract_version?: ContractVersion;
  cooler_left: CoolerResultPayload;
  cooler_right: CoolerResultPayload;
  errors: Errors;
  outer_diameter_axis: OuterDiameterAxis;
  provenance: Provenance;
  request_hash: RequestHash1;
  wall_thickness_axis: WallThicknessAxis;
}
/**
 * Right-vs-left comparison fields (delta/ratio and tech-adjusted).
 */
export interface ComparisonResultPayload {
  fields: Fields;
  warnings: Warnings;
}
/**
 * Reference to a 2D float64 array shipped outside the JSON payload.
 *
 * ``buffer_index`` addresses the transferable ArrayBuffer list of the
 * worker message (row-major / C order, shape [n_wall_thickness,
 * n_outer_diameter]).
 */
export interface GridFieldRef {
  buffer_index: BufferIndex;
  description?: Description;
  name: Name;
  shape: Shape;
  unit: Unit;
}
export interface WarningItem {
  affected_quantity?: AffectedQuantity;
  code: WarningCode;
  message: Message;
  recommendation?: Recommendation;
}
export interface CoolerResultPayload {
  fields: Fields1;
  label: Label;
  masks: Masks;
  summary: ScalarSummary;
  warnings: Warnings1;
}
/**
 * KPI values at the cooler's design point (roadmap §9). SI units.
 */
export interface ScalarSummary {
  is_feasible: IsFeasible;
  screens_passed: ScreensPassed;
  units: Units;
  values: Values;
}
export interface ScreensPassed {
  [k: string]: boolean;
}
export interface Units {
  [k: string]: string;
}
/**
 * KPI name → value (None where undefined/masked)
 */
export interface Values {
  [k: string]: number | null;
}
export interface ErrorItem {
  code: ErrorCode;
  field_path?: FieldPath;
  message: Message1;
}
export interface Provenance {
  contract_version: ContractVersion1;
  core_version: CoreVersion;
  generated_utc: GeneratedUtc;
  golden_reference?: GoldenReference;
  request_hash: RequestHash;
}
