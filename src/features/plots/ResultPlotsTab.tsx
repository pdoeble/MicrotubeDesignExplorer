import { useEffect, useMemo, useRef, useState } from "react";
import { useSimulationStore } from "../../state/simulationStore";
import { SimulationWorkerClient, type SimulationProgressHandler } from "../simulation/client";
import type { SimulationWorkerResult } from "../../workers/protocol";
import {
  buildBrowserReportPayload,
  buildStandaloneHtmlReport,
  canonicalReportJson,
  downloadTextFile,
  openPrintableReport,
  reportFilename,
} from "../export/reportExport";
import { captureReportFigures } from "../export/reportFigures";
import { PlotFigure } from "./PlotFigure";
import { CompositePlotFigure } from "./CompositePlotFigure";
import { isCompositePlot } from "./compositePlotSpec";
import {
  plotById,
  plotRegistry,
  variantPlot,
  type PlotFamily,
  type PlotId,
  type PlotVariantKind,
} from "./plotRegistry";
import { colorDomainForPlot } from "./plotSpec";

const plotFamilyLabels: Record<PlotFamily, string> = {
  "boundary-summary": "Boundaries",
  "linear-map": "Linear maps",
  "log-map": "Log maps",
  "log-map-grid": "Log-map grids",
  "percent-delta": "Comparison deltas",
  "ratio-map": "Comparison ratios",
  "share-grid": "Resistance shares",
};

const plotFamilyOrder: PlotFamily[] = [
  "log-map",
  "linear-map",
  "percent-delta",
  "ratio-map",
  "boundary-summary",
  "log-map-grid",
  "share-grid",
];

