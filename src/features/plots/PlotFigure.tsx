import { useEffect, useMemo, useRef } from "react";
import type {
  GridFieldRef,
  SimulationResultPayload,
} from "../../contracts/generated/simulation-result";
import type { SimulationWorkerResult } from "../../workers/protocol";
import { plotById, type PlotId } from "./plotRegistry";

type PlotFigureProps = {
  result: SimulationWorkerResult;
  plotId: PlotId;
  cooler: "cooler_left" | "cooler_right";
};

export function PlotFigure({ result, plotId, cooler }: PlotFigureProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const plot = plotById(plotId);
  const field = fieldForPlot(result.payload, plotId, cooler);
  const array = field ? result.arrays[field.buffer_index] : undefined;
  const zValues = useMemo(() => matrixFromArray(array, field), [array, field]);
  const xValues = useMemo(
    () => result.payload.outer_diameter_axis.map((value) => value * 1000),
    [result.payload.outer_diameter_axis],
  );
  const yValues = useMemo(
    () => result.payload.wall_thickness_axis.map((value) => value * 1000),
    [result.payload.wall_thickness_axis],
  );
  const titleScope = plot.source === "comparison" ? "Comparison" : result.payload[cooler].label;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !field || !zValues) return undefined;
    let cancelled = false;

    void import("plotly.js-dist-min").then(({ default: Plotly }) => {
      if (cancelled) return;
      void Plotly.newPlot(
        element,
        [
          {
            colorbar: { title: { text: field.unit } },
            colorscale: plot.family === "percent-delta" ? "RdBu" : "Viridis",
            hovertemplate:
              "d_o=%{x:.4g} mm<br>t=%{y:.4g} mm<br>value=%{z:.4g} " +
              field.unit +
              "<extra></extra>",
            type: "heatmap",
            x: xValues,
            y: yValues,
            z: zValues,
          },
        ],
        {
          margin: { b: 58, l: 70, r: 24, t: 48 },
          title: { text: `${plot.title} — ${titleScope}` },
          xaxis: { title: { text: "Outer diameter d_o [mm]" }, type: "log" },
          yaxis: { title: { text: "Wall thickness t [mm]" } },
        },
        {
          displaylogo: false,
          responsive: true,
          toImageButtonOptions: {
            filename: `${plot.id}-${cooler}`,
            format: "png",
            scale: 2,
          },
        },
      );
    });

    return () => {
      cancelled = true;
      void import("plotly.js-dist-min").then(({ default: Plotly }) => Plotly.purge(element));
    };
  }, [field, plot.family, plot.id, plot.title, titleScope, xValues, yValues, zValues]);

  if (!field || !array || !zValues) {
    return <p className="placeholder-note">Selected plot field is not available in this result.</p>;
  }

  return (
    <figure className="plot-figure">
      <div ref={elementRef} className="plot-figure__canvas" aria-label={plot.description} />
      <figcaption>
        {plot.description} Values are read from `SimulationResult`; axes use SI-derived display
        conversions.
      </figcaption>
    </figure>
  );
}

export function fieldForPlot(
  payload: SimulationResultPayload,
  plotId: PlotId,
  cooler: "cooler_left" | "cooler_right",
): GridFieldRef | undefined {
  const plot = plotById(plotId);
  const fields = plot.source === "comparison" ? payload.comparison.fields : payload[cooler].fields;
  return fields.find((field) => field.name === plot.field);
}

function matrixFromArray(
  array: Float64Array | undefined,
  field: GridFieldRef | undefined,
): number[][] | undefined {
  if (!array || !field) return undefined;
  const [rowsRaw, columnsRaw] = field.shape;
  const rows = Number(rowsRaw);
  const columns = Number(columnsRaw);
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows * columns !== array.length) {
    return undefined;
  }
  const matrix: number[][] = [];
  for (let row = 0; row < rows; row += 1) {
    const offset = row * columns;
    matrix.push(Array.from(array.slice(offset, offset + columns)));
  }
  return matrix;
}
