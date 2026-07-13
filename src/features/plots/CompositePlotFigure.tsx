import { useEffect, useId, useMemo, useRef, useState } from "react";
import type Plotly from "plotly.js-dist-min";
import type { SimulationRequest } from "../../contracts/generated/simulation-request";
import type { SimulationWorkerResult } from "../../workers/protocol";
import {
  compositeGeometry,
  createCompositePlotSpec,
  designBoundaryLegendEntries,
} from "./compositePlotSpec";
import { plotById, type PlotId } from "./plotRegistry";
import { imageExportOptions, supportedImageFormats, type ImageFormat } from "./plotSpec";
import { referenceWidthPx } from "./paperLayout";
import { useContainerWidth } from "./PlotFigure";

export function CompositePlotFigure({
  result,
  plotId,
  request,
}: {
  request: SimulationRequest;
  result: SimulationWorkerResult;
  plotId: PlotId;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [containerRef, containerWidth] = useContainerWidth();
  const controlId = useId();
  const [pngScale, setPngScale] = useState(2);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const plot = plotById(plotId);
  const spec = useMemo(
    () =>
      containerWidth
        ? createCompositePlotSpec(result, plotId, Math.min(containerWidth, 1400), request)
        : undefined,
    [containerWidth, plotId, request, result],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !spec) return undefined;
    let cancelled = false;
    let plotly: typeof Plotly | undefined;
    void import("plotly.js-dist-min").then(({ default: Plotly }) => {
      plotly = Plotly;
      if (!cancelled) void Plotly.newPlot(element, spec.data, spec.layout, spec.config);
    });
    return () => {
      cancelled = true;
      if (plotly) plotly.purge(element);
    };
  }, [spec]);

  async function exportImage(format: ImageFormat) {
    const geometry = compositeGeometry(plotId);
    const exportSpec = createCompositePlotSpec(result, plotId, undefined, request);
    if (!exportSpec || !geometry) return;
    const { default: Plotly } = await import("plotly.js-dist-min");
    await Plotly.downloadImage(
      exportSpec as unknown as Parameters<typeof Plotly.downloadImage>[0],
      {
        ...imageExportOptions(plotId, "cooler_left", format, pngScale),
        height: Math.round(
          (geometry.figureCm[1] / geometry.figureCm[0]) * referenceWidthPx(geometry),
        ),
        width: Math.round(referenceWidthPx(geometry)),
      },
    );
    setExportStatus(`Exported ${format.toUpperCase()} figure.`);
  }

  return (
    <figure className="plot-figure plot-figure--composite">
      <h3 className="plot-figure__title">{plot.title}</h3>
      <div className="plot-figure__actions" aria-label="Figure export controls">
        <label className="plot-figure__scale" htmlFor={`${controlId}-png-scale`}>
          <span>PNG scale</span>
          <select
            id={`${controlId}-png-scale`}
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
            type="button"
          >
            {format.toUpperCase()}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="plot-figure__frame">
        <div
          ref={elementRef}
          className="plot-figure__canvas plot-figure__canvas--composite"
          role="img"
          aria-label={plot.description}
        />
      </div>
      {plotId === "design-boundary-lines" ? (
        <ul className="plot-figure__legend" aria-label="Design screen boundary legend">
          {designBoundaryLegendEntries.map((entry) => (
            <li key={entry.label}>
              <span
                aria-hidden="true"
                className="plot-figure__legend-swatch"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </li>
          ))}
        </ul>
      ) : null}
      {exportStatus ? (
        <p className="plot-figure__status" role="status">
          {exportStatus}
        </p>
      ) : null}
      <figcaption>
        {plot.description} Both panels use shared scales. PNG and SVG exports include calculation
        provenance.
      </figcaption>
    </figure>
  );
}
