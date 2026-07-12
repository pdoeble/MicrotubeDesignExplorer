import { ParameterControl } from "../../components/ParameterControl";
import { LinkedGroupNotice } from "../../components/LinkedGroupNotice";
import { getByPath, type CoolerKey, useSimulationStore } from "../../state/simulationStore";
import { specsForGroup, type ParameterSpec } from "../input/parameterManifest";

const COOLERS: CoolerKey[] = ["cooler_left", "cooler_right"];

export function MaterialsTab() {
  const request = useSimulationStore((state) => state.request);
  const setLinkedGroup = useSimulationStore((state) => state.setLinkedGroup);
  const setCoolerValue = useSimulationStore((state) => state.setCoolerValue);
  const resetCoolerField = useSimulationStore((state) => state.resetCoolerField);

  return (
    <section aria-labelledby="materials-heading" className="workflow-section">
      <div>
        <h3 id="materials-heading">Materials & fluids</h3>
        <p className="section-kicker">
          Define solid-material data and the fixed property sets used by each fluid circuit.
        </p>
      </div>

      <div className="cooler-grid">
        {COOLERS.map((cooler) => (
          <section
            className="cooler-panel"
            aria-labelledby={`${cooler}-materials-heading`}
            key={cooler}
          >
            <p className="cooler-panel__role">
              {cooler === "cooler_left" ? "Reference design" : "Comparison design"}
            </p>
            <h4 id={`${cooler}-materials-heading`}>{request[cooler].label}</h4>
            {cooler === "cooler_left" || !request.linked_groups.materials ? (
              <>
                <TextField
                  id={`${cooler}-material-name`}
                  label="Material name"
                  value={request[cooler].material.name}
                  onChange={(value) => setCoolerValue(cooler, "materials", "material.name", value)}
                />
                <ParameterGroup
                  title="Solid material"
                  cooler={cooler}
                  group="materials"
                  specs={specsForGroup("materials")}
                  getValue={(path) => Number(getByPath(request[cooler], path))}
                  onChange={(path, value) => setCoolerValue(cooler, "materials", path, value)}
                  onReset={(path) => resetCoolerField(cooler, "materials", path)}
                />
              </>
            ) : (
              <LinkedGroupNotice
                group="materials"
                sourceLabel={request.cooler_left.label}
                title="Solid material"
                onUnlink={(group) => setLinkedGroup(group, false)}
              />
            )}
            {cooler === "cooler_left" || !request.linked_groups.air_side ? (
              <>
                <TextField
                  id={`${cooler}-air-fluid-name`}
                  label="Air property set"
                  value={request[cooler].air_side.fluid.name}
                  onChange={(value) =>
                    setCoolerValue(cooler, "air_side", "air_side.fluid.name", value)
                  }
                />
                <ParameterGroup
                  title="Air fluid properties"
                  cooler={cooler}
                  group="air_side"
                  specs={fluidSpecs("air_side")}
                  getValue={(path) => Number(getByPath(request[cooler], path))}
                  onChange={(path, value) => setCoolerValue(cooler, "air_side", path, value)}
                  onReset={(path) => resetCoolerField(cooler, "air_side", path)}
                />
              </>
            ) : (
              <LinkedGroupNotice
                group="air_side"
                sourceLabel={request.cooler_left.label}
                title="Air fluid properties"
                onUnlink={(group) => setLinkedGroup(group, false)}
              />
            )}
            {cooler === "cooler_left" || !request.linked_groups.coolant_side ? (
              <>
                <TextField
                  id={`${cooler}-coolant-fluid-name`}
                  label="Coolant property set"
                  value={request[cooler].coolant_side.fluid.name}
                  onChange={(value) =>
                    setCoolerValue(cooler, "coolant_side", "coolant_side.fluid.name", value)
                  }
                />
                <ParameterGroup
                  title="Coolant fluid properties"
                  cooler={cooler}
                  group="coolant_side"
                  specs={fluidSpecs("coolant_side")}
                  getValue={(path) => Number(getByPath(request[cooler], path))}
                  onChange={(path, value) => setCoolerValue(cooler, "coolant_side", path, value)}
                  onReset={(path) => resetCoolerField(cooler, "coolant_side", path)}
                />
              </>
            ) : (
              <LinkedGroupNotice
                group="coolant_side"
                sourceLabel={request.cooler_left.label}
                title="Coolant fluid properties"
                onUnlink={(group) => setLinkedGroup(group, false)}
              />
            )}
          </section>
        ))}
      </div>
    </section>
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
