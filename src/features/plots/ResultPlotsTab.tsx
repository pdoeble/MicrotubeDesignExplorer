export function ResultPlotsTab() {
  return (
    <section aria-labelledby="plots-heading">
      <h2 id="plots-heading">Result Plots</h2>
      <p className="placeholder-note" role="status">
        The plot registry, tandem/delta views, KPI panel, and figure exports are implemented in
        milestone M6 once the Python core (M3) and worker bridge (M4) are available.
      </p>
    </section>
  );
}
