import { useEffect, useRef, useState } from "react";
import { useSimulationStore } from "../../state/simulationStore";
import { SimulationWorkerClient, type SimulationProgressHandler } from "../simulation/client";
import type { SimulationWorkerResult } from "../../workers/protocol";
import { PlotFigure } from "./PlotFigure";
import { plotRegistry, type PlotFamily, type PlotId } from "./plotRegistry";

const plotFamilyLabels: Record<PlotFamily, string> = {
  "boundary-summary": "Boundaries",
  "linear-map": "Linear maps",
  "log-map": "Log maps",
  "log-map-grid": "Log-map grids",
  "percent-delta": "Comparison deltas",
  "share-grid": "Resistance shares",
};

const plotFamilyOrder: PlotFamily[] = [
  "log-map",
  "linear-map",
  "percent-delta",
  "boundary-summary",
  "log-map-grid",
  "share-grid",
];

export function ResultPlotsTab() {
  const request = useSimulationStore((state) => state.request);
  const [result, setResult] = useState<SimulationWorkerResult | null>(null);
  const [status, setStatus] = useState("No result computed in this session.");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<PlotId>("overall-coefficient-map");
  const [selectedCooler, setSelectedCooler] = useState<"cooler_left" | "cooler_right">(
    "cooler_left",
  );
  const clientRef = useRef<SimulationWorkerClient | null>(null);

  useEffect(
    () => () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    },
    [],
  );

  const runSimulation = async () => {
    const client = clientRef.current ?? new SimulationWorkerClient();
    clientRef.current = client;
    setRunning(true);
    setError(null);
    const onProgress: SimulationProgressHandler = (progress) => setStatus(progress.message);
    const unsubscribe = client.onProgress(onProgress);
    try {
      await client.initialize();
      const next = await client.compute(request);
      setResult(next);
      setStatus(`Computed ${next.arrays.length} numeric fields.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setStatus("Simulation failed.");
    } finally {
      unsubscribe();
      setRunning(false);
    }
  };

  return (
    <section aria-labelledby="plots-heading" className="workflow-section">
      <div className="section-heading-row">
        <div>
          <h2 id="plots-heading">Result Plots</h2>
          <p className="section-kicker">Plots read only from the current `SimulationResult`.</p>
        </div>
        <button type="button" className="primary-button" onClick={runSimulation} disabled={running}>
          {running ? "Computing..." : "Run simulation"}
        </button>
      </div>

      <p className="placeholder-note" role="status">
        {status}
      </p>
      {error ? <p className="field-error">{error}</p> : null}

      {result ? (
        <>
          <KpiSummary result={result} />
          <fieldset className="link-controls">
            <legend>Plot selection</legend>
            <label className="text-field" htmlFor="plot-id">
              <span>Plot</span>
              <select
                id="plot-id"
                value={selectedPlot}
                onChange={(event) => setSelectedPlot(event.target.value as PlotId)}
              >
                {plotFamilyOrder.map((family) => {
                  const plots = plotRegistry.filter((plot) => plot.family === family);
                  if (plots.length === 0) return null;
                  return (
                    <optgroup label={plotFamilyLabels[family]} key={family}>
                      {plots.map((plot) => (
                        <option value={plot.id} key={plot.id}>
                          {plot.title}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </label>
            <label className="text-field" htmlFor="plot-cooler">
              <span>Cooler</span>
              <select
                id="plot-cooler"
                value={selectedCooler}
                onChange={(event) =>
                  setSelectedCooler(event.target.value as "cooler_left" | "cooler_right")
                }
                disabled={
                  plotRegistry.find((plot) => plot.id === selectedPlot)?.source === "comparison"
                }
              >
                <option value="cooler_left">{result.payload.cooler_left.label}</option>
                <option value="cooler_right">{result.payload.cooler_right.label}</option>
              </select>
            </label>
          </fieldset>
          <PlotFigure result={result} plotId={selectedPlot} cooler={selectedCooler} />
        </>
      ) : null}
    </section>
  );
}

function KpiSummary({ result }: { result: SimulationWorkerResult }) {
  const rows = [
    ["Overall coefficient", "overall_coefficient"],
    ["Bundle conductance", "bundle_conductance"],
    ["Tube pressure drop", "tube_pressure_drop"],
    ["Coolant volume flow", "coolant_volume_flow"],
    ["Burst pressure", "burst_pressure"],
    ["Capillary rise", "capillary_rise"],
    ["Cost index", "cost_index"],
  ] as const;

  return (
    <section className="full-width-panel" aria-labelledby="kpi-heading">
      <h3 id="kpi-heading">Design-point summary</h3>
      <div className="table-scroll">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Quantity</th>
              <th>{result.payload.cooler_left.label}</th>
              <th>{result.payload.cooler_right.label}</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, key]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{formatScalar(result.payload.cooler_left.summary.values[key])}</td>
                <td>{formatScalar(result.payload.cooler_right.summary.values[key])}</td>
                <td>{result.payload.cooler_left.summary.units[key] ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatScalar(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return Number(value.toPrecision(6)).toString();
}
