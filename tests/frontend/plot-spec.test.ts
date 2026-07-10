import { describe, expect, it } from "vitest";
import type { GridFieldRef, Provenance } from "../../src/contracts/generated/simulation-result";
import { plotById } from "../../src/features/plots/plotRegistry";
import {
  createPlotSpec,
  imageExportOptions,
  matrixFromArray,
  provenanceFooter,
} from "../../src/features/plots/plotSpec";

const field: GridFieldRef = {
  buffer_index: 0,
  name: "delta_same_geometry_percent",
  shape: [2, 3],
  unit: "%",
};

const provenance: Provenance = {
  contract_version: "1.0.0",
  core_version: "0.1.0",
  generated_utc: "2026-07-10T12:00:00Z",
  golden_reference: "0123456789abcdef",
  request_hash: "abcdef0123456789",
};

describe("plot spec", () => {
  it("maps row-major transferable arrays to Plotly matrices", () => {
    expect(matrixFromArray(new Float64Array([1, 2, 3, 4, 5, 6]), field)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("rejects arrays whose shape does not match the transferred length", () => {
    expect(matrixFromArray(new Float64Array([1, 2, 3, 4, 5]), field)).toBeUndefined();
  });

  it("adds provenance and symmetric color scale to percent-delta figures", () => {
    const spec = createPlotSpec({
      cooler: "cooler_right",
      field,
      plot: plotById("same-geometry-ratio"),
      provenance,
      titleScope: "Comparison",
      xValues: [1, 2, 3],
      yValues: [0.1, 0.2],
      zValues: [
        [-5, 0, 3],
        [7, Number.NaN, -2],
      ],
    });
    const trace = spec.data[0];
    if (!trace) throw new Error("Expected heatmap trace");

    expect(trace.zmin).toBe(-7);
    expect(trace.zmax).toBe(7);
    expect(trace.zmid).toBe(0);
    expect(spec.layout.annotations?.[0]).toMatchObject({
      text: "contract 1.0.0 | core 0.1.0 | request abcdef012345 | generated 2026-07-10T12:00:00Z | golden 0123456789ab",
    });
    expect(spec.config.toImageButtonOptions).toEqual({
      filename: "same-geometry-ratio-cooler_right",
      format: "png",
      scale: 2,
    });
  });

  it("creates explicit PNG and SVG export options", () => {
    expect(imageExportOptions("overall-coefficient-map", "cooler_right", "png")).toEqual({
      filename: "overall-coefficient-map-cooler_right",
      format: "png",
      scale: 2,
    });
    expect(imageExportOptions("overall-coefficient-map", "cooler_right", "svg")).toEqual({
      filename: "overall-coefficient-map-cooler_right",
      format: "svg",
      scale: 1,
    });
  });

  it("keeps provenance footer identifiers compact", () => {
    expect(provenanceFooter(provenance)).toContain("request abcdef012345");
    expect(provenanceFooter(provenance)).toContain("golden 0123456789ab");
  });
});
