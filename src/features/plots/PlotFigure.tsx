import { useEffect, useId, useMemo, useRef, useState } from "react";
import type Plotly from "plotly.js-dist-min";
import type { SimulationWorkerResult } from "../../workers/protocol";
import { plotById, type PlotId } from "./plotRegistry";
import {
  axisMillimeters,
  type ColorDomain,
  createPlotSpec,
  fieldForPlot,
  imageExportOptions,
  maskMatrixForPlot,
  matrixFromArray,
  overlayTracesForPlot,
  statusMatrixForPlot,
  preparePlotData,
  summarizePlotData,
  supportedImageFormats,
  titleScopeForPlot,
  type CoolerKey,
  type ImageFormat,
} from "./plotSpec";
import { presentationForPlot } from "./plotPresentation";

type PlotFigureProps = {
  colorDomain?: ColorDomain | undefined;
  result: SimulationWorkerResult;
  plotId: PlotId;
  cooler: CoolerKey;
};

export function PlotFigure({ colorDomain, result, plotId, cooler }: PlotFigureProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const detailsId = useId();
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [pngScale, setPngScale] = useState(2);
  const plot = plotById(plotId);
  const field = fieldForPlot(result.payload, plotId, cooler);
  const array = field ? result.arrays[field.buffer_index] : undefined;
  const rawValues = useMemo(() => matrixFromArray(array, field), [array, field]);
  const xValues = useMemo(
    () => axisMillimeters(result.payload.outer_diameter_axis),
    [result.payload.outer_diameter_axis],
  );
  const yValues = useMemo(
    () => axisMillimeters(result.payload.wall_thickness_axis),
    [result.payload.wall_thickness_axis],
  );
  const titleScope = titleScopeForPlot(result.payload, plot, cooler);
  const presentation = presentationForPlot(plot);
  const overlays = useMemo(
    () => overlayTracesForPlot(result.payload, result.arrays, plot, cooler),
    [cooler, plot, result.arrays, result.payload],
  );
  const statusValues = useMemo(
    () => statusMatrixForPlot(result.payload, result.arrays, plot, cooler),
    [cooler, plot, result.arrays, result.payload],
  );
  const zValues = useMemo(
    () =>
      rawValues
        ? maskMatrixForPlot(result.payload, result.arrays, plot, cooler, rawValues)
        : undefined,
    [cooler, plot, rawValues, result.arrays, result.payload],
  );
  const preparedData = useMemo(
    () => (zValues ? preparePlotData(xValues, yValues, zValues, plot, statusValues) : undefined),
    [plot, statusValues, xValues, yValues, zValues],
  );
  const dataSummary = useMemo(
    () =>
      preparedData
        ? summarizePlotData(preparedData.displayValues, preparedData.statusValues)
        : undefined,
    [preparedData],
  );
  const plotSpec = useMemo(
    () =>
      field && zValues
        ? createPlotSpec({
            colorDomain,
            cooler,
            field,
            overlays,
            plot,
            provenance: result.payload.provenance,
            statusValues,
            titleScope,
            xValues,
            yValues,
            zValues,
          })
        : undefined,
    [
      colorDomain,
      cooler,
      field,
      overlays,
      plot,
      result.payload.provenance,
      statusValues,
      titleScope,
      xValues,
      yValues,
      zValues,
    ],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !plotSpec) return undefined;
    let cancelled = false;
    let plotly: typeof Plotly | undefined;

    void import("plotly.js-dist-min").then(({ default: Plotly }) => {
      plotly = Plotly;
      if (cancelled) return;
      void Plotly.newPlot(element, plotSpec.data, plotSpec.layout, plotSpec.config);
    });

    return () => {
      cancelled = true;
      if (plotly) plotly.purge(element);
    };
  }, [plotSpec]);

  async function exportImage(format: ImageFormat) {
    const element = elementRef.current;
    if (!element) return;
    setExportStatus(null);
    const { default: Plotly } = await import("plotly.js-dist-min");
    await Plotly.downloadImage(element, imageExportOptions(plotId, cooler, format, pngScale));
    setExportStatus(`Exported ${format.toUpperCase()} figure.`);
  }

  if (!field || !array || !zValues || !plotSpec) {
    return <p className="placeholder-note">Selected plot field is not available in this result.</p>;
  }

  return (
    <figure className="plot-figure">
      <h3 className="plot-figure__title">
        {plot.title} — {titleScope}
      </h3>
      <div className="plot-figure__actions" aria-label="Figure export controls">
        <label className="plot-figure__scale" htmlFor={`${detailsId}-png-scale`}>
          <span>PNG scale</span>
          <select
            id={`${detailsId}-png-scale`}
            value={pngScale}
            onChange={(event) => setPngScale(Number(event.target.value))}
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
          </select>
        </label>
        {supportedImageFormats.map((format) => (
          <button
            className="text-button"
            key={format}
            onClick={() => void exportImage(format)}
            title={`Export ${format.toUpperCase()} figure`}
            type="button"
          >
            {format.toUpperCase()}
          </button>
        ))}
      </div>
      <div
        ref={elementRef}
        className="plot-figure__canvas"
        role="img"
        aria-label={plot.description}
        aria-describedby={detailsId}
      />
      {exportStatus ? (
        <p className="plot-figure__status" role="status">
          {exportStatus}
        </p>
      ) : null}
      <figcaption>
        {plot.description} Values are read from `SimulationResult`; axes use SI-derived display
        conversions. The exported figure includes request and version provenance.
      </figcaption>
      {dataSummary ? (
        <div className="plot-figure__details" id={detailsId}>
          <table className="summary-table">
            <caption>Current plot data summary</caption>
            <tbody>
              <tr>
                <th scope="row">Plot ID</th>
                <td>{plot.id}</td>
              </tr>
              <tr>
                <th scope="row">Field</th>
                <td>{field.name}</td>
              </tr>
              <tr>
                <th scope="row">Unit</th>
                <td>{presentation.displayUnit}</td>
              </tr>
              <tr>
                <th scope="row">Finite cells</th>
                <td>
                  {dataSummary.finiteCells} / {dataSummary.totalCells}
                </td>
              </tr>
              <tr>
                <th scope="row">Minimum</th>
                <td>{formatPlotValue(dataSummary.minimum)}</td>
              </tr>
              <tr>
                <th scope="row">Maximum</th>
                <td>{formatPlotValue(dataSummary.maximum)}</td>
              </tr>
              <tr>
                <th scope="row">Status counts</th>
                <td>{formatStatusCounts(dataSummary.statusCounts)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </figure>
  );
}

function formatPlotValue(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return Number(value.toPrecision(6)).toString();
}

function formatStatusCounts(statusCounts: Record<string, number>): string {
  const entries = Object.entries(statusCounts);
  if (entries.length === 0) return "n/a";
  return entries.map(([status, count]) => `${status}: ${count}`).join("; ");
}
