import manifestJson from "../../contracts/parameter-manifest.json";

export type ParameterGroup =
  "air_side" | "boundary_conditions" | "coolant_side" | "geometry" | "materials" | "sweep";

export type ParameterSpec = {
  default: number;
  description: string;
  display_factor: number;
  display_unit: string;
  group: ParameterGroup;
  integer: boolean;
  label: string;
  maximum: number;
  minimum: number;
  mode: string | null;
  path: string;
  scale: "linear" | "log";
  step_display: number | null;
  unit: string;
};

export const parameterManifest = manifestJson.parameters as ParameterSpec[];

export function specsForGroup(group: ParameterGroup): ParameterSpec[] {
  return parameterManifest.filter((spec) => spec.group === group);
}

export function specDisplayValue(spec: ParameterSpec, value: number): number {
  return value * spec.display_factor;
}

export function specInternalValue(spec: ParameterSpec, displayValue: number): number {
  const value = displayValue / spec.display_factor;
  return spec.integer ? Math.round(value) : value;
}

export function valueOutsideSpec(spec: ParameterSpec, value: number): boolean {
  return !Number.isFinite(value) || value < spec.minimum || value > spec.maximum;
}
