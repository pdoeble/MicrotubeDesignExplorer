import { useMemo } from "react";
import { useSimulationStore } from "../../state/simulationStore";
import { encodeUrlState } from "../../state/urlState";

export function SettingsTab() {
  const request = useSimulationStore((state) => state.request);
  const resetAll = useSimulationStore((state) => state.resetAll);
  const encodedLength = useMemo(() => encodeUrlState(request).length, [request]);

  return (
    <section aria-labelledby="settings-heading" className="workflow-section">
      <h2 id="settings-heading">Settings</h2>
      <div className="settings-actions">
        <button type="button" className="primary-button" onClick={resetAll}>
          Reset to paper defaults
        </button>
      </div>
      <dl className="meta-list">
        <dt>URL state schema</dt>
        <dd>1.0.0</dd>
        <dt>Encoded scientific state</dt>
        <dd>{encodedLength} characters in the `state` query parameter</dd>
        <dt>Left/right links</dt>
        <dd>
          Geometry {stateText(request.linked_groups.geometry)}, air side{" "}
          {stateText(request.linked_groups.air_side)}, coolant side{" "}
          {stateText(request.linked_groups.coolant_side)}, screens{" "}
          {stateText(request.linked_groups.boundary_conditions)}, materials{" "}
          {stateText(request.linked_groups.materials)}.
        </dd>
      </dl>
    </section>
  );
}

function stateText(value: boolean | undefined): string {
  return value ? "linked" : "independent";
}
