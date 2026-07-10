import { ParameterControl } from "../../components/ParameterControl";
import type {
  AirOperatingMode,
  CoolantOperatingMode,
  GeometryMode,
  InnerBoundaryCondition,
  TubeArrangement,
} from "../../contracts/generated/simulation-request";
import {
  getByPath,
  type CoolerKey,
  type LinkGroup,
  useSimulationStore,
} from "../../state/simulationStore";
import { specsForGroup, type ParameterSpec } from "./parameterManifest";

const COOLERS: CoolerKey[] = ["cooler_left", "cooler_right"];
const AIR_MODES: AirOperatingMode[] = [
  "constant_velocity",
  "constant_volume_flow",
  "constant_mass_flow",
];
const COOLANT_MODES: CoolantOperatingMode[] = [
  "constant_velocity",
  "constant_volume_flow",
  "constant_mass_flow",
  "constant_pressure_drop",
  "constant_hydraulic_power",
];

export function InputTab() {
  const request = useSimulationStore((state) => state.request);
  const setLinkedGroup = useSimulationStore((state) => state.setLinkedGroup);
  const setGeometryMode = useSimulationStore((state) => state.setGeometryMode);
  const setCoolerValue = useSimulationStore((state) => state.setCoolerValue);
  const setSweepValue = useSimulationStore((state) => state.setSweepValue);
  const resetCoolerField = useSimulationStore((state) => state.resetCoolerField);
  const resetSweepField = useSimulationStore((state) => state.resetSweepField);

  return (
    <section aria-labelledby="input-heading" className="workflow-section">
      <div className="section-heading-row">
        <div>
          <h2 id="input-heading">Input</h2>
          <p className="section-kicker">
            Paper defaults load as linked geometry, air, coolant, and screens.
          </p>
        </div>
      </div>

      <LinkControls
        groups={["geometry", "air_side", "coolant_side", "boundary_conditions"]}
        linkedGroups={request.linked_groups}
        onChange={setLinkedGroup}
      />

      <div className="cooler-grid">
        {COOLERS.map((cooler) => (
          <section
            className="cooler-panel"
            aria-labelledby={`${cooler}-input-heading`}
            key={cooler}
          >
            <h3 id={`${cooler}-input-heading`}>{request[cooler].label}</h3>
            <TextField
              id={`${cooler}-label`}
              label="Cooler label"
              value={request[cooler].label}
              onChange={(value) => setCoolerValue(cooler, "materials", "label", value)}
            />
            <SelectField
              id={`${cooler}-geometry-mode`}
              label="Geometry representation"
              value={request[cooler].geometry.mode ?? "dimensions"}
              options={["dimensions", "volume_aspect"]}
              onChange={(value) => setGeometryMode(cooler, value as GeometryMode)}
            />
            <SelectField
              id={`${cooler}-arrangement`}
              label="Tube arrangement"
              value={request[cooler].geometry.arrangement ?? "inline"}
              options={["inline", "staggered"]}
              onChange={(value) =>
                setCoolerValue(cooler, "geometry", "geometry.arrangement", value as TubeArrangement)
              }
            />
            <CheckboxField
              id={`${cooler}-finite-row`}
              label="Finite-row VDI G7 correction"
              checked={request[cooler].geometry.use_finite_row_correction ?? false}
              onChange={(checked) =>
                setCoolerValue(cooler, "geometry", "geometry.use_finite_row_correction", checked)
              }
            />
            <ParameterGroup
              title="Geometry and design point"
              cooler={cooler}
              group="geometry"
              specs={geometrySpecs(request[cooler].geometry.mode ?? "dimensions")}
              getValue={(path) => Number(getByPath(request[cooler], path))}
              onChange={(path, value) => setCoolerValue(cooler, "geometry", path, value)}
              onReset={(path) => resetCoolerField(cooler, "geometry", path)}
            />
            <SelectField
              id={`${cooler}-air-mode`}
              label="Air operating mode"
              value={request[cooler].air_side.mode ?? "constant_velocity"}
              options={AIR_MODES}
              onChange={(value) =>
                setCoolerValue(cooler, "air_side", "air_side.mode", value as AirOperatingMode)
              }
            />
            <ParameterGroup
              title="Air operating target"
              cooler={cooler}
              group="air_side"
              specs={modeValueSpecs(
                "air_side",
                request[cooler].air_side.mode ?? "constant_velocity",
              )}
              getValue={(path) => Number(getByPath(request[cooler], path))}
              onChange={(path, value) => setCoolerValue(cooler, "air_side", path, value)}
              onReset={(path) => resetCoolerField(cooler, "air_side", path)}
            />
            <SelectField
              id={`${cooler}-coolant-mode`}
              label="Coolant operating mode"
              value={request[cooler].coolant_side.mode ?? "constant_velocity"}
              options={COOLANT_MODES}
              onChange={(value) =>
                setCoolerValue(
                  cooler,
                  "coolant_side",
                  "coolant_side.mode",
                  value as CoolantOperatingMode,
                )
              }
            />
            <ParameterGroup
              title="Coolant operating target"
              cooler={cooler}
              group="coolant_side"
              specs={modeValueSpecs(
                "coolant_side",
                request[cooler].coolant_side.mode ?? "constant_velocity",
              )}
              getValue={(path) => Number(getByPath(request[cooler], path))}
              onChange={(path, value) => setCoolerValue(cooler, "coolant_side", path, value)}
              onReset={(path) => resetCoolerField(cooler, "coolant_side", path)}
            />
            <SelectField
              id={`${cooler}-inner-boundary`}
              label="Inner thermal boundary"
              value={
                request[cooler].boundary_conditions.inner_boundary_condition ??
                "constant_wall_temperature"
              }
              options={["constant_wall_temperature", "constant_heat_flux"]}
              onChange={(value) =>
                setCoolerValue(
                  cooler,
                  "boundary_conditions",
                  "boundary_conditions.inner_boundary_condition",
                  value as InnerBoundaryCondition,
                )
              }
            />
            <ParameterGroup
              title="Screens and tolerances"
              cooler={cooler}
              group="boundary_conditions"
              specs={specsForGroup("boundary_conditions")}
              getValue={(path) => Number(getByPath(request[cooler], path))}
              onChange={(path, value) => setCoolerValue(cooler, "boundary_conditions", path, value)}
              onReset={(path) => resetCoolerField(cooler, "boundary_conditions", path)}
            />
          </section>
        ))}
      </div>

      <section className="full-width-panel" aria-labelledby="sweep-heading">
        <h3 id="sweep-heading">Sweep grid</h3>
        <div className="parameter-grid">
          {specsForGroup("sweep").map((spec) => (
            <ParameterControl
              key={spec.path}
              id={`sweep-${spec.path.replaceAll(".", "-")}`}
              spec={spec}
              value={Number(getByPath(request, spec.path))}
              onChange={(value) => setSweepValue(spec.path, value)}
              onReset={() => resetSweepField(spec.path)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function LinkControls({
  groups,
  linkedGroups,
  onChange,
}: {
  groups: LinkGroup[];
  linkedGroups: Record<string, boolean>;
  onChange: (group: LinkGroup, linked: boolean) => void;
}) {
  return (
    <fieldset className="link-controls">
      <legend>Left/right linking</legend>
      {groups.map((group) => (
        <CheckboxField
          key={group}
          id={`link-${group}`}
          label={linkLabel(group)}
          checked={Boolean(linkedGroups[group])}
          onChange={(checked) => onChange(group, checked)}
        />
      ))}
    </fieldset>
  );
}

function ParameterGroup({
  title,
  cooler,
  specs,
  getValue,
  onChange,
  onReset,
}: {
  title: string;
  cooler: CoolerKey;
  group: string;
  specs: ParameterSpec[];
  getValue: (path: string) => number;
  onChange: (path: string, value: number) => void;
  onReset: (path: string) => void;
}) {
  return (
    <fieldset className="parameter-fieldset">
      <legend>{title}</legend>
      <div className="parameter-grid">
        {specs.map((spec) => (
          <ParameterControl
            key={`${cooler}-${spec.path}-${spec.mode ?? "base"}`}
            id={`${cooler}-${spec.path.replaceAll(".", "-")}-${spec.mode ?? "base"}`}
            spec={spec}
            value={getValue(spec.path)}
            onChange={(value) => onChange(spec.path, value)}
            onReset={() => onReset(spec.path)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function geometrySpecs(mode: GeometryMode): ParameterSpec[] {
  return specsForGroup("geometry").filter((spec) => {
    if (spec.path.startsWith("geometry.dimensions.")) return mode === "dimensions";
    if (spec.path.startsWith("geometry.volume_aspect.")) return mode === "volume_aspect";
    return true;
  });
}

function modeValueSpecs(group: "air_side" | "coolant_side", mode: string): ParameterSpec[] {
  return specsForGroup(group).filter((spec) => spec.path.endsWith(".value") && spec.mode === mode);
}

function linkLabel(group: LinkGroup): string {
  return {
    air_side: "Air side",
    boundary_conditions: "Screens",
    coolant_side: "Coolant side",
    geometry: "Geometry",
    materials: "Materials",
  }[group];
}

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option} key={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="checkbox-field" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
