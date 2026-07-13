import { useMemo } from "react";
import { useSimulationStore } from "../../state/simulationStore";
import { encodeUrlState, URL_STATE_VERSION } from "../../state/urlState";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";
const COMMIT_HASH = import.meta.env.VITE_COMMIT_HASH ?? "local";
const REPOSITORY_URL = "https://github.com/pdoeble/MicrotubeDesignExplorer";

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
        <dd>{URL_STATE_VERSION}</dd>
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

      <section className="full-width-panel" aria-labelledby="authorship-license-heading">
        <h3 id="authorship-license-heading">Authorship, citation &amp; license</h3>
        <dl className="meta-list">
          <dt>Software title and version</dt>
          <dd>
            Microtube Design Explorer {APP_VERSION} (build {COMMIT_HASH})
          </dd>
          <dt>Software author</dt>
          <dd>Philip Döbler, Esslingen University of Applied Sciences</dd>
          <dt>Copyright</dt>
          <dd>© 2026 Philip Döbler, Esslingen University of Applied Sciences</dd>
          <dt>Application source-code license</dt>
          <dd>
            The application source code is available under the{" "}
            <a href={`${REPOSITORY_URL}/blob/main/LICENSE`}>MIT License</a>, including permission to
            use, copy, modify, merge, publish, distribute, sublicense, and sell copies subject to
            its notice requirements.
          </dd>
          <dt>Scientific-material license scope</dt>
          <dd>
            The paper sources, MATLAB reference script, and MATLAB-derived golden datasets remain
            under their authors’ copyright and are not licensed for reuse outside this project by
            the MIT license. They are not included in the deployed application.
          </dd>
          <dt>Warranty</dt>
          <dd>
            The software is provided “as is”, without warranty of any kind. Consult the full license
            text for the binding disclaimer and limitation of liability.
          </dd>
          <dt>Software citation</dt>
          <dd>
            Cite the software and the accompanying paper. Machine-readable citation metadata is
            provided in <a href={`${REPOSITORY_URL}/blob/main/CITATION.cff`}>CITATION.cff</a>.
          </dd>
          <dt>Accompanying paper authors</dt>
          <dd>Philip Döbler, Michael Henzler, and Michael Auerbach</dd>
          <dt>Canonical repository</dt>
          <dd>
            <a href={REPOSITORY_URL}>{REPOSITORY_URL}</a>
          </dd>
        </dl>
      </section>
    </section>
  );
}

function stateText(value: boolean | undefined): string {
  return value ? "linked" : "independent";
}
