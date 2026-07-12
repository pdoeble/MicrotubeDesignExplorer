import { useEffect, useId, useMemo, useRef, useState } from "react";
import type Plotly from "plotly.js-dist-min";
import type { SimulationWorkerResult } from "../../workers/protocol";
import { createCompositePlotSpec } from "./compositePlotSpec";
import { plotById, type PlotId } from "./plotRegistry";
import { imageExportOptions, supportedImageFormats, type ImageFormat } from "./plotSpec";

export function CompositePlotFigure({
  result,
  plotId,
}: {
  result: SimulationWorkerResult;
  plotId: PlotId;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const controlId = useId();
  const [pngScale, setPngScale] = useState(2);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const plot = plotById(plotId);
  const spec = useMemo(() => createCompositePlotSpec(result, plotId), [plotId, result]);

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
    const element = elementRef.current;
    if (!element || !spec) return;
    const { default: Plotly } = await import("plotly.js-dist-min");
    await Plotly.downloadImage(element, {
      ...imageExportOptions(plotId, "cooler_left", format, pngScale),
      height: spec.layout.height ?? 900,
      width: 950,
    });
    setExportStatus(`Exported ${format.toUpperCase()} figure.`);
  }

  if (!spec) return <p className="placeholder-note">Composite plot data are unavailable.</p>;
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
      <div
        ref={elementRef}
        className="plot-figure__canvas plot-figure__canvas--composite"
        role="img"
        aria-label={plot.description}
      />
      {exportStatus ? (
        <p className="plot-figure__status" role="status">
          {exportStatus}
        </p>
      ) : null}
      <figcaption>
        {plot.description} Shared scales and provenance are included in PNG and SVG exports.
      </figcaption>
    </figure>
  );
}
