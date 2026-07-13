import { useSimulationStore } from "../../state/simulationStore";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";
const COMMIT_HASH = import.meta.env.VITE_COMMIT_HASH ?? "local";
const REPOSITORY_URL = "https://github.com/pdoeble/MicrotubeDesignExplorer";

export function SettingsTab() {
  const resetAll = useSimulationStore((state) => state.resetAll);

  return (
    <section aria-labelledby="settings-heading" className="workflow-section">
      <h2 id="settings-heading">Settings</h2>
      <div className="settings-actions">
        <button type="button" className="primary-button" onClick={resetAll}>
          Reset to paper defaults
        </button>
      </div>
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
          <dd>Philip Döbler, Michael Henzler, Michael Auerbach, and André Casal Kulzer</dd>
          <dt>Canonical repository</dt>
          <dd>
            <a href={REPOSITORY_URL}>{REPOSITORY_URL}</a>
          </dd>
        </dl>
      </section>
    </section>
  );
}
