import { describe, expect, it } from "vitest";
import type {
  GridFieldRef,
  Provenance,
  SimulationResultPayload,
} from "../../src/contracts/generated/simulation-result";
import { plotById } from "../../src/features/plots/plotRegistry";
import {
  createPlotSpec,
  imageExportOptions,
  matrixFromArray,
  overlayTracesForPlot,
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

const payload: SimulationResultPayload = {
  comparison: {
    fields: [
      { buffer_index: 1, name: "boundary_wall_ratio", shape: [3, 1], unit: "%" },
      { buffer_index: 2, name: "boundary_left_diameter", shape: [3, 1], unit: "m" },
      { buffer_index: 3, name: "boundary_right_diameter", shape: [3, 1], unit: "m" },
    ],
    warnings: [],
  },
  contract_version: "1.0.0",
  cooler_left: {
    fields: [],
    label: "Aluminum",
    masks: [],
    summary: {
      is_feasible: true,
      screens_passed: {},
      units: {
        design_outer_diameter: "m",
        design_wall_thickness: "m",
        material_min_wall_thickness: "m",
      },
      values: {
        design_outer_diameter: 0.001,
        design_wall_thickness: 0.0001,
        material_min_wall_thickness: 0.00007,
      },
    },
    warnings: [],
  },
  cooler_right: {
    fields: [],
    label: "Polyamide",
    masks: [],
    summary: {
      is_feasible: true,
      screens_passed: {},
      units: {
        design_outer_diameter: "m",
        design_wall_thickness: "m",
        material_min_wall_thickness: "m",
      },
      values: {
        design_outer_diameter: 0.001,
        design_wall_thickness: 0.0001,
        material_min_wall_thickness: 0.000025,
      },
    },
    warnings: [],
  },
  errors: [],
  outer_diameter_axis: [0.0001, 0.01],
  provenance,
  request_hash: provenance.request_hash,
  wall_thickness_axis: [0.000001, 0.0045],
};

const overlayArrays = [
  new Float64Array(),
  new Float64Array([10, 20, 30]),
  new Float64Array([0.001, 0.002, 0.003]),
  new Float64Array([0.0015, 0.0025, Number.NaN]),
] as const;

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
    const overlays = [
      {
        mode: "markers",
        type: "scatter",
        x: [1],
        y: [0.1],
      },
    ] as const;
    const spec = createPlotSpec({
      cooler: "cooler_right",
      field,
      overlays: [...overlays],
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
    expect(spec.data).toHaveLength(2);
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

  it("creates boundary, minimum-wall, and design-point overlays from SimulationResult", () => {
    const traces = overlayTracesForPlot(
      payload,
      overlayArrays,
      plotById("overall-coefficient-map"),
      "cooler_left",
    );

    expect(traces.map((trace) => trace.name)).toEqual([
      "Feasible boundary - Aluminum",
      "Minimum wall - Aluminum",
      "Design point - Aluminum",
    ]);
    expect(traces[0]?.x).toEqual([1, 2, 3]);
    const boundaryY = traces[0]?.y as number[] | undefined;
    expect(boundaryY?.[0]).toBeCloseTo(0.1);
    expect(boundaryY?.[1]).toBeCloseTo(0.4);
    expect(boundaryY?.[2]).toBeCloseTo(0.9);
    const minimumWallY = traces[1]?.y as number[] | undefined;
    expect(minimumWallY?.[0]).toBeCloseTo(0.07);
    expect(minimumWallY?.[1]).toBeCloseTo(0.07);
    expect(traces[2]?.x).toEqual([1]);
    expect(traces[2]?.y).toEqual([0.1]);
  });

  it("shows both coolers' overlays on comparison plots", () => {
    const traces = overlayTracesForPlot(
      payload,
      overlayArrays,
      plotById("same-geometry-ratio"),
      "cooler_left",
    );

    expect(traces.map((trace) => trace.name)).toEqual([
      "Feasible boundary - Aluminum",
      "Minimum wall - Aluminum",
      "Design point - Aluminum",
      "Feasible boundary - Polyamide",
      "Minimum wall - Polyamide",
      "Design point - Polyamide",
    ]);
    expect(traces[3]?.x).toEqual([1.5, 2.5]);
  });

  it("keeps provenance footer identifiers compact", () => {
    expect(provenanceFooter(provenance)).toContain("request abcdef012345");
    expect(provenanceFooter(provenance)).toContain("golden 0123456789ab");
  });
});
