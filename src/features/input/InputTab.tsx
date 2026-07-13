import { ParameterControl } from "../../components/ParameterControl";
import type {
  AirOperatingMode,
  CoolantOperatingMode,
  GeometryMode,
  InnerBoundaryCondition,
  TubeArrangement,
} from "../../contracts/generated/simulation-request";
import { getByPath, type CoolerKey, useSimulationStore } from "../../state/simulationStore";
import { specsForGroup, type ParameterSpec } from "./parameterManifest";

export type DesignInputGroup = "air_side" | "boundary_conditions" | "coolant_side" | "geometry";

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

/** Operating and geometry controls for one visible design and one setup category. */
export function DesignInputs({ cooler, group }: { cooler: CoolerKey; group: DesignInputGroup }) {
  const request = useSimulationStore((state) => state.request);
  const setGeometryMode = useSimulationStore((state) => state.setGeometryMode);
  const setCoolerValue = useSimulationStore((state) => state.setCoolerValue);
  const resetCoolerField = useSimulationStore((state) => state.resetCoolerField);
  const configuration = request[cooler];

  if (group === "geometry") {
    return (
      <>
        <SelectField
          id={`${cooler}-geometry-mode`}
          label="Geometry representation"
          value={configuration.geometry.mode ?? "dimensions"}
          options={["dimensions", "volume_aspect"]}
          onChange={(value) => setGeometryMode(cooler, value as GeometryMode)}
        />
        <SelectField
          id={`${cooler}-arrangement`}
          label="Tube arrangement"
          value={configuration.geometry.arrangement ?? "inline"}
          options={["inline", "staggered"]}
          onChange={(value) =>
            setCoolerValue(cooler, "geometry", "geometry.arrangement", value as TubeArrangement)
          }
        />
        <CheckboxField
          id={`${cooler}-finite-row`}
          label="Finite-row VDI G7 correction"
          checked={configuration.geometry.use_finite_row_correction ?? false}
          onChange={(checked) =>
            setCoolerValue(cooler, "geometry", "geometry.use_finite_row_correction", checked)
          }
        />
        <ParameterGroup
          title="Geometry and design point"
          cooler={cooler}
          specs={geometrySpecs(configuration.geometry.mode ?? "dimensions")}
          getValue={(path) => Number(getByPath(configuration, path))}
          onChange={(path, value) => setCoolerValue(cooler, "geometry", path, value)}
          onReset={(path) => resetCoolerField(cooler, "geometry", path)}
        />
      </>
    );
  }

  if (group === "air_side") {
    const mode = configuration.air_side.mode ?? "constant_velocity";
    return (
      <>
        <SelectField
          id={`${cooler}-air-mode`}
          label="Air operating mode"
          value={mode}
          options={AIR_MODES}
          onChange={(value) =>
            setCoolerValue(cooler, "air_side", "air_side.mode", value as AirOperatingMode)
          }
        />
        <ParameterGroup
          title="Air operating target"
          cooler={cooler}
          specs={modeValueSpecs("air_side", mode)}
          getValue={(path) => Number(getByPath(configuration, path))}
          onChange={(path, value) => setCoolerValue(cooler, "air_side", path, value)}
          onReset={(path) => resetCoolerField(cooler, "air_side", path)}
        />
      </>
    );
  }

  if (group === "coolant_side") {
    const mode = configuration.coolant_side.mode ?? "constant_velocity";
    return (
      <>
        <SelectField
          id={`${cooler}-coolant-mode`}
          label="Coolant operating mode"
          value={mode}
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
          specs={modeValueSpecs("coolant_side", mode)}
          getValue={(path) => Number(getByPath(configuration, path))}
          onChange={(path, value) => setCoolerValue(cooler, "coolant_side", path, value)}
          onReset={(path) => resetCoolerField(cooler, "coolant_side", path)}
        />
      </>
    );
  }

  return (
    <>
      <SelectField
        id={`${cooler}-inner-boundary`}
        label="Inner thermal boundary"
        value={
          configuration.boundary_conditions.inner_boundary_condition ?? "constant_wall_temperature"
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
        specs={specsForGroup("boundary_conditions")}
        getValue={(path) => Number(getByPath(configuration, path))}
        onChange={(path, value) => setCoolerValue(cooler, "boundary_conditions", path, value)}
        onReset={(path) => resetCoolerField(cooler, "boundary_conditions", path)}
      />
    </>
  );
}

/** The sweep grid is global and therefore intentionally rendered once, outside a design editor. */
export function SweepInputs() {
  const request = useSimulationStore((state) => state.request);
  const setSweepValue = useSimulationStore((state) => state.setSweepValue);
  const resetSweepField = useSimulationStore((state) => state.resetSweepField);

  return (
    <section className="full-width-panel" aria-labelledby="sweep-heading">
      <h4 id="sweep-heading">Shared sweep grid</h4>
      <p className="section-kicker">
        These coordinates and the grid resolution apply to both designs.
      </p>
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
