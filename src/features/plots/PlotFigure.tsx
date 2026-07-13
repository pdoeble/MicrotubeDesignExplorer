import { useEffect, useId, useMemo, useRef, useState } from "react";
import type Plotly from "plotly.js-dist-min";
import type { SimulationRequest } from "../../contracts/generated/simulation-request";
import type { SimulationWorkerResult } from "../../workers/protocol";
import { plotById, type PlotId } from "./plotRegistry";
import {
  axisMillimeters,
  colorDomainForPlot,
  comparisonBoundaryForResult,
  type ColorDomain,
  createPlotSpec,
  fieldForPlot,
  imageExportOptions,
  maskMatrixForPlot,
  matrixFromArray,
  overlayTracesForPlot,
  paperContext,
  paperGeometryForPlot,
  statusMatrixForPlot,
  preparePlotData,
  summarizePlotData,
  supportedImageFormats,
  titleScopeForPlot,
  type CoolerKey,
  type ImageFormat,
} from "./plotSpec";
import { presentationForPlot } from "./plotPresentation";
import { referenceWidthPx } from "./paperLayout";

/** Observed content width of a figure container, for paper-scaled rendering. */
export function useContainerWidth(): [React.RefObject<HTMLDivElement>, number | undefined] {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      setWidth(element?.clientWidth || undefined);
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured)
        setWidth((previous) =>
          previous !== undefined && Math.abs(previous - measured) < 1 ? previous : measured,
        );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [containerRef, width];
}

type PlotFigureProps = {
  colorDomain?: ColorDomain | undefined;
  result: SimulationWorkerResult;
  plotId: PlotId;
  request: SimulationRequest;
  cooler: CoolerKey;
};

export function PlotFigure({ colorDomain, result, plotId, cooler, request }: PlotFigureProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [containerRef, containerWidth] = useContainerWidth();
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
  const comparisonBoundary = useMemo(
    () =>
      plot.source === "comparison"
        ? comparisonBoundaryForResult(result.payload, result.arrays)
        : undefined,
    [plot.source, result.arrays, result.payload],
  );
  // Robust/fixed color limits apply in single mode too (MATLAB shares k, kA
  // and burst limits across Al+PA regardless of display mode).
  const effectiveColorDomain = useMemo(
    () => colorDomain ?? colorDomainForPlot(result.payload, result.arrays, plotId, [cooler]),
    [colorDomain, cooler, plotId, result.arrays, result.payload],
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
  const geometry = paperGeometryForPlot(plot);
  const paper = useMemo(
    () => paperContext(geometry, containerWidth ? Math.min(containerWidth, 1400) : undefined),
    [containerWidth, geometry],
  );
  const paperOverlays = useMemo(
    () => overlayTracesForPlot(result.payload, result.arrays, plot, cooler, paper, request),
    [cooler, paper, plot, request, result.arrays, result.payload],
  );
  const plotSpec = useMemo(
    () =>
      field && zValues && containerWidth
        ? createPlotSpec({
            colorDomain: effectiveColorDomain,
            comparisonBoundary,
            cooler,
            field,
            overlays: paperOverlays,
            paper,
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
      containerWidth,
      comparisonBoundary,
      cooler,
      effectiveColorDomain,
      field,
      paper,
      paperOverlays,
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
    if (!field || !zValues) return;
    setExportStatus(null);
    const { default: Plotly } = await import("plotly.js-dist-min");
    // Export renders a fresh spec at the MATLAB reference size so the file
    // keeps the paper geometry regardless of the on-screen zoom.
    const exportSpec = createPlotSpec({
      colorDomain: effectiveColorDomain,
      comparisonBoundary,
      cooler,
      field,
      overlays: overlayTracesForPlot(
        result.payload,
        result.arrays,
        plot,
        cooler,
        undefined,
        request,
      ),
      plot,
      provenance: result.payload.provenance,
      statusValues,
      titleScope,
      xValues,
      yValues,
      zValues,
    });
    await Plotly.downloadImage(
      exportSpec as unknown as Parameters<typeof Plotly.downloadImage>[0],
      {
        ...imageExportOptions(plotId, cooler, format, pngScale),
        height: Math.round(
          (geometry.figureCm[1] / geometry.figureCm[0]) * referenceWidthPx(geometry),
        ),
        width: Math.round(referenceWidthPx(geometry)),
      },
    );
    setExportStatus(`Exported ${format.toUpperCase()} figure.`);
  }

  if (!field || !array || !zValues) {
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
      <div ref={containerRef} className="plot-figure__frame">
        <div
          ref={elementRef}
          className="plot-figure__canvas"
          role="img"
          aria-label={plot.description}
          aria-describedby={detailsId}
        />
      </div>
      {exportStatus ? (
        <p className="plot-figure__status" role="status">
          {exportStatus}
        </p>
      ) : null}
      <figcaption>
        {plot.description} Values use the units shown on the axes and color scale. PNG and SVG
        exports include calculation provenance.
      </figcaption>
      {dataSummary ? (
        <div className="plot-figure__details" id={detailsId}>
          <table className="summary-table">
            <caption>Current plot data summary</caption>
            <tbody>
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
