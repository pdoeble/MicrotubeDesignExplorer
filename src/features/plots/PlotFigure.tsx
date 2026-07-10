import { useEffect, useMemo, useRef, useState } from "react";
import type { SimulationWorkerResult } from "../../workers/protocol";
import { plotById, type PlotId } from "./plotRegistry";
import {
  axisMillimeters,
  type ColorDomain,
  createPlotSpec,
  fieldForPlot,
  imageExportOptions,
  matrixFromArray,
  overlayTracesForPlot,
  supportedImageFormats,
  titleScopeForPlot,
  type CoolerKey,
  type ImageFormat,
} from "./plotSpec";

type PlotFigureProps = {
  colorDomain?: ColorDomain | undefined;
  result: SimulationWorkerResult;
  plotId: PlotId;
  cooler: CoolerKey;
};

export function PlotFigure({ colorDomain, result, plotId, cooler }: PlotFigureProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const plot = plotById(plotId);
  const field = fieldForPlot(result.payload, plotId, cooler);
  const array = field ? result.arrays[field.buffer_index] : undefined;
  const zValues = useMemo(() => matrixFromArray(array, field), [array, field]);
  const xValues = useMemo(
    () => axisMillimeters(result.payload.outer_diameter_axis),
    [result.payload.outer_diameter_axis],
  );
  const yValues = useMemo(
    () => axisMillimeters(result.payload.wall_thickness_axis),
    [result.payload.wall_thickness_axis],
  );
  const titleScope = titleScopeForPlot(result.payload, plot, cooler);
  const overlays = useMemo(
    () => overlayTracesForPlot(result.payload, result.arrays, plot, cooler),
    [cooler, plot, result.arrays, result.payload],
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

    void import("plotly.js-dist-min").then(({ default: Plotly }) => {
      if (cancelled) return;
      void Plotly.newPlot(element, plotSpec.data, plotSpec.layout, plotSpec.config);
    });

    return () => {
      cancelled = true;
      void import("plotly.js-dist-min").then(({ default: Plotly }) => Plotly.purge(element));
    };
  }, [plotSpec]);

  async function exportImage(format: ImageFormat) {
    const element = elementRef.current;
    if (!element) return;
    setExportStatus(null);
    const { default: Plotly } = await import("plotly.js-dist-min");
    await Plotly.downloadImage(element, imageExportOptions(plotId, cooler, format));
    setExportStatus(`Exported ${format.toUpperCase()} figure.`);
  }

  if (!field || !array || !zValues || !plotSpec) {
    return <p className="placeholder-note">Selected plot field is not available in this result.</p>;
  }

  return (
    <figure className="plot-figure">
      <div className="plot-figure__actions" aria-label="Figure export controls">
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
    </figure>
  );
}
