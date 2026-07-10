const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";
const COMMIT_HASH = import.meta.env.VITE_COMMIT_HASH ?? "local";

export function StartTab() {
  return (
    <section aria-labelledby="start-heading">
      <h2 id="start-heading">About this application</h2>
      <p>
        This static web application accompanies the paper{" "}
        <em>
          Local Resistance-Based Design-Space Analysis of Polyamide Microtubes for Compact Heat
          Exchangers
        </em>{" "}
        (Döbler, Henzler, Auerbach et&nbsp;al., Esslingen University of Applied Sciences). It ports
        the complete approved MATLAB screening model to Python and executes it locally in your
        browser — no data leaves your device.
      </p>
      <h3>How to use it</h3>
      <ol>
        <li>
          Configure both heat exchangers under <strong>Input</strong>. The default reproduces the
          paper case: identical geometry, aluminum versus polyamide (PA).
        </li>
        <li>
          Adjust static material and fluid properties under <strong>Materials</strong>.
        </li>
        <li>
          Explore the design-space maps under <strong>Result Plots</strong> and export figures or a
          full report.
        </li>
      </ol>
      <h3>Scientific basis</h3>
      <p>
        Outer convection: VDI-Wärmeatlas 2013 G7 (inline cross-flow tube bank). Inner convection:
        VDI-Wärmeatlas 2013 G1 (circular internal flow, constant wall temperature). Pressure
        integrity: Lamé with tolerance-adjusted minimum wall. All assumptions, validity limits, and
        screens are shown with the results.
      </p>
      <h3>Version and citation</h3>
      <dl className="meta-list">
        <dt>Application version</dt>
        <dd>{APP_VERSION}</dd>
        <dt>Build</dt>
        <dd>{COMMIT_HASH}</dd>
        <dt>Citation</dt>
        <dd>
          See <code>CITATION.cff</code> in the repository.
        </dd>
      </dl>
    </section>
  );
}
