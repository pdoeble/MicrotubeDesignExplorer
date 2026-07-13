const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";
const COMMIT_HASH = import.meta.env.VITE_COMMIT_HASH ?? "local";

export function StartTab() {
  return (
    <section aria-labelledby="start-heading">
      <h2 id="start-heading">About this application</h2>
      <p>
        This application lets readers reproduce and explore the design-space calculation presented
        in the paper{" "}
        <em>
          Local Resistance-Based Design-Space Analysis of Polyamide Microtubes for Compact Heat
          Exchangers
        </em>{" "}
        (Döbler et&nbsp;al.). It evaluates heat-transfer performance and feasibility across outer
        diameter and wall thickness for a reference and a comparison design.
      </p>
      <h3>How to use it</h3>
      <ol>
        <li>
          Open <strong>Model Setup</strong> and name the reference and comparison designs.
        </li>
        <li>
          Work through Geometry, Solid material, Air circuit, Coolant circuit, and Screens &amp;
          boundaries. Each category can use the same values for both designs or separate values.
        </li>
        <li>
          Continue to <strong>Results</strong> to compute design-space maps and export figures or a
          complete report.
        </li>
      </ol>
      <h3>Scientific basis</h3>
      <p>
        The calculation follows the VDI-Wärmeatlas, 12th edition (2019): chapter G7 for outer
        convection in an inline cross-flow tube bank and chapter G1 for circular internal flow with
        constant wall temperature. Pressure integrity is evaluated with Lamé using the
        tolerance-adjusted minimum wall. All assumptions, validity limits, and screens are shown
        with the results.
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
