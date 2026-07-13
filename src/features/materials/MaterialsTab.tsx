import { ParameterControl } from "../../components/ParameterControl";
import { getByPath, type CoolerKey, useSimulationStore } from "../../state/simulationStore";
import { specsForGroup, type ParameterSpec } from "../input/parameterManifest";

export type PropertyInputGroup = "air_side" | "coolant_side" | "materials";

/** Material or fluid-property controls for one visible design and one setup category. */
export function PropertyInputs({
  cooler,
  group,
}: {
  cooler: CoolerKey;
  group: PropertyInputGroup;
}) {
  const request = useSimulationStore((state) => state.request);
  const setCoolerValue = useSimulationStore((state) => state.setCoolerValue);
  const resetCoolerField = useSimulationStore((state) => state.resetCoolerField);
  const configuration = request[cooler];

  if (group === "materials") {
    return (
      <>
        <TextField
          id={`${cooler}-material-name`}
          label="Material name"
          value={configuration.material.name}
          onChange={(value) => setCoolerValue(cooler, "materials", "material.name", value)}
        />
        <ParameterGroup
          title="Solid material properties"
          cooler={cooler}
          specs={specsForGroup("materials")}
          getValue={(path) => Number(getByPath(configuration, path))}
          onChange={(path, value) => setCoolerValue(cooler, "materials", path, value)}
          onReset={(path) => resetCoolerField(cooler, "materials", path)}
        />
      </>
    );
  }

  if (group === "air_side") {
    return (
      <>
        <TextField
          id={`${cooler}-air-fluid-name`}
          label="Air property set"
          value={configuration.air_side.fluid.name}
          onChange={(value) => setCoolerValue(cooler, "air_side", "air_side.fluid.name", value)}
        />
        <ParameterGroup
          title="Air fluid properties"
          cooler={cooler}
          specs={fluidSpecs("air_side")}
          getValue={(path) => Number(getByPath(configuration, path))}
          onChange={(path, value) => setCoolerValue(cooler, "air_side", path, value)}
          onReset={(path) => resetCoolerField(cooler, "air_side", path)}
        />
      </>
    );
  }

  return (
    <>
      <TextField
        id={`${cooler}-coolant-fluid-name`}
        label="Coolant property set"
        value={configuration.coolant_side.fluid.name}
        onChange={(value) =>
          setCoolerValue(cooler, "coolant_side", "coolant_side.fluid.name", value)
        }
      />
      <ParameterGroup
        title="Coolant fluid properties"
        cooler={cooler}
        specs={fluidSpecs("coolant_side")}
        getValue={(path) => Number(getByPath(configuration, path))}
        onChange={(path, value) => setCoolerValue(cooler, "coolant_side", path, value)}
        onReset={(path) => resetCoolerField(cooler, "coolant_side", path)}
      />
    </>
  );
}

function fluidSpecs(group: "air_side" | "coolant_side"): ParameterSpec[] {
  return specsForGroup(group).filter((spec) => spec.mode === null && !spec.path.endsWith(".value"));
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
            id={`${cooler}-materials-${spec.path.replaceAll(".", "-")}-${spec.mode ?? "base"}`}
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