export function ResultPlotsTab() {
  const request = useSimulationStore((state) => state.request);
  const [result, setResult] = useState<SimulationWorkerResult | null>(null);
  const [status, setStatus] = useState("No result computed in this session.");
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<PlotId>("overall-coefficient-map");
  const [selectedCooler, setSelectedCooler] = useState<"cooler_left" | "cooler_right">(
    "cooler_left",
  );
  const [displayMode, setDisplayMode] = useState<"single" | "tandem">("single");
  const clientRef = useRef<SimulationWorkerClient | null>(null);
  const selectedDefinition = useMemo(() => plotById(selectedPlot), [selectedPlot]);
  const isComparisonPlot = selectedDefinition.source === "comparison";
  const isComposite = isCompositePlot(selectedPlot);
  const comparisonVariant = selectedDefinition.variantKind;
  const tandemColorDomain = useMemo(
    () =>
      result && !isComparisonPlot && !isComposite && displayMode === "tandem"
        ? colorDomainForPlot(result.payload, result.arrays, selectedPlot, [
            "cooler_left",
            "cooler_right",
          ])
        : undefined,
    [displayMode, isComparisonPlot, isComposite, result, selectedPlot],
  );

  useEffect(
    () => () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if ((isComparisonPlot || isComposite) && displayMode !== "single") {
      setDisplayMode("single");
    }
  }, [displayMode, isComparisonPlot, isComposite]);

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
      setReportStatus(null);
      setStatus(`Computed ${next.arrays.length} numeric fields.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setStatus("Simulation failed.");
    } finally {
      unsubscribe();
      setRunning(false);
    }
  };

  const exportReport = async (format: "json" | "html" | "pdf") => {
    if (!result) return;
    setReportStatus(null);
    try {
      const payload = await buildBrowserReportPayload(request, result);
      if (format === "json") {
        downloadTextFile(
          reportFilename(payload, "json"),
          canonicalReportJson(payload),
          "application/json;charset=utf-8",
        );
        setReportStatus("Exported JSON sidecar.");
      } else {
        setReportStatus("Capturing report figures.");
        const figures = await captureReportFigures(result);
        const html = buildStandaloneHtmlReport(payload, { figures });
        if (format === "html") {
          downloadTextFile(reportFilename(payload, "html"), html, "text/html;charset=utf-8");
          setReportStatus("Exported standalone HTML report.");
        } else {
          openPrintableReport(html);
          setReportStatus("Opened print/PDF report.");
        }
      }
    } catch (caught) {
      setReportStatus(caught instanceof Error ? caught.message : String(caught));
    }
  };

  return (
    <section aria-labelledby="plots-heading" className="workflow-section">
      <div className="section-heading-row">
        <div>
          <h2 id="plots-heading">Results</h2>
          <p className="section-kicker">
            Compute, compare and export figures from the current `SimulationResult`.
          </p>
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
          <section className="full-width-panel" aria-labelledby="report-export-heading">
            <div className="report-export-row">
              <div>
                <h3 id="report-export-heading">Report exports</h3>
                <p className="section-kicker">
                  Reports use the current immutable `SimulationResult` and request hash.
                </p>
              </div>
              <div className="report-export-actions" aria-label="Report export controls">
                <button
                  className="text-button"
                  onClick={() => void exportReport("json")}
                  type="button"
                >
                  JSON
                </button>
                <button
                  className="text-button"
                  onClick={() => void exportReport("html")}
                  type="button"
                >
                  HTML
                </button>
                <button
                  className="text-button"
                  onClick={() => void exportReport("pdf")}
                  type="button"
                >
                  Print / PDF
                </button>
              </div>
            </div>
            {reportStatus ? (
              <p className="plot-figure__status" role="status">
                {reportStatus}
              </p>
            ) : null}
          </section>
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
            <label className="text-field" htmlFor="plot-display">
              <span>Display</span>
              <select
                id="plot-display"
                value={displayMode}
                onChange={(event) => setDisplayMode(event.target.value as "single" | "tandem")}
                disabled={isComparisonPlot || isComposite}
              >
                <option value="single">Single cooler</option>
                <option value="tandem">Tandem</option>
              </select>
            </label>
            <label className="text-field" htmlFor="comparison-variant">
              <span>Comparison value</span>
              <select
                id="comparison-variant"
                value={comparisonVariant ?? ""}
                onChange={(event) => {
                  const next = variantPlot(
                    selectedDefinition,
                    event.target.value as PlotVariantKind,
                  );
                  if (next) setSelectedPlot(next.id as PlotId);
                }}
                disabled={!comparisonVariant}
              >
                <option value="">n/a</option>
                <option value="delta">Delta (%)</option>
                <option value="ratio">Ratio</option>
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
                disabled={isComparisonPlot || isComposite || displayMode === "tandem"}
              >
                <option value="cooler_left">{result.payload.cooler_left.label}</option>
                <option value="cooler_right">{result.payload.cooler_right.label}</option>
              </select>
            </label>
          </fieldset>
          {isComposite ||
          (selectedPlot === "bundle-conductance-map" && displayMode === "tandem") ? (
            <CompositePlotFigure result={result} plotId={selectedPlot} />
          ) : !isComparisonPlot && displayMode === "tandem" ? (
            <div className="plot-tandem-grid" aria-label={`${selectedDefinition.title} tandem`}>
              <PlotFigure
                colorDomain={tandemColorDomain}
                result={result}
                plotId={selectedPlot}
                cooler="cooler_left"
              />
              <PlotFigure
                colorDomain={tandemColorDomain}
                result={result}
                plotId={selectedPlot}
                cooler="cooler_right"
              />
            </div>
          ) : (
            <PlotFigure result={result} plotId={selectedPlot} cooler={selectedCooler} />
          )}
        </>
      ) : null}
    </section>
  );
}

function KpiSummary({ result }: { result: SimulationWorkerResult }) {
  const rows = [
    ["Overall coefficient", "overall_coefficient", 1, "W/(m² K)"],
    ["Bundle conductance", "bundle_conductance", 1, "W K⁻¹"],
    ["Tube pressure drop", "tube_pressure_drop", 1e-5, "bar"],
    ["Coolant volume flow", "coolant_volume_flow", 6e4, "L min⁻¹"],
    ["Burst pressure", "burst_pressure", 1e-5, "bar"],
    ["Capillary rise", "capillary_rise", 1e3, "mm"],
    ["Cost index", "cost_index", 1, "-"],
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
            {rows.map(([label, key, factor, unit]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{formatScalar(result.payload.cooler_left.summary.values[key], factor)}</td>
                <td>{formatScalar(result.payload.cooler_right.summary.values[key], factor)}</td>
                <td>{unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatScalar(value: number | null | undefined, factor = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return Number((value * factor).toPrecision(4)).toString();
}
