import { useState } from "react";
import { LinkedGroupNotice } from "../../components/LinkedGroupNotice";
import { Tabs } from "../../components/Tabs";
import { type CoolerKey, type LinkGroup, useSimulationStore } from "../../state/simulationStore";
import { PropertyInputs } from "../materials/MaterialsTab";
import { DesignInputs, SweepInputs } from "./InputTab";

type SetupCategory = {
  description: string;
  group: LinkGroup;
  label: string;
};

const SETUP_CATEGORIES: readonly SetupCategory[] = [
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
    description: "Air properties, operating mode and target",
    group: "air_side",
    label: "Air circuit",
  },
  {
    description: "Coolant properties, operating mode and target",
    group: "coolant_side",
    label: "Coolant circuit",
  },
  {
    description: "Thermal boundary condition, tolerances, screens and sweep grid",
    group: "boundary_conditions",
    label: "Screens & boundaries",
  },
] as const;

export function ModelSetupTab({ onContinue }: { onContinue: () => void }) {
  const [activeCategory, setActiveCategory] = useState<LinkGroup>("geometry");
  const [visibleDesign, setVisibleDesign] = useState<CoolerKey>("cooler_left");
  const request = useSimulationStore((state) => state.request);
  const setCoolerLabel = useSimulationStore((state) => state.setCoolerLabel);

  const tabs = SETUP_CATEGORIES.map((category) => ({
    id: category.group,
    label: category.label,
    panel: (
      <SetupCategoryPanel
        category={category}
        visibleDesign={visibleDesign}
        onVisibleDesignChange={setVisibleDesign}
      />
    ),
  }));

  return (
    <section aria-labelledby="model-setup-heading" className="workflow-section">
      <div>
        <h2 id="model-setup-heading">Model setup</h2>
        <p className="section-kicker">
          Configure each scientific category for the reference and comparison designs.
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

      <div className="setup-category-tabs">
        <Tabs
          tabs={tabs}
          activeId={activeCategory}
          onActivate={(id) => setActiveCategory(id as LinkGroup)}
          ariaLabel="Model setup categories"
        />
      </div>

      <div className="setup-actions" aria-label="Model setup navigation">
        <span />
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue to results
        </button>
      </div>
    </section>
  );
}

function SetupCategoryPanel({
  category,
  visibleDesign,
  onVisibleDesignChange,
}: {
  category: SetupCategory;
  visibleDesign: CoolerKey;
  onVisibleDesignChange: (value: CoolerKey) => void;
}) {
  const request = useSimulationStore((state) => state.request);
  const setLinkedGroup = useSimulationStore((state) => state.setLinkedGroup);
  const linked = Boolean(request.linked_groups[category.group]);
  const isLinkedComparison = visibleDesign === "cooler_right" && linked;
  const role = visibleDesign === "cooler_left" ? "Reference design" : "Comparison design";
  const headingId = `${category.group}-category-heading`;
  const editorHeadingId = `${category.group}-${visibleDesign}-heading`;

  return (
    <section className="setup-category" aria-labelledby={headingId}>
      <div>
        <h3 id={headingId}>{category.label}</h3>
        <p className="section-kicker">{category.description}</p>
      </div>

      <div className="setup-switches">
        <div>
          <p className="switch-label">Design view</p>
          <DesignViewSwitch value={visibleDesign} onChange={onVisibleDesignChange} />
        </div>
        <div>
          <p className="switch-label">Comparison mode</p>
          <LinkModeSwitch
            group={category.group}
            linked={linked}
            onChange={(nextLinked) => setLinkedGroup(category.group, nextLinked)}
          />
        </div>
      </div>

      <section className="cooler-panel setup-category__editor" aria-labelledby={editorHeadingId}>
        <p className="cooler-panel__role">{role}</p>
        <h4 id={editorHeadingId}>{request[visibleDesign].label}</h4>
        {isLinkedComparison ? (
          <LinkedGroupNotice
            group={category.group}
            sourceLabel={request.cooler_left.label}
            title={category.label}
            onUnlink={(group) => setLinkedGroup(group, false)}
          />
        ) : (
          <CategoryInputs group={category.group} cooler={visibleDesign} />
        )}
      </section>

      {category.group === "boundary_conditions" ? <SweepInputs /> : null}
    </section>
  );
}

function CategoryInputs({ group, cooler }: { group: LinkGroup; cooler: CoolerKey }) {
  switch (group) {
    case "geometry":
    case "boundary_conditions":
      return <DesignInputs cooler={cooler} group={group} />;
    case "materials":
      return <PropertyInputs cooler={cooler} group={group} />;
    case "air_side":
    case "coolant_side":
      return (
        <>
          <DesignInputs cooler={cooler} group={group} />
          <PropertyInputs cooler={cooler} group={group} />
        </>
      );
  }
}

function DesignViewSwitch({
  value,
  onChange,
}: {
  value: CoolerKey;
  onChange: (value: CoolerKey) => void;
}) {
  return (
    <div className="design-view-switch" role="group" aria-label="Visible design">
      <button
        className={
          value === "cooler_left" ? "switch-button switch-button--active" : "switch-button"
        }
        type="button"
        aria-pressed={value === "cooler_left"}
        onClick={() => onChange("cooler_left")}
      >
        Reference
      </button>
      <button
        className={
          value === "cooler_right" ? "switch-button switch-button--active" : "switch-button"
        }
        type="button"
        aria-pressed={value === "cooler_right"}
        onClick={() => onChange("cooler_right")}
      >
        Comparison
      </button>
    </div>
  );
}

function LinkModeSwitch({
  group,
  linked,
  onChange,
}: {
  group: LinkGroup;
  linked: boolean;
  onChange: (linked: boolean) => void;
}) {
  return (
    <div
      className="link-mode-switch"
      role="group"
      aria-label={`${group.replaceAll("_", " ")} value relationship`}
    >
      <button
        className={linked ? "switch-button switch-button--active" : "switch-button"}
        type="button"
        aria-pressed={linked}
        onClick={() => onChange(true)}
      >
        Same values
      </button>
      <button
        className={!linked ? "switch-button switch-button--active" : "switch-button"}
        type="button"
        aria-pressed={!linked}
        onClick={() => onChange(false)}
      >
        Separate values
      </button>
    </div>
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
