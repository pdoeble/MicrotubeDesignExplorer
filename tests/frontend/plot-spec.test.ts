import { describe, expect, it } from "vitest";
import type {
  GridFieldRef,
  Provenance,
  SimulationResultPayload,
} from "../../src/contracts/generated/simulation-result";
import { plotById } from "../../src/features/plots/plotRegistry";
import {
  colorDomainForPlot,
  createPlotSpec,
  fieldForPlot,
  imageExportOptions,
  matrixFromArray,
  maskMatrixForPlot,
  overlayTracesForPlot,
  preparePlotData,
  provenanceFooter,
  statusMatrixForPlot,
  summarizePlotData,
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
    fields: [{ buffer_index: 4, name: "overall_coefficient", shape: [2, 2], unit: "W/(m^2 K)" }],
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
    fields: [{ buffer_index: 5, name: "overall_coefficient", shape: [2, 2], unit: "W/(m^2 K)" }],
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
  new Float64Array([1, 2, Number.NaN, 4]),
  new Float64Array([3, 6, 8, Number.NaN]),
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
      height: 499,
      scale: 2,
      width: 624,
    });
  });

  it("creates explicit PNG and SVG export options at the MATLAB figure size", () => {
    expect(imageExportOptions("overall-coefficient-map", "cooler_right", "png")).toEqual({
      filename: "overall-coefficient-map-cooler_right",
      format: "png",
      height: 499,
      scale: 2,
      width: 624,
    });
    expect(imageExportOptions("overall-coefficient-map", "cooler_right", "png", 3)).toEqual({
      filename: "overall-coefficient-map-cooler_right",
      format: "png",
      height: 499,
      scale: 3,
      width: 624,
    });
    expect(imageExportOptions("overall-coefficient-map", "cooler_right", "svg")).toEqual({
      filename: "overall-coefficient-map-cooler_right",
      format: "svg",
      height: 499,
      scale: 1,
      width: 624,
    });
  });

  it("computes shared color domains across tandem cooler fields", () => {
    const domain = colorDomainForPlot(payload, overlayArrays, "overall-coefficient-map", [
      "cooler_left",
      "cooler_right",
    ]);
    expect(domain?.zmin).toBeCloseTo(Math.log10(1.05));
    expect(domain?.zmax).toBeCloseTo(Math.log10(7.9));
  });

  it("computes non-symmetric domains for comparison ratio maps", () => {
    const ratioField: GridFieldRef = {
      buffer_index: 6,
      name: "ratio_tech_adjusted",
      shape: [2, 2],
      unit: "-",
    };
    const ratioPayload: SimulationResultPayload = {
      ...payload,
      comparison: {
        fields: [...payload.comparison.fields, ratioField],
        warnings: [],
      },
    };
    const arrays = [...overlayArrays, new Float64Array([0.5, 1, 1.5, Number.NaN])] as const;

    expect(
      colorDomainForPlot(ratioPayload, arrays, "tech-adjusted-ratio-k", ["cooler_left"]),
    ).toEqual({
      zmax: 1.5,
      zmin: 0.5,
    });
  });

  it("applies an explicit color domain to generated heatmaps", () => {
    const spec = createPlotSpec({
      colorDomain: { zmax: 8, zmin: 1 },
      cooler: "cooler_left",
      field,
      plot: plotById("overall-coefficient-map"),
      provenance,
      titleScope: "Aluminum",
      xValues: [1, 2, 3],
      yValues: [0.1, 0.2],
      zValues: [
        [1, 2, 3],
        [4, 5, 6],
      ],
    });

    expect(spec.data[0]?.zauto).toBe(false);
    expect(spec.data[0]?.zmin).toBe(1);
    expect(spec.data[0]?.zmax).toBe(8);
  });

  it("places the short aluminum coefficient labels as deterministic annotations", () => {
    const spec = createPlotSpec({
      cooler: "cooler_left",
      field,
      plot: plotById("overall-coefficient-map"),
      provenance,
      titleScope: "Aluminum",
      xValues: [0.1, 1, 10],
      yValues: [0, 4],
      zValues: [
        [250, 350, 450],
        [250, 350, 450],
      ],
    });

    const annotationText = spec.layout.annotations?.map((annotation) => annotation.text);
    expect(annotationText).toEqual(expect.arrayContaining(["300", "400"]));
    const contour300 = spec.data.find((trace) => trace.name === "300 W/(m² K)");
    const contour400 = spec.data.find((trace) => trace.name === "400 W/(m² K)");
    expect(contour300?.contours?.showlabels).toBe(false);
    expect(contour400?.contours?.showlabels).toBe(false);
  });

  it("places short aluminum conductance labels for the single and design-boundary maps", () => {
    for (const plotId of ["bundle-conductance-map", "design-boundary-lines"] as const) {
      const spec = createPlotSpec({
        cooler: "cooler_left",
        field,
        plot: plotById(plotId),
        provenance,
        titleScope: "Aluminum",
        xValues: [0.1, 1, 10],
        yValues: [0, 4],
        zValues: [
          [1, 350, 600],
          [1, 350, 600],
        ],
      });

      const annotationText = spec.layout.annotations?.map((annotation) => annotation.text);
      expect(annotationText).toEqual(expect.arrayContaining(["50", "300", "500"]));
    }
  });

  it("separates the Figure 22 colorbar title and places every available inline percent label", () => {
    const spec = createPlotSpec({
      cooler: "cooler_left",
      field,
      plot: plotById("tech-adjusted-delta-ka"),
      provenance,
      titleScope: "Comparison",
      xValues: [0.1, 1, 10],
      yValues: [0, 4],
      zValues: [
        [-50, 10, 75],
        [-50, 10, 75],
      ],
    });

    expect(spec.data[0]?.colorbar?.title?.text).toBe("");
    const annotationText = spec.layout.annotations?.map((annotation) => annotation.text);
    expect(annotationText).toEqual(
      expect.arrayContaining([
        "Δ(<i>k</i><sub>o</sub><i>A</i><sub>o</sub>)<sub>feas</sub>",
        "-25 %",
        "0 %",
        "+25 %",
        "+50 %",
      ]),
    );
    for (const level of [-25, 0, 25, 50]) {
      const contour = spec.data.find((trace) => trace.name === `${level} %`);
      expect(contour?.contours?.showlabels).toBe(false);
    }
  });

  it("places the Figure 09 zero-percent label in its narrow feasible band", () => {
    const spec = createPlotSpec({
      cooler: "cooler_left",
      field,
      plot: plotById("tech-adjusted-delta-k"),
      provenance,
      titleScope: "Comparison",
      xValues: [0.1, 1, 10],
      yValues: [0, 4],
      zValues: [
        [-20, 5, 20],
        [-20, 5, 20],
      ],
    });

    expect(spec.layout.annotations?.map((annotation) => annotation.text)).toContain("0 %");
    const zeroContour = spec.data.find((trace) => trace.name === "0 %");
    expect(zeroContour?.contours?.showlabels).toBe(false);
  });

  it("creates boundary, minimum-wall, and design-point overlays from SimulationResult", () => {
    const traces = overlayTracesForPlot(
      payload,
      overlayArrays,
      plotById("overall-coefficient-map"),
      "cooler_left",
    );

    expect(traces.map((trace) => trace.name).filter(Boolean)).toEqual([
      "Technology limit - Aluminum",
      "Validated aluminum reference",
      "Request design point - Aluminum",
    ]);
    expect(traces).toHaveLength(22);
    const minimumWallY = traces[1]?.y as number[] | undefined;
    expect(minimumWallY?.[0]).toBeCloseTo(70);
    expect(minimumWallY?.[1]).toBeCloseTo(0.7);
    expect(traces[2]?.x).toEqual([1]);
    expect(traces[2]?.y).toEqual([10]);
  });

  it("shows only composite boundaries on comparison plots (MATLAB Fig. 9)", () => {
    const traces = overlayTracesForPlot(
      payload,
      overlayArrays,
      plotById("same-geometry-ratio"),
      "cooler_left",
    );

    expect(traces.map((trace) => trace.name).filter(Boolean)).toEqual([
      "Feasible boundary - Aluminum",
      "Feasible boundary - Polyamide",
      "Request design point - Aluminum",
    ]);
    // Each boundary has a white underlay followed by the styled line.
    expect(traces[3]?.x).toEqual([1.5, 2.5]);
    expect(traces[1]?.y).toEqual([10, 20, 30]);
  });

  it("creates individual screen boundary contour traces from exported masks", () => {
    const maskRef: GridFieldRef = {
      buffer_index: 7,
      name: "mask_screen_burst_pressure",
      shape: [2, 2],
      unit: "-",
    };
    const boundaryPayload: SimulationResultPayload = {
      ...payload,
      cooler_left: {
        ...payload.cooler_left,
        masks: [maskRef],
      },
    };
    const arrays = [...overlayArrays, new Float64Array(), new Float64Array([0, 1, 0, 1])] as const;

    const traces = overlayTracesForPlot(
      boundaryPayload,
      arrays,
      plotById("design-boundary-lines"),
      "cooler_left",
    );

    expect(traces[0]).toMatchObject({
      name: "Burst pressure",
      type: "contour",
    });
  });

  it("resamples native wall thickness onto a regular tau display axis", () => {
    const prepared = preparePlotData(
      [1, 2],
      [0.1, 0.2, 0.4],
      [
        [10, 20],
        [20, 40],
        [40, 80],
      ],
      plotById("coolant-throughput-map"),
    );
    expect(prepared.tauValues[0]).toBe(0);
    expect(prepared.tauValues.at(-1)).toBe(40);
    expect(prepared.displayValues[40]?.[0]).toBeCloseTo(10 * 6e4);
    expect(prepared.displayValues[40]?.[1]).toBeCloseTo(40 * 6e4);
  });

  it("never interpolates display values across a non-finite source interval", () => {
    const prepared = preparePlotData(
      [1],
      [0.1, 0.2],
      [[100], [Number.NaN]],
      plotById("overall-coefficient-map"),
    );
    expect(prepared.displayValues[40]?.[0]).toBe(100);
    expect(prepared.displayValues[60]?.[0]).toBeNaN();
  });

  it("clips ordinary map data below the own-material technology limit", () => {
    const maskRef: GridFieldRef = {
      buffer_index: 6,
      name: "mask_below_min_wall",
      shape: [2, 2],
      unit: "-",
    };
    const maskedPayload: SimulationResultPayload = {
      ...payload,
      cooler_left: { ...payload.cooler_left, masks: [maskRef] },
    };
    const arrays = [...overlayArrays, new Float64Array([1, 0, 0, 1])] as const;
    const masked = maskMatrixForPlot(
      maskedPayload,
      arrays,
      plotById("overall-coefficient-map"),
      "cooler_left",
      [
        [1, 2],
        [3, 4],
      ],
    );
    expect(masked).toEqual([
      [Number.NaN, 2],
      [3, Number.NaN],
    ]);
  });

  it("builds hover validity status from exported masks", () => {
    const maskRefs: GridFieldRef[] = [
      { buffer_index: 7, name: "mask_invalid_geometry", shape: [2, 2], unit: "-" },
      { buffer_index: 8, name: "mask_wall_ratio_range", shape: [2, 2], unit: "-" },
      { buffer_index: 9, name: "mask_below_min_wall", shape: [2, 2], unit: "-" },
      { buffer_index: 10, name: "mask_all_screens_feasible", shape: [2, 2], unit: "-" },
      { buffer_index: 11, name: "mask_operating_unsolvable", shape: [2, 2], unit: "-" },
    ];
    const statusPayload: SimulationResultPayload = {
      ...payload,
      cooler_left: {
        ...payload.cooler_left,
        masks: maskRefs,
      },
    };
    const arrays = [
      ...overlayArrays,
      new Float64Array(),
      new Float64Array([1, 0, 0, 0]),
      new Float64Array([0, 1, 0, 0]),
      new Float64Array([0, 0, 1, 0]),
      new Float64Array([1, 1, 1, 0]),
      new Float64Array([0, 0, 0, 0]),
    ] as const;

    expect(
      statusMatrixForPlot(
        statusPayload,
        arrays,
        plotById("overall-coefficient-map"),
        "cooler_left",
      ),
    ).toEqual([
      ["invalid geometry", "outside wall-ratio range"],
      ["below minimum wall", "screened out"],
    ]);
  });

  it("summarizes plotted data for tabular access", () => {
    expect(
      summarizePlotData(
        [
          [1, Number.NaN],
          [3, 5],
        ],
        [
          ["valid", "invalid geometry"],
          ["valid", "screened out"],
        ],
      ),
    ).toEqual({
      finiteCells: 3,
      maximum: 5,
      minimum: 1,
      statusCounts: {
        "invalid geometry": 1,
        "screened out": 1,
        valid: 2,
      },
      totalCells: 4,
    });
  });

  it("can resolve mask-backed plot fields", () => {
    const maskRef: GridFieldRef = {
      buffer_index: 7,
      name: "mask_all_screens_feasible",
      shape: [2, 2],
      unit: "-",
    };
    const maskPayload: SimulationResultPayload = {
      ...payload,
      cooler_left: {
        ...payload.cooler_left,
        masks: [maskRef],
      },
    };

    expect(fieldForPlot(maskPayload, "feasibility-mask-map", "cooler_left")).toBe(maskRef);
  });

  it("keeps provenance footer identifiers compact", () => {
    expect(provenanceFooter(provenance)).toContain("request abcdef012345");
    expect(provenanceFooter(provenance)).toContain("golden 0123456789ab");
  });
});
