import { useState } from "react";
import type { LinkGroup } from "../../state/simulationStore";
import { useSimulationStore } from "../../state/simulationStore";
import { MaterialsTab } from "../materials/MaterialsTab";
import { InputTab } from "./InputTab";

type SetupStep = "design" | "properties";

const LINK_GROUPS: readonly {
  description: string;
  group: LinkGroup;
  label: string;
}[] = [
  {
    description: "Package geometry, tube arrangement and design point",
    group: "geometry",
    label: "Geometry",
  },
  {
    description: "Solid-material properties and manufacturing limits",
    group: "materials",
    label: "Solid material",
  },
  {
    description: "Fluid properties, operating mode and target",
    group: "air_side",
    label: "Air circuit",
  },
  {
    description: "Fluid properties, operating mode and target",
    group: "coolant_side",
    label: "Coolant circuit",
  },
  {
    description: "Thermal boundary condition, tolerances and screens",
    group: "boundary_conditions",
    label: "Screens & boundaries",
  },
] as const;

export function ModelSetupTab({ onContinue }: { onContinue: () => void }) {
  const [step, setStep] = useState<SetupStep>("design");
  const request = useSimulationStore((state) => state.request);
  const setCoolerLabel = useSimulationStore((state) => state.setCoolerLabel);
  const setLinkedGroup = useSimulationStore((state) => state.setLinkedGroup);

  return (
    <section aria-labelledby="model-setup-heading" className="workflow-section">
      <div className="section-heading-row">
        <div>
          <h2 id="model-setup-heading">Model setup</h2>
          <p className="section-kicker">
            Configure two designs in one workflow. Linked groups are edited once in the reference
            design and applied to both.
          </p>
        </div>
        <p className="setup-progress" aria-live="polite">
          Step {step === "design" ? "1" : "2"} of 2
        </p>
      </div>

      <fieldset className="comparison-identity">
        <legend>Design names</legend>
        <p className="fieldset-description">
          Names identify panels, figures and report columns; they remain independent of linking.
        </p>
        <div className="comparison-identity__grid">
          <TextField
            id="cooler-left-label"
            label="Reference design"
            value={request.cooler_left.label}
            onChange={(value) => setCoolerLabel("cooler_left", value)}
          />
          <TextField
            id="cooler-right-label"
            label="Comparison design"
            value={request.cooler_right.label}
            onChange={(value) => setCoolerLabel("cooler_right", value)}
          />
        </div>
      </fieldset>

      <fieldset className="link-controls link-controls--setup" aria-describedby="link-help">
        <legend>Reference/comparison linking</legend>
        <p className="fieldset-description" id="link-help">
          Linking copies the reference group to the comparison design. Unlinking restores its last
          independent values.
        </p>
        <div className="link-controls__grid">
          {LINK_GROUPS.map(({ description, group, label }) => (
            <label className="link-control" htmlFor={`link-${group}`} key={group}>
              <input
                id={`link-${group}`}
                type="checkbox"
                aria-label={label}
                checked={Boolean(request.linked_groups[group])}
                onChange={(event) => setLinkedGroup(group, event.target.checked)}
              />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <nav className="setup-stepper" aria-label="Model setup steps">
        <button
          className={step === "design" ? "setup-step setup-step--active" : "setup-step"}
          type="button"
          aria-current={step === "design" ? "step" : undefined}
          onClick={() => setStep("design")}
        >
          <span>1</span>
          <strong>Design & operation</strong>
          <small>Geometry, operating points and screens</small>
        </button>
        <button
          className={step === "properties" ? "setup-step setup-step--active" : "setup-step"}
          type="button"
          aria-current={step === "properties" ? "step" : undefined}
          onClick={() => setStep("properties")}
        >
          <span>2</span>
          <strong>Materials & fluids</strong>
          <small>Solid and fluid property sets</small>
        </button>
      </nav>

      {step === "design" ? <InputTab /> : <MaterialsTab />}

      <div className="setup-actions" aria-label="Model setup navigation">
        {step === "properties" ? (
          <button className="text-button" type="button" onClick={() => setStep("design")}>
            Back to design & operation
          </button>
        ) : (
          <span />
        )}
        {step === "design" ? (
          <button className="primary-button" type="button" onClick={() => setStep("properties")}>
            Continue to materials & fluids
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onContinue}>
            Continue to results
          </button>
        )}
      </div>
    </section>
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
